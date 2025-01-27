export class DataManager {
    constructor() {
        this.orgLookup = new Map();
        this.originalData = null;
        this.charities = {};             // EIN -> { name, receipt_amt, govt_amt, contrib_amt, grant_amt }
        this.edgeAccumulator = {};       // "filer~grantee" -> totalGrant
        this.totalCharitiesCount = 0;
        this.totalGrantsCount = 0;
    }

    async loadData() {
        if (this.originalData) {
            console.log("Returning cached data");
            return this.originalData;
        }

        try {
            console.log("Loading zipped data files...");

            // Load charities first
            const charitiesZipBuf = await fetch('./charities.csv.zip').then(r => r.arrayBuffer());
            const charitiesZip = await JSZip.loadAsync(charitiesZipBuf);
            const charitiesCsvString = await charitiesZip.file('charities_truncated.csv').async('string');

            await new Promise((resolve, reject) => {
                Papa.parse(charitiesCsvString, {
                    header: true,
                    skipEmptyLines: true,
                    complete: results => {
                        results.data.forEach(row => {
                            const ein = (row['filer_ein'] || '').trim();
                            if (!ein) return;
                            let rAmt = parseInt((row['receipt_amt'] || '0').trim(), 10);
                            if (isNaN(rAmt)) rAmt = 0;
                            this.charities[ein] = {
                                name: (row['filer_name'] || '').trim(),
                                receipt_amt: rAmt,
                                govt_amt: parseInt((row['govt_amt'] || '0').trim(), 10) || 0,
                                contrib_amt: parseInt((row['contrib_amt'] || '0').trim(), 10) || 0,
                                grant_amt: 0 // gets accumulated from grants
                            };
                        });
                        this.totalCharitiesCount = Object.keys(this.charities).length;
                        resolve();
                    },
                    error: err => reject(err)
                });
            });

            // Then load and process grants
            const grantsZipBuf = await fetch('./grants.csv.zip').then(r => r.arrayBuffer());
            const grantsZip = await JSZip.loadAsync(grantsZipBuf);
            const grantsCsvString = await grantsZip.file('grants_truncated.csv').async('string');

            await new Promise((resolve, reject) => {
                Papa.parse(grantsCsvString, {
                    header: true,
                    skipEmptyLines: true,
                    complete: results => {
                        let count = 0;
                        results.data.forEach(row => {
                            const filer = (row['filer_ein'] || '').trim();
                            const grantee = (row['grant_ein'] || '').trim();
                            let amt = parseInt((row['grant_amt'] || '0').trim(), 10);
                            if (isNaN(amt)) amt = 0;
                            count++;

                            if (this.charities[filer] && this.charities[grantee]) {
                                const key = filer + '~' + grantee;
                                if (!this.edgeAccumulator[key]) this.edgeAccumulator[key] = 0;
                                this.edgeAccumulator[key] += amt;
                                this.charities[filer].grant_amt += amt;
                            }
                        });
                        this.totalGrantsCount = count;
                        resolve();
                    },
                    error: err => reject(err)
                });
            });

            // Build lookup table for search
            this.buildOrgLookup();

            // Format data for visualization compatibility
            this.originalData = {
                charities: Object.entries(this.charities).map(([ein, data]) => ({
                    filer_ein: ein,
                    filer_name: data.name,
                    receipt_amt: data.receipt_amt,
                    govt_amt: data.govt_amt,
                    contrib_amt: data.contrib_amt,
                    grant_amt: data.grant_amt
                })),
                grants: Object.entries(this.edgeAccumulator).map(([key, amt]) => {
                    const [filer, grantee] = key.split('~');
                    return {
                        filer_ein: filer,
                        grant_ein: grantee,
                        grant_amt: amt
                    };
                })
            };

            return this.originalData;

        } catch (error) {
            console.error('Error loading data:', error);
            throw new Error(`Failed to load data: ${error.message}`);
        }
    }

    validateData(charities, grants) {
        // Validate charities data with new fields
        const hasValidCharities = charities.every(charity =>
            charity.filer_ein &&
            charity.filer_name &&
            !isNaN(parseFloat(charity.receipt_amt || '0')) &&
            !isNaN(parseFloat(charity.govt_amt || '0')) &&
            !isNaN(parseFloat(charity.contrib_amt || '0'))
        );

        // Validate grants data
        const hasValidGrants = grants.every(grant =>
            grant.filer_ein &&
            grant.grant_ein &&
            !isNaN(parseFloat(grant.grant_amt || '0'))
        );

        return hasValidCharities && hasValidGrants;
    }

    buildOrgLookup() {
        this.orgLookup.clear();
        for (const [ein, data] of Object.entries(this.charities)) {
            this.orgLookup.set(ein, data.name);
            const searchStr = `${ein} ${data.name.toLowerCase()}`;
            this.orgLookup.set(searchStr, ein);
        }
    }

    getConnectedOrgs(startEIN, depth) {
        if (!startEIN || !this.originalData || depth < 0) {
            return new Map();
        }

        const connected = new Map();
        connected.set(startEIN, 0);

        // If depth is 0, only return the starting organization
        if (depth === 0) {
            return connected;
        }

        let currentLevel = 0;
        let frontier = new Set([startEIN]);

        while (currentLevel < depth && frontier.size > 0) {
            const newFrontier = new Set();

            for (const ein of frontier) {
                this.originalData.grants.forEach(grant => {
                    if (grant.filer_ein === ein && !connected.has(grant.grant_ein)) {
                        connected.set(grant.grant_ein, currentLevel + 1);
                        newFrontier.add(grant.grant_ein);
                    }
                    if (grant.grant_ein === ein && !connected.has(grant.filer_ein)) {
                        connected.set(grant.filer_ein, currentLevel + 1);
                        newFrontier.add(grant.filer_ein);
                    }
                });
            }

            frontier = newFrontier;
            currentLevel++;
        }

        return connected;
    }

    filterData(filters) {
        const { minAmount, maxOrgs, orgFilter, depth } = filters;
    
        if (!orgFilter || !this.originalData) {
            return this.getEmptyResult();
        }
    
        // For depth 0, ONLY show the root organization
        if (depth === 0) {
            const connected = new Map([[orgFilter, 0]]);
            // Find self-referential grants if they exist
            const selfGrants = this.originalData.grants.filter(g => 
                g.filer_ein === orgFilter && 
                g.grant_ein === orgFilter &&
                parseFloat(g.grant_amt) >= minAmount
            );
    
            return {
                grants: selfGrants,
                orgs: new Set([orgFilter]),
                connected,
                stats: {
                    orgCount: 1,
                    grantCount: selfGrants.length,
                    totalCharities: this.totalCharitiesCount,
                    totalGrants: this.totalGrantsCount
                }
            };
        }
    
        // Rest of the code for depth > 0 remains the same...
        const connected = new Map([[orgFilter, 0]]);
        const allValidGrants = this.originalData.grants.filter(g => 
            parseFloat(g.grant_amt) >= minAmount
        );
    
        // BFS through the graph up to specified depth
        let frontier = new Set([orgFilter]);
        let currentDepth = 0;
        let filteredGrants = new Set();
    
        while (currentDepth < depth && frontier.size > 0) {
            const newFrontier = new Set();
    
            allValidGrants.forEach(grant => {
                if (frontier.has(grant.filer_ein)) {
                    if (!connected.has(grant.grant_ein)) {
                        connected.set(grant.grant_ein, currentDepth + 1);
                        newFrontier.add(grant.grant_ein);
                    }
                    filteredGrants.add(grant);
                }
                if (frontier.has(grant.grant_ein)) {
                    if (!connected.has(grant.filer_ein)) {
                        connected.set(grant.filer_ein, currentDepth + 1);
                        newFrontier.add(grant.filer_ein);
                    }
                    filteredGrants.add(grant);
                }
            });
    
            frontier = newFrontier;
            currentDepth++;
        }
    
        const grantsArray = Array.from(filteredGrants);
        const adjustedMaxOrgs = maxOrgs - 1;
        const { filteredGrants: finalGrants, topOrgs, stats } = 
            this.limitToTopOrgsWithRoot(grantsArray, adjustedMaxOrgs, orgFilter);
    
        return {
            grants: finalGrants,
            orgs: topOrgs,
            connected,
            stats: {
                ...stats,
                totalCharities: this.totalCharitiesCount,
                totalGrants: this.totalGrantsCount
            }
        };
    }

    createResult(grants, orgs, connected) {
        return {
            grants,
            orgs,
            connected,
            stats: {
                orgCount: orgs.size,
                grantCount: grants.length,
                totalGrants: this.totalGrantsCount,
                totalCharities: this.totalCharitiesCount
            }
        };
    }

    limitToTopOrgsWithRoot(grants, maxOrgs, rootEIN) {
        // Calculate volume for non-root orgs
        const orgVolume = new Map();
        grants.forEach(grant => {
            const amount = parseFloat(grant.grant_amt);
            if (grant.filer_ein !== rootEIN) {
                orgVolume.set(grant.filer_ein,
                    (orgVolume.get(grant.filer_ein) || 0) + amount);
            }
            if (grant.grant_ein !== rootEIN) {
                orgVolume.set(grant.grant_ein,
                    (orgVolume.get(grant.grant_ein) || 0) + amount);
            }
        });

        // Get top orgs by volume (excluding root)
        const topOrgs = new Set([rootEIN]); // Start with root
        Array.from(orgVolume.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxOrgs)
            .forEach(([ein]) => topOrgs.add(ein));

        // Filter grants to only include connections with top orgs
        const finalGrants = grants.filter(grant =>
            (grant.filer_ein === rootEIN || topOrgs.has(grant.filer_ein)) &&
            (grant.grant_ein === rootEIN || topOrgs.has(grant.grant_ein))
        );

        return {
            filteredGrants: finalGrants,
            topOrgs,
            stats: {
                orgCount: topOrgs.size,
                grantCount: finalGrants.length,
                totalGrants: grants.length
            }
        };
    }

    filterGrantsByConnected(grants, connectedOrgs) {
        return grants.filter(grant =>
            connectedOrgs.has(grant.filer_ein) &&
            connectedOrgs.has(grant.grant_ein)
        );
    }

    limitToTopOrgs(grants, maxOrgs) {
        const orgVolume = this.calculateOrgVolumes(grants);
        const topOrgs = new Set(
            Array.from(orgVolume.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, maxOrgs)
                .map(([ein]) => ein)
        );

        const finalGrants = grants.filter(
            grant => topOrgs.has(grant.filer_ein) &&
                topOrgs.has(grant.grant_ein)
        );

        return {
            filteredGrants: finalGrants,
            topOrgs,
            stats: {
                orgCount: topOrgs.size,
                grantCount: finalGrants.length,
                totalGrants: this.originalData.grants.length
            }
        };
    }

    calculateOrgVolumes(grants) {
        const orgVolume = new Map();
        grants.forEach(grant => {
            const amount = parseFloat(grant.grant_amt);
            orgVolume.set(grant.filer_ein,
                (orgVolume.get(grant.filer_ein) || 0) + amount);
            orgVolume.set(grant.grant_ein,
                (orgVolume.get(grant.grant_ein) || 0) + amount);
        });
        return orgVolume;
    }

    searchOrganizations(searchText) {
        if (!searchText || searchText.length < 2) return [];

        const input = searchText.toLowerCase();
        return Array.from(this.orgLookup.entries())
            .filter(([key]) =>
                typeof key === 'string' &&
                key.toLowerCase().includes(input)
            )
            .slice(0, 5)
            .map(([key, value]) => ({
                ein: typeof value === 'string' ? value : key,
                name: this.orgLookup.get(value) || 'Unknown Organization'
            }));
    }

    getOrgDetails(ein) {
        const charity = this.originalData.charities.find(c => c.filer_ein === ein);
        if (!charity) return null;

        return {
            name: charity.filer_name,
            ein: charity.filer_ein,
            receipts: charity.receipt_amt,
            govtFunds: charity.govt_amt,
            contributions: charity.contrib_amt,
            grantsGiven: charity.grant_amt
        };
    }

    calculateTaxpayerImpact(eins) {
        return eins.reduce((total, ein) => {
            const org = this.getOrgDetails(ein);
            return total + (org ? org.govtFunds : 0);
        }, 0);
    }
}
