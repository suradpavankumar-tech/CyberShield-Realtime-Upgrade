import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldAlert,
  PhoneCall,
  Search,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  getThreatPulseTrends,
  type ThreatPulseResponse,
} from "../services/securityModules";

export default function ThreatPulse() {
  const [pulseData, setPulseData] = useState<ThreatPulseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>("CAMP_DIGITAL_ARREST");

  useEffect(() => {
    fetchPulse();
  }, []);

  async function fetchPulse() {
    setLoading(true);
    setError(null);
    try {
      const data = await getThreatPulseTrends();
      setPulseData(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to load live threat pulse data.");
    } finally {
      setLoading(false);
    }
  }

  const campaigns = pulseData?.campaigns || [];

  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      camp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.threat_vector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "ALL" || camp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "ALL", label: "All Campaigns" },
    { id: "COERCION", label: "Digital Arrest & Coercion" },
    { id: "BANKING_UPI", label: "UPI & Payment Traps" },
    { id: "UTILITIES", label: "Utility Smishing" },
    { id: "MOBILE_MALWARE", label: "Loan APK Blackmail" },
    { id: "JOB_INVESTMENT", label: "Task & Crypto Fraud" },
  ];

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Top Radar Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
              <Activity size={26} className="animate-pulse" />
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                  ThreatPulse™ Radar
                </span>
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-300">
                  LIVE TELEMETRY
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Emerging Scam Trends & Live Cyber Threat Radar
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/emergency"
              className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600"
            >
              <PhoneCall size={14} />
              Victim Emergency (Dial 1930)
            </Link>

            <button
              type="button"
              onClick={fetchPulse}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white transition"
              title="Refresh Radar Feeds"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Telemetry Headline Metrics */}
        {pulseData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                National Threat Posture
              </span>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <p className="text-lg font-black text-red-400">
                  {pulseData.national_threat_level}
                </p>
              </div>
              <p className="text-[10px] text-slate-400">High volume of video coercion attacks</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Active Major Campaigns
              </span>
              <p className="text-xl font-black text-white">
                {pulseData.telemetry.active_campaign_count} Tracked
              </p>
              <p className="text-[10px] text-emerald-400">Verified by CERT-In & MHA I4C</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Critical Threat Ratio
              </span>
              <p className="text-xl font-black text-amber-400">
                {pulseData.telemetry.critical_threat_ratio_pct}%
              </p>
              <p className="text-[10px] text-slate-400">Across {pulseData.telemetry.total_threats_analyzed}+ scans</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Helpline Status
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-lg font-black text-cyan-400">1930</span>
                <span className="text-[10px] rounded bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5">
                  24x7 ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Citizen Financial Cyber Fraud</p>
            </div>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search scams by name, vector, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0a1220] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                  selectedCategory === cat.id
                    ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                    : "bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && !pulseData && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0a1220]">
            <Loader2 size={24} className="animate-spin text-red-400" />
            <p className="text-xs text-slate-400">Gathering threat radar feeds...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Emerging Campaigns Radar List */}
        <div className="space-y-4">
          {filteredCampaigns.map((camp) => {
            const isExpanded = expandedCampaignId === camp.id;

            return (
              <div
                key={camp.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220] transition-all hover:border-white/20"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedCampaignId(isExpanded ? null : camp.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-white/[0.02]"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        camp.severity === "CRITICAL"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {camp.status === "SPIKING" ? (
                        <Flame size={20} className="text-red-400 animate-pulse" />
                      ) : (
                        <ShieldAlert size={20} />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            camp.status === "SPIKING"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {camp.status} ({camp.weekly_change_pct > 0 ? `+${camp.weekly_change_pct}%` : `${camp.weekly_change_pct}%`})
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {camp.category}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-white">
                        {camp.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Primary Vector
                      </span>
                      <p className="text-xs font-semibold text-cyan-300">
                        {camp.threat_vector}
                      </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Forensic Dossier */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-[#060b14] p-5 space-y-5">
                    {/* Summary & Target */}
                    <div className="grid gap-4 md:grid-cols-[1fr_260px]">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Threat Overview
                        </h4>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {camp.summary}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Target Demographic
                        </span>
                        <p className="font-semibold text-white">{camp.target_audience}</p>
                        <span className="text-[10px] uppercase font-bold text-slate-500 pt-1 block">
                          Official Source
                        </span>
                        <p className="text-[11px] text-cyan-300">{camp.source}</p>
                      </div>
                    </div>

                    {/* Modus Operandi & Red Flags */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-white/5 bg-[#0a1220] p-4 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                          <TrendingUp size={14} /> Modus Operandi (Attack Flow)
                        </h4>
                        <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed space-y-1">
                          {camp.modus_operandi}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-[#0a1220] p-4 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle size={14} /> Immediate Red Flags
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {camp.red_flags.map((flag, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-400 font-bold">•</span>
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Containment Protocol Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            Immediate Containment Action
                          </span>
                          <p className="text-xs text-slate-200 mt-0.5">
                            {camp.containment_action}
                          </p>
                        </div>
                      </div>

                      <Link
                        to="/emergency"
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition"
                      >
                        Contain Incident <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Official Advisory Authorities Banner */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Authoritative Threat Feeds & Intelligence Partners
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pulseData?.advisory_sources.map((source, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs"
              >
                <ShieldCheck size={16} className="text-cyan-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">{source.name}</p>
                  <p className="text-[10px] text-slate-500">{source.agency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
