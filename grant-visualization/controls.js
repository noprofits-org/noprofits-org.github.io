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
            // Ensure container exists
            let container = document.getElementById('yearCheckboxes');
            const controlsDiv = document.getElementById('controls');

            if (!container) {
                console.warn('Year checkboxes container not found, creating it...');
                const yearFilterContainer = document.createElement('div');
                yearFilterContainer.id = 'yearFilterContainer';
                yearFilterContainer.innerHTML = `
                    <label>Filter by Grant Years:</label>
                    <div id="yearCheckboxes"></div>
                `;
                // Insert after org filter
                const orgFilterGroup = controlsDiv.querySelector('.control-group');
                if (orgFilterGroup) {
                    controlsDiv.insertBefore(yearFilterContainer, orgFilterGroup.nextSibling);
                } else {
                    controlsDiv.insertBefore(yearFilterContainer, controlsDiv.firstChild);
                }
                container = document.getElementById('yearCheckboxes');
            }

            // Get available years from DataManager
            let availableYears = this.dataManager.getAvailableYears(currentOrg);

            // Ensure we have at least the last 3 years if empty
            if (availableYears.length === 0) {
                const currentYear = new Date().getFullYear();
                availableYears = [currentYear, currentYear - 1, currentYear - 2];
            }



            // Clear and rebuild checkboxes
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

            // Add event listeners
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                this.addListener(checkbox, 'change', () => {
                    this.triggerUpdate();
                });
            });

            // Show container
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
                this.setupYearCheckboxes(searchEl.value.trim());
            }, 300);
        };

        const handleOrgSelect = (option) => {
            orgFilter.value = option.value;
            matchingOrgs.style.display = 'none';
            // Update year checkboxes before triggering update
            this.setupYearCheckboxes(option.value);
            this.triggerUpdate();
        };

        if (orgFilter) {
            this.addListener(orgFilter, 'input', handleSearch);
        }

        if (matchingOrgs) {
            this.addListener(matchingOrgs, 'click', (e) => {
                if (e.target.tagName === 'OPTION') {
                    handleOrgSelect(e.target);
                }
            });

            this.addListener(matchingOrgs, 'keydown', (e) => {
                if (e.key === 'Enter') {
                    const selectedOption = matchingOrgs.options[matchingOrgs.selectedIndex];
                    if (selectedOption) {
                        handleOrgSelect(selectedOption);
                    }
                }
            });
        }

        if (updateViewBtn) {
            this.addListener(updateViewBtn, 'click', () => this.triggerUpdate());
        }
        if (generateBtn) {
            this.addListener(generateBtn, 'click', () => this.triggerUpdate());
        }

        // Handle the minimum amount slider
        if (minAmountSlider && minAmountDisplay) {
            const minAmountInput = document.getElementById('minAmountInput');
            this.addListener(minAmountSlider, 'input', (e) => {
                const dollarValue = this.convertSliderToDollars(e.target.value);
                minAmountDisplay.textContent = this.formatDollarAmount(dollarValue);
                if (minAmountInput) {
                    minAmountInput.value = dollarValue;
                }
                this.triggerUpdate();
            });
            
            if (minAmountInput) {
                this.addListener(minAmountInput, 'input', (e) => {
                    let value = parseInt(e.target.value);
                    if (isNaN(value)) value = 0;
                    value = Math.min(100000000, Math.max(0, value));
                    
                    // Update display
                    minAmountDisplay.textContent = this.formatDollarAmount(value);
                    
                    // Update slider position
                    const sliderValue = this.convertDollarsToSlider(value);
                    minAmountSlider.value = sliderValue;
                    
                    this.triggerUpdate();
                });
        
                // Handle when input loses focus - cleanup invalid values
                this.addListener(minAmountInput, 'blur', (e) => {
                    let value = parseInt(e.target.value);
                    if (isNaN(value)) value = 0;
                    value = Math.min(100000000, Math.max(0, value));
                    e.target.value = value;
                    minAmountDisplay.textContent = this.formatDollarAmount(value);
                });
            }
        }

        // Handle other numeric inputs
        ['maxOrgs', 'depth'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                this.addListener(input, 'change', () => this.validateInputs());
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.toString().includes('timeout')) {
                this.enableControls();
                const status = document.getElementById('status');
                if (status) {
                    status.textContent = 'Operation timed out. Please try again.';
                    status.style.color = 'orange';
                }
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.toString().includes('timeout')) {
                this.enableControls();
                const status = document.getElementById('status');
                if (status) {
                    status.textContent = 'Operation timed out. Please try again.';
                    status.style.color = 'orange';
                }
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
        exportBtn.addEventListener('click', () => this.exportVisualization());
        document.getElementById('controls').appendChild(exportBtn);
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

        // Format numbers with commas
        const formatNumber = num => num.toLocaleString();

        statsEl.innerHTML = `
            <strong>Statistics:</strong><br>
            Showing ${formatNumber(stats.orgCount)} organization${stats.orgCount !== 1 ? 's' : ''}<br>
            ${formatNumber(stats.grantCount)} grant${stats.grantCount !== 1 ? 's' : ''} visible<br>
            Total grants in dataset: ${formatNumber(stats.totalGrants)}
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
        // Get current settings
        const settings = {
            orgFilter: document.getElementById('orgFilter').value,
            minAmount: document.getElementById('minAmount').value,
            maxOrgs: document.getElementById('maxOrgs').value,
            depth: document.getElementById('depth').value,
            selectedYears: Array.from(document.querySelectorAll('input[name="yearFilter"]:checked'))
                .map(cb => cb.value)
        };

        // Create a composite canvas with visualization and settings
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Get the SVG data
        const svgData = new XMLSerializer().serializeToString(this.svg.node());
        const img = new Image();

        img.onload = () => {
            // Set canvas size to accommodate both image and settings
            canvas.width = img.width;
            canvas.height = img.height + 100; // Extra space for settings

            // Draw visualization
            ctx.fillStyle = '#0f172a'; // Match background color
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Draw settings
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            let y = img.height + 20;
            ctx.fillText(`Organization: ${settings.orgFilter}`, 10, y);
            ctx.fillText(`Min Amount: $${settings.minAmount}`, 10, y + 20);
            ctx.fillText(`Max Orgs: ${settings.maxOrgs}`, 10, y + 40);
            ctx.fillText(`Depth: ${settings.depth}`, 10, y + 60);
            ctx.fillText(`Years: ${settings.selectedYears.join(', ')}`, 10, y + 80);

            // Create download link
            const link = document.createElement('a');
            link.download = 'grant-visualization.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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