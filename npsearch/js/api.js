// api.js - Handles all ProPublica API interactions

const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://cors.bridged.cc/'
];

let currentProxyIndex = 0;

async function tryFetchWithProxy(url) {
    if (currentProxyIndex >= CORS_PROXIES.length) {
        throw new Error('All CORS proxies failed. Please try again later.');
    }

    try {
        const proxyUrl = CORS_PROXIES[currentProxyIndex] + encodeURIComponent(url);
        console.log('Trying proxy:', CORS_PROXIES[currentProxyIndex]);
        console.log('Full URL:', proxyUrl);
        
        const response = await fetch(proxyUrl);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw response text:', text.substring(0, 200) + '...');
        
        try {
            // Parse the text into JSON
            const data = JSON.parse(text);
            // Validate the data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format');
            }
            return data; // Return the parsed data directly
        } catch (parseError) {
            console.error('Parse error:', parseError);
            throw new Error('Failed to parse API response');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        currentProxyIndex++;
        return tryFetchWithProxy(url);
    }
}

async function searchNonprofits(searchTerm) {
    try {
        console.log('Searching for:', searchTerm);
        const apiUrl = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(searchTerm)}`;
        const data = await tryFetchWithProxy(apiUrl);
        
        // Validate the response structure
        if (!data.organizations || !Array.isArray(data.organizations)) {
            throw new Error('Invalid response format from API');
        }
        
        console.log('Search results:', data);
        return data;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

async function getNonprofitDetails(ein) {
    try {
        console.log('Fetching details for EIN:', ein);
        const apiUrl = `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`;
        const data = await tryFetchWithProxy(apiUrl);
        console.log('Organization details:', data);
        return data;
    } catch (error) {
        console.error('Details fetch error:', error);
        throw error;
    }
}

export {
    searchNonprofits,
    getNonprofitDetails,
    tryFetchWithProxy
};