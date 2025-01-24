export class EfficiencyGauge {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            value: options.value || '_',
            label: options.label || '',
            description: options.description || '',
            formula: options.formula || '',
            thresholds: options.thresholds || [
                { value: 85, color: '#34D399' },
                { value: 75, color: '#6EE7B7' },
                { value: 65, color: '#FBBF24' },
                { value: 50, color: '#FB923C' },
                { value: 0, color: '#EF4444' }
            ]
        };
        this.render();
    }

    getColor(value) {
        if (value === '_') return '#666';
        const threshold = this.options.thresholds.find(t => value >= t.value);
        return threshold ? threshold.color : this.options.thresholds[this.options.thresholds.length - 1].color;
    }

    render() {
        const value = this.options.value;
        const displayValue = value === '_' ? 'N/A' : `${value.toFixed(1)}%`;
        const barWidth = value === '_' ? 0 : Math.min(value, 100);
        const color = this.getColor(value);

        this.container.innerHTML = `
            <div class="metric-card">
                <h3>${this.options.label}</h3>
                <div class="metric-value">
                    ${displayValue}
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${barWidth}%; 
                            background-color: ${color}">
                        </div>
                    </div>
                </div>
                <div class="metric-desc">
                    ${this.options.description}
                    ${this.options.formula ? `<div class="formula">${this.options.formula}</div>` : ''}
                </div>
            </div>
        `;
    }
}