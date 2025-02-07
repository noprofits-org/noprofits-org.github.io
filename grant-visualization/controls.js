// controls.js
const DEBOUNCE_DELAY = 300;

export class Controls {
    constructor(dataManager, onUpdate) {

        try {
            if (!dataManager) {
                throw new Error("DataManager is required");
            }
            if (!onUpdate || typeof onUpdate !== 'function') {
                throw new Error("onUpdate callback is required and must be a function");
            }

            this.dataManager = dataManager;
            this.onUpdate = onUpdate;
            this.eventListeners = new Map();

            this.setupEventListeners();
            this.setupInputValidation();
            this.addExportButton();
            this.setupYearCheckboxes();

        } catch (error) {
            throw error;
        }
    }

    setupYearCheckboxes(currentOrg = '') {
        try {
            let container = document.getElementById('yearCheckboxes');
            const controlsDiv = document.getElementById('controls');

            if (!container) {
                const yearFilterContainer = document.createElement('div');
                yearFilterContainer.id = 'yearFilterContainer';
                yearFilterContainer.innerHTML = `
                    <label>Filter by Grant Years:</label>
                    <div id="yearCheckboxes"></div>
                `;
                const orgFilterGroup = controlsDiv.querySelector('.control-group');
                if (orgFilterGroup) {
                    controlsDiv.insertBefore(yearFilterContainer, orgFilterGroup.nextSibling);
                } else {
                    controlsDiv.insertBefore(yearFilterContainer, controlsDiv.firstChild);
                }
                container = document.getElementById('yearCheckboxes');
            }

            let availableYears = this.dataManager.getAvailableYears(currentOrg);
            container.innerHTML = '';
            availableYears.sort().reverse().forEach(year => {
                const label = document.createElement('label');
                label.className = 'year-checkbox-label';
                label.style.marginRight = '15px';
                label.innerHTML = `
                    <input type="checkbox" 
                           name="yearFilter" 
                           value="${year}" 
                           ${this.getDefaultYearState(year) ? 'checked' : ''}>
                    ${year}
                `;
                container.appendChild(label);
            });

            // Add event listeners for immediate updates
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                this.addListener(checkbox, 'change', () => {
                    const filters = this.getFilters();
                    this.onUpdate(filters);
                });
            });

            const filterContainer = document.getElementById('yearFilterContainer');
            if (filterContainer) {
                filterContainer.style.display = 'block';
            }

        } catch (error) {
            console.error("Error setting up year checkboxes:", error);
        }
    }

    // Add to Controls class
    getDefaultYearState(year) {
        const currentYear = new Date().getFullYear();
        return year >= currentYear - 2;
    }

    setupEventListeners() {
        const orgFilter = document.getElementById('orgFilter');
        const matchingOrgs = document.getElementById('matchingOrgs');
        const updateViewBtn = document.getElementById('updateViewBtn');
        const generateBtn = document.getElementById('generateBtn');
        const minAmountSlider = document.getElementById('minAmount');
        const minAmountDisplay = document.getElementById('minAmountDisplay');

        // Remove update buttons as we'll update automatically
        if (updateViewBtn) {
            updateViewBtn.remove();
        }
        if (generateBtn) {
            generateBtn.remove();
        }

        let searchTimeout;
        const handleSearch = (e) => {
            const searchEl = e.target;
            searchEl.classList.add('search-loading');
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const matches = this.dataManager.searchOrganizations(searchEl.value);
                this.updateOrgSearchResults(matches);
                searchEl.classList.remove('search-loading');
                // Update year checkboxes when org changes
                this.setupYearCheckboxes(searchEl.value);
                // Trigger update after org search
                const filters = this.getFilters();
                this.onUpdate(filters);
            }, 300);
        };

        // Organization filter with debounce
        if (orgFilter) {
            this.addListener(orgFilter, 'input', handleSearch);
        }

        // Organization selection
        if (matchingOrgs) {
            this.addListener(matchingOrgs, 'click', (e) => {
                if (e.target.tagName === 'OPTION') {
                    orgFilter.value = e.target.value;
                    matchingOrgs.style.display = 'none';
                    this.setupYearCheckboxes(e.target.value);
                    const filters = this.getFilters();
                    this.onUpdate(filters);
                }
            });
        }

        // Handle the minimum amount slider with immediate update
        if (minAmountSlider && minAmountDisplay) {
            const minAmountInput = document.getElementById('minAmountInput');
            this.addListener(minAmountSlider, 'input', (e) => {
                const dollarValue = this.convertSliderToDollars(e.target.value);
                minAmountDisplay.textContent = this.formatDollarAmount(dollarValue);
                if (minAmountInput) {
                    minAmountInput.value = dollarValue;
                }
                const filters = this.getFilters();
                this.onUpdate(filters);
            });

            if (minAmountInput) {
                this.addListener(minAmountInput, 'input', (e) => {
                    let value = parseInt(e.target.value);
                    if (isNaN(value)) value = 0;
                    value = Math.min(100000000, Math.max(0, value));
                    minAmountDisplay.textContent = this.formatDollarAmount(value);
                    const sliderValue = this.convertDollarsToSlider(value);
                    minAmountSlider.value = sliderValue;
                    const filters = this.getFilters();
                    this.onUpdate(filters);
                });
            }
        }

        // Handle numeric inputs with immediate update
        ['maxOrgs', 'depth'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                this.addListener(input, 'input', () => {
                    this.validateInputs();
                    const filters = this.getFilters();
                    this.onUpdate(filters);
                });
            }
        });
    }

    addListener(element, event, handler) {
        if (!element) {
            return;
        }

        element.addEventListener(event, handler);

        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ event, handler });
    }

    setupInputValidation() {
        this.validateInputs();
        const form = document.querySelector('form');
        if (form) {
            this.addListener(form, 'submit', (e) => {
                e.preventDefault();
                this.validateInputs();
                this.triggerUpdate();
            });
        }
    }

    updateOrgSearchResults(matches) {
        const selectEl = document.getElementById('matchingOrgs');
        if (!selectEl) return;

        selectEl.innerHTML = '';

        if (matches.length > 0) {
            matches.forEach(({ ein, name }) => {
                const option = document.createElement('option');
                option.value = ein;
                option.textContent = `${name} (${ein})`;
                selectEl.appendChild(option);
            });
            selectEl.style.display = 'block';
        } else {
            selectEl.style.display = 'none';
        }
    }

    getFilters() {
        const selectedYears = Array.from(
            document.querySelectorAll('input[name="yearFilter"]:checked')
        ).map(el => parseInt(el.value));

        // If no years selected, use available years or defaults
        if (selectedYears.length === 0) {
            const currentOrg = document.getElementById('orgFilter').value.trim();
            selectedYears.push(...this.dataManager.getAvailableYears(currentOrg));
        }

        return {
            orgFilter: document.getElementById('orgFilter').value.trim(),
            minAmount: this.convertSliderToDollars(document.getElementById('minAmount').value),
            maxOrgs: Math.min(100, Math.max(1, parseInt(document.getElementById('maxOrgs').value) || 10)),
            selectedYears: selectedYears,
            depth: Math.min(5, Math.max(1, parseInt(document.getElementById('depth').value) || 2))
        };
    }

    triggerUpdate() {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            const filters = this.getFilters();
            this.onUpdate(filters);
        }, DEBOUNCE_DELAY);
    }

    addExportButton() {
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Visualization';
        exportBtn.id = 'exportBtn';
        exportBtn.className = 'export-button';

        const controlsDiv = document.getElementById('controls');
        if (controlsDiv) {
            controlsDiv.appendChild(exportBtn);
            this.addListener(exportBtn, 'click', () => this.exportVisualization());
        }
    }

    showGrantWarning(maxGrant, orgName) {
        // Remove any existing warning
        const existingWarning = document.getElementById('grantWarning');
        if (existingWarning) {
            existingWarning.remove();
        }

        // Create warning element
        const warning = document.createElement('div');
        warning.id = 'grantWarning';
        warning.style.cssText = `
            position: fixed;
            top: 80px;
            right: 10px;
            background: rgba(146, 64, 14, 0.9);
            color: #fef3c7;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #d97706;
            max-width: 300px;
            z-index: 1000;
            font-size: 0.9em;
        `;

        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(maxGrant);

        warning.innerHTML = `
            <div style="display: flex; align-items: start; gap: 10px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                    Warning: ${orgName} has a maximum grant value of ${formattedAmount}. Filtering above this amount may hide connections.
                </div>
            </div>
        `;

        document.body.appendChild(warning);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            color: #fef3c7;
            font-size: 20px;
            cursor: pointer;
            padding: 0 5px;
        `;
        closeBtn.onclick = () => warning.remove();
        warning.appendChild(closeBtn);
    }

    updateYearFilters(availableYears) {
        const container = document.getElementById('yearCheckboxes');
        if (!container) {
            return;
        }

        container.innerHTML = '';

        availableYears.forEach(year => {
            const label = document.createElement('label');
            label.className = 'year-checkbox-label';
            label.innerHTML = `
                <input type="checkbox" name="yearFilter" value="${year}" checked>
                ${year}
            `;
            container.appendChild(label);
        });

        // Show the container and add change event listeners
        const filterContainer = document.getElementById('yearFilterContainer');
        if (filterContainer) {
            filterContainer.style.display = 'block';

            // Add event listeners to checkboxes
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                this.addListener(checkbox, 'change', () => {
                    const selectedYears = this.getFilters().selectedYears;
                    this.triggerUpdate();
                });
            });
        }
    }

    updateStats(stats) {
        const statsEl = document.getElementById('stats');
        if (!statsEl) return;

        // Store current stats for use in export
        this.currentStats = stats;

        // Show warning if needed
        if (stats.showWarning) {
            const rootOrg = document.getElementById('orgFilter').value;
            const orgName = this.dataManager.charities[rootOrg]?.name || 'Selected organization';
            this.showGrantWarning(stats.maxRootGrant, orgName);
        } else {
            const existingWarning = document.getElementById('grantWarning');
            if (existingWarning) {
                existingWarning.remove();
            }
        }

        // Format numbers with commas
        const formatNumber = num => num.toLocaleString();
        const formatCurrency = num => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);

        statsEl.innerHTML = `
            <strong>Statistics</strong><br>
            Organizations: ${formatNumber(stats.orgCount)}<br>
            Grants Visualized: ${formatNumber(stats.grantCount)}<br>
            Total Dataset Grants: ${formatNumber(stats.totalGrants)}<br>
            Total Grant Amount: ${formatCurrency(stats.totalAmount)}<br>
            Average Grant: ${formatCurrency(stats.averageAmount)}<br>
            Standard Deviation: ${formatCurrency(stats.standardDeviation)}
        `;
    }

    setupYearInputs() {
        const currentYear = new Date().getFullYear();
        const minYearInput = document.getElementById('minYear');
        const maxYearInput = document.getElementById('maxYear');

        if (minYearInput && !minYearInput.value) {
            minYearInput.value = 2000; // Default minimum year
        }
        if (maxYearInput && !maxYearInput.value) {
            maxYearInput.value = currentYear; // Default to current year
        }
    }

    exportVisualization() {
        // Get the SVG element
        const svg = document.getElementById('network');
        if (!svg) {
            console.error('No SVG found');
            return;
        }

        // Create a copy of the SVG
        const svgCopy = svg.cloneNode(true);

        // Set the background color to match the display
        svgCopy.style.backgroundColor = '#0f172a';

        // Format numbers for display
        const formatNumber = (num) => new Intl.NumberFormat('en-US').format(Math.round(num));
        const formatCurrency = (num) => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);

        // Create stats background and container
        const statsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        statsGroup.setAttribute('transform', 'translate(20, 20)');

        const statsBackground = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        statsBackground.setAttribute('x', '-10');
        statsBackground.setAttribute('y', '-10');
        statsBackground.setAttribute('width', '400');
        statsBackground.setAttribute('height', '180');
        statsBackground.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
        statsBackground.setAttribute('rx', '8');
        statsGroup.appendChild(statsBackground);

        // Function to add text line
        const addTextLine = (content, y) => {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.textContent = content;
            text.setAttribute('x', '0');
            text.setAttribute('y', y);
            text.setAttribute('fill', 'white');
            text.setAttribute('font-family', 'sans-serif');
            text.setAttribute('font-size', '14px');
            return text;
        };

        // Get current stats
        const stats = this.currentStats || {};

        // Add title
        const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
        title.textContent = "Statistics";
        title.setAttribute('x', '0');
        title.setAttribute('y', '5');
        title.setAttribute('fill', 'white');
        title.setAttribute('font-family', 'sans-serif');
        title.setAttribute('font-size', '16px');
        title.setAttribute('font-weight', 'bold');
        statsGroup.appendChild(title);

        // Add statistics lines
        const lines = [
            `Organizations: ${formatNumber(stats.orgCount || 0)}`,
            `Grants Visualized: ${formatNumber(stats.grantCount || 0)}`,
            `Total Dataset Grants: ${formatNumber(stats.totalGrants || 0)}`,
            `Total Grant Amount: ${formatCurrency(stats.totalAmount || 0)}`,
            `Average Grant: ${formatCurrency(stats.averageAmount || 0)}`,
            `Standard Deviation: ${formatCurrency(stats.standardDeviation || 0)}`
        ];

        lines.forEach((line, index) => {
            statsGroup.appendChild(addTextLine(line, 30 + (index * 20)));
        });

        svgCopy.appendChild(statsGroup);

        // Add metadata
        const filters = this.getFilters();
        const metadata = document.createElementNS("http://www.w3.org/2000/svg", "metadata");
        metadata.textContent = JSON.stringify({
            ...filters,
            timestamp: new Date().toISOString(),
            stats: this.currentStats
        });
        svgCopy.appendChild(metadata);

        // Convert and download
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgCopy);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });

        const link = document.createElement('a');
        link.download = `grant-visualization-${new Date().toISOString().split('T')[0]}.svg`;
        link.href = URL.createObjectURL(svgBlob);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    validateInputs() {
        const elements = {
            minAmount: { min: 0, max: Infinity, default: 10000 },
            maxOrgs: { min: 1, max: 100, default: 14 },
            depth: { min: 1, max: 5, default: 1 }
        };

        Object.entries(elements).forEach(([id, constraints]) => {
            const el = document.getElementById(id);
            if (!el) return;

            let value = parseFloat(el.value);
            if (isNaN(value)) {
                value = constraints.default;
            }

            value = Math.max(constraints.min, Math.min(constraints.max, value));
            el.value = value;
        });
    }

    destroy() {
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
    }

    convertSliderToDollars(sliderValue) {
        if (sliderValue == 0) return 0;
        return Math.floor(Math.exp(Math.log(100000000) * sliderValue / 100));
    }

    convertDollarsToSlider(dollarValue) {
        if (dollarValue <= 0) return 0;
        return Math.min(100, Math.floor((Math.log(dollarValue) / Math.log(100000000)) * 100));
    }

    formatDollarAmount(amount) {
        return '$' + amount.toLocaleString('en-US', {
            maximumFractionDigits: 0
        });
    }
}