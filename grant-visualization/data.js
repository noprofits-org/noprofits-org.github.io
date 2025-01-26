export class DataManager {
    constructor() {
        this.orgLookup = new Map();
        this.originalData = null;
    }

    async loadData() {
        if (this.originalData) {
            return this.originalData;
        }

        try {
            // Load data using fetch, just like in the original code
            const [charitiesResponse, grantsResponse] = await Promise.all([
                fetch('charities.csv'),
                fetch('grants.csv')
            ]);
            
            // Get the text content from the responses
            const [charitiesText, grantsText] = await Promise.all([
                charitiesResponse.text(),
                grantsResponse.text()
            ]);
            
            // Parse the CSV data
            const charities = d3.csvParse(charitiesText);
            const grants = d3.csvParse(grantsText);
            
            // Validate the parsed data
            if (!this.validateData(charities, grants)) {
                throw new Error('Invalid data structure in CSV files');
            }

            this.originalData = {
                charities,
                grants
            };
            
            this.buildOrgLookup();
            return this.originalData;
        } catch (error) {
            console.error('Error loading data:', error);
            throw new Error(`Failed to load data: ${error.message}`);
        }
    }

    validateData(charities, grants) {
        // Validate charities data
        const hasValidCharities = charities.every(charity => 
            charity.filer_ein && 
            charity.filer_name
        );

        // Validate grants data
        const hasValidGrants = grants.every(grant => 
            grant.filer_ein && 
            grant.grant_ein && 
            !isNaN(parseFloat(grant.grant_amt))
        );

        if (!hasValidCharities || !hasValidGrants) {
            console.error('Data validation failed:', {
                firstCharity: charities[0],
                firstGrant: grants[0],
                hasValidCharities,
                hasValidGrants
            });
        }

        return hasValidCharities && hasValidGrants;
    }

    buildOrgLookup() {
        this.orgLookup.clear();
        
        // Build lookup from both charities and grants
        const addToLookup = (ein, name) => {
            if (ein && name) {
                this.orgLookup.set(ein, name);
                const searchStr = `${ein} ${name.toLowerCase()}`;
                this.orgLookup.set(searchStr, ein);
            }
        };

        // Add from charities file
        this.originalData.charities.forEach(charity => {
            addToLookup(charity.filer_ein, charity.filer_name);
        });

        // Add from grants file for any missing EINs
        this.originalData.grants.forEach(grant => {
            if (!this.orgLookup.has(grant.filer_ein)) {
                addToLookup(grant.filer_ein, grant.filer_name);
            }
        });
    }

    getConnectedOrgs(startEIN, depth) {
        if (!startEIN || !this.originalData) {
            return new Map();
        }

        const connected = new Map();
        connected.set(startEIN, 0);
        
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
        if (!this.originalData) {
            throw new Error('Data not loaded');
        }

        const { minAmount, maxOrgs, orgFilter, depth } = filters;
        
        // Filter grants by minimum amount
        let filteredGrants = this.originalData.grants.filter(
            g => parseFloat(g.grant_amt) >= minAmount
        );

        // Apply organization filter if specified
        let connected = new Map();
        if (orgFilter) {
            connected = this.getConnectedOrgs(orgFilter, depth);
            filteredGrants = this.filterGrantsByConnected(filteredGrants, connected);
        }

        // Limit to top organizations by volume
        const { filteredGrants: finalGrants, topOrgs, stats } = 
            this.limitToTopOrgs(filteredGrants, maxOrgs);

        return { 
            grants: finalGrants, 
            orgs: topOrgs,
            connected,
            stats
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
        if (!searchText || searchText.length < 2) {
            return [];
        }

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
}