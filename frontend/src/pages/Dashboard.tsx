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
} from "lucide-react";

import { Link } from "react-router-dom";

import DashboardStatCard from "../components/ui/DashboardStatCard";
import RiskDistributionChart from "../components/ui/RiskDistributionChart";
import ThreatTrendChart from "../components/ui/ThreatTrendChart";

import {
  getDashboard,
  getDashboardTrends,
} from "../services/dashboardService";

import type {
  DashboardResponse,
  DashboardTrendsResponse,
  DashboardScan,
} from "../types/dashboard";

function formatCategory(
  category: string | null,
) {
  if (!category) {
    return "Unclassified";
  }

  return category
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(
  date: string | null,
) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(parsed);
}

function formatTrendDateRange(
  trends: DashboardTrendsResponse | null,
) {
  if (
    !trends ||
    trends.trends.length === 0
  ) {
    return "Last 7 days";
  }

  const first =
    trends.trends[0]?.date;

  const last =
    trends.trends[
      trends.trends.length - 1
    ]?.date;

  if (!first || !last) {
    return `Last ${trends.period_days} days`;
  }

  const firstDate = new Date(first);
  const lastDate = new Date(last);

  if (
    Number.isNaN(firstDate.getTime()) ||
    Number.isNaN(lastDate.getTime())
  ) {
    return `Last ${trends.period_days} days`;
  }

  const formatter =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );

  return `${formatter.format(
    firstDate,
  )} - ${formatter.format(lastDate)}`;
}

function getRiskClasses(
  riskLevel: string | null,
) {
  switch (riskLevel) {
    case "HIGH":
      return {
        badge:
          "border-red-400/20 bg-red-400/10 text-red-300",
        dot: "bg-red-400",
      };

    case "MEDIUM":
      return {
        badge:
          "border-amber-400/20 bg-amber-400/10 text-amber-300",
        dot: "bg-amber-400",
      };

    case "LOW":
      return {
        badge:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        dot: "bg-emerald-400",
      };

    default:
      return {
        badge:
          "border-slate-400/20 bg-slate-400/10 text-slate-400",
        dot: "bg-slate-400",
      };
  }
}

function getInputIcon(
  inputType: DashboardScan["input_type"],
) {
  if (inputType === "URL") {
    return <Search size={15} />;
  }

  if (inputType === "MESSAGE") {
    return <FileWarning size={15} />;
  }

  return <Mail size={15} />;
}

function getStatusClasses(
  status: string,
) {
  switch (status) {
    case "COMPLETED":
      return {
        badge:
          "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300",
        icon: (
          <CheckCircle2
            size={14}
            className="text-emerald-400"
          />
        ),
      };

    case "FAILED":
      return {
        badge:
          "border-red-400/15 bg-red-400/[0.05] text-red-300",
        icon: (
          <XCircle
            size={14}
            className="text-red-400"
          />
        ),
      };

    case "PENDING":
      return {
        badge:
          "border-amber-400/15 bg-amber-400/[0.05] text-amber-300",
        icon: (
          <Clock3
            size={14}
            className="text-amber-400"
          />
        ),
      };

    default:
      return {
        badge:
          "border-white/10 bg-white/[0.03] text-slate-400",
        icon: (
          <Clock3
            size={14}
            className="text-slate-500"
          />
        ),
      };
  }
}

function getErrorMessage(error: any) {
  const detail =
    error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (
    Array.isArray(detail) &&
    detail.length > 0
  ) {
    return (
      detail[0]?.msg ||
      "The backend rejected the dashboard request."
    );
  }

  if (
    typeof error?.response?.data
      ?.message === "string"
  ) {
    return error.response.data.message;
  }

  if (
    typeof error?.message === "string"
  ) {
    return error.message;
  }

  return "Unable to load security intelligence.";
}

function Dashboard() {
  const [trendDays, setTrendDays] =
    useState(7);

  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(
      null,
    );

  const [trends, setTrends] =
    useState<DashboardTrendsResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadDashboard(
    refresh = false,
  ) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        dashboardData,
        trendsData,
      ] = await Promise.all([
        getDashboard(),
        getDashboardTrends(trendDays),
      ]);

      setDashboard(dashboardData);
      setTrends(trendsData);
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

  const derivedData = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    const total =
      dashboard.total_scans;

    const completed =
      dashboard.status_distribution
        .completed;

    const failed =
      dashboard.status_distribution
        .failed;

    const pending =
      dashboard.status_distribution
        .pending;

    const highRisk =
      dashboard.risk_distribution.high;

    const mediumRisk =
      dashboard.risk_distribution.medium;

    const lowRisk =
      dashboard.risk_distribution.low;

    const classified =
      highRisk +
      mediumRisk +
      lowRisk;

    const completionRate =
      total > 0
        ? Math.round(
            (completed / total) * 100,
          )
        : 0;

    const highRiskRate =
      total > 0
        ? Math.round(
            (highRisk / total) * 100,
          )
        : 0;

    const categories = Object.entries(
      dashboard.threat_categories,
    )
      .sort(
        ([, first], [, second]) =>
          second - first,
      )
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
      categories,
    };
  }, [dashboard]);

  /* ==================================================
      LOADING
  ================================================== */

  if (loading) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto max-w-[1500px]">

          <div className="flex min-h-[70vh] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">

                <RefreshCw
                  size={21}
                  className="animate-spin text-cyan-400"
                />

              </div>

              <p className="mt-4 text-sm font-medium text-white">
                Loading security intelligence
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Retrieving your latest scan
                analytics...
              </p>

            </div>

          </div>

        </div>
      </section>
    );
  }

  /* ==================================================
      ERROR
  ================================================== */

  if (
    error ||
    !dashboard ||
    !trends ||
    !derivedData
  ) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto max-w-[1500px]">

          <div className="flex min-h-[70vh] items-center justify-center">

            <div className="w-full max-w-md rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-7 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
                <TriangleAlert size={22} />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-white">
                Dashboard unavailable
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {error ||
                  "Security analytics could not be retrieved."}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadDashboard()
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                <RefreshCw size={15} />

                Try again
              </button>

            </div>

          </div>

        </div>
      </section>
    );
  }

  const highestRisk =
    dashboard.highest_risk_scan;

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1500px]">

        {/* ==================================================
            DASHBOARD HEADER
        ================================================== */}
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">

          {/* Heading */}
          <div>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              <ShieldCheck size={15} />

              Security overview
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Threat intelligence dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor investigation activity,
              risk classifications, and
              emerging threat patterns across
              your CyberShield workspace.
            </p>

          </div>

          {/* ==================================================
              DATE RANGE + REFRESH
          ================================================== */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Date range */}
            <div className="relative">

              <select
                value={trendDays}
                onChange={(event) =>
                  setTrendDays(
                    Number(event.target.value),
                  )
                }
                className="min-w-[220px] appearance-none rounded-xl border border-white/10 bg-[#0a1220] py-3 pl-11 pr-10 text-xs font-semibold text-slate-200 outline-none transition hover:border-cyan-400/20 focus:border-cyan-400/30 focus:ring-2 focus:ring-cyan-400/10"
                aria-label="Dashboard date range"
              >

                <option value={7}>
                  {formatTrendDateRange(
                    trends,
                  )}
                </option>

                <option value={14}>
                  Last 14 days
                </option>

                <option value={30}>
                  Last 30 days
                </option>

              </select>

              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
              />

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >

              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh intelligence"}

            </button>

          </div>

        </div>

        {/* ==================================================
            MAIN STATS
        ================================================== */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <DashboardStatCard
            label="Total investigations"
            value={dashboard.total_scans}
            description={`${derivedData.completed} completed • ${derivedData.failed} failed • ${derivedData.pending} pending`}
            icon={Activity}
          />

          <DashboardStatCard
            label="Average risk score"
            value={
              dashboard.average_risk_score !==
              null
                ? dashboard.average_risk_score.toFixed(
                    2,
                  )
                : "—"
            }
            description="Across risk-classified investigations"
            icon={TrendingUp}
            iconClassName="bg-amber-400/10 text-amber-300"
          />

          <DashboardStatCard
            label="High-risk investigations"
            value={derivedData.highRisk}
            description={`${derivedData.highRiskRate}% of all investigations`}
            icon={AlertTriangle}
            iconClassName="bg-red-400/10 text-red-300"
          />

          <DashboardStatCard
            label="Top threat category"
            value={
              dashboard.threat_intelligence
                .top_category_count
            }
            description={
              dashboard.threat_intelligence
                .top_category
                ? formatCategory(
                    dashboard
                      .threat_intelligence
                      .top_category,
                  )
                : "No classified category"
            }
            icon={Target}
            iconClassName="bg-violet-400/10 text-violet-300"
          />

        </div>

        {/* ==================================================
            CLASSIFICATION SUMMARY
        ================================================== */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">

          {/* Completed */}
          <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <CheckCircle2
                  size={16}
                  className="text-emerald-400"
                />

                <span className="text-xs font-semibold text-slate-300">
                  Completed
                </span>

              </div>

              <span className="text-lg font-bold text-white">
                {derivedData.completed}
              </span>

            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">

              <div
                className="h-full rounded-full bg-emerald-400"
                style={{
                  width: `${derivedData.completionRate}%`,
                }}
              />

            </div>

            <p className="mt-2 text-[10px] text-slate-600">
              {derivedData.completionRate}%
              completion rate
            </p>

          </div>

          {/* Pending */}
          <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.025] p-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Clock3
                  size={16}
                  className="text-amber-400"
                />

                <span className="text-xs font-semibold text-slate-300">
                  Pending
                </span>

              </div>

              <span className="text-lg font-bold text-white">
                {derivedData.pending}
              </span>

            </div>

            <p className="mt-3 text-[10px] text-slate-600">
              Investigations awaiting final
              analysis
            </p>

          </div>

          {/* Failed */}
          <div className="rounded-xl border border-red-400/10 bg-red-400/[0.025] p-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <XCircle
                  size={16}
                  className="text-red-400"
                />

                <span className="text-xs font-semibold text-slate-300">
                  Failed
                </span>

              </div>

              <span className="text-lg font-bold text-white">
                {derivedData.failed}
              </span>

            </div>

            <p className="mt-3 text-[10px] text-slate-600">
              Backend investigations that
              failed
            </p>

          </div>

        </div>

        {/* ==================================================
            ANALYTICS
        ================================================== */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.35fr]">

          <RiskDistributionChart
            distribution={
              dashboard.risk_distribution
            }
          />

          <ThreatTrendChart
            trends={trends.trends}
          />

        </div>

        {/* ==================================================
            INTELLIGENCE PANELS
        ================================================== */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">

          {/* Investigation Mix */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Analysis sources
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Investigation mix
                </h2>
              </div>

              <BarChart3
                size={18}
                className="text-cyan-400"
              />

            </div>

            <div className="mt-6 space-y-4">

              {[
                {
                  label: "URLs",
                  value:
                    dashboard
                      .input_distribution
                      .url,
                  icon: (
                    <Search size={15} />
                  ),
                },
                {
                  label: "Messages",
                  value:
                    dashboard
                      .input_distribution
                      .message,
                  icon: (
                    <FileWarning
                      size={15}
                    />
                  ),
                },
                {
                  label: "Emails",
                  value:
                    dashboard
                      .input_distribution
                      .email,
                  icon: (
                    <Mail size={15} />
                  ),
                },
              ].map((item) => {

                const percentage =
                  dashboard.total_scans > 0
                    ? Math.round(
                        (item.value /
                          dashboard.total_scans) *
                          100,
                      )
                    : 0;

                return (
                  <div key={item.label}>

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2 text-xs text-slate-400">

                        {item.icon}

                        {item.label}

                      </div>

                      <span className="text-xs font-semibold text-white">
                        {item.value}
                      </span>

                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">

                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                    <p className="mt-1 text-right text-[9px] text-slate-700">
                      {percentage}%
                    </p>

                  </div>
                );
              })}

            </div>

          </div>

          {/* Threat Intelligence */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Threat intelligence
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Category landscape
                </h2>
              </div>

              <Target
                size={18}
                className="text-violet-400"
              />

            </div>

            {derivedData.categories.length ===
            0 ? (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">

                <Target
                  size={20}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-3 text-xs text-slate-600">
                  No threat categories have
                  been classified yet.
                </p>

              </div>
            ) : (
              <div className="mt-5 space-y-3">

                {derivedData.categories.map(
                  ([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                          <Target size={13} />
                        </span>

                        <span className="truncate text-xs font-medium text-slate-300">
                          {formatCategory(
                            category,
                          )}
                        </span>

                      </div>

                      <span className="ml-3 text-sm font-bold text-white">
                        {count}
                      </span>

                    </div>
                  ),
                )}

              </div>
            )}

          </div>

          {/* Highest Risk */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Highest-risk investigation
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Priority signal
                </h2>
              </div>

              <TriangleAlert
                size={18}
                className="text-red-400"
              />

            </div>

            {highestRisk ? (
              <Link
                to={`/scan/${highestRisk.scan_id}`}
                className="mt-5 block rounded-xl border border-red-400/10 bg-red-400/[0.035] p-4 transition hover:border-red-400/25 hover:bg-red-400/[0.055]"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600">
                      Scan #{highestRisk.scan_id}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCategory(
                        highestRisk.threat_category,
                      )}
                    </p>

                  </div>

                  <span
                    className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${
                      getRiskClasses(
                        highestRisk.risk_level,
                      ).badge
                    }`}
                  >
                    {highestRisk.risk_level ||
                      "UNASSESSED"}
                  </span>

                </div>

                <div className="mt-5 flex items-end justify-between">

                  <div>

                    <p
                      className={`text-4xl font-bold ${
                        highestRisk.risk_level ===
                        "HIGH"
                          ? "text-red-300"
                          : highestRisk.risk_level ===
                              "MEDIUM"
                            ? "text-amber-300"
                            : "text-emerald-300"
                      }`}
                    >
                      {highestRisk.risk_score ??
                        "—"}
                    </p>

                    <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                      Risk score
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-xs font-semibold text-slate-300">
                      {highestRisk.confidence !==
                      null
                        ? `${highestRisk.confidence}%`
                        : "—"}
                    </p>

                    <p className="text-[10px] text-slate-600">
                      Confidence
                    </p>

                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] text-slate-600">

                  <span>
                    {highestRisk.input_type}{" "}
                    analysis
                  </span>

                  <span>
                    {formatDate(
                      highestRisk.created_at,
                    )}
                  </span>

                </div>

                <div className="mt-4 flex items-center justify-end gap-1 text-[10px] font-semibold text-red-300">

                  Investigate signal

                  <ArrowRight size={12} />

                </div>

              </Link>
            ) : (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center text-xs text-slate-600">
                No risk-classified investigation
                available.
              </div>
            )}

          </div>

        </div>

        {/* ==================================================
            RECENT INVESTIGATIONS
        ================================================== */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220]">

          <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Investigation activity
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Recent scans
              </h2>

            </div>

            <div className="flex items-center gap-4">

              <div className="flex items-center gap-2 text-[10px] text-slate-600">

                <Clock3 size={13} />

                Latest database records

              </div>

              <Link
                to="/history"
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                View all

                <ArrowRight size={12} />
              </Link>

            </div>

          </div>

          {dashboard.recent_scans.length ===
          0 ? (
            <div className="p-10 text-center">

              <ShieldCheck
                size={24}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-sm text-slate-500">
                No investigations have been
                recorded yet.
              </p>

              <Link
                to="/scanner"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Start investigation

                <ArrowRight size={13} />
              </Link>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>

                  <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-[0.14em] text-slate-600">

                    <th className="px-5 py-3 font-semibold">
                      Investigation
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Source
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Risk
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Category
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Confidence
                    </th>

                    <th className="px-5 py-3 text-right font-semibold">
                      Created
                    </th>

                    <th className="px-5 py-3 text-right font-semibold">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {dashboard.recent_scans.map(
                    (scan) => {

                      const risk =
                        getRiskClasses(
                          scan.risk_level,
                        );

                      const status =
                        getStatusClasses(
                          scan.status,
                        );

                      return (
                        <tr
                          key={scan.scan_id}
                          className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                        >

                          <td className="px-5 py-4">

                            <Link
                              to={`/scan/${scan.scan_id}`}
                              className="flex items-center gap-3"
                            >

                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400">
                                {getInputIcon(
                                  scan.input_type,
                                )}
                              </div>

                              <div>

                                <p className="text-xs font-semibold text-white transition hover:text-cyan-300">
                                  Scan #
                                  {scan.scan_id}
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-600">
                                  Investigation
                                </p>

                              </div>

                            </Link>

                          </td>

                          <td className="px-5 py-4">

                            <span className="text-xs text-slate-400">
                              {scan.input_type}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <span
                                className={`h-1.5 w-1.5 rounded-full ${risk.dot}`}
                              />

                              <span
                                className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${risk.badge}`}
                              >
                                {scan.risk_level ||
                                  "UNASSESSED"}
                              </span>

                              {scan.risk_score !==
                                null && (
                                <span className="text-xs font-bold text-white">
                                  {
                                    scan.risk_score
                                  }
                                </span>
                              )}

                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <span className="text-xs text-slate-400">
                              {formatCategory(
                                scan.threat_category,
                              )}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-semibold ${status.badge}`}
                            >

                              {status.icon}

                              {scan.status}

                            </span>

                          </td>

                          <td className="px-5 py-4">

                            {scan.confidence !==
                            null ? (
                              <span className="text-xs font-medium text-slate-300">
                                {scan.confidence}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">
                                —
                              </span>
                            )}

                          </td>

                          <td className="px-5 py-4 text-right">

                            <span className="text-[10px] text-slate-600">
                              {formatDate(
                                scan.created_at,
                              )}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-right">

                            <Link
                              to={`/scan/${scan.scan_id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.04] hover:text-cyan-300"
                            >
                              Investigate

                              <ArrowRight
                                size={11}
                              />
                            </Link>

                          </td>

                        </tr>
                      );
                    },
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}
        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-slate-700 sm:flex-row sm:items-center sm:justify-between">

          <span>
            CyberShield Threat Intelligence
          </span>

          <span className="flex items-center gap-1.5">

            <span className="relative flex h-1.5 w-1.5">

              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />

            </span>

            Live backend data

          </span>

        </div>

      </div>
    </section>
  );
}

export default Dashboard;