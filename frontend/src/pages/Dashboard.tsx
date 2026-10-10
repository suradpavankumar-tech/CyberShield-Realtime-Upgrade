import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileWarning,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  TriangleAlert,
  XCircle,
  Globe2,
  UserCheck,
  Smartphone,
  Network,
  QrCode,
  AlertOctagon,
  Zap,
  Sparkles,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardStatCard from "../components/ui/DashboardStatCard";
import RiskDistributionChart from "../components/ui/RiskDistributionChart";
import ThreatTrendChart from "../components/ui/ThreatTrendChart";

import {
  getDashboard,
  getDashboardTrends,
} from "../services/dashboardService";
import {
  getThreatPulseTrends,
  type ThreatPulseResponse,
} from "../services/securityModules";
import { analyze } from "../services/analysisService";

import type {
  DashboardResponse,
  DashboardTrendsResponse,
  DashboardScan,
} from "../types/dashboard";
import type { AnalysisResponse, InputType } from "../types/analysis";

function formatCategory(category: string | null) {
  if (!category) return "Unclassified";
  return category
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatTrendDateRange(trends: DashboardTrendsResponse | null) {
  if (!trends || trends.trends.length === 0) return "Last 7 days";
  const first = trends.trends[0]?.date;
  const last = trends.trends[trends.trends.length - 1]?.date;
  if (!first || !last) return `Last ${trends.period_days} days`;

  const firstDate = new Date(first);
  const lastDate = new Date(last);
  if (Number.isNaN(firstDate.getTime()) || Number.isNaN(lastDate.getTime())) {
    return `Last ${trends.period_days} days`;
  }

  const formatter = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(firstDate)} - ${formatter.format(lastDate)}`;
}

function getRiskClasses(riskLevel: string | null) {
  switch (riskLevel) {
    case "HIGH":
      return {
        badge: "border-red-400/20 bg-red-400/10 text-red-300",
        dot: "bg-red-400",
      };
    case "MEDIUM":
      return {
        badge: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        dot: "bg-amber-400",
      };
    case "LOW":
      return {
        badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        dot: "bg-emerald-400",
      };
    default:
      return {
        badge: "border-slate-400/20 bg-slate-400/10 text-slate-400",
        dot: "bg-slate-400",
      };
  }
}

function getInputIcon(inputType: DashboardScan["input_type"]) {
  if (inputType === "URL") return <Search size={15} />;
  if (inputType === "MESSAGE") return <FileWarning size={15} />;
  return <Mail size={15} />;
}

function getStatusClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return {
        badge: "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300",
        icon: <CheckCircle2 size={14} className="text-emerald-400" />,
      };
    case "FAILED":
      return {
        badge: "border-red-400/15 bg-red-400/[0.05] text-red-300",
        icon: <XCircle size={14} className="text-red-400" />,
      };
    case "PENDING":
      return {
        badge: "border-amber-400/15 bg-amber-400/[0.05] text-amber-300",
        icon: <Clock3 size={14} className="text-amber-400" />,
      };
    default:
      return {
        badge: "border-white/10 bg-white/[0.03] text-slate-400",
        icon: <Clock3 size={14} className="text-slate-500" />,
      };
  }
}

function getErrorMessage(error: any) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg || "The backend rejected the dashboard request.";
  }
  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }
  if (typeof error?.message === "string") return error.message;
  return "Unable to load security intelligence.";
}

export default function Dashboard() {
  const [trendDays, setTrendDays] = useState(7);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [trends, setTrends] = useState<DashboardTrendsResponse | null>(null);
  const [threatPulse, setThreatPulse] = useState<ThreatPulseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Instant Triage State
  const [triageType, setTriageType] = useState<InputType>("URL");
  const [triageContent, setTriageContent] = useState("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<AnalysisResponse | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);

  // Recent Scans Filter State
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadDashboard(refresh = false) {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [dashboardData, trendsData, pulseData] = await Promise.all([
        getDashboard(),
        getDashboardTrends(trendDays),
        getThreatPulseTrends().catch(() => null),
      ]);

      setDashboard(dashboardData);
      setTrends(trendsData);
      setThreatPulse(pulseData);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [trendDays]);

  // Derived Analytics Data
  const derivedData = useMemo(() => {
    if (!dashboard) return null;

    const total = dashboard.total_scans;
    const completed = dashboard.status_distribution.completed;
    const failed = dashboard.status_distribution.failed;
    const pending = dashboard.status_distribution.pending;
    const highRisk = dashboard.risk_distribution.high;
    const mediumRisk = dashboard.risk_distribution.medium;
    const lowRisk = dashboard.risk_distribution.low;
    const classified = highRisk + mediumRisk + lowRisk;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const highRiskRate = total > 0 ? Math.round((highRisk / total) * 100) : 0;

    // Posture score: percentage of safe/low-risk interactions weighted against high risk
    const postureScore =
      classified > 0
        ? Math.max(10, Math.min(99, Math.round(((lowRisk * 1.0 + mediumRisk * 0.4) / classified) * 100)))
        : 95;

    const categories = Object.entries(dashboard.threat_categories)
      .sort(([, first], [, second]) => second - first)
      .slice(0, 5);

    return {
      total,
      completed,
      failed,
      pending,
      highRisk,
      mediumRisk,
      lowRisk,
      classified,
      completionRate,
      highRiskRate,
      postureScore,
      categories,
    };
  }, [dashboard]);

  // Filtered recent scans
  const filteredScans = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.recent_scans.filter((scan) => {
      // Risk filter
      if (riskFilter !== "ALL" && (scan.risk_level || "UNASSESSED") !== riskFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== "ALL" && scan.input_type !== typeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = scan.scan_id.toString().includes(query);
        const matchesCat = (scan.threat_category || "").toLowerCase().includes(query);
        const matchesType = scan.input_type.toLowerCase().includes(query);
        if (!matchesId && !matchesCat && !matchesType) return false;
      }
      return true;
    });
  }, [dashboard, riskFilter, typeFilter, searchQuery]);

  // Handle Instant Triage submission
  async function handleInstantTriage(e: React.FormEvent) {
    e.preventDefault();
    if (!triageContent.trim()) return;

    setTriageLoading(true);
    setTriageError(null);
    setTriageResult(null);

    try {
      const res = await analyze(triageType, triageContent.trim());
      setTriageResult(res);
      // Refresh dashboard background stats
      void loadDashboard(true);
    } catch (err: any) {
      setTriageError(err?.response?.data?.detail || err.message || "Triage inspection failed.");
    } finally {
      setTriageLoading(false);
    }
  }

  /* ==================================================
      LOADING STATE
  ================================================== */
  if (loading) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-lg shadow-cyan-500/10">
                <RefreshCw size={24} className="animate-spin text-cyan-400" />
              </div>
              <p className="mt-4 text-base font-bold text-white">Initializing CyberShield Command Center</p>
              <p className="mt-1 text-xs text-slate-400">Aggregating telemetry, live radar, and threat models…</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ==================================================
      ERROR STATE
  ================================================== */
  if (error || !dashboard || !trends || !derivedData) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-7 text-center shadow-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300 ring-1 ring-red-400/20">
                <TriangleAlert size={24} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-white">Dashboard Telemetry Offline</h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {error || "Security analytics could not be retrieved from the intelligence gateway."}
              </p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                <RefreshCw size={14} />
                Reconnect Gateway
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const highestRisk = dashboard.highest_risk_scan;

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1500px] space-y-7">
        {/* ==================================================
            COMMAND CENTER EXECUTIVE HEADER
        ================================================== */}
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="cyber-beacon-emerald inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">
                // SOC COMMAND COORD: IND-80 // SECTOR 04
              </span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-300">
                CYBERSHIELD 2.0 // ZERO-DAY ARMED
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.2)] sm:text-4xl">
              Threat Intelligence Command
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-sm">
              Continuous multi-vector threat detection, live infrastructure telemetry, and multi-signal triage across URLs,
              messages, Android APKs, and compromised identity registers.
            </p>
          </div>

          {/* Controls: Date range & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                className="min-w-[210px] appearance-none rounded-xl border border-cyan-500/20 bg-[rgba(8,16,30,0.85)] py-2.5 pl-10 pr-9 font-mono text-xs font-semibold text-slate-200 outline-none backdrop-blur-md transition hover:border-cyan-400/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
                aria-label="Dashboard date range"
              >
                <option value={7}>{formatTrendDateRange(trends)}</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400"
              />
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-[rgba(8,16,30,0.85)] px-4 py-2.5 font-mono text-xs font-semibold text-slate-300 backdrop-blur-md transition hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-cyan-400" : "text-cyan-400"} />
              {refreshing ? "Syncing…" : "Refresh"}
            </button>

            <Link
              to="/emergency"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 font-mono text-xs font-bold text-rose-300 shadow-lg shadow-rose-950/40 transition hover:bg-rose-500/20 hover:border-rose-400"
            >
              <AlertOctagon size={14} className="text-rose-400" />
              <span>SOS 1930</span>
            </Link>
          </div>
        </div>

        {/* ==================================================
            LIVE THREAT PULSE ADVISORY & MARQUEE BANNER
        ================================================== */}
        <div className="cyber-card cyber-corner-bracket relative overflow-hidden p-4 shadow-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70 cyber-radar-beam" />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/30">
                <Sparkles size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-cyan-400">
                    NATIONAL CYBER RADAR
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-black uppercase tracking-widest ${
                      threatPulse?.national_threat_level === "CRITICAL"
                        ? "bg-rose-500 text-black shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                        : "bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    }`}
                  >
                    {threatPulse?.national_threat_level || "ELEVATED"} ADVISORY
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-slate-200">
                  Active Threat Waves: Coercive Digital Arrest Extortion &amp; Trojanized Banking APK Smishing
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono">
              <span className="text-[11px] text-slate-400">
                Active Campaigns: <strong className="text-white">{threatPulse?.campaigns.length || 3}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-400">
                Helpline: <strong className="text-rose-400">1930</strong>
              </span>
              <Link
                to="/threat-pulse"
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 hover:border-cyan-400"
              >
                <span>Live Radar</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* ==================================================
            FAST TRIAGE & INSTANT ON-DASHBOARD SCANNER
        ================================================== */}
        <div className="cyber-card cyber-corner-bracket relative overflow-hidden p-5 shadow-2xl">
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent ${
              triageLoading ? "cyber-radar-beam opacity-100" : "opacity-40"
            }`}
          />

          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
                <Zap size={17} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 cyber-beacon-cyan" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    // INSTANT TELEMETRY SCAN
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Instant Threat Triage</h3>
                <p className="text-[11px] text-slate-400">
                  Inspect suspicious URLs, SMS texts, or emails directly without navigating away
                </p>
              </div>
            </div>

            {/* Input Type Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-cyan-500/20 bg-black/60 p-1">
              {(["URL", "MESSAGE", "EMAIL"] as InputType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTriageType(type)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                    triageType === type
                      ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleInstantTriage} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                value={triageContent}
                onChange={(e) => setTriageContent(e.target.value)}
                placeholder={
                  triageType === "URL"
                    ? "Paste URL (e.g., https://secure-bank-login.fraud-site.cc/verify)..."
                    : triageType === "MESSAGE"
                    ? "Paste SMS or WhatsApp message text (e.g., Electricity bill overdue, call 9876543210)..."
                    : "Paste suspicious email body or header text..."
                }
                className="w-full rounded-xl border border-cyan-500/20 bg-[#040812] px-4 py-2.5 font-mono text-xs text-white placeholder-slate-600 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              />
            </div>
            <button
              type="submit"
              disabled={triageLoading || !triageContent.trim()}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 font-mono text-xs font-bold text-white shadow-lg shadow-cyan-500/30 transition hover:from-cyan-400 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50"
            >
              {triageLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Evaluating…</span>
                </>
              ) : (
                <>
                  <Search size={14} />
                  <span>Triage Now</span>
                </>
              )}
            </button>
          </form>

          {/* Triage Inline Feedback */}
          {triageError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertTriangle size={15} className="shrink-0 text-rose-400" />
              <span>{triageError}</span>
            </div>
          )}

          {triageResult && (
            <div className="mt-4 rounded-xl border border-white/10 bg-[#080f1c] p-4 transition-all">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
                      triageResult.risk_level === "HIGH" || triageResult.risk_level === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40"
                        : triageResult.risk_level === "MEDIUM"
                        ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                    }`}
                  >
                    {triageResult.risk_score ?? "0"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Scan #{triageResult.scan_id}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                          getRiskClasses(triageResult.risk_level).badge
                        }`}
                      >
                        {triageResult.risk_level || "LOW"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Category: <strong className="text-slate-200">{triageResult.threat_category || "General"}</strong>
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-300">
                      {triageResult.analysis_details?.recommendation ||
                        triageResult.analysis_details?.recommendations?.[0] ||
                        triageResult.verdict ||
                        "Analysis complete. Review indicators below."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTriageResult(null);
                      setTriageContent("");
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                  <Link
                    to={`/scan/${triageResult.scan_id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <span>Full Forensic Report</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            MAIN STATS & CYBER POSTURE COMMAND GRID
        ================================================== */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardStatCard
            label="Total investigations"
            value={dashboard.total_scans}
            description={`${derivedData.completed} completed • ${derivedData.failed} failed • ${derivedData.pending} pending`}
            icon={Activity}
          />

          <DashboardStatCard
            label="Average risk score"
            value={dashboard.average_risk_score !== null ? dashboard.average_risk_score.toFixed(2) : "—"}
            description="Across risk-classified investigations"
            icon={TrendingUp}
            iconClassName="bg-amber-400/10 text-amber-300"
          />

          <DashboardStatCard
            label="High-risk detections"
            value={derivedData.highRisk}
            description={`${derivedData.highRiskRate}% of overall workspace scans`}
            icon={AlertTriangle}
            iconClassName="bg-red-400/10 text-red-300"
          />

          <DashboardStatCard
            label="Defense Posture"
            value={`${derivedData.postureScore}%`}
            description="Workspace safety & hygiene index"
            icon={Shield}
            iconClassName="bg-emerald-400/10 text-emerald-300"
          />

          <DashboardStatCard
            label="Top threat vector"
            value={dashboard.threat_intelligence.top_category_count}
            description={
              dashboard.threat_intelligence.top_category
                ? formatCategory(dashboard.threat_intelligence.top_category)
                : "No classified category"
            }
            icon={Target}
            iconClassName="bg-violet-400/10 text-violet-300"
          />
        </div>

        {/* ==================================================
            CYBERSHIELD 2.0 SECURITY OPERATIONS LAUNCHPAD
        ================================================== */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 cyber-beacon-cyan" />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  // ACTIVE DEFENSE ECOSYSTEM
                </p>
              </div>
              <h2 className="mt-1 text-lg font-bold text-white tracking-tight">Security Operations Launchpad</h2>
            </div>
            <span className="font-mono text-xs text-slate-400">8 ARMED DEFENSIVE MODULES</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* BrowserShield */}
            <Link
              to="/browser-shield"
              className="cyber-card cyber-corner-bracket group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 transition-transform duration-300 group-hover:scale-110">
                  <Globe2 size={18} />
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-cyan-300">BrowserShield</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Manifest V3 live extension &amp; pre-flight link interception simulator.
              </p>
            </Link>

            {/* IdentityShield */}
            <Link
              to="/identity-shield"
              className="cyber-card cyber-corner-bracket group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30 transition-transform duration-300 group-hover:scale-110">
                  <UserCheck size={18} />
                </div>
                <span className="rounded bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-300 ring-1 ring-violet-500/20">
                  k-ANONYMITY
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-violet-300">IdentityShield</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Breach registry &amp; client-side SHA-1 credential exposure audit.
              </p>
            </Link>

            {/* AppShield */}
            <Link
              to="/app-shield"
              className="cyber-card cyber-corner-bracket group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30 transition-transform duration-300 group-hover:scale-110">
                  <Smartphone size={18} />
                </div>
                <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300 ring-1 ring-blue-500/20">
                  STATIC APK
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-blue-300">AppShield</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Android APK decompilation, permissions risk &amp; trojanized payload triage.
              </p>
            </Link>

            {/* ThreatGraph */}
            <Link
              to="/threat-graph"
              className="cyber-card cyber-corner-bracket group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 transition-transform duration-300 group-hover:scale-110">
                  <Network size={18} />
                </div>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/20">
                  TOPOLOGY
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-amber-300">ThreatGraph</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Connected threat infrastructure linking IPs, SSL certs, and campaigns.
              </p>
            </Link>

            {/* QRShield */}
            <Link
              to="/qr-shield"
              className="cyber-card cyber-corner-bracket group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 transition-transform duration-300 group-hover:scale-110">
                  <QrCode size={18} />
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                  QUISHING
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-emerald-300">QRShield</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Decode QR screenshot payloads &amp; intercept fraudulent UPI payment URLs.
              </p>
            </Link>

            {/* ThreatPulse */}
            <Link
              to="/threat-pulse"
              className="cyber-card cyber-corner-bracket group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30 transition-transform duration-300 group-hover:scale-110">
                  <Activity size={18} />
                </div>
                <span className="rounded bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300 ring-1 ring-rose-500/20">
                  LIVE RADAR
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-rose-300">ThreatPulse</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Live scam radar tracking emerging national vectors and advisories.
              </p>
            </Link>

            {/* Email Header Analyzer */}
            <Link
              to="/email-headers"
              className="cyber-card cyber-corner-bracket group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 transition-transform duration-300 group-hover:scale-110">
                  <Mail size={18} />
                </div>
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 ring-1 ring-cyan-500/20">
                  SPF/DKIM
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-cyan-300">Email Headers</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Inspect raw headers for spoofed senders, DKIM alignment, and DMARC rules.
              </p>
            </Link>

            {/* Fraud Emergency Assistant */}
            <Link
              to="/emergency"
              className="cyber-card cyber-corner-bracket group relative overflow-hidden border-rose-500/30 bg-rose-500/[0.05] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-rose-400 hover:shadow-[0_0_25px_rgba(244,63,94,0.25)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30 transition-transform duration-300 group-hover:scale-110">
                  <AlertOctagon size={18} />
                </div>
                <span className="rounded bg-rose-500 px-2 py-0.5 font-mono text-[10px] font-black text-black shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  HOTLINE 1930
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-rose-200 transition-colors group-hover:text-rose-100">Fraud Emergency</h3>
              <p className="mt-1 text-[11px] text-rose-300/80">
                Urgent victim recovery workflow, bank account freezes, and formal FIR filing.
              </p>
            </Link>
          </div>
        </div>

        {/* ==================================================
            CLASSIFICATION SUMMARY PROGRESS BARS
        ================================================== */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="cyber-card p-4 transition-all duration-300 hover:border-emerald-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="font-mono text-xs font-semibold text-slate-300">Completed Scans</span>
              </div>
              <span className="font-mono text-lg font-black text-white drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{derivedData.completed}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                style={{ width: `${derivedData.completionRate}%` }}
              />
            </div>
            <p className="mt-2 font-mono text-[10px] text-slate-500">{derivedData.completionRate}% completion rate</p>
          </div>

          <div className="cyber-card p-4 transition-all duration-300 hover:border-amber-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 size={16} className="text-amber-400" />
                <span className="font-mono text-xs font-semibold text-slate-300">Pending Scans</span>
              </div>
              <span className="font-mono text-lg font-black text-white drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{derivedData.pending}</span>
            </div>
            <p className="mt-3 text-[10px] text-slate-500">Investigations awaiting final asynchronous analysis</p>
          </div>

          <div className="cyber-card p-4 transition-all duration-300 hover:border-red-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-400" />
                <span className="font-mono text-xs font-semibold text-slate-300">Failed Interceptions</span>
              </div>
              <span className="font-mono text-lg font-black text-white drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]">{derivedData.failed}</span>
            </div>
            <p className="mt-3 text-[10px] text-slate-500">Unresolvable hosts or network timeouts</p>
          </div>
        </div>

        {/* ==================================================
            ANALYTICS: CHARTS & RADAR TRENDS
        ================================================== */}
        <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
          <RiskDistributionChart distribution={dashboard.risk_distribution} />
          <ThreatTrendChart trends={trends.trends} />
        </div>

        {/* ==================================================
            INTELLIGENCE PANELS: SOURCE MIX, CATEGORIES, PRIORITY
        ================================================== */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Investigation Mix */}
          <div className="cyber-card cyber-corner-bracket p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 cyber-beacon-cyan" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    // 01 INGESTION MIX
                  </p>
                </div>
                <h2 className="mt-1 text-lg font-bold text-white tracking-tight">Investigation Sources</h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
                <BarChart3 size={18} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                {
                  label: "URLs",
                  value: dashboard.input_distribution.url,
                  icon: <Search size={15} />,
                },
                {
                  label: "Messages",
                  value: dashboard.input_distribution.message,
                  icon: <FileWarning size={15} />,
                },
                {
                  label: "Emails",
                  value: dashboard.input_distribution.email,
                  icon: <Mail size={15} />,
                },
              ].map((item) => {
                const percentage =
                  dashboard.total_scans > 0
                    ? Math.round((item.value / dashboard.total_scans) * 100)
                    : 0;

                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                        {item.icon}
                        {item.label}
                      </div>
                      <span className="font-mono text-xs font-bold text-white">{item.value}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.6)]" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="mt-1 text-right font-mono text-[9px] text-slate-500">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threat Categories */}
          <div className="cyber-card cyber-corner-bracket p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 cyber-beacon-cyan" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    // 02 THREAT TAXONOMY
                  </p>
                </div>
                <h2 className="mt-1 text-lg font-bold text-white tracking-tight">Category Breakdown</h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/20">
                <Target size={18} />
              </div>
            </div>

            {derivedData.categories.length === 0 ? (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
                <Target size={20} className="mx-auto text-slate-700" />
                <p className="mt-3 text-xs text-slate-500">No threat categories classified yet.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-2.5">
                {derivedData.categories.map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 transition hover:border-violet-500/30 hover:bg-violet-500/[0.04]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                        <Target size={12} />
                      </span>
                      <span className="truncate text-xs font-medium text-slate-300">
                        {formatCategory(category)}
                      </span>
                    </div>
                    <span className="ml-3 font-mono text-xs font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Signal / Highest Risk */}
          <div className="cyber-card cyber-corner-bracket p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 cyber-beacon-red" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    // 03 CRITICAL SIGNAL
                  </p>
                </div>
                <h2 className="mt-1 text-lg font-bold text-white tracking-tight">Highest-Risk Detection</h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/10 text-red-400 ring-1 ring-red-400/20">
                <TriangleAlert size={18} />
              </div>
            </div>

            {highestRisk ? (
              <Link
                to={`/scan/${highestRisk.scan_id}`}
                className="mt-5 block rounded-xl border border-red-500/25 bg-red-500/[0.04] p-4 transition duration-300 hover:border-red-500/50 hover:bg-red-500/[0.08] hover:shadow-[0_0_20px_rgba(244,63,94,0.18)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">
                      // SCAN #{highestRisk.scan_id}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {formatCategory(highestRisk.threat_category)}
                    </p>
                  </div>
                  <span
                    className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold ${
                      getRiskClasses(highestRisk.risk_level).badge
                    }`}
                  >
                    {highestRisk.risk_level || "UNASSESSED"}
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p
                      className={`font-mono text-3xl font-black ${
                        highestRisk.risk_level === "HIGH"
                          ? "text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.4)]"
                          : highestRisk.risk_level === "MEDIUM"
                          ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                          : "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                      }`}
                    >
                      {highestRisk.risk_score ?? "—"}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">Risk score</p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xs font-semibold text-slate-300">
                      {highestRisk.confidence !== null ? `${highestRisk.confidence}%` : "—"}
                    </p>
                    <p className="font-mono text-[10px] text-slate-500">Confidence</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-[10px] text-slate-400">
                  <span>{highestRisk.input_type} analysis</span>
                  <span>{formatDate(highestRisk.created_at)}</span>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1 font-mono text-[10px] font-bold text-red-300">
                  <span>Investigate signal</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            ) : (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center text-xs text-slate-500">
                No risk-classified investigation recorded.
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            RECENT INVESTIGATIONS ACTIVITY TABLE & FILTERS
        ================================================== */}
        <div className="cyber-card cyber-corner-bracket overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] p-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 cyber-beacon-cyan" />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  // 04 INCIDENT FEED: RECENT TELEMETRY
                </p>
              </div>
              <h2 className="mt-1 text-lg font-bold text-white tracking-tight">Real-Time Security Investigations</h2>
            </div>

            {/* Table Filters & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ID, category…"
                  className="rounded-xl border border-cyan-500/20 bg-[#040812] py-1.5 pl-8 pr-3 font-mono text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                />
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-500/70" />
              </div>

              {/* Risk Level Filter */}
              <div className="flex items-center gap-1 rounded-xl border border-cyan-500/20 bg-black/60 p-1">
                {["ALL", "HIGH", "MEDIUM", "LOW"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRiskFilter(level)}
                    className={`rounded-lg px-2 py-1 font-mono text-[10px] font-bold transition ${
                      riskFilter === level
                        ? "bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Source Type Filter */}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
                {["ALL", "URL", "MESSAGE", "EMAIL"].map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setTypeFilter(source)}
                    className={`rounded-lg px-2 py-1 font-mono text-[10px] font-bold transition ${
                      typeFilter === source
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>

              <Link
                to="/history"
                className="inline-flex items-center gap-1 font-mono text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {filteredScans.length === 0 ? (
            <div className="p-10 text-center">
              <ShieldCheck size={28} className="mx-auto text-slate-600" />
              <p className="mt-3 text-sm text-slate-400">
                {searchQuery || riskFilter !== "ALL" || typeFilter !== "ALL"
                  ? "No investigations match your active filter."
                  : "No investigations recorded yet."}
              </p>
              <Link
                to="/scanner"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-mono text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition hover:bg-cyan-300"
              >
                <span>Launch New Scan</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-5 py-3 font-semibold">// INVESTIGATION</th>
                    <th className="px-5 py-3 font-semibold">// VECTOR</th>
                    <th className="px-5 py-3 font-semibold">// RISK SCORE</th>
                    <th className="px-5 py-3 font-semibold">// THREAT CATEGORY</th>
                    <th className="px-5 py-3 font-semibold">// STATUS</th>
                    <th className="px-5 py-3 font-semibold">// CONFIDENCE</th>
                    <th className="px-5 py-3 text-right font-semibold">// TIMESTAMP</th>
                    <th className="px-5 py-3 text-right font-semibold">// ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredScans.map((scan) => {
                    const risk = getRiskClasses(scan.risk_level);
                    const status = getStatusClasses(scan.status);

                    return (
                      <tr
                        key={scan.scan_id}
                        className="border-b border-white/[0.04] transition hover:bg-cyan-500/[0.03]"
                      >
                        <td className="px-5 py-3.5">
                          <Link to={`/scan/${scan.scan_id}`} className="group flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 group-hover:border-cyan-500/40 group-hover:text-cyan-300">
                              {getInputIcon(scan.input_type)}
                            </div>
                            <div>
                              <p className="font-mono text-xs font-bold text-white transition group-hover:text-cyan-300">
                                #SCN-{scan.scan_id.toString().padStart(4, "0")}
                              </p>
                              <p className="text-[10px] text-slate-500">Security Audit</p>
                            </div>
                          </Link>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-slate-300">{scan.input_type}</span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                            <span className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold ${risk.badge}`}>
                              {scan.risk_level || "UNASSESSED"}
                            </span>
                            {scan.risk_score !== null && (
                              <span className="font-mono text-xs font-bold text-white">{scan.risk_score}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs font-medium text-slate-200">
                            {formatCategory(scan.threat_category)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[9px] font-semibold ${status.badge}`}
                          >
                            {status.icon}
                            {scan.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          {scan.confidence !== null ? (
                            <span className="font-mono text-xs font-semibold text-slate-200">{scan.confidence}%</span>
                          ) : (
                            <span className="font-mono text-xs text-slate-500">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right font-mono">
                          <span className="text-[10px] text-slate-400">{formatDate(scan.created_at)}</span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/scan/${scan.scan_id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                          >
                            <span>Inspect</span>
                            <ArrowRight size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==================================================
            FOOTER: SYSTEM HEARTBEAT
        ================================================== */}
        <div className="flex flex-col gap-2 border-t border-white/[0.05] pt-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span>CyberShield 2.0 Unified Threat Engine</span>
            <span>•</span>
            <span>Zero-Knowledge Telemetry</span>
            <span>•</span>
            <span>National Cybercrime Helpline: 1930</span>
          </div>

          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-emerald-400">All Defensive Gateways Synchronized</span>
          </span>
        </div>
      </div>
    </section>
  );
}