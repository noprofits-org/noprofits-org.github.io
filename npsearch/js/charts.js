// charts.js - Handles all chart rendering

import { numberWithCommas } from './utils.js';

function renderFinancialTrendsChart(containerId, filings) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.log('Container not found:', containerId);
        return;
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    container.innerHTML = ''; // Clear any existing content
    container.appendChild(canvas);

    // Process and sort the data
    const chartData = filings
        .map(filing => ({
            year: filing.tax_prd_yr || '',
            revenue: filing.totrevenue || 0,
            expenses: filing.totfuncexpns || 0,
            assets: filing.totassetsend || 0
        }))
        .sort((a, b) => a.year - b.year); // Sort by year ascending
    
    console.log('Processed chart data:', chartData);

    // Format dollar amounts
    const formatDollar = (value) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value}`;
    };

       // Create the chart
       try {
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.year),
                datasets: [
                    {
                        label: 'Revenue',
                        data: chartData.map(d => d.revenue),
                        borderColor: '#4299e1',
                        backgroundColor: '#4299e1',
                        tension: 0.1,
                        pointRadius: 0
                    },
                    {
                        label: 'Expenses',
                        data: chartData.map(d => d.expenses),
                        borderColor: '#f56565',
                        backgroundColor: '#f56565',
                        tension: 0.1,
                        pointRadius: 0
                    },
                    {
                        label: 'Assets',
                        data: chartData.map(d => d.assets),
                        borderColor: '#48bb78',
                        backgroundColor: '#48bb78',
                        tension: 0.1,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatDollar(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#333'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    y: {
                        grid: {
                            color: '#333'
                        },
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return formatDollar(value);
                            }
                        }
                    }
                }
            }
        });
        console.log('Chart successfully rendered');
    } catch (error) {
        console.error('Error rendering chart:', error);
        container.innerHTML = `<div class="error-message">Unable to display chart: ${error.message}</div>`;
    }
}

export {
    renderFinancialTrendsChart
};

