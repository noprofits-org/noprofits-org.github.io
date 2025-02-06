export class NetworkVisualization {
    constructor(svg, width, height) {
        this.svg = svg;
        this.width = width;
        this.height = height;
        this.simulation = null;
        this.container = svg.append("g");
        this.maxValue = 1;
        this.sliderContainer = null;
        this.sliderHandle = null;

        // Enhanced zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => this.handleZoom(event));

        // Setup container and initial zoom
        this.svg.call(this.zoom);
        this.setupMarkers();

        // Add zoom controls
        this.addZoomControls();

        // Keep track of data for zoom-to-fit
        this.currentNodes = [];
        this.currentLinks = [];

        // Bind methods that need 'this' context
        this.calculateNodeRadius = this.calculateNodeRadius.bind(this);
        this.calculateLinkWidth = this.calculateLinkWidth.bind(this);
        this.tick = this.tick.bind(this);
        this.handleZoom = this.handleZoom.bind(this);
    }

    addZoomControls() {
        // Container for all zoom controls
        const controls = this.svg.append("g")
            .attr("class", "zoom-controls")
            .attr("transform", "translate(20, 20)");

        // Add slider container with a stored reference
        this.sliderContainer = controls.append("g")
            .attr("class", "zoom-slider")
            .attr("transform", "translate(0, 120)");

        // Add slider background
        this.sliderContainer.append("rect")
            .attr("class", "slider-background")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 30)
            .attr("height", 150)
            .attr("fill", "#1e293b")
            .attr("rx", 5);

        // Add slider track
        this.sliderContainer.append("line")
            .attr("class", "slider-track")
            .attr("x1", 15)
            .attr("y1", 10)
            .attr("x2", 15)
            .attr("y2", 140)
            .attr("stroke", "#4b5563")
            .attr("stroke-width", 4)
            .attr("rx", 2);

        // Add slider handle
        this.sliderHandle = this.sliderContainer.append("circle")
            .attr("class", "slider-handle")
            .attr("cx", 15)
            .attr("cy", 75)
            .attr("r", 8)
            .attr("fill", "#60a5fa")
            .style("cursor", "pointer");

        // Add drag behavior to handle
        const drag = d3.drag()
            .on("drag", (event) => {
                const y = Math.max(10, Math.min(140, event.y));
                this.sliderHandle.attr("cy", y);

                // Convert position to scale (inverse relationship)
                const scale = 2.1 - (y / 140) * 1.9;

                // Apply zoom transform
                this.svg.transition()
                    .duration(0)
                    .call(this.zoom.transform,
                        d3.zoomIdentity
                            .translate(this.width / 2, this.height / 2)
                            .scale(scale)
                            .translate(-this.width / 2, -this.height / 2));
            });

        this.sliderHandle.call(drag);

        // Add labels
        this.sliderContainer.append("text")
            .attr("x", 35)
            .attr("y", 15)
            .attr("fill", "white")
            .attr("font-size", "10px")
            .text("+");

        this.sliderContainer.append("text")
            .attr("x", 35)
            .attr("y", 140)
            .attr("fill", "white")
            .attr("font-size", "10px")
            .text("−");
    }

    handleZoomButton(factor) {
        const transform = d3.zoomTransform(this.svg.node());
        this.svg.transition()
            .duration(300)
            .call(this.zoom.transform,
                d3.zoomIdentity
                    .translate(transform.x, transform.y)
                    .scale(transform.k * factor));
    }

    zoomToFit(paddingPercent = 0.95) {
        const bounds = this.container.node().getBBox();
        const fullWidth = this.width;
        const fullHeight = this.height;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;
        const scale = paddingPercent / Math.max(width / fullWidth, height / fullHeight);
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        this.svg.transition()
            .duration(500)
            .call(this.zoom.transform,
                d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale));
    }

    handleZoom(event) {
        this.container.attr("transform", event.transform);
    }

    setupMarkers() {
        const defs = this.svg.append("defs");
        const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];

        colors.forEach((color, i) => {
            defs.append("marker")
                .attr("id", `arrow-${i}`)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 25)
                .attr("refY", 0)
                .attr("markerWidth", 8)
                .attr("markerHeight", 8)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("fill", color);
        });

        defs.append("marker")
            .attr("id", "arrow-self")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#94a3b8");
    }

    calculateNodeRadius(d) {
        // Logarithmic scaling for better representation of varying grant amounts
        const minRadius = 8;
        const maxRadius = 50;
        const scale = d3.scaleLog()
            .domain([1, this.maxValue])
            .range([minRadius, maxRadius])
            .clamp(true);

        return scale(Math.max(1, d.value));
    }

    calculateLinkWidth(value) {
        // Logarithmic scaling for link widths
        const minWidth = 1;
        const maxWidth = 10;
        const scale = d3.scaleLog()
            .domain([1, this.maxValue])
            .range([minWidth, maxWidth])
            .clamp(true);

        return scale(Math.max(1, value));
    }
    createNodes(data, charities) {
        const nodes = new Map();

        // Create value scale first - ensure we have valid numbers
        const validAmounts = data.grants.map(grant => parseFloat(grant.grant_amt)).filter(amt => !isNaN(amt));
        const maxGrant = Math.max(1, ...validAmounts); // Ensure minimum of 1
        this.maxValue = maxGrant;

        data.grants.forEach(grant => {
            [grant.filer_ein, grant.grant_ein].forEach(ein => {
                if (!nodes.has(ein)) {
                    const charity = charities.find(c => c.filer_ein === ein);
                    if (charity) {
                        nodes.set(ein, {
                            id: ein,
                            name: charity.filer_name || 'Unknown',
                            value: maxGrant / 10, // Set initial value
                            depth: data.connected.get(ein) || 0
                        });
                    }
                }
            });
        });

        // Update values after nodes are created
        data.grants.forEach(grant => {
            const amount = parseFloat(grant.grant_amt);
            if (!isNaN(amount)) {
                if (nodes.has(grant.filer_ein)) {
                    nodes.get(grant.filer_ein).value += amount;
                }
                if (nodes.has(grant.grant_ein)) {
                    nodes.get(grant.grant_ein).value += amount;
                }
            }
        });

        return Array.from(nodes.values());
    }

    createLinks(grants) {
        return grants.map(grant => {
            const amount = parseFloat(grant.grant_amt);
            return {
                source: grant.filer_ein,
                target: grant.grant_ein,
                value: isNaN(amount) ? 1 : amount,
                isSelf: grant.filer_ein === grant.grant_ein
            };
        }).filter(link => link.source && link.target); // Ensure both ends exist
    }

    update(data, charities) {
        // Clear existing content
        this.svg.selectAll("*").remove();
        this.setupMarkers();  // Re-add markers after clear

        if (!data || !data.grants || data.grants.length === 0) return;

        const nodes = this.createNodes(data, charities);
        const links = this.createLinks(data.grants);

        // Initialize positions in a circle
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) / 12;

        nodes.forEach((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        });

        // Create forces simulation
    this.simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(d => {
                // Base distance on node sizes
                const sourceR = this.calculateNodeRadius(d.source);
                const targetR = this.calculateNodeRadius(d.target);
                return sourceR + targetR + 100; // Additional padding
            }))
        .force("charge", d3.forceManyBody()
            .strength(d => -5000)) // Stronger repulsion
        .force("collision", d3.forceCollide()
            .radius(d => this.calculateNodeRadius(d) + 30)
            .strength(1)) // Maximum collision strength
        .force("radial", d3.forceRadial(
            d => d.depth === 0 ? 0 : 300, // Root at center, others in orbit
            this.width / 2,
            this.height / 2
        ).strength(0.8))
        .velocityDecay(0.4) // More damping
        .alphaDecay(0.01) // Slower cooling
        .on("tick", this.tick);

        // Container for zoom
        const container = this.svg.append("g");

        // Draw links
        this.links = container.append("g")
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("class", "link")
            .attr("stroke", d => this.getColorForDepth(nodes.find(n => n.id === d.source.id).depth))
            .attr("stroke-width", d => Math.max(1, Math.sqrt(d.value) / 8000))
            .attr("fill", "none")
            .attr("marker-end", d => `url(#arrow-${d.isSelf ? 'self' : nodes.find(n => n.id === d.source.id).depth})`);

        // Draw nodes
        this.nodes = container.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .call(this.createDragBehavior());

        // Add circles to nodes
        this.nodes.append("circle")
            .attr("r", d => this.calculateNodeRadius(d))
            .attr("fill", d => this.getColorForDepth(d.depth))
            .attr("stroke", "#4b5563")
            .attr("stroke-width", 2);

        // Add labels
        const textGroups = this.nodes.append("g")
            .attr("class", "text-group");

        textGroups.append("text")
            .text(d => d.name)
            .attr("x", d => this.calculateNodeRadius(d) + 5)
            .attr("y", -4)
            .attr("fill", "white")
            .attr("font-size", "12px")
            .style("pointer-events", "none");

        textGroups.append("text")
            .text(d => `EIN: ${d.id}`)
            .attr("x", d => this.calculateNodeRadius(d) + 5)
            .attr("y", 12)
            .attr("fill", "#94a3b8")
            .attr("font-size", "10px")
            .style("pointer-events", "none");

        // Set up zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        this.svg.call(zoom);

        // Save references
        this.container = container;
        this.zoom = zoom;

        // Set up tick
        this.simulation.on("tick", () => {
            this.nodes.attr("transform", d => `translate(${d.x},${d.y})`);

            this.links.attr("d", d => {
                if (!d.source || !d.target) return "";

                if (d.source.id === d.target.id) {
                    const r = this.calculateNodeRadius(d.source) + 20;
                    return `M${d.source.x},${d.source.y} C${d.source.x - r},${d.source.y - r} ${d.source.x + r},${d.source.y - r} ${d.source.x},${d.source.y}`;
                }

                const sourceRadius = this.calculateNodeRadius(d.source);
                const targetRadius = this.calculateNodeRadius(d.target);

                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const angle = Math.atan2(dy, dx);

                const startX = d.source.x + (sourceRadius * Math.cos(angle));
                const startY = d.source.y + (sourceRadius * Math.sin(angle));
                const endX = d.target.x - (targetRadius * Math.cos(angle));
                const endY = d.target.y - (targetRadius * Math.sin(angle));

                return `M${startX},${startY}L${endX},${endY}`;
            });
        });

        // Initial zoom to fit
        setTimeout(() => {
            this.svg.transition()
                .duration(500)
                .call(this.zoom.transform,
                    d3.zoomIdentity
                        .translate(this.width / 2, this.height / 2)
                        .scale(1)  // Start more zoomed out
                        .translate(-this.width / 2, -this.height / 2));

            // Update slider handle position to match
            this.svg.select(".zoom-controls circle")
                .attr("cy", 105); // Position for 0.5 scale
        }, 100);
    }

    tick() {
        if (!this.nodes || !this.links) return;

        // Ensure valid coordinates for nodes
        this.currentNodes.forEach(node => {
            if (typeof node.x === 'undefined' || isNaN(node.x)) {
                node.x = this.width / 2;
            }
            if (typeof node.y === 'undefined' || isNaN(node.y)) {
                node.y = this.height / 2;
            }
        });

        // Update node positions with boundary constraints
        this.nodes.attr("transform", d => {
            const radius = this.calculateNodeRadius(d);
            const x = Math.max(radius + 10, Math.min(this.width - radius - 10, d.x));
            const y = Math.max(radius + 10, Math.min(this.height - radius - 10, d.y));
            return `translate(${x},${y})`;
        });

        // Update link positions with safer access to coordinates
        this.links.attr("d", d => {
            const source = typeof d.source === 'object' ? d.source : this.currentNodes.find(n => n.id === d.source);
            const target = typeof d.target === 'object' ? d.target : this.currentNodes.find(n => n.id === d.target);

            if (!source || !target) return "";

            const sourceX = source.x || this.width / 2;
            const sourceY = source.y || this.height / 2;
            const targetX = target.x || this.width / 2;
            const targetY = target.y || this.height / 2;

            if (source.id === target.id) {
                const r = this.calculateNodeRadius(source) + 20;
                return `M${sourceX},${sourceY} C${sourceX - r},${sourceY - r} ${sourceX + r},${sourceY - r} ${sourceX},${sourceY}`;
            }

            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const angle = Math.atan2(dy, dx);

            const sourceR = this.calculateNodeRadius(source);
            const targetR = this.calculateNodeRadius(target);

            const startX = sourceX + (sourceR * Math.cos(angle));
            const startY = sourceY + (sourceR * Math.sin(angle));
            const endX = targetX - (targetR * Math.cos(angle));
            const endY = targetY - (targetR * Math.sin(angle));

            return `M${startX},${startY}L${endX},${endY}`;
        });
    }

    createDragBehavior() {
        return d3.drag()
            .on("start", (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                // d.fx = null;
                // d.fy = null;
            });
    }

    resetPositions() {
        if (this.currentNodes) {
            this.currentNodes.forEach(node => {
                node.fx = null;
                node.fy = null;
            });
            this.simulation.alpha(1).restart();
        }
    }

    getColorForDepth(depth) {
        const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
        return colors[depth] || '#6b7280';
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.svg
            .attr("width", width)
            .attr("height", height);

        if (this.simulation) {
            this.simulation
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("x", d3.forceX(width / 2).strength(0.1))
                .force("y", d3.forceY(height / 2).strength(0.1))
                .alpha(1)
                .restart();
        }
    }

    createNodes(data, charities) {
        const nodes = new Map();

        // Create value scale first
        const maxGrant = Math.max(...data.grants.map(grant => parseFloat(grant.grant_amt)));
        this.maxValue = maxGrant;

        data.grants.forEach(grant => {
            [grant.filer_ein, grant.grant_ein].forEach(ein => {
                if (!nodes.has(ein)) {
                    const charity = charities.find(c => c.filer_ein === ein);
                    if (charity) {
                        nodes.set(ein, {
                            id: ein,
                            name: charity.filer_name,
                            value: maxGrant / 10, // Set initial value
                            depth: data.connected.get(ein) || 0,
                            x: this.width / 2 + (Math.random() - 0.5) * 100,
                            y: this.height / 2 + (Math.random() - 0.5) * 100
                        });
                    }
                }
            });
        });

        // Update values after nodes are created
        data.grants.forEach(grant => {
            const amount = parseFloat(grant.grant_amt);
            if (nodes.has(grant.filer_ein)) {
                nodes.get(grant.filer_ein).value += amount;
            }
            if (nodes.has(grant.grant_ein)) {
                nodes.get(grant.grant_ein).value += amount;
            }
        });

        return Array.from(nodes.values());
    }

    createForceSimulation(nodes, links) {
        return d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links)
                .id(d => d.id)
                .distance(150)
                .strength(0.3))
            .force("charge", d3.forceManyBody()
                .strength(-500))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collision", d3.forceCollide()
                .radius(d => this.calculateNodeRadius(d) + 20)
                .strength(0.8))
            .force("x", d3.forceX(this.width / 2).strength(0.1))
            .force("y", d3.forceY(this.height / 2).strength(0.1))
            .alphaDecay(0.02) // Slower cooling
            .velocityDecay(0.3); // More damping
    }

    createLinks(grants) {
        return grants.map(grant => ({
            source: grant.filer_ein,
            target: grant.grant_ein,
            value: parseFloat(grant.grant_amt),
            isSelf: grant.filer_ein === grant.grant_ein
        }));
    }

    destroy() {
        if (this.simulation) {
            this.simulation.stop();
        }
        this.container.selectAll("*").remove();
        this.svg.selectAll(".zoom-controls").remove();
    }
}