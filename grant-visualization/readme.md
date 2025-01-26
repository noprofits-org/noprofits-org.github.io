# Nonprofit Grant Flow Network Visualizer

A D3.js-based visualization tool that displays grant relationships between nonprofit organizations. The visualization represents organizations as nodes and grants as directed edges, allowing users to explore funding relationships in the nonprofit sector.

## Overview

The Grant Flow Network Visualizer creates an interactive network graph showing how funding flows between nonprofit organizations. Organizations are represented as nodes, with their size indicating total grant volume (given + received). Directed edges show individual grants, with arrow direction indicating fund flow and line thickness representing grant amount.

## Features

- **Interactive Network Graph**: Drag and reposition nodes with sticky positioning
- **Organization Search**: Filter visualization by specific organizations
- **Connection Depth Control**: View funding relationships up to 5 levels deep
- **Grant Amount Filtering**: Filter by minimum grant amount
- **Organization Limiting**: Control visualization density by limiting number of organizations shown
- **Color-Coded Relationships**: Different colors indicate relationship depth from selected organization

## Technical Implementation

The project is structured into several modular components:

### Core Components

- `DataManager`: Handles data loading and processing
- `NetworkVisualization`: Manages the D3.js visualization
- `Controls`: Handles user interface and input processing
- `GrantVisualizer`: Main application class coordinating all components

### Data Structure

The visualization uses two main CSV files:
- `charities.csv`: Contains organization information
  - Fields: filer_ein, filer_name, receipt_amt
- `grants.csv`: Contains grant relationship data
  - Fields: filer_ein, filer_name, grant_ein, grant_amt

### Visualization Logic

- Node size is proportional to total grant volume
- Edge thickness represents individual grant amounts
- Color coding indicates relationship depth:
  - Red: Root organization
  - Orange: Direct connections
  - Green: Secondary connections
  - Blue: Tertiary connections
  - Purple: Level 4 connections
  - Pink: Level 5 connections

## Development History

The project evolved from a single-file implementation to a modular structure:
1. Initial version: All code in one HTML file
2. Modularization: Split into separate components for better maintainability
3. Enhanced features: Added sticky nodes and improved data validation
4. UI improvements: Better error handling and user feedback

## Planned Enhancements

1. **Navigation Improvements**
   - Add zoom and pan controls
   - Implement minimap for large networks
   - Add ability to center on selected nodes

2. **Search Enhancements**
   - Improved organization search with autocomplete
   - Advanced filtering options
   - Search history

3. **User Interface**
   - Add reset button to unstick all nodes
   - Node highlighting on hover to show connections
   - Improved tooltips with detailed information

4. **Future Considerations**
   - Performance optimizations for larger datasets
   - Export functionality for subgraphs
   - Support for different data formats
   - Comparative visualization features

## Setup and Usage

1. Place all files in the same directory
2. Ensure `charities.csv` and `grants.csv` are present
3. Open `grant-visualization.html` in a web browser
4. Use the control panel to:
   - Search for specific organizations
   - Adjust connection depth (1-5)
   - Set minimum grant amount
   - Limit number of organizations shown

## Technical Requirements

- Modern web browser with ES6 support
- D3.js v7
- No additional server requirements

## Data Source

Data sourced from joeisdone.github.io/charity (accessed January 2025)