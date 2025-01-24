// search.js - Handles search functionality and results display
import { searchNonprofits, getNonprofitDetails } from './api.js';
import { 
    formatCurrency,
    formatDate,
    calculateEfficiencyRatios,
    calculateSustainabilityMetrics,
    getMetricColor,
    numberWithCommas
} from './utils.js';
import { renderFinancialTrendsChart } from './charts.js';
import { EfficiencyGauge } from './gauge.js';

let searchInput, searchButton, resultsContainer, modal;

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

// In search.js, add these section templates
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

function getEfficiencySection(ratios) {
    return `
        <div class="section">
            <h2 class="section-header">Efficiency Metrics</h2>
            <div class="metric-grid">
                <div id="program-efficiency-gauge"></div>
                <div id="fundraising-efficiency-gauge"></div>
                <div id="admin-rate-gauge"></div>
            </div>
            <div class="text-sm text-gray-500 mt-4">
                Note: Metrics based on most recent Form 990 filing.
            </div>
        </div>
    `;
}

function getSustainabilitySection(sustainability) {
    const monthsOfCash = sustainability?.monthsOfCash || 0;
    return `
        <div class="section">
            <h2 class="section-header">Sustainability Metrics</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <h3>Months of Cash</h3>
                    <div class="metric-value" id="months-of-cash">
                        ${typeof sustainability.monthsOfCash === 'number' ? sustainability.monthsOfCash.toFixed(1) + " months" : "NA"}
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${typeof sustainability.monthsOfCash === 'number' ? Math.min(sustainability.monthsOfCash / 12 * 100, 100) : 0}%; 
                                background-color: ${typeof sustainability.monthsOfCash === 'number' ? getMetricColor('sustainability', sustainability.monthsOfCash) : '#ccc'}">
                            </div>
                        </div>
                    </div>
                    <div class="metric-desc">Operating runway based on current assets</div>
                </div>
            </div>
        </div>
    `;
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
        
        const data = await getNonprofitDetails(ein);
        console.log("Filing data:", data.filings_with_data[0]);

        const org = data.organization;
        
        if (!org) {
            throw new Error('Organization data not found');
        }

        const sustainability = calculateSustainabilityMetrics(data.filings_with_data[0] || {});
        console.log("Sustainability:", sustainability);

        const ratios = calculateEfficiencyRatios(data.filings_with_data[0] || {});
        console.log("Ratios:", ratios);
        
        // Compose modal content from sections
        document.getElementById('modalContent').innerHTML = `
            ${getFinancialTrendsSection(data)}
            ${getEfficiencySection(ratios)}
            ${getSustainabilitySection(sustainability)}
            ${getOrgDetailsSection(org)}
            ${getFullReportSection(ein)}
        `;

        // Initialize gauges
        new EfficiencyGauge('program-efficiency-gauge', {
            value: typeof ratios.programEfficiency === 'number' ? ratios.programEfficiency : 0, // Default to 0 for gauge
            label: 'Program Efficiency',
            description: 'Percentage of expenses going to programs',
            formula: ratios.formulas.programEfficiency
        });

        new EfficiencyGauge('fundraising-efficiency-gauge', {
            value: typeof ratios.fundraisingEfficiency === 'number' ? ratios.fundraisingEfficiency : 0,
            label: 'Fundraising Efficiency',
            description: 'Cost to raise each dollar',
            formula: ratios.formulas.fundraisingEfficiency,
            thresholds: [
                { value: 40, color: '#EF4444' },
                { value: 30, color: '#FB923C' },
                { value: 20, color: '#FBBF24' },
                { value: 10, color: '#6EE7B7' },
                { value: 0, color: '#34D399' }
            ]
        });

        new EfficiencyGauge('admin-rate-gauge', {
            value: typeof ratios.adminRate === 'number' ? ratios.adminRate : 0,
            label: 'Administrative Rate',
            description: 'Overhead expenses as percent of total',
            formula: ratios.formulas.adminRate,
            thresholds: [
                { value: 25, color: '#EF4444' },
                { value: 20, color: '#FB923C' },
                { value: 15, color: '#FBBF24' },
                { value: 10, color: '#6EE7B7' },
                { value: 0, color: '#34D399' }
            ]
        });

        if (data.filings_with_data?.length > 0) {
            renderFinancialTrendsChart('trendsChart', data.filings_with_data);
        }

    } catch (error) {
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
        
        const data = await searchNonprofits(searchTerm);
        console.log('Search results:', data);
        
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