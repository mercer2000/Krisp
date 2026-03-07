"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

// ── Types ───────────────────────────────────────────
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  content: string;
  source: string;
  author: string | null;
  topic: string | null;
  sentiment: string | null;
  tags: string[] | null;
  sourceUrl: string | null;
  sourceDomain: string | null;
  sourceTimestamp: string | null;
  truncated: boolean;
  createdAt: string;
}

interface GraphEdge {
  source: string;
  target: string;
  similarity: number;
}

interface ThoughtGraphProps {
  onNodeClick: (node: GraphNode) => void;
}

// ── Color map by source type ────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  web_clip: "#14b8a6",  // teal
  zapier: "#eab308",    // yellow
  manual: "#6b7280",    // gray
};

const SOURCE_LABELS: Record<string, string> = {
  web_clip: "Web Clips",
  zapier: "Zapier",
  manual: "Manual",
};

export default function ThoughtGraph({ onNodeClick }: ThoughtGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [threshold, setThreshold] = useState(0.3);
  const simulationRef = useRef<d3.Simulation<GraphNode, d3.SimulationLinkDatum<GraphNode>> | null>(null);

  const fetchAndRender = useCallback(async (similarityThreshold: number) => {
    if (!svgRef.current || !containerRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/brain/thoughts/graph?threshold=${similarityThreshold}&limit=150`
      );
      if (!res.ok) throw new Error("Failed to load graph data");
      const data = await res.json();

      const nodes: GraphNode[] = data.nodes;
      const edges: GraphEdge[] = data.edges;

      setNodeCount(nodes.length);
      setEdgeCount(edges.length);

      if (nodes.length === 0) {
        setLoading(false);
        return;
      }

      renderGraph(nodes, edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [onNodeClick]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderGraph = useCallback((nodes: GraphNode[], edges: GraphEdge[]) => {
    const svgEl = svgRef.current!;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const container = containerRef.current!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr("width", width).attr("height", height);

    // Build a node lookup for D3 links
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Filter edges to only those connecting existing nodes
    const links = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        similarity: e.similarity,
      }));

    // Count connections per node for sizing
    const connectionCount = new Map<string, number>();
    for (const link of links) {
      connectionCount.set(link.source, (connectionCount.get(link.source) || 0) + 1);
      connectionCount.set(link.target, (connectionCount.get(link.target) || 0) + 1);
    }

    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom as unknown as (selection: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void);

    // Force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>(links as unknown as d3.SimulationLinkDatum<GraphNode>[])
          .id((d) => d.id)
          .distance((d) => {
            const sim = (d as unknown as { similarity: number }).similarity;
            return 150 * (1 - sim);
          })
          .strength((d) => {
            const sim = (d as unknown as { similarity: number }).similarity;
            return sim * 0.8;
          })
      )
      .force("charge", d3.forceManyBody().strength(-120).distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => {
        const conns = connectionCount.get(d.id) || 0;
        return 8 + Math.min(conns * 2, 12);
      }));

    simulationRef.current = simulation;

    // Draw edges
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "var(--border)")
      .attr("stroke-opacity", (d) => 0.2 + d.similarity * 0.5)
      .attr("stroke-width", (d) => 0.5 + d.similarity * 2);

    // Draw nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        onNodeClick(d);
      });

    // Node circles
    node
      .append("circle")
      .attr("r", (d) => {
        const conns = connectionCount.get(d.id) || 0;
        return 6 + Math.min(conns * 2, 10);
      })
      .attr("fill", (d) => SOURCE_COLORS[d.source] || "#6b7280")
      .attr("fill-opacity", 0.85)
      .attr("stroke", "var(--background)")
      .attr("stroke-width", 2);

    // Node labels (topic or first ~20 chars of content)
    node
      .append("text")
      .text((d) => {
        if (d.topic) return d.topic.slice(0, 25);
        const firstLine = (d.content || "").split("\n")[0];
        return firstLine.slice(0, 25) + (firstLine.length > 25 ? "..." : "");
      })
      .attr("dx", (d) => {
        const conns = connectionCount.get(d.id) || 0;
        return 8 + Math.min(conns * 2, 10) + 4;
      })
      .attr("dy", 4)
      .attr("font-size", "11px")
      .attr("fill", "var(--foreground)")
      .attr("opacity", 0.8)
      .attr("pointer-events", "none");

    // Hover effects
    node
      .on("mouseenter", function (_event, d) {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", () => {
            const conns = connectionCount.get(d.id) || 0;
            return (6 + Math.min(conns * 2, 10)) * 1.3;
          })
          .attr("fill-opacity", 1);

        // Highlight connected edges
        link
          .attr("stroke-opacity", (l) => {
            const lSource = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
            const lTarget = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
            return lSource === d.id || lTarget === d.id
              ? 0.9
              : 0.08;
          })
          .attr("stroke", (l) => {
            const lSource = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
            const lTarget = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
            return lSource === d.id || lTarget === d.id
              ? "var(--primary)"
              : "var(--border)";
          });
      })
      .on("mouseleave", function (_event, d) {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", () => {
            const conns = connectionCount.get(d.id) || 0;
            return 6 + Math.min(conns * 2, 10);
          })
          .attr("fill-opacity", 0.85);

        link
          .attr("stroke-opacity", (l) => 0.2 + l.similarity * 0.5)
          .attr("stroke", "var(--border)");
      });

    // Drag behavior
    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Tick handler
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as unknown as GraphNode).x!)
        .attr("y1", (d) => (d.source as unknown as GraphNode).y!)
        .attr("x2", (d) => (d.target as unknown as GraphNode).x!)
        .attr("y2", (d) => (d.target as unknown as GraphNode).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Initial zoom to fit
    simulation.on("end", () => {
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds) {
        const pad = 40;
        const fullWidth = bounds.width + pad * 2;
        const fullHeight = bounds.height + pad * 2;
        const midX = bounds.x + bounds.width / 2;
        const midY = bounds.y + bounds.height / 2;
        const scale = Math.min(width / fullWidth, height / fullHeight, 1.5);
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(scale)
          .translate(-midX, -midY);
        svg.transition().duration(500).call(zoom.transform as any, transform);
      }
    });
  }, [onNodeClick]);

  // Initial load
  useEffect(() => {
    fetchAndRender(threshold);
    return () => {
      simulationRef.current?.stop();
    };
  }, [threshold]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        d3.select(svgRef.current).attr("width", width).attr("height", height);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Controls bar */}
      <div className="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--background)] px-6 py-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="similarity-threshold"
            className="text-xs font-medium text-[var(--muted-foreground)]"
          >
            Similarity:
          </label>
          <input
            id="similarity-threshold"
            type="range"
            min="0.1"
            max="0.7"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="h-1.5 w-24 cursor-pointer accent-[var(--primary)]"
          />
          <span className="min-w-[2.5rem] text-xs text-[var(--muted-foreground)]">
            {threshold.toFixed(2)}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto">
          {Object.entries(SOURCE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: SOURCE_COLORS[key] }}
              />
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {label}
              </span>
            </div>
          ))}
        </div>

        <span className="text-xs text-[var(--muted-foreground)]">
          {nodeCount} nodes &middot; {edgeCount} edges
        </span>
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-[var(--background)]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/80">
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" />
              </span>
              Loading graph...
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          </div>
        )}

        {!loading && nodeCount === 0 && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
            <div className="mb-4 text-[var(--muted-foreground)] opacity-30">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="5" cy="6" r="2" />
                <circle cx="19" cy="6" r="2" />
                <circle cx="12" cy="18" r="2" />
                <circle cx="5" cy="18" r="2" />
                <circle cx="19" cy="18" r="2" />
                <circle cx="12" cy="6" r="2" />
                <line x1="7" y1="6" x2="10" y2="6" opacity="0.4" />
                <line x1="14" y1="6" x2="17" y2="6" opacity="0.4" />
                <line x1="6" y1="8" x2="11" y2="16" opacity="0.4" />
                <line x1="13" y1="16" x2="18" y2="8" opacity="0.4" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              No thoughts with embeddings
            </h2>
            <p className="mt-2 max-w-md text-center text-sm text-[var(--muted-foreground)]">
              Save some web clips or thoughts to see them visualized as an
              interactive knowledge graph.
            </p>
          </div>
        )}

        <svg ref={svgRef} className="block h-full w-full" />
      </div>
    </div>
  );
}

export type { GraphNode };
