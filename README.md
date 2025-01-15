# github.io

# NoProfits.org

A platform for transparency in social services funding.

## API Documentation

### ProPublica Nonprofit API Fields

Key fields used in efficiency calculations:

```javascript
{
    "filings_with_data": [{
        "tax_prd": 201912,                 // Tax period (YYYYMM)
        "tax_prd_yr": 2019,                // Tax year
        "totrevenue": 1410352,             // Total revenue
        "totfuncexpns": 1518092,           // Total functional expenses
        "totassetsend": 1962416,           // Total assets end of year
        "totliabend": 736116,              // Total liabilities end of year
        "totcntrbgfts": 1392267,           // Total contributions and grants
        "profndraising": 0                 // Professional fundraising fees
    }]
}

## Efficiency Metrics

The platform calculates several key efficiency metrics:

1. Program Efficiency = Program Expenses / Total Expenses
  * Benchmark: >70% considered good
  * Shows what percentage of expenses go to programs

2. Fundraising Efficiency = Fundraising Costs / Total Contributions
  * Benchmark: <20% considered good
  * Shows cost to raise each dollar

3. Administrative Rate = Admin Expenses / Total Expenses
  * Benchmark: <15% considered good
  * Shows overhead rate

## Development

To run locally:
1. Clone repository
2. Open index.html in browser or use local server
3. API requires CORS proxy for ProPublica endpoints

##Project Status and Next Steps for NoProfits.org

#COMPLETED:
- Added calculateEfficiencyRatios function
- Created README.md with API documentation
- Designed modal section for efficiency metrics
- Added CSS for new efficiency metric components

#NEXT STEPS:
1. Implement efficiency metrics display in modal:
   - Add new HTML section to showAnalysis function
   - Test metric calculations with real data
   - Add color coding based on benchmarks

2. In Progress Code Snippets:
   - Modal section HTML starting with:
     '<div class="efficiency-metrics">'
   - New CSS styles starting with:
     '.efficiency-metrics {'

3. Issues to Address:
   - Verify API field names match actual ProPublica response
   - Test calculations with edge cases (missing data, zeros)
   - Add error handling for missing fields

4. Future Enhancements:
   - Add tooltips explaining benchmarks
   - Year-over-year comparison
   - Mobile-friendly visualizations
   - Additional sustainability metrics

FILES MODIFIED:
- npsearch.html
- styles.css
- README.md

Please share this summary in the next chat to continue implementation.