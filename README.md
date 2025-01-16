# NoProfits.org

A platform for transparency in social services funding.

## API Documentation

### ProPublica Nonprofit API Fields

The API provides two main endpoints: search and organization details. Here are the key fields available:

#### Organization Details
```javascript
{
    "id": "numeric_id",
    "ein": "employer_identification_number",
    "name": "organization_name",
    "address": "street_address",
    "city": "city_name",
    "state": "state_code",
    "zipcode": "zip_code",
    "ntee_code": "nonprofit_type_code",
    "raw_ntee_code": "detailed_category_code",
    "subsection_code": "tax_classification_code",
    "asset_amount": "total_assets",
    "income_amount": "total_income",
    "revenue_amount": "total_revenue",
    "tax_period": "filing_period_YYYYMM"
}
```

#### Filing Data Fields
```javascript
{
    "tax_prd": "YYYYMM",                    // Tax period 
    "tax_prd_yr": "YYYY",                   // Tax year
    "formtype": "form_type_code",           // Type of 990 form
    
    // Revenue Fields
    "totrevenue": "total_revenue",          // Total revenue
    "totcntrbgfts": "total_contributions",  // Total contributions/grants
    "grsrcptsrelated170": "program_revenue",// Program service revenue
    "invstmntinc": "investment_income",     // Investment income
    
    // Expense Fields
    "totfuncexpns": "total_expenses",       // Total functional expenses
    "profndraising": "fundraising_fees",    // Professional fundraising
    "compnsatncurrofcr": "officer_comp",    // Officer compensation
    "othrsalwages": "other_salaries",       // Other salaries and wages
    "payrolltx": "payroll_taxes",           // Payroll taxes
    
    // Balance Sheet
    "totassetsend": "total_assets",         // Total assets end of year
    "totliabend": "total_liabilities",      // Total liabilities end
    "totnetassetend": "net_assets",         // Net assets/fund balances
    
    // Program Details
    "gftgrntsrcvd170": "grants_received",   // Grants received
    "srvcsval170": "services_value",        // Value of services provided
    
    // Other Financial
    "secrdmrtgsend": "secured_mortgages",   // Secured mortgages
    "txexmptbndsend": "tax_exempt_bonds"    // Tax-exempt bonds
}
```

## Efficiency Metrics

The platform calculates and displays several key efficiency metrics with color-coded thresholds:

1. Program Efficiency = Program Expenses / Total Expenses
   * Excellent (Green): > 85%
   * Good (Light Green): 75-85%
   * Fair (Yellow): 65-75%
   * Concerning (Orange): 50-65%
   * Poor (Red): < 50%

2. Fundraising Efficiency = Fundraising Costs / Total Contributions
   * Excellent (Green): < 10%
   * Good (Light Green): 10-20%
   * Fair (Yellow): 20-30%
   * Concerning (Orange): 30-40%
   * Poor (Red): > 40%

3. Administrative Rate = Management & General / Total Expenses
   * Excellent (Green): < 10%
   * Good (Light Green): 10-15%
   * Fair (Yellow): 15-20%
   * Concerning (Orange): 20-25%
   * Poor (Red): > 25%

Each metric includes:
- Visual progress bar with color coding
- Hover tooltip showing thresholds
- Descriptive text explanation

## Development

### Local Setup
1. Clone repository
2. Open index.html in browser or use local server
3. API requires CORS proxy for ProPublica endpoints

### Tech Stack
- Pure JavaScript (no framework)
- TailwindCSS for styling
- Chart.js for visualizations
- ProPublica Nonprofit Explorer API

## Current Project Status

### Completed Features:
- Basic search functionality
- Organization details display
- Efficiency metrics calculation and display
- Color-coded metric visualization
- Financial trends chart
- Mobile-responsive design
- Basic error handling

### Next Steps for Development Session:

1. Implement Additional Sustainability Metrics:
   - Months of Cash (based on current assets vs monthly expenses)
   - Revenue Diversification metric
   - Year-over-year growth visualization

2. Search Enhancements:
   - Add state/region filter
   - Add revenue range filter
   - Add NTEE code (organization type) filter
   - Save recent searches functionality

3. UI/UX Improvements:
   - Add loading states for metrics
   - Implement comparison view for multiple organizations
   - Add data download/export functionality
   - Enhance mobile experience

4. Documentation:
   - Add JSDoc comments
   - Create contributing guidelines
   - Add deployment instructions

FILES TO MODIFY:
- npsearch.html: Add new metrics and filters
- styles.css: Add styles for new components
- nonprofits.js: Implement new calculations