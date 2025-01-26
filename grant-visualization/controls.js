// controls.js
export class Controls {
    constructor(dataManager, onUpdate) {
        this.dataManager = dataManager;
        this.onUpdate = onUpdate;
        this.eventListeners = new Map(); // Store for cleanup
        this.setupEventListeners();
        this.setupInputValidation();
    }

    setupEventListeners() {
        // Organization search
        const orgFilter = document.getElementById('orgFilter');
        const matchingOrgs = document.getElementById('matchingOrgs');

        // Debounced search handler
        let searchTimeout;
        const handleSearch = (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const matches = this.dataManager.searchOrganizations(e.target.value);
                this.updateOrgSearchResults(matches);
            }, 300);
        };

        // Organization selection handlers
        const handleOrgSelect = (option) => {
            orgFilter.value = option.value;
            matchingOrgs.style.display = 'none';
            this.triggerUpdate();
        };

        // Add event listeners
        this.addListener(orgFilter, 'input', handleSearch);
        this.addListener(matchingOrgs, 'click', (e) => {
            if (e.target.tagName === 'OPTION') {
                handleOrgSelect(e.target);
            }
        });

        // Keyboard navigation
        this.addListener(matchingOrgs, 'keydown', (e) => {
            if (e.key === 'Enter') {
                const selectedOption = matchingOrgs.options[matchingOrgs.selectedIndex];
                if (selectedOption) {
                    handleOrgSelect(selectedOption);
                }
            }
        });

        // Update button
        this.addListener(
            document.querySelector('button'), 
            'click', 
            () => this.triggerUpdate()
        );

        // Add input validation listeners
        ['minAmount', 'maxOrgs', 'depth'].forEach(id => {
            const input = document.getElementById(id);
            this.addListener(input, 'change', () => this.validateInputs());
        });
    }

    addListener(element, event, handler) {
        if (!element) {
            console.warn(`Element not found for event: ${event}`);
            return;
        }
        
        element.addEventListener(event, handler);
        
        // Store for cleanup
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ event, handler });
    }

    setupInputValidation() {
        // Set initial valid values
        this.validateInputs();
        
        // Add validation on form submission
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
            matches.forEach(({ein, name}) => {
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
        return {
            minAmount: Math.max(0, parseFloat(document.getElementById('minAmount').value) || 0),
            maxOrgs: Math.min(100, Math.max(1, parseInt(document.getElementById('maxOrgs').value) || 10)),
            orgFilter: document.getElementById('orgFilter').value.trim(),
            depth: Math.min(5, Math.max(1, parseInt(document.getElementById('depth').value) || 2))
        };
    }

    updateStats(stats) {
        const statsEl = document.getElementById('stats');
        if (!statsEl) return;

        statsEl.innerHTML = `
            <strong>Statistics:</strong><br>
            Showing ${stats.orgCount.toLocaleString()} organizations<br>
            ${stats.grantCount.toLocaleString()} grants visible<br>
            Total grants in dataset: ${stats.totalGrants.toLocaleString()}
        `;
    }

    validateInputs() {
        const elements = {
            minAmount: { min: 0, max: Infinity, default: 10000 },
            maxOrgs: { min: 1, max: 100, default: 14 },
            depth: { min: 1, max: 5, default: 2 }
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

    triggerUpdate() {
        const filters = this.getFilters();
        this.onUpdate(filters);
    }

    // Cleanup method
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
    }
}