// utils.js - Utility functions for nonprofit analysis

/**
 * Formats a number with commas as thousand separators
 * @param {number} x - Number to format
 * @returns {string} Formatted number
 */
function numberWithCommas(x) {
    if (!x) return '0';
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Formats currency values
 * @param {number} value - Amount to format
 * @param {boolean} abbreviated - Whether to abbreviate large numbers
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, abbreviated = false) {
    if (!value) return '$0';
    
    if (abbreviated) {
        if (value >= 1000000000) {
            return `$${(value / 1000000000).toFixed(1)}B`;
        }
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
    }
    
    return `$${numberWithCommas(value)}`;
}

/**
 * Formats a date string
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Date formatting error:', e);
        return 'Invalid Date';
    }
}

/**
 * Calculates efficiency ratios from Form 990 data
 * @param {Object} filing - Form 990 filing data
 * @returns {Object} Calculated efficiency ratios
 */
function calculateEfficiencyRatios(filing) {
    // Extract base values with safe fallbacks
    const totalExpenses = filing?.totfuncexpns || 0;
    const totalContributions = filing?.totcntrbgfts || 0;
    const programExpenses = filing?.progservexp || (totalExpenses * 0.88); // Use actual if available
    const managementExpenses = filing?.managgenexp || (totalExpenses * 0.10);
    const fundraisingExpenses = filing?.fundraisingexp || (totalExpenses * 0.02);

    // Calculate core efficiency ratios
    const programEfficiency = totalExpenses > 0 ? programExpenses / totalExpenses : 0;
    const fundraisingEfficiency = totalContributions > 0 ? fundraisingExpenses / totalContributions : 0;
    const adminRate = totalExpenses > 0 ? managementExpenses / totalExpenses : 0;

    return {
        programEfficiency,
        fundraisingEfficiency,
        adminRate,
        // Add raw values for reference
        raw: {
            totalExpenses,
            totalContributions,
            programExpenses,
            managementExpenses,
            fundraisingExpenses
        }
    };
}

/**
 * Calculates sustainability metrics
 * @param {Object} filing - Form 990 filing data
 * @returns {Object} Sustainability metrics
 */
function calculateSustainabilityMetrics(filing) {
    // Monthly expenses (total expenses / 12)
    const monthlyExpenses = (filing?.totfuncexpns || 0) / 12;
    
    // Current assets and liabilities (more accurate for cash position)
    const currentAssets = filing?.totcurrassets || 0;    // Using current assets
    const currentLiabilities = filing?.totcurrliab || 0; // Using current liabilities
    
    // Working capital (current assets - current liabilities)
    const workingCapital = currentAssets - currentLiabilities;
    
    // Months of cash calculation using working capital
    const monthsOfCash = monthlyExpenses > 0 ? workingCapital / monthlyExpenses : 0;

    // Debug log
    console.log('Sustainability Calculation:', {
        monthlyExpenses,
        currentAssets,
        currentLiabilities,
        workingCapital,
        monthsOfCash
    });
    
    // Revenue sources for diversification
    const contributions = filing?.totcntrbgfts || 0;
    const programRevenue = filing?.progrevenue || 0;
    const investmentIncome = filing?.investinc || 0;
    const otherRevenue = filing?.othrevenue || 0;
    const totalRevenue = filing?.totrevenue || 0;

    // Calculate revenue diversification (Herfindahl-Hirschman Index)
    const revenueSources = [
        contributions / totalRevenue,
        programRevenue / totalRevenue,
        investmentIncome / totalRevenue,
        otherRevenue / totalRevenue
    ].filter(share => !isNaN(share));

    const diversificationScore = revenueSources.length > 0 ?
        1 - revenueSources.reduce((sum, share) => sum + Math.pow(share, 2), 0) : 0;

        return {
            monthsOfCash,
            workingCapital,
            diversificationScore,
            raw: {
                currentAssets,
                currentLiabilities,
                monthlyExpenses,
                revenueSources: {
                    contributions,
                    programRevenue,
                    investmentIncome,
                    otherRevenue,
                    totalRevenue
                }
            }
        };
    }

/**
 * Returns color coding for different metrics
 * @param {string} metricType - Type of metric
 * @param {number} value - Metric value
 * @returns {string} Hex color code
 */
function getMetricColor(metricType, value) {
    const thresholds = {
        program: [
            { threshold: 0.85, color: '#34D399', label: 'Excellent' }, // Green
            { threshold: 0.75, color: '#6EE7B7', label: 'Good' },     // Light green
            { threshold: 0.65, color: '#FBBF24', label: 'Fair' },     // Yellow
            { threshold: 0.50, color: '#FB923C', label: 'Concerning' },// Orange
            { threshold: 0, color: '#EF4444', label: 'Poor' }         // Red
        ],
        admin: [
            { threshold: 0.25, color: '#EF4444', label: 'Poor' },
            { threshold: 0.20, color: '#FB923C', label: 'Concerning' },
            { threshold: 0.15, color: '#FBBF24', label: 'Fair' },
            { threshold: 0.10, color: '#6EE7B7', label: 'Good' },
            { threshold: 0, color: '#34D399', label: 'Excellent' }
        ],
        fundraising: [
            { threshold: 0.40, color: '#EF4444', label: 'Poor' },
            { threshold: 0.30, color: '#FB923C', label: 'Concerning' },
            { threshold: 0.20, color: '#FBBF24', label: 'Fair' },
            { threshold: 0.10, color: '#6EE7B7', label: 'Good' },
            { threshold: 0, color: '#34D399', label: 'Excellent' }
        ],
        sustainability: [
            { threshold: 12, color: '#34D399', label: 'Excellent' },   // 12+ months
            { threshold: 9, color: '#6EE7B7', label: 'Good' },        // 9-12 months
            { threshold: 6, color: '#FBBF24', label: 'Fair' },        // 6-9 months
            { threshold: 3, color: '#FB923C', label: 'Concerning' },  // 3-6 months
            { threshold: 0, color: '#EF4444', label: 'Poor' }         // 0-3 months
        ]
    };

    const metricThresholds = thresholds[metricType];
    if (!metricThresholds) {
        console.error(`Unknown metric type: ${metricType}`);
        return '#EF4444';
    }

    const result = metricThresholds.find(({threshold}) => value >= threshold);
    return result ? result.color : metricThresholds[metricThresholds.length - 1].color;
}

/**
 * Calculate year-over-year growth rate
 * @param {Array} filings - Array of yearly filings
 * @param {string} metric - Metric to calculate growth for
 * @returns {number} Growth rate as decimal
 */
function calculateGrowthRate(filings, metric) {
    if (!filings || filings.length < 2) return 0;
    
    // Sort filings by year descending
    const sortedFilings = [...filings].sort((a, b) => 
        (b.tax_prd_yr || 0) - (a.tax_prd_yr || 0)
    );
    
    const current = sortedFilings[0][metric] || 0;
    const previous = sortedFilings[1][metric] || 0;
    
    if (previous === 0) return 0;
    return (current - previous) / previous;
}

export {
    numberWithCommas,
    formatCurrency,
    formatDate,
    calculateEfficiencyRatios,
    calculateSustainabilityMetrics,
    getMetricColor,
    calculateGrowthRate
};