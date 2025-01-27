// network.js
export class NetworkVisualization {
    constructor(svg, width, height) {
        this.svg = svg;
        this.width = width;
        this.height = height;
        this.simulation = null;

        // Initialize arrow markers for different depths
        this.setupMarkers();
    }

    setupMarkers() {
        const defs = this.svg.append("defs");

        // Create arrow markers for each depth level
        const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
        colors.forEach((color, i) => {
            defs.append("marker")
                .attr("id", `arrow-${i}`)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 20)
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("fill", color);
        });

        // Special marker for self-referential links
        defs.append("marker")
            .attr("id", "arrow-self")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#94a3b8");
    }

    // In NetworkVisualization class
    createNodes(data, charities) {
        const nodes = new Map();

        // For depth 0, ONLY create the root node
        if (data.connected.size === 1) {
            const rootEIN = Array.from(data.connected.keys())[0];
            const charity = charities.find(c => c.filer_ein === rootEIN);
            if (charity) {
                const totalValue = data.grants.reduce((sum, grant) =>
                    sum + parseFloat(grant.grant_amt), 0);

                nodes.set(rootEIN, {
                    id: rootEIN,
                    name: charity.filer_name,
                    value: totalValue || 1, // Ensure minimum size even without self-grants
                    depth: 0
                });
                return Array.from(nodes.values());
            }
        }

        // Only reach here for depth > 0
        data.grants.forEach(grant => {
            if (!nodes.has(grant.filer_ein)) {
                const charity = charities.find(c => c.filer_ein === grant.filer_ein);
                if (charity) {
                    nodes.set(grant.filer_ein, {
                        id: grant.filer_ein,
                        name: charity.filer_name,
                        value: 0,
                        depth: data.connected.get(grant.filer_ein) || 0
                    });
                }
            }
            if (!nodes.has(grant.grant_ein)) {
                const charity = charities.find(c => c.filer_ein === grant.grant_ein);
                if (charity) {
                    nodes.set(grant.grant_ein, {
                        id: grant.grant_ein,
                        name: charity.filer_name,
                        value: 0,
                        depth: data.connected.get(grant.grant_ein) || 0
                    });
                }
            }
        });

        // Calculate node values
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

    createLinks(grants) {
        return grants.map(grant => ({
            source: grant.filer_ein,
            target: grant.grant_ein,
            value: parseFloat(grant.grant_amt),
            isSelf: grant.filer_ein === grant.grant_ein
        }));
    }

    update(data, charities) {
        const nodes = this.createNodes(data, charities);
        const links = this.createLinks(data.grants);

        this.svg.selectAll("*").remove();
        this.setupMarkers();

        // Force simulation setup
        this.simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links)
                .id(d => d.id)
                .distance(150))
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collision", d3.forceCollide().radius(d => this.calculateNodeRadius(d) + 20));

        // Draw links with arrows
        this.links = this.svg.append("g")
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("class", "link")
            .attr("stroke", (d) => {
                const sourceDepth = nodes.find(n => n.id === d.source.id).depth;
                return this.getColorForDepth(sourceDepth);
            })
            .attr("stroke-width", d => Math.max(1, Math.sqrt(d.value) / 8000))
            .attr("fill", "none")
            .attr("marker-end", d => `url(#arrow-${d.isSelf ? 'self' : '0'})`);

        // Create node groups
        this.nodes = this.svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .call(this.drag(this.simulation));

        // Add circles to nodes
        this.nodes.append("circle")
            .attr("r", d => this.calculateNodeRadius(d))
            .attr("fill", d => this.getColorForDepth(d.depth))
            .attr("stroke", "#4b5563")
            .attr("stroke-width", 2);

        // Add text group for multiline text
        const textGroups = this.nodes.append("g")
            .attr("class", "text-group");

        // Add organization name
        textGroups.append("text")
            .text(d => d.name)
            .attr("x", d => this.calculateNodeRadius(d) + 5)
            .attr("y", -2)
            .attr("fill", "white")
            .attr("font-size", "8px")
            .style("pointer-events", "none");

        // Add EIN below name
        textGroups.append("text")
            .text(d => `EIN: ${d.id}`)
            .attr("x", d => this.calculateNodeRadius(d) + 5)
            .attr("y", 8)
            .attr("fill", "#94a3b8")  // Lighter color for EIN
            .attr("font-size", "7px")
            .style("pointer-events", "none");

        // Update simulation
        this.simulation.on("tick", () => this.tick());
    }

    tick() {
        // Update node positions
        this.nodes.attr("transform", d => `translate(${d.x},${d.y})`);

        // Update link paths
        this.links.attr("d", d => {
            const sourceNode = d.source;
            const targetNode = d.target;

            if (sourceNode.id === targetNode.id) {
                // Self-referential link
                const r = this.calculateNodeRadius(sourceNode) + 20;
                return `M${sourceNode.x},${sourceNode.y} C${sourceNode.x - r},${sourceNode.y - r} ${sourceNode.x + r},${sourceNode.y - r} ${sourceNode.x},${sourceNode.y}`;
            }

            // Calculate the radius of both nodes
            const sourceRadius = this.calculateNodeRadius(sourceNode);
            const targetRadius = this.calculateNodeRadius(targetNode);

            // Calculate the total distance and angle
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const angle = Math.atan2(dy, dx);

            // Adjust start and end points to be on the node circles
            const startX = sourceNode.x + (sourceRadius * Math.cos(angle));
            const startY = sourceNode.y + (sourceRadius * Math.sin(angle));
            const endX = targetNode.x - (targetRadius * Math.cos(angle));
            const endY = targetNode.y - (targetRadius * Math.sin(angle));

            return `M${startX},${startY}L${endX},${endY}`;
        });
    }

    calculateNodeRadius(d) {
        return Math.max(5, Math.log(d.value) / Math.log(10) * 4);
    }

    getColorForDepth(depth) {
        const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
        return colors[depth] || '#6b7280';
    }

    drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
}