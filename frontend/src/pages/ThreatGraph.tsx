import { useState, useEffect, useRef } from "react";
import {
  Network,
  Search,
  Globe2,
  Server,
  Lock,
  Flame,
  Building2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  Info,
  ArrowRight,
  History,
} from "lucide-react";
import {
  analyzeThreatGraph,
  getScanThreatGraph,
  getRecentGraphTargets,
  type ThreatGraphResponse,
  type GraphNode,
  type RecentGraphTarget,
} from "../services/securityModules";

export default function ThreatGraph() {
  const [targetInput, setTargetInput] = useState("https://secure-sbi-login.fraudulent-portal.xyz/verify-kyc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<ThreatGraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [recentTargets, setRecentTargets] = useState<RecentGraphTarget[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadRecentTargets();
    handleAnalyze();
  }, []);

  async function loadRecentTargets() {
    try {
      const data = await getRecentGraphTargets();
      setRecentTargets(data);
    } catch {
      // Ignore background targets load failure
    }
  }

  async function handleAnalyze(customTarget?: string) {
    const targetToQuery = (customTarget || targetInput).trim();
    if (!targetToQuery) return;

    setLoading(true);
    setError(null);
    setSelectedNode(null);

    try {
      const data = await analyzeThreatGraph(targetToQuery);
      setGraphData(data);
      // Auto-select primary URL or domain node
      if (data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to generate infrastructure graph.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectScan(scanId: number, target: string) {
    setTargetInput(target);
    setLoading(true);
    setError(null);
    setSelectedNode(null);

    try {
      const data = await getScanThreatGraph(scanId);
      setGraphData(data);
      if (data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to load scan graph.");
    } finally {
      setLoading(false);
    }
  }

  function getNodeIcon(type: string) {
    switch (type) {
      case "URL":
        return <Globe2 size={16} />;
      case "DOMAIN":
        return <Network size={16} />;
      case "IP_ADDRESS":
        return <Server size={16} />;
      case "SSL_CERTIFICATE":
        return <Lock size={16} />;
      case "TARGET_BRAND":
        return <Building2 size={16} />;
      case "CAMPAIGN":
        return <Flame size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  }

  function getNodeColorClass(node: GraphNode) {
    if (node.type === "TARGET_BRAND" || node.type === "CAMPAIGN") {
      return "border-red-500/50 bg-red-500/10 text-red-400 ring-1 ring-red-500/20";
    }
    if (node.type === "IP_ADDRESS") {
      return "border-purple-500/50 bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20";
    }
    if (node.type === "SSL_CERTIFICATE") {
      return "border-amber-500/50 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20";
    }
    if (node.type === "DOMAIN") {
      return "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20";
    }
    return "border-blue-500/50 bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20";
  }

  // Position nodes in a radially pleasing topology
  function calculateNodePosition(index: number, total: number) {
    if (total === 1) return { x: 50, y: 50 };
    // Root node at center
    if (index === 0) return { x: 50, y: 50 };

    const angle = ((index - 1) / (total - 1)) * 2 * Math.PI;
    const radius = 35; // % radius from center
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return { x, y };
  }

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
              <Network size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                  // THREATGRAPH™ INFRASTRUCTURE RADAR
                </span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
                  INTERACTIVE MESH
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                Threat Infrastructure &amp; Relationship Graph
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-xs text-slate-400">
              Correlated Assets: <strong className="text-cyan-300">{graphData?.node_count || 0} Nodes</strong>
            </span>
          </div>
        </div>

        {/* Input & Target Bar */}
        <div className="cyber-card cyber-corner-bracket p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500/70" />
              <input
                type="text"
                placeholder="Enter URL, domain, or hostname to map infrastructure..."
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-full rounded-xl border border-cyan-500/20 bg-[#040812] pl-10 pr-4 py-2.5 font-mono text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAnalyze()}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2.5 font-mono text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition hover:from-cyan-300 hover:to-blue-400 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Mapping Graph...
                </>
              ) : (
                "Construct Graph"
              )}
            </button>
          </div>

          {/* Quick Select Recent Targets */}
          {recentTargets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <History size={12} className="text-cyan-400" /> Recent Scans:
              </span>
              {recentTargets.slice(0, 5).map((rt) => (
                <button
                  key={rt.scan_id}
                  type="button"
                  onClick={() => handleSelectScan(rt.scan_id, rt.target)}
                  className="rounded-lg border border-cyan-500/20 bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-white transition truncate max-w-[220px]"
                >
                  {rt.target}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-300">
              <AlertTriangle size={14} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Visual Graph Canvas & Forensic Drawer Container */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Canvas Box */}
          <div
            ref={containerRef}
            className="cyber-card cyber-corner-bracket relative h-[600px] overflow-hidden p-4 flex flex-col justify-between"
          >
            {/* Top Toolbar */}
            <div className="z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur border border-white/10 px-3 py-1.5 text-[11px] text-slate-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Topology: Relational Star Mesh</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 rounded-xl bg-black/60 backdrop-blur border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
                  className="p-1.5 text-slate-400 hover:text-white rounded"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
                  className="p-1.5 text-slate-400 hover:text-white rounded"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 text-slate-400 hover:text-white rounded"
                  title="Reset Zoom"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            {/* Interactive Graph Network */}
            {graphData && (
              <div
                className="absolute inset-0 transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* SVG Connections / Edges */}
                <svg className="w-full h-full pointer-events-none absolute inset-0">
                  <defs>
                    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>
                  {graphData.edges.map((edge) => {
                    const sourceNodeIdx = graphData.nodes.findIndex((n) => n.id === edge.source);
                    const targetNodeIdx = graphData.nodes.findIndex((n) => n.id === edge.target);
                    if (sourceNodeIdx === -1 || targetNodeIdx === -1) return null;

                    const p1 = calculateNodePosition(sourceNodeIdx, graphData.nodes.length);
                    const p2 = calculateNodePosition(targetNodeIdx, graphData.nodes.length);

                    return (
                      <g key={edge.id}>
                        <line
                          x1={`${p1.x}%`}
                          y1={`${p1.y}%`}
                          x2={`${p2.x}%`}
                          y2={`${p2.y}%`}
                          stroke="url(#edgeGrad)"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="animate-pulse"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Nodes Display */}
                {graphData.nodes.map((node, idx) => {
                  const pos = calculateNodePosition(idx, graphData.nodes.length);
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className={`absolute cursor-pointer transition-all duration-200 select-none ${
                        isSelected ? "scale-110 z-20" : "hover:scale-105 z-10"
                      }`}
                    >
                      <div
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur shadow-2xl transition ${getNodeColorClass(
                          node
                        )} ${isSelected ? "ring-2 ring-cyan-400 shadow-cyan-500/20" : ""}`}
                        style={{ minWidth: "120px", maxWidth: "160px" }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {getNodeIcon(node.type)}
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                            {node.type.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white text-center truncate w-full px-1">
                          {node.label}
                        </span>
                        <span
                          className={`mt-1 rounded-full px-1.5 py-0.2 text-[8px] font-bold uppercase ${
                            node.risk_level === "CRITICAL"
                              ? "bg-red-500/20 text-red-300"
                              : node.risk_level === "HIGH"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {node.risk_level}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Legend */}
            <div className="z-10 flex flex-wrap items-center gap-3 rounded-xl bg-black/60 backdrop-blur border border-white/10 px-3 py-2 text-[10px] text-slate-400">
              <span className="font-bold text-slate-300">Legend:</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Network size={12} /> Domain
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <Server size={12} /> IP / Host
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Lock size={12} /> SSL Cert
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <Building2 size={12} /> Target Brand
              </span>
              <span className="flex items-center gap-1 text-pink-400">
                <Flame size={12} /> Campaign
              </span>
            </div>
          </div>

          {/* Forensic Metadata Drawer */}
          <div className="cyber-card cyber-corner-bracket p-6 space-y-5">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">{getNodeIcon(selectedNode.type)}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {selectedNode.type.replace("_", " ")} ENTITY
                    </span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                      selectedNode.risk_level === "CRITICAL"
                        ? "bg-red-500/20 text-red-300"
                        : selectedNode.risk_level === "HIGH"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {selectedNode.risk_level}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white break-all">
                    {selectedNode.full_name}
                  </h4>
                </div>

                {/* Key-Value Metadata Matrix */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Forensic Attributes
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(selectedNode.metadata).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-2 rounded-lg bg-[#060b14] p-2 border border-white/5"
                      >
                        <span className="text-slate-400 capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="font-mono text-slate-200 text-right truncate max-w-[180px]">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Relationships */}
                {graphData && (
                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Connected Relationships
                    </span>
                    <div className="space-y-1.5">
                      {graphData.edges
                        .filter(
                          (e) => e.source === selectedNode.id || e.target === selectedNode.id
                        )
                        .map((edge) => (
                          <div
                            key={edge.id}
                            className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-2 text-[11px] text-slate-300"
                          >
                            <ArrowRight size={12} className="text-cyan-400 shrink-0" />
                            <span className="font-semibold text-cyan-300">{edge.label}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-500">
                <Info size={32} className="mb-2 text-slate-600" />
                <p className="text-xs">Select any node in the graph to inspect forensic attributes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
