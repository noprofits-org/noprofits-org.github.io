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

export {
    numberWithCommas,
    formatCurrency,
    formatDate
};

