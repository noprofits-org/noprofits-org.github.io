// search.js - Handles search functionality and results display
import { searchNonprofits, getNonprofitDetails } from './api.js';
import { 
    formatCurrency, 
    calculateEfficiencyRatios,
    calculateSustainabilityMetrics,
    getMetricColor 
} from './utils.js';
import { renderFinancialTrendsChart } from './charts.js';
import { tryFetchWithProxy } from './api.js';
import { numberWithCommas } from './utils.js';

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('resultsContainer');
const modal = document.getElementById('analysisModal');

/**
 * Display historical filings data in a table format
 * @param {Array} filings - Array of filing data objects
 * @returns {string} HTML string for the filings table
 */
function displayFilingsHistory(filings) {
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
                        <td>${filing.tax_prd_yr || 'N/A'}</td>
                        <td>${filing.totrevenue ? '$' + numberWithCommas(filing.totrevenue) : 'N/A'}</td>
                        <td>${filing.totfuncexpns ? '$' + numberWithCommas(filing.totfuncexpns) : 'N/A'}</td>
                        <td>${filing.totassetsend ? '$' + numberWithCommas(filing.totassetsend) : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
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
    `).join('');

    resultsContainer.innerHTML = `
        <div class="results-count">Found ${data.total_results} results</div>
        ${resultsHTML}
    `;
}


async function showAnalysis(ein, orgName) {
    try {
        document.getElementById('modalOrgName').textContent = orgName;
        document.getElementById('modalContent').innerHTML = '<div class="loading-spinner"></div>';
        modal.style.display = 'block';
        
        console.log('Fetching details for EIN:', ein);
        const data = await getNonprofitDetails(ein);  // Using imported function instead of direct API call
        
        const org = data.organization;
        if (!org) {
            throw new Error('Organization data not found');
        }

        const taxExemptSince = org.tax_exempt_since ? 
            new Date(org.tax_exempt_since).toLocaleDateString() : 'N/A';
        const lastFiling = org.latest_filing_date ?
            new Date(org.latest_filing_date).toLocaleDateString() : 'N/A';

        // Debug what data we're getting
        console.log('Organization data received:', org);
        console.log("Filings data:", data.filings_with_data);

        // Try to access filings data
        const filings = data.filings_with_data || [];
        const latestFiling = filings[0] || {};
        console.log('Latest filing:', latestFiling);
        const ratios = calculateEfficiencyRatios(latestFiling);
        const sustainability = calculateSustainabilityMetrics(latestFiling);

        const revenue = org.income_amount ? 
            `${numberWithCommas(org.income_amount)}` : 'N/A';
        const assets = org.asset_amount ?
            `${numberWithCommas(org.asset_amount)}` : 'N/A';
        const address = org.address || 'N/A';

        console.log('Sustainability metrics:', sustainability); // Debug output

        document.getElementById('modalContent').innerHTML = `
            <div class="section">
                <h2 class="section-header">Financial Trends</h2>
                <div id="trendsChart" style="height: 300px; margin-bottom: 2rem;"></div>
                <div id="previousYearsData">
                    ${data.filings_with_data ? displayFilingsHistory(data.filings_with_data) : 'No historical data available'}
                </div>
            </div>

            <div class="section">
                <h2 class="section-header">Sustainability Metrics</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <h3>Months of Cash</h3>
                        <div class="metric-value" id="months-of-cash">
                            ${sustainability.monthsOfCash.toFixed(1)} months
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${Math.min(sustainability.monthsOfCash / 12 * 100, 100)}%; 
                                    background-color: ${getMetricColor('sustainability', sustainability.monthsOfCash)}">
                                </div>
                            </div>
                        </div>
                        <div class="metric-desc">Operating runway based on current assets</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-header">Efficiency Metrics</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <h3>Program Efficiency</h3>
                        <div class="metric-value" id="program-efficiency">
                            ${(ratios.programEfficiency * 100).toFixed(1)}%
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${ratios.programEfficiency * 100}%; 
                                    background-color: ${getMetricColor('program', ratios.programEfficiency)}">
                                </div>
                            </div>
                        </div>
                        <div class="metric-desc">Percentage of expenses going to programs</div>
                    </div>

                    <div class="metric-card">
                        <h3>Fundraising Efficiency</h3>
                        <div class="metric-value" id="fundraising-efficiency">
                            ${(ratios.fundraisingEfficiency * 100).toFixed(1)}%
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${Math.min(ratios.fundraisingEfficiency * 100, 100)}%; 
                                    background-color: ${getMetricColor('fundraising', ratios.fundraisingEfficiency)}">
                                </div>
                            </div>
                        </div>
                        <div class="metric-desc">Cost to raise each dollar</div>
                    </div>

                    <div class="metric-card">
                        <h3>Administrative Rate</h3>
                        <div class="metric-value" id="admin-rate">
                            ${(ratios.adminRate * 100).toFixed(1)}%
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${ratios.adminRate * 100}%;
                                    background-color: ${getMetricColor('admin', ratios.adminRate)}">
                                </div>
                            </div>
                        </div>
                        <div class="metric-desc">Overhead expenses as percent of total</div>
                    </div>
                </div>
                <div class="text-sm text-gray-500 mt-4">
                    Note: These metrics are calculated based on the organization's most recent Form 990 filing and may vary based on filing practices and reporting periods.
                </div>
            </div>

            <div class="section">
                <h2 class="section-header">Organization Details</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <h3>Organization Info</h3>
                        <div class="metric-value">
                            EIN: ${org.ein}<br>
                            Location: ${org.city}, ${org.state}<br>
                            Tax-Exempt Since: ${taxExemptSince}<br>
                            Last Filing: ${lastFiling}
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
                            Revenue: ${org.income_amount ? '$' + numberWithCommas(org.income_amount) : 'N/A'}<br>
                            Assets: ${org.asset_amount ? '$' + numberWithCommas(org.asset_amount) : 'N/A'}<br>
                            ${org.exemption_number ? 'Exemption: ' + org.exemption_number : ''}
                        </div>
                    </div>

                    <div class="metric-card">
                        <h3>Contact Information</h3>
                        <div class="metric-value">
                            Address: ${org.address ? `${org.address}, ${org.city}, ${org.state}` : 'N/A'}<br>
                            ZIP: ${org.zipcode || 'N/A'}<br>
                            ${org.website ? `Website: <a href="${org.website}" target="_blank" style="color: #4299e1;">${org.website}</a>` : ''}
                        </div>
                    </div>
                </div>
            </div>

        <div class="section">
                <h2 class="section-header">Full Report</h2>
                <div class="metric-card">
                    <div class="metric-value">
                        <a href="https://projects.propublica.org/nonprofits/organizations/${ein}" 
                        target="_blank" 
                        style="color: #4299e1;">
                            View on ProPublica →
                        </a>
                    </div>
                </div>
            </div>
        `;

        console.log("About to initialize chart");
        if (data.filings_with_data && data.filings_with_data.length > 0) {
            console.log("Have filings data, calling renderFinancialTrendsChart");
            renderFinancialTrendsChart('trendsChart', data.filings_with_data);
        } else {
            console.log("No filings data available for chart");
        }

    } catch (error) {
        console.error('Analysis Error:', error);
        document.getElementById('modalContent').innerHTML = `
            <div class="error-message">
                Unable to load analysis: ${error.message}
                <br><br>
                <a href="https://projects.propublica.org/nonprofits/organizations/${ein}" 
                target="_blank"
                style="color: #4299e1;">
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
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    try {
        searchButton.disabled = true;
        resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

        const data = await searchNonprofits(searchTerm); // Data is already parsed
        if (!data || !data.organizations) {
            throw new Error('Invalid response from search');
        }
        displayResults(data);
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
searchButton.addEventListener('click', handleSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
}

// Export functions needed globally
window.showAnalysis = showAnalysis;
window.closeModal = closeModal;