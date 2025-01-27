# Nonprofit Grant Flow Network

This project visualizes nonprofit grant flow networks, showing relationships between organizations through their grant activities. It also highlights government funding and taxpayer impact.

## Current Status

The visualization currently loads and displays nonprofit grant data with some interactivity, but several improvements are needed to match the reference implementation.

### Working Features
- Basic data loading from CSV/ZIP files
- Organization search by EIN or name
- Basic network visualization
- Financial data display
- Government funding highlights

### Areas for Improvement

1. Initial Load Behavior
- Currently: Loads and displays full graph on page load
- Target: Should wait for user input (EIN or keyword) before displaying
- Need to modify the initial data loading pattern

2. Data Filtering
- Currently: Shows many interconnected nodes
- Target: More selective filtering based on:
  - User-specified EINs
  - Keywords
  - Connection depth
  - Grant amounts

3. BFS Implementation
- Need to implement multi-root BFS approach:
  - Start from largest receipt_amt EIN
  - Expand until 5+ nodes found
  - Maintain proper level boundaries for coloring
  - Respect depth settings

4. Visualization
- Consider switching from D3.js to Viz.js for:
  - Better hierarchical layout
  - More consistent node placement
  - Clearer relationship display

## Key Dependencies

- JSZip: For handling compressed CSV files
- PapaParse: For efficient CSV parsing
- D3.js: Current visualization library
- (Potential) Viz.js: For improved graph rendering

## Data Structure

### Charities CSV
- filer_ein
- filer_name
- receipt_amt
- govt_amt
- contrib_amt
- tax_year

### Grants CSV
- filer_ein
- grant_ein
- tax_year
- grant_amt

## Next Steps

1. Update initial load behavior
2. Implement reference BFS algorithm
3. Fix depth control functionality
4. Consider visualization library switch
5. Add proper error handling
6. Improve performance on large datasets

## Reference Implementation Notes

The reference implementation:
- Uses Viz.js for graph rendering
- Implements multi-root BFS search
- Shows selective node relationships
- Handles high taxpayer funding alerts
- Provides clear visual hierarchy
- Only loads visualization after user input

## Directory Structure

```
grant-visualization/
├── charities.csv
├── grants.csv
├── controls.js
├── data.js
├── main.js
├── network.js
├── styles.css
└── grant-visualization.html
```