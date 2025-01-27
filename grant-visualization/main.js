// main.js
import { DataManager } from './data.js';
import { NetworkVisualization } from './network.js';
import { Controls } from './controls.js';

export class GrantVisualizer {
    constructor() {
        this.dataManager = new DataManager();
        this.networkViz = null;
        this.controls = null;
        this.currentFilters = null;
    }

    async initialize() {
        console.log("Starting initialization...");
        try {
            // Load initial data but don't visualize yet
            await this.dataManager.loadData();

            // Initialize visualization
            const svg = d3.select('#network');
            const width = window.innerWidth;
            const height = window.innerHeight;

            console.log("Creating network visualization...");
            this.networkViz = new NetworkVisualization(svg, width, height);

            // Initialize controls
            console.log("Initializing controls...");
            this.controls = new Controls(this.dataManager, this.handleUpdate.bind(this));

            // Display initial message
            this.showWelcomeMessage();

            // Handle window resize
            window.addEventListener('resize', () => this.handleResize());

        } catch (error) {
            console.error("Initialization failed:", error);
            this.showError("Failed to initialize visualization: " + error.message);
        }
    }

    showWelcomeMessage() {
        const svg = d3.select('#network');
        svg.selectAll("*").remove();
        svg.append("text")
            .attr("x", window.innerWidth / 2)
            .attr("y", window.innerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text("Please select an organization to begin visualization");
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.background = 'rgba(239, 68, 68, 0.9)';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }

    async handleUpdate(filters) {
        this.currentFilters = filters;
        try {
            if (!filters.orgFilter) {
                this.showWelcomeMessage();
                return;
            }

            // Process data with filters
            const filteredData = this.dataManager.filterData(filters);

            // Update stats display
            this.controls.updateStats(filteredData.stats);

            // Update visualization
            this.networkViz.update(filteredData, this.dataManager.originalData.charities);
        } catch (error) {
            console.error('Update error:', error);
            this.showError('Failed to update visualization: ' + error.message);
        }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.networkViz.resize(width, height);

        if (this.currentFilters) {
            this.handleUpdate(this.currentFilters).catch(console.error);
        } else {
            this.showWelcomeMessage();
        }
    }
}