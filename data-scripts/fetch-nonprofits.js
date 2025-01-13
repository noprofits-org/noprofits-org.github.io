import fetch from 'node-fetch';
import fs from 'fs';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchSeattleNonprofits(startPage = 1, endPage = 5) { // Testing with just 5 pages first
    try {
        console.log('Starting nonprofit data fetch...');
        const allOrganizations = [];
        
        for (let page = startPage; page <= endPage; page++) {
            console.log(`\nFetching page ${page}...`);
            
            const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?state%5Bid%5D=WA&ntee%5Bid%5D=5&page=${page}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            allOrganizations.push(...data.organizations);
            
            console.log(`Retrieved ${data.organizations.length} organizations`);
            
            // Save progress after each page
            fs.writeFileSync(
                'wa_nonprofits_progress.json', 
                JSON.stringify({ 
                    last_page: page,
                    organizations: allOrganizations 
                }, null, 2)
            );
            
            // Rate limiting - wait 1 second between requests
            await delay(1000);
        }
        
        // Save final results
        fs.writeFileSync(
            'wa_nonprofits.json',
            JSON.stringify({ organizations: allOrganizations }, null, 2)
        );
        
        console.log('\nFetch complete!');
        console.log('Total organizations retrieved:', allOrganizations.length);
        
    } catch (error) {
        console.error('Error fetching nonprofit data:', error);
    }
}

fetchSeattleNonprofits();