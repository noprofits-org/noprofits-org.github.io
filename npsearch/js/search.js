// search.js
import { searchNonprofits, getNonprofitDetails } from './api.js';
import {
    formatCurrency,
    formatDate,
    numberWithCommas
} from './utils.js';
import { renderFinancialTrendsChart } from './charts.js';

let searchInput, searchButton, resultsContainer, modal;

/**
 * Display historical filings data in a table format
 * @param {Array} filings - Array of filing data objects
 * @returns {string} HTML string for the filings table
 */
function displayFilingsHistory(filings) {  // <--- Restored function
    if (!filings || filings.length === 0) return 'No historical data available';

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Assets</th>
                </tr>
            </thead>
            <tbody>
                ${filings.map(filing => `
                    <tr>
                        <td data-label="Year">${filing.tax_prd_yr || 'N/A'}</td>
                        <td data-label="Revenue">${filing.totrevenue ? '$' + numberWithCommas(filing.totrevenue) : 'N/A'}</td>
                        <td data-label="Expenses">${filing.totfuncexpns ? '$' + numberWithCommas(filing.totfuncexpns) : 'N/A'}</td>
                        <td data-label="Assets">${filing.totassetsend ? '$' + numberWithCommas(filing.totassetsend) : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getFinancialTrendsSection(data) {
    return `
        <div class="section">
            <h2 class="section-header">Financial Trends</h2>
            <div id="trendsChart" style="height: 300px; margin-bottom: 2rem;"></div>
            <div id="previousYearsData">
                ${data.filings_with_data ? displayFilingsHistory(data.filings_with_data) : 'No historical data available'}
            </div>
        </div>
    `;
}

/**
 * Display search results in the UI
 */
function displayResults(data) {
    if (!data.organizations?.length) {
        resultsContainer.innerHTML = '<div class="error-message">No organizations found</div>';
        return;
    }

    const resultsContainer = document.getElementById('resultsContainer');

    // Clear any existing results
    resultsContainer.innerHTML = '';

    const resultsHTML = data.organizations.map(org => `
        <div class="org-card">
            <div class="org-name">${org.name}</div>
            <div class="org-meta">
                EIN: ${org.ein}<br>
                Location: ${org.city}, ${org.state}<br>
                <a href="https://projects.propublica.org/nonprofits/organizations/${org.ein}" target="_blank">
                    View on ProPublica
                </a>
                <br>
                <a href="#" onclick="showAnalysis('${org.ein}', '${org.name.replace(/'/g, "\\'")}'); return false;">
                    NoProfit Quick Analysis
                </a>
            </div>
        </div>
    `);

    // Append the new results to the container
    resultsContainer.innerHTML += resultsHTML.join('');

    // Now you can add a results count element if needed
    const resultsCount = document.createElement('div');
    resultsCount.classList.add('results-count');
    resultsCount.textContent = `Found ${data.total_results} results`;
    resultsContainer.appendChild(resultsCount);
}

function getOrgDetailsSection(org) {
    return `
        <div class="section">
            <h2 class="section-header">Organization Details</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <h3>Organization Info</h3>
                    <div class="metric-value">
                        EIN: ${org.ein}<br>
                        Location: ${org.city}, ${org.state}<br>
                        Tax-Exempt Since: ${formatDate(org.tax_exempt_since)}<br>
                        Last Filing: ${formatDate(org.latest_filing_date)}
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Classification</h3>
                    <div class="metric-value">
                        NTEE Code: ${org.ntee_code || 'N/A'}<br>
                        Subsection: ${org.subsection_code || 'N/A'}<br>
                        Foundation Status: ${org.foundation_code || 'N/A'}
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Latest Financial Data</h3>
                    <div class="metric-value">
                        Revenue: ${formatCurrency(org.income_amount)}<br>
                        Assets: ${formatCurrency(org.asset_amount)}<br>
                        ${org.exemption_number ? 'Exemption: ' + org.exemption_number : ''}
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Contact Information</h3>
                    <div class="metric-value">
                        Address: ${org.address ? `${org.address}, ${org.city}, ${org.state}` : 'N/A'}<br>
                        ZIP: ${org.zipcode || 'N/A'}<br>
                        ${org.website ? `Website: <a href="${org.website}" target="_blank" class="text-blue-500">${org.website}</a>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getFullReportSection(ein) {
    return `
        <div class="section">
            <h2 class="section-header">Full Report</h2>
            <div class="metric-card">
                <div class="metric-value">
                    <a href="https://projects.propublica.org/nonprofits/organizations/${ein}" 
                       target="_blank" 
                       class="text-blue-500">
                        View on ProPublica →
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Update showAnalysis to use these sections
async function showAnalysis(ein, orgName) {
    try {
        document.getElementById('modalOrgName').textContent = orgName;
        document.getElementById('modalContent').innerHTML = '<div class="loading-spinner"></div>';
        modal.style.display = 'block';

        // *** THIS IS THE KEY CHANGE ***
        let data; // Declare data variable here
        try {
            data = await getNonprofitDetails(ein); // Fetch the data
        } catch (fetchError) {
            console.error("Error fetching nonprofit details:", fetchError);
            document.getElementById('modalContent').innerHTML = `
                <div class="error-message">
                    Unable to retrieve nonprofit details. Please try again later.
                    <br><br>
                    <a href="https://projects.propublica.org/nonprofits/organizations/${ein}" 
                       target="_blank"
                       class="text-blue-500">
                        View on ProPublica →
                    </a>
                </div>
            `;
            return; // Important: Exit the function if fetching fails
        }
        // **********************************

        if (!data || !data.organization) {
            throw new Error('Organization data not found in the response');
        }

        const org = data.organization;

        // Compose modal content from sections
        document.getElementById('modalContent').innerHTML = `
            ${getFinancialTrendsSection(data)}
            ${getOrgDetailsSection(org)}
            ${getFullReportSection(ein)}
        `;

        if (data.filings_with_data?.length > 0) {
            renderFinancialTrendsChart('trendsChart', data.filings_with_data);
        }

    } catch (error) { // This catch now handles other errors, not the fetch error
        console.error('Analysis Error:', error);
        document.getElementById('modalContent').innerHTML = `
            <div class="error-message">
                Unable to load analysis: ${error.message}
                <br><br>
                <a href="https://projects.propublica.org/nonprofits/organizations/${ein}" 
                   target="_blank"
                   class="text-blue-500">
                    View on ProPublica →
                </a>
            </div>
        `;
    }
}

/**
 * Handle the search process
 */
async function handleSearch() {
    console.log('Search triggered');
    const searchTerm = searchInput.value.trim();
    console.log('Search term:', searchTerm);
    if (!searchTerm) return;

    try {
        searchButton.disabled = true;
        resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

        const timeoutId = setTimeout(() => {
            console.error('Search timed out');
            resultsContainer.innerHTML = '<div class="error-message">Search timed out. Please try again later.</div>';
            searchButton.disabled = false;
        }, 10000); // Set a 10 second timeout

        const data = await searchNonprofits(searchTerm);
        clearTimeout(timeoutId); // Clear the timeout if successful

        console.log('Search results:', data);

        if (!data || !data.organizations) {
            throw new Error('Invalid response from search');
        }
        displayResults(data); // <--- This line was missing!
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <div class="error-message">
                Error: ${error.message}<br>
                Please try again later or visit 
                <a href="https://projects.propublica.org/nonprofits/" target="_blank">
                    ProPublica Nonprofit Explorer
                </a> directly.
            </div>
        `;
    } finally {
        searchButton.disabled = false;
    }
}

/**
 * Close the analysis modal
 */
function closeModal() {
    modal.style.display = 'none';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    searchInput = document.getElementById('searchInput');
    searchButton = document.getElementById('searchButton');
    resultsContainer = document.getElementById('resultsContainer');
    modal = document.getElementById('analysisModal');

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };
});

// Export functions needed globally
window.handleSearch = handleSearch;
window.showAnalysis = showAnalysis;
window.closeModal = closeModal;