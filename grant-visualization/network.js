// network.js
export class NetworkVisualization {
    constructor(svg, width, height) {
        this.svg = svg;
        this.width = width;
        this.height = height;
        this.simulation = null;
        this.depthColors = d3.scaleOrdinal()
            .domain([0, 1, 2, 3, 4, 5])
            .range(['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899']);
        
        this.setupMarkers();
    }

    setupMarkers() {
        this.svg.append("defs").append("marker")
            .attr("id", "arrow")
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

    update(data, charities) {
        const nodes = this.createNodes(data, charities);
        const links = this.createLinks(data.grants);
        this.initialize(nodes, links, data.connected);
    }

    createNodes(data, charities) {
        const uniqueEINs = new Set([
            ...data.grants.map(d => d.filer_ein),
            ...data.grants.map(d => d.grant_ein)
        ]);

        const charityNames = new Map(
            charities.map(d => [d.filer_ein, d.filer_name])
        );

        return Array.from(uniqueEINs).map(ein => ({
            id: ein,
            name: charityNames.get(ein) || 'Unknown Organization',
            ein: ein,
            value: this.calculateNodeValue(ein, data.grants)
        }));
    }

    createLinks(grants) {
        return grants.map(d => ({
            source: d.filer_ein,
            target: d.grant_ein,
            value: +d.grant_amt
        }));
    }

    calculateNodeValue(ein, grants) {
        const totalValue = grants.reduce((sum, grant) => {
            if (grant.filer_ein === ein || grant.grant_ein === ein) {
                return sum + parseFloat(grant.grant_amt);
            }
            return sum;
        }, 0);
        return Math.log(totalValue) / Math.log(10000); // Normalize the value
    }

    initialize(nodes, links, connected) {
        this.svg.selectAll("*").remove();
        this.setupMarkers();

        this.simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collision", d3.forceCollide().radius(d => 
                Math.max(30, this.calculateNodeRadius(d))));

        this.drawNetwork(nodes, links, connected);
        this.simulation.on("tick", () => this.tick());
    }

    drawNetwork(nodes, links, connected) {
        // Create links
        this.links = this.svg.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("class", "link")
            .style("stroke", "#94a3b8")
            .style("stroke-opacity", 0.6)
            .style("stroke-width", d => Math.max(1, Math.sqrt(d.value) / 8000))
            .attr("marker-end", "url(#arrow)");

        // Create nodes
        this.nodes = this.svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .call(this.drag(this.simulation));

        // Add circles to nodes
        this.nodes.append("circle")
            .attr("r", d => this.calculateNodeRadius(d))
            .style("fill", d => {
                const nodeDepth = connected.get(d.ein);
                return nodeDepth !== undefined ? 
                    this.depthColors(nodeDepth) : "#6b7280";
            })
            .style("stroke", "#4b5563")
            .style("stroke-width", 2);

        // Add labels
        this.nodes.append("text")
            .text(d => d.name)
            .attr("x", d => this.calculateNodeRadius(d) + 5)
            .attr("y", 3)
            .style("fill", "white")
            .style("font-size", "8px")
            .style("pointer-events", "none");
    }

    calculateNodeRadius(d) {
        return Math.max(5, d.value * 10);
    }

    tick() {
        this.links
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        this.nodes
            .attr("transform", d => `translate(${d.x},${d.y})`);
    }

    drag(simulation) {
        const dragstarted = (event) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        };

        const dragged = (event) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        };

        const dragended = (event) => {
            if (!event.active) simulation.alphaTarget(0);
            // event.subject.fx = null;
            // event.subject.fy = null;
        };

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
            
    }
    
    addDoubleClickHandler() {
        this.nodes.on('dblclick', (event, d) => {
            d.fx = null;
            d.fy = null;
            this.simulation.alpha(0.3).restart();
        });
    }
}