// main.js
import { DataManager } from './data.js';
import { NetworkVisualization } from './network.js';
import { Controls } from './controls.js';

export class GrantVisualizer {
    constructor() {
        this.dataManager = new DataManager();
        this.networkViz = null;
        this.controls = null;
    }

    async initialize() {
        // Load initial data
        const data = await this.dataManager.loadData();
        if (!data) {
            throw new Error('Failed to load data');
        }

        // Initialize visualization
        const svg = d3.select('#network');
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.networkViz = new NetworkVisualization(svg, width, height);

        // Initialize controls
        this.controls = new Controls(this.dataManager, this.handleUpdate.bind(this));

        // Perform initial update
        await this.handleUpdate(this.controls.getFilters());

        // Add window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    async handleUpdate(filters) {
        try {
            // Process data with filters
            const filteredData = this.dataManager.filterData(filters);
            
            // Update stats display
            this.controls.updateStats(filteredData.stats);

            // Update visualization
            this.networkViz.update(filteredData, this.dataManager.originalData.charities);
        } catch (error) {
            console.error('Update error:', error);
            throw error; // Propagate error up
        }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.networkViz = new NetworkVisualization(
            d3.select('#network'), 
            width, 
            height
        );

        // Re-render with current filters
        this.handleUpdate(this.controls.getFilters()).catch(console.error);
    }
}