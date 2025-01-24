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
    const totalExpenses = filing?.totfuncexpns;
    const programExpenses = filing?.totprgmrevnue;
    const totalContributions = filing?.totcntrbgfts;
    const fundraisingExpenses = filing?.lessdirfndrsng;
    const managementAndGeneralExpenses = filing?.gnlsothr;

    const isValidNumber = (value) => typeof value === 'number' && !isNaN(value);

    let programEfficiency = "NA";
    if (isValidNumber(totalExpenses) && isValidNumber(programExpenses) && totalExpenses > 0) {
        programEfficiency = (programExpenses / totalExpenses) * 100;
    }

    let fundraisingEfficiency = "NA";
    if (isValidNumber(totalContributions) && isValidNumber(fundraisingExpenses) && totalContributions > 0) {
        fundraisingEfficiency = (fundraisingExpenses / totalContributions) * 100;
    }

    let adminRate = "NA";
    if (isValidNumber(totalExpenses) && isValidNumber(managementAndGeneralExpenses) && totalExpenses > 0) {
        adminRate = (managementAndGeneralExpenses / totalExpenses) * 100;
    }

    return {
        programEfficiency,
        fundraisingEfficiency,
        adminRate,
        formulas: {
            programEfficiency: "Program Efficiency = (Program Service Expenses / Total Expenses) × 100%",
            fundraisingEfficiency: "Fundraising Efficiency = (Fundraising Expenses / Total Contributions) × 100%",
            adminRate: "Administrative Rate = (Management & General Expenses / Total Expenses) × 100%"
        }
    };
}

/**
 * Calculates sustainability metrics
 * @param {Object} filing - Form 990 filing data
 * @returns {Object} Sustainability metrics
 */
function calculateSustainabilityMetrics(filing) {
    const totalExpenses = filing?.totfuncexpns;
    const totalAssets = filing?.totassetsend;
    const totalLiabilities = filing?.totliabend;
    const totalRevenue = filing?.totrevenue;
    const programRevenue = filing?.totprgmrevnue;
    const contributions = filing?.totcntrbgfts;
    const investmentIncome = filing?.invstmntinc;

    // Helper function to check if a value is a valid number
    const isValidNumber = (value) => typeof value === 'number' && !isNaN(value);

    let monthlyExpenses = "NA";
    if (isValidNumber(totalExpenses)) {
        monthlyExpenses = totalExpenses / 12;
    }

    let workingCapital = "NA";
    if (isValidNumber(totalAssets) && isValidNumber(totalLiabilities)) {
        workingCapital = totalAssets - totalLiabilities;
    }

    let monthsOfCash = "NA";
    if (isValidNumber(workingCapital) && isValidNumber(monthlyExpenses) && monthlyExpenses > 0) {
        monthsOfCash = workingCapital / monthlyExpenses;
    }

    let otherRevenue = "NA";
    if (isValidNumber(totalRevenue) && isValidNumber(programRevenue) && isValidNumber(contributions) && isValidNumber(investmentIncome)) {
        otherRevenue = totalRevenue - programRevenue - contributions - investmentIncome;
    }

    let revenueSources = [];
    if (isValidNumber(programRevenue) && isValidNumber(contributions) && isValidNumber(investmentIncome) && isValidNumber(otherRevenue)) {
        revenueSources = [
            { source: 'Program', amount: programRevenue },
            { source: 'Contributions', amount: contributions },
            { source: 'Investment', amount: investmentIncome },
            { source: 'Other', amount: otherRevenue }
        ].filter(source => source.amount > 0);
    }

    let diversificationScore = "NA";
    if (revenueSources.length > 1 && isValidNumber(totalRevenue) && totalRevenue > 0) {
        diversificationScore = revenueSources.reduce((sum, source) => sum + Math.pow(source.amount / totalRevenue, 2), 0);
    }

    return {
        monthsOfCash,
        workingCapital,
        diversificationScore,
        revenueSources
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

    const result = metricThresholds.find(({ threshold }) => value >= threshold);
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
        (b.tax_prd_yr || "NA") - (a.tax_prd_yr || "NA")
    );

    const current = sortedFilings[0][metric] || "NA";
    const previous = sortedFilings[1][metric] || "NA";

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

