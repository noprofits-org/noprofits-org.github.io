# NoProfits.org

A platform for transparency in social services funding.

## Project Overview

NoProfits.org is a web application designed to provide transparency and insights into the financial health of nonprofit organizations. Users can search for organizations by name and view details like their mission statement, financial data, and efficiency metrics. The platform also calculates and displays key performance indicators to help users assess the financial well-being and effectiveness of nonprofits.

## Tech Stack

* Front-end: HTML, CSS (TailwindCSS), JavaScript (Chart.js)
* API: ProPublica Nonprofit Explorer API (CORS proxy required for local development)

## Local Development Setup

1. Clone the repository.
2. Install dependencies (if using a package manager like npm or yarn).
3. Configure a local CORS proxy for ProPublica API requests (optional, but recommended for development).
4. Open `index.html` in a web browser or use a local development server.

## Code Structure

The codebase is primarily organized into three main JavaScript files:

* `npsearch.html`: This file contains the HTML structure of the application, including search input fields, organization details display areas, and charts. It also includes JavaScript code for basic search functionality and data binding to the UI.
* `styles.css`: This file contains TailwindCSS classes used for styling the application's layout and visual elements.
* `nonprofits.js`: This file contains the core application logic, including:
    * Fetching organization data from the ProPublica API.
    * Parsing and processing API responses.
    * Calculating efficiency metrics (program efficiency, fundraising efficiency, administrative rate).
    * Generating chart data for financial trends visualization.

## Current Features

* **Search Functionality:** Users can search for nonprofit organizations by name.
* **Organization Details:** Displays basic information about an organization, including its mission statement, address, and tax classification.
* **Financial Data:** Shows key financial data points from the most recent 990 filing, including total revenue, expenses, assets, and liabilities.
* **Efficiency Metrics:** Calculates and displays three key efficiency metrics with color-coded progress bars and hover tooltips for thresholds:
    * Program Efficiency
    * Fundraising Efficiency
    * Administrative Rate
* **Financial Trends Chart:** Visualizes trends in revenue, expenses, and net assets over time using Chart.js.
* **Mobile-Responsive Design:** The application adjusts its layout for optimal viewing on various screen sizes.
* **Basic Error Handling:** Handles potential errors during API requests and data processing.

## Next Steps

The following features are planned for future development sessions:

* **Additional Sustainability Metrics:**
    * Months of Cash (based on current assets vs monthly expenses)
    * Revenue Diversification metric
    * Year-over-year growth visualization
* **Search Enhancements:**
    * Add state/region filter
    * Add revenue range filter
    * Add NTEE code (organization type) filter
    * Save recent searches functionality
* **UI/UX Improvements:**
    * Add loading states for metrics calculations
    * Implement comparison view for multiple organizations
    * Add data download/export functionality
    * Enhance mobile experience
* **Documentation:**
    * Add JSDoc comments to improve code readability
    * Create contributing guidelines for developers interested in contributing to the project
    * Add deployment instructions for deploying the application to a production environment

## Files to Modify for Adding New Features

* `npsearch.html`: This file will likely require the most modifications to add new search filters, metrics, and UI components for displaying additional data or functionalities.
* `styles.css`: New CSS classes might be needed to style the additional UI components introduced for new features.
* `nonprofits.js`: The core logic for fetching data, calculating metrics, and generating visualizations might need to be extended to handle new metrics and functionalities.