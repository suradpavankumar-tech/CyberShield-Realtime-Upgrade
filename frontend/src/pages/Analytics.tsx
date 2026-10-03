import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Link2,
  Target,
  XCircle,
  ChevronRight,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  getDashboard,
  getDashboardTrends,
} from "../services/dashboardService";

import type {
  DashboardResponse,
  DashboardTrendsResponse,
} from "../types/dashboard";

import { useSettings } from "../context/SettingsContext";

type TrendPeriod = 7 | 14 | 30;

function formatCategory(
  category: string | null | undefined,
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

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(parsed);
}

function formatFullDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function getPercentage(
  value: number,
  total: number,
) {
  if (total <= 0) {
    return 0;
  }

  return Math.round(
    (value / total) * 100,
  );
}

function getRiskBadge(level: string | null) {
  switch (level) {
    case "HIGH":
      return "border-red-400/15 bg-red-400/[0.06] text-red-300";

    case "MEDIUM":
      return "border-amber-400/15 bg-amber-400/[0.06] text-amber-300";

    case "LOW":
      return "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300";

    default:
      return "border-white/10 bg-white/[0.03] text-slate-500";
  }
}

function Analytics() {
  const { settings } = useSettings();

  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  const [trends, setTrends] =
    useState<DashboardTrendsResponse | null>(
      null,
    );

  const [trendPeriod, setTrendPeriod] =
    useState<TrendPeriod>(7);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  /*
   * ========================================================
   * LOAD ANALYTICS
   * ========================================================
   *
   * Dashboard and trend data are fetched from the real
   * authenticated backend.
   */
  async function loadAnalytics(
    refresh = false,
    period: TrendPeriod = trendPeriod,
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
        getDashboardTrends(period),
      ]);

      setDashboard(dashboardData);
      setTrends(trendsData);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(
          "Unable to load security analytics.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
   * Initial load.
   */
  useEffect(() => {
    void loadAnalytics();
    // Initial request only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Reload when the trend period changes.
   */
  useEffect(() => {
    if (!dashboard) {
      return;
    }

    void loadAnalytics(true, trendPeriod);
    // Period changes intentionally trigger a backend request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendPeriod]);

  /*
   * Optional automatic refresh from application settings.
   */
  useEffect(() => {
    if (!settings.autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadAnalytics(
        true,
        trendPeriod,
      );
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    settings.autoRefresh,
    trendPeriod,
  ]);

  /*
   * ========================================================
   * CATEGORY DATA
   * ========================================================
   */
  const categoryEntries = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return Object.entries(
      dashboard.threat_categories,
    )
      .sort(
        ([, a], [, b]) => b - a,
      )
      .slice(0, 8);
  }, [dashboard]);

  /*
   * ========================================================
   * TREND SCALE
   * ========================================================
   */
  const maxTrendValue = useMemo(() => {
    if (
      !trends ||
      trends.trends.length === 0
    ) {
      return 1;
    }

    return Math.max(
      ...trends.trends.map(
        (point) => point.total_scans,
      ),
      1,
    );
  }, [trends]);

  /*
   * ========================================================
   * TREND TOTALS
   * ========================================================
   */
  const trendTotals = useMemo(() => {
    if (!trends) {
      return {
        scans: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    }

    return trends.trends.reduce(
      (total, point) => ({
        scans:
          total.scans +
          point.total_scans,

        high:
          total.high +
          point.high_risk,

        medium:
          total.medium +
          point.medium_risk,

        low:
          total.low +
          point.low_risk,
      }),
      {
        scans: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    );
  }, [trends]);

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */
  if (loading) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto flex min-h-[650px] max-w-[1400px] items-center justify-center">
          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
              <RefreshCw
                size={25}
                className="animate-spin"
              />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-white">
              Loading security analytics
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Aggregating real investigation data
              from CyberShield.
            </p>

          </div>
        </div>
      </section>
    );
  }

  /*
   * ========================================================
   * ERROR
   * ========================================================
   */
  if (
    error ||
    !dashboard ||
    !trends
  ) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto max-w-[900px]">

          <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.035] p-8">

            <div className="flex flex-col items-center text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
                <AlertCircle size={25} />
              </div>

              <h1 className="mt-5 text-xl font-semibold text-white">
                Analytics unavailable
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {error ||
                  "Security analytics could not be retrieved."}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadAnalytics()
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                <RefreshCw size={14} />
                Try again
              </button>

            </div>
          </div>
        </div>
      </section>
    );
  }

  /*
   * ========================================================
   * SAFE DATA
   * ========================================================
   */
  const {
    total_scans,
    average_risk_score,
    risk_distribution,
    status_distribution,
    input_distribution,
    threat_intelligence,
    highest_risk_scan,
    recent_scans,
  } = dashboard;

  const totalRiskClassified =
    risk_distribution.high +
    risk_distribution.medium +
    risk_distribution.low;

  const highestRiskPercentage =
    getPercentage(
      risk_distribution.high,
      totalRiskClassified,
    );

  const successfulCompletionRate =
    getPercentage(
      status_distribution.completed,
      total_scans,
    );

  const inputTotal =
    input_distribution.url +
    input_distribution.message +
    input_distribution.email;

  /*
   * ========================================================
   * RENDER
   * ========================================================
   */
  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1400px]">

        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              <BarChart3 size={15} />
              Security intelligence
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Analyze investigation volume, risk
              patterns, threat categories, and
              security activity using live
              CyberShield backend data.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              void loadAnalytics(
                true,
                trendPeriod,
              )
            }
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh analytics"}
          </button>

        </div>

        {/* ==================================================
            KPI CARDS
        ================================================== */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          {/* Total */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                  Total investigations
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {total_scans}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <Activity size={18} />
              </div>

            </div>

          </div>

          {/* Average risk */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                  Average risk score
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-300">
                  {average_risk_score !== null
                    ? average_risk_score.toFixed(2)
                    : "—"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                <TrendingUp size={18} />
              </div>

            </div>

            <p className="mt-2 text-[10px] text-slate-600">
              Completed scored investigations
            </p>

          </div>

          {/* High risk */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                  High-risk investigations
                </p>

                <p className="mt-2 text-3xl font-bold text-red-300">
                  {risk_distribution.high}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                <ShieldAlert size={18} />
              </div>

            </div>

            <p className="mt-2 text-[10px] text-slate-600">
              {highestRiskPercentage}% of classified investigations
            </p>

          </div>

          {/* Top threat */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div className="min-w-0">

                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                  Top threat
                </p>

                <p className="mt-2 truncate text-lg font-bold text-violet-300">
                  {formatCategory(
                    threat_intelligence.top_category,
                  )}
                </p>

              </div>

              <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                <Target size={18} />
              </div>

            </div>

            <p className="mt-2 text-[10px] text-slate-600">
              {threat_intelligence.top_category_count} investigations
            </p>

          </div>

        </div>

        {/* ==================================================
            RISK + STATUS
        ================================================== */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">

          {/* Risk */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Risk analysis
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Risk distribution
                </h2>
              </div>

              <ShieldAlert
                size={18}
                className="text-red-300"
              />

            </div>

            <div className="mt-6 space-y-5">

              {[
                {
                  label: "High",
                  value:
                    risk_distribution.high,
                  className:
                    "bg-red-400",
                  text:
                    "text-red-300",
                },
                {
                  label: "Medium",
                  value:
                    risk_distribution.medium,
                  className:
                    "bg-amber-400",
                  text:
                    "text-amber-300",
                },
                {
                  label: "Low",
                  value:
                    risk_distribution.low,
                  className:
                    "bg-emerald-400",
                  text:
                    "text-emerald-300",
                },
              ].map((item) => {

                const percentage =
                  getPercentage(
                    item.value,
                    totalRiskClassified,
                  );

                return (
                  <div key={item.label}>

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-medium text-slate-400">
                        {item.label}
                      </span>

                      <span
                        className={`text-xs font-bold ${item.text}`}
                      >
                        {item.value}{" "}
                        <span className="text-slate-600">
                          ({percentage}%)
                        </span>
                      </span>

                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]">

                      <div
                        className={`h-full rounded-full ${item.className}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              })}

            </div>

            {totalRiskClassified === 0 && (
              <p className="mt-5 text-center text-[10px] text-slate-700">
                No risk classifications available yet.
              </p>
            )}

          </div>

          {/* Status */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Pipeline status
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Investigation outcomes
                </h2>
              </div>

              <Activity
                size={18}
                className="text-cyan-300"
              />

            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">

              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4 text-center">

                <CheckCircle2
                  size={18}
                  className="mx-auto text-emerald-300"
                />

                <p className="mt-3 text-2xl font-bold text-emerald-300">
                  {status_distribution.completed}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">
                  Completed
                </p>

              </div>

              <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.025] p-4 text-center">

                <Clock3
                  size={18}
                  className="mx-auto text-amber-300"
                />

                <p className="mt-3 text-2xl font-bold text-amber-300">
                  {status_distribution.pending}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">
                  Pending
                </p>

              </div>

              <div className="rounded-xl border border-red-400/10 bg-red-400/[0.025] p-4 text-center">

                <XCircle
                  size={18}
                  className="mx-auto text-red-300"
                />

                <p className="mt-3 text-2xl font-bold text-red-300">
                  {status_distribution.failed}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">
                  Failed
                </p>

              </div>

            </div>

            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  Successful completion rate
                </span>

                <span className="text-sm font-bold text-white">
                  {successfulCompletionRate}%
                </span>

              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">

                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${successfulCompletionRate}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </div>

        {/* ==================================================
            INPUT DISTRIBUTION
        ================================================== */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220] p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Analysis sources
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Investigation input mix
              </h2>
            </div>

            <BarChart3
              size={18}
              className="text-cyan-300"
            />

          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">

            {[
              {
                label: "URLs",
                value:
                  input_distribution.url,
                icon: Link2,
              },
              {
                label: "Messages",
                value:
                  input_distribution.message,
                icon: MessageSquareText,
              },
              {
                label: "Emails",
                value:
                  input_distribution.email,
                icon: Mail,
              },
            ].map((item) => {

              const Icon = item.icon;

              const percentage =
                getPercentage(
                  item.value,
                  inputTotal,
                );

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                >

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <Icon
                        size={16}
                        className="text-cyan-300"
                      />

                      <span className="text-xs font-semibold text-slate-300">
                        {item.label}
                      </span>

                    </div>

                    <span className="text-sm font-bold text-white">
                      {item.value}
                    </span>

                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">

                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                  <p className="mt-2 text-[10px] text-slate-600">
                    {percentage}% of all investigations
                  </p>

                </div>
              );
            })}

          </div>

        </div>

        {/* ==================================================
            THREAT CATEGORIES
        ================================================== */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220]">

          <div className="border-b border-white/10 p-5">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Threat intelligence
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Threat category landscape
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Most frequently classified categories
              from your real investigation dataset.
            </p>

          </div>

          {categoryEntries.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-600">
              No threat categories have been classified yet.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">

              {categoryEntries.map(
                ([category, count], index) => {

                  const maxCategoryCount =
                    categoryEntries[0]?.[1] ?? 1;

                  const percentage =
                    getPercentage(
                      count,
                      maxCategoryCount,
                    );

                  return (
                    <div
                      key={category}
                      className="flex items-center gap-4 p-4 sm:p-5"
                    >

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-xs font-bold text-violet-300">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-3">

                          <span className="truncate text-xs font-semibold text-slate-300">
                            {formatCategory(
                              category,
                            )}
                          </span>

                          <span className="text-xs font-bold text-white">
                            {count}
                          </span>

                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">

                          <div
                            className="h-full rounded-full bg-violet-400"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>
                  );
                },
              )}

            </div>
          )}

        </div>

        {/* ==================================================
            TREND ANALYSIS
        ================================================== */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220]">

          <div className="border-b border-white/10 p-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Activity trend
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Investigation activity
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Daily investigation volume and
                  risk classification from PostgreSQL.
                </p>

              </div>

              <div className="flex items-center gap-2">

                {[7, 14, 30].map(
                  (days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setTrendPeriod(
                          days as TrendPeriod,
                        )
                      }
                      className={[
                        "rounded-lg border px-3 py-2 text-[10px] font-semibold transition",
                        trendPeriod === days
                          ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                          : "border-white/10 bg-white/[0.02] text-slate-600 hover:bg-white/[0.05] hover:text-slate-300",
                      ].join(" ")}
                    >
                      {days}D
                    </button>
                  ),
                )}

              </div>

            </div>

          </div>

          <div className="p-5">

            {/* Trend summary */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-700">
                  Period scans
                </p>

                <p className="mt-1 text-lg font-bold text-white">
                  {trendTotals.scans}
                </p>
              </div>

              <div className="rounded-xl border border-red-400/10 bg-red-400/[0.025] p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-700">
                  High
                </p>

                <p className="mt-1 text-lg font-bold text-red-300">
                  {trendTotals.high}
                </p>
              </div>

              <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.025] p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-700">
                  Medium
                </p>

                <p className="mt-1 text-lg font-bold text-amber-300">
                  {trendTotals.medium}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-700">
                  Low
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-300">
                  {trendTotals.low}
                </p>
              </div>

            </div>

            {trends.trends.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center text-xs text-slate-600">
                No trend data available yet.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <div
                  className="flex min-w-[700px] items-end gap-3"
                  style={{
                    minWidth:
                      trends.trends.length > 14
                        ? "1100px"
                        : "700px",
                  }}
                >

                  {trends.trends.map(
                    (point) => {

                      const height =
                        point.total_scans === 0
                          ? 8
                          : Math.max(
                              10,
                              Math.round(
                                (point.total_scans /
                                  maxTrendValue) *
                                  180,
                              ),
                            );

                      return (
                        <div
                          key={point.date}
                          className="flex min-w-0 flex-1 flex-col items-center"
                        >

                          <div className="mb-3 flex h-[190px] w-full items-end justify-center">

                            <div
                              className="group relative w-8 rounded-t-lg bg-cyan-400/70 transition hover:bg-cyan-300 sm:w-10"
                              style={{
                                height: `${height}px`,
                              }}
                              title={`${formatFullDate(
                                point.date,
                              )}: ${
                                point.total_scans
                              } investigations`}
                            >

                              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#111b2b] px-3 py-2 text-[9px] shadow-xl group-hover:block">

                                <p className="font-semibold text-white">
                                  {formatFullDate(
                                    point.date,
                                  )}
                                </p>

                                <p className="mt-1 text-slate-400">
                                  Total:{" "}
                                  {point.total_scans}
                                </p>

                                <p className="text-red-300">
                                  High:{" "}
                                  {point.high_risk}
                                </p>

                                <p className="text-amber-300">
                                  Medium:{" "}
                                  {point.medium_risk}
                                </p>

                                <p className="text-emerald-300">
                                  Low:{" "}
                                  {point.low_risk}
                                </p>

                              </div>

                            </div>

                          </div>

                          <span className="text-[9px] text-slate-600">
                            {formatDate(
                              point.date,
                            )}
                          </span>

                          <span className="mt-1 text-xs font-bold text-white">
                            {point.total_scans}
                          </span>

                          <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[8px]">
                            <span className="text-red-300">
                              H:{point.high_risk}
                            </span>

                            <span className="text-amber-300">
                              M:{point.medium_risk}
                            </span>

                            <span className="text-emerald-300">
                              L:{point.low_risk}
                            </span>
                          </div>

                        </div>
                      );
                    },
                  )}

                </div>
              </div>
            )}

          </div>
        </div>

        {/* ==================================================
            HIGHEST RISK + RECENT
        ================================================== */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">

          {/* Highest risk */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Priority signal
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Highest-risk investigation
                </h2>
              </div>

              <ShieldAlert
                size={18}
                className="text-red-300"
              />

            </div>

            {highest_risk_scan ? (
              <Link
                to={`/scan/${highest_risk_scan.scan_id}`}
                className="mt-5 block rounded-xl border border-red-400/10 bg-red-400/[0.035] p-4 transition hover:border-red-400/25 hover:bg-red-400/[0.055]"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600">
                      Scan #{highest_risk_scan.scan_id}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCategory(
                        highest_risk_scan.threat_category,
                      )}
                    </p>
                  </div>

                  <span
                    className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${getRiskBadge(
                      highest_risk_scan.risk_level,
                    )}`}
                  >
                    {highest_risk_scan.risk_level ??
                      "N/A"}
                  </span>

                </div>

                <div className="mt-5 flex items-end justify-between">

                  <div>
                    <p className="text-4xl font-bold text-red-300">
                      {highest_risk_scan.risk_score ??
                        "—"}
                    </p>

                    <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                      Risk score
                    </p>
                  </div>

                  <div className="text-right">

                    <p className="text-xs font-semibold text-slate-300">
                      {highest_risk_scan.confidence !==
                      null
                        ? `${highest_risk_scan.confidence}%`
                        : "—"}
                    </p>

                    <p className="text-[10px] text-slate-600">
                      Confidence
                    </p>

                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] text-slate-600">

                  <span>
                    {highest_risk_scan.input_type} analysis
                  </span>

                  <span>
                    {new Intl.DateTimeFormat(
                      "en-IN",
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                    ).format(
                      new Date(
                        highest_risk_scan.created_at,
                      ),
                    )}
                  </span>

                </div>

                <div className="mt-4 flex items-center justify-end gap-1 text-[10px] font-semibold text-red-300">
                  Investigate signal
                  <ChevronRight size={12} />
                </div>

              </Link>
            ) : (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center text-xs text-slate-600">
                No risk-classified investigation available.
              </div>
            )}

          </div>

          {/* Recent */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220]">

            <div className="flex items-center justify-between border-b border-white/10 p-5">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Investigation activity
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Recent scans
                </h2>
              </div>

              <Link
                to="/history"
                className="text-[10px] font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                View all
              </Link>

            </div>

            {recent_scans.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-600">
                No recent investigations available.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">

                {recent_scans
                  .slice(0, 6)
                  .map((scan) => (
                    <Link
                      key={scan.scan_id}
                      to={`/scan/${scan.scan_id}`}
                      className="flex items-center gap-3 p-4 transition hover:bg-white/[0.02]"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.035] text-slate-500">
                        {scan.input_type ===
                        "URL" ? (
                          <Link2 size={15} />
                        ) : scan.input_type ===
                          "MESSAGE" ? (
                          <MessageSquareText
                            size={15}
                          />
                        ) : (
                          <Mail size={15} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">

                          <span className="text-xs font-semibold text-white">
                            #{scan.scan_id}
                          </span>

                          <span className="text-[8px] uppercase tracking-wider text-slate-700">
                            {scan.input_type}
                          </span>

                        </div>

                        <p className="mt-1 truncate text-[10px] text-slate-600">
                          {formatCategory(
                            scan.threat_category,
                          )}
                        </p>

                      </div>

                      <div className="text-right">

                        <p
                          className={`text-xs font-bold ${getRiskBadge(
                            scan.risk_level,
                          )
                            .split(" ")
                            .find((value) =>
                              value.startsWith(
                                "text-",
                              ),
                            ) ?? "text-white"}`}
                        >
                          {scan.risk_score ??
                            "—"}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-700">
                          {scan.status}
                        </p>

                      </div>

                      <ChevronRight
                        size={14}
                        className="shrink-0 text-slate-700"
                      />

                    </Link>
                  ))}

              </div>
            )}

          </div>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}
        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-slate-700 sm:flex-row sm:items-center sm:justify-between">

          <span>
            CyberShield Threat Intelligence
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            Analytics powered by live backend data
          </span>

        </div>

      </div>
    </section>
  );
}

export default Analytics;