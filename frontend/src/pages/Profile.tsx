import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Verified,
  Database,
  ShieldAlert,
  CalendarDays,
} from "lucide-react";

import { getCurrentUser } from "../services/authService";
import { getDashboard } from "../services/dashboardService";

import type { User } from "../types/auth";
import type { DashboardResponse } from "../types/dashboard";



function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function Profile() {
  const [user, setUser] = useState<User | null>(null);

  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ========================================================
   * LOAD AUTHENTICATED PROFILE
   * ========================================================
   *
   * The backend currently provides:
   *
   * GET /auth/me
   *
   * This page therefore displays real authenticated
   * account information rather than pretending that
   * profile-edit APIs exist.
   */
  async function loadProfile(
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
        userData,
        dashboardData,
      ] = await Promise.all([
        getCurrentUser(),
        getDashboard(),
      ]);

      setUser(userData);
      setDashboard(dashboardData);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to retrieve your account information.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  /*
   * ========================================================
   * DERIVED ACCOUNT DATA
   * ========================================================
   */
  const initials = useMemo(() => {
    if (!user?.full_name?.trim()) {
      return "U";
    }

    return user.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase(),
      )
      .join("");
  }, [user]);

  const totalScans =
    dashboard?.total_scans ?? 0;

  const completedScans =
    dashboard?.status_distribution
      .completed ?? 0;

  const pendingScans =
    dashboard?.status_distribution
      .pending ?? 0;

  const failedScans =
    dashboard?.status_distribution
      .failed ?? 0;

  const highRiskScans =
    dashboard?.risk_distribution.high ?? 0;

  const mediumRiskScans =
    dashboard?.risk_distribution.medium ?? 0;

  const lowRiskScans =
    dashboard?.risk_distribution.low ?? 0;

  const averageRisk =
    dashboard?.average_risk_score;

  const topThreat =
    dashboard?.threat_intelligence
      .top_category ?? null;

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */
  if (loading) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto flex min-h-[650px] max-w-[1200px] items-center justify-center">
          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
              <Loader2
                size={25}
                className="animate-spin"
              />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-white">
              Loading profile
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Retrieving your authenticated CyberShield account.
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
  if (error || !user) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto max-w-[900px]">

          <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.035] p-8">

            <div className="flex flex-col items-center text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
                <AlertCircle size={25} />
              </div>

              <h1 className="mt-5 text-xl font-semibold text-white">
                Profile unavailable
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {error ||
                  "Your authenticated account information could not be retrieved."}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadProfile()
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
   * MAIN PROFILE
   * ========================================================
   */
  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1200px]">

        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              <UserRound size={15} />
              Account
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Profile
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View your authenticated CyberShield identity,
              account status, and security investigation activity.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              void loadProfile(true)
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
              : "Refresh profile"}
          </button>

        </div>

        {/* ==================================================
            IDENTITY CARD
        ================================================== */}
        <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220]">

          <div className="border-b border-white/10 p-5 sm:p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Identity
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Authenticated account
            </h2>

          </div>

          <div className="p-5 sm:p-6">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

              {/* Avatar */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl font-bold text-cyan-300">
                {initials}
              </div>

              {/* Identity */}
              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-2xl font-bold text-white">
                    {user.full_name}
                  </h2>

                  {user.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-cyan-400/15 bg-cyan-400/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                      <Verified size={11} />
                      Verified
                    </span>
                  )}

                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">

                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail size={13} />
                    {user.email}
                  </span>

                  <span className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {formatRole(user.role)}
                  </span>

                </div>

              </div>

              {/* Account state */}
              <div
                className={[
                  "rounded-xl border px-4 py-3",
                  user.is_active
                    ? "border-emerald-400/10 bg-emerald-400/[0.025]"
                    : "border-red-400/10 bg-red-400/[0.025]",
                ].join(" ")}
              >

                <div className="flex items-center gap-2">

                  <span
                    className={[
                      "h-2 w-2 rounded-full",
                      user.is_active
                        ? "bg-emerald-400"
                        : "bg-red-400",
                    ].join(" ")}
                  />

                  <span
                    className={[
                      "text-xs font-semibold",
                      user.is_active
                        ? "text-emerald-300"
                        : "text-red-300",
                    ].join(" ")}
                  >
                    {user.is_active
                      ? "Account active"
                      : "Account inactive"}
                  </span>

                </div>

              </div>

            </div>

          </div>
        </div>

        {/* ==================================================
            ACCOUNT DETAILS
        ================================================== */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">

          {/* Authentication */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220]">

            <div className="border-b border-white/10 p-5">

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Account details
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Authentication profile
              </h2>

            </div>

            <div className="divide-y divide-white/[0.05]">

              {/* User ID */}
              <div className="flex items-center justify-between gap-4 p-4">

                <div className="flex items-center gap-2.5">

                  <ShieldCheck
                    size={15}
                    className="text-slate-600"
                  />

                  <span className="text-xs text-slate-500">
                    User ID
                  </span>

                </div>

                <span className="text-xs font-semibold text-white">
                  #{user.id}
                </span>

              </div>

              {/* Email */}
              <div className="flex items-center justify-between gap-4 p-4">

                <div className="flex items-center gap-2.5">

                  <Mail
                    size={15}
                    className="text-slate-600"
                  />

                  <span className="text-xs text-slate-500">
                    Email
                  </span>

                </div>

                <span className="max-w-[60%] truncate text-right text-xs font-medium text-slate-300">
                  {user.email}
                </span>

              </div>

              {/* Role */}
              <div className="flex items-center justify-between gap-4 p-4">

                <div className="flex items-center gap-2.5">

                  <UserRound
                    size={15}
                    className="text-slate-600"
                  />

                  <span className="text-xs text-slate-500">
                    Role
                  </span>

                </div>

                <span className="text-xs font-semibold text-white">
                  {formatRole(user.role)}
                </span>

              </div>

              {/* Verification */}
              <div className="flex items-center justify-between gap-4 p-4">

                <div className="flex items-center gap-2.5">

                  <Verified
                    size={15}
                    className="text-slate-600"
                  />

                  <span className="text-xs text-slate-500">
                    Verification
                  </span>

                </div>

                <span
                  className={
                    user.is_verified
                      ? "text-xs font-semibold text-cyan-300"
                      : "text-xs font-semibold text-slate-600"
                  }
                >
                  {user.is_verified
                    ? "Verified"
                    : "Not verified"}
                </span>

              </div>

              {/* Account state */}
              <div className="flex items-center justify-between gap-4 p-4">

                <div className="flex items-center gap-2.5">

                  <CheckCircle2
                    size={15}
                    className="text-slate-600"
                  />

                  <span className="text-xs text-slate-500">
                    Account state
                  </span>

                </div>

                <span
                  className={
                    user.is_active
                      ? "text-xs font-semibold text-emerald-300"
                      : "text-xs font-semibold text-red-300"
                  }
                >
                  {user.is_active
                    ? "Active"
                    : "Inactive"}
                </span>

              </div>

            </div>
          </div>

          {/* Security state */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220]">

            <div className="border-b border-white/10 p-5">

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Security state
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Account security
              </h2>

            </div>

            <div className="p-5">

              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <ShieldCheck size={18} />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-white">
                      Authentication protected
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      API requests are protected through
                      your authenticated CyberShield session.
                    </p>

                  </div>

                </div>

              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    Verification
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    {user.is_verified
                      ? "Verified account"
                      : "Verification pending"}
                  </p>

                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    Session
                  </p>

                  <p className="mt-2 text-sm font-semibold text-emerald-300">
                    Authenticated
                  </p>

                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ==================================================
            SECURITY ACTIVITY
        ================================================== */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220]">

          <div className="border-b border-white/10 p-5">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Security activity
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Investigation statistics
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Aggregated from your real CyberShield analysis records.
            </p>

          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">

            {/* Total */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    Total scans
                  </p>

                  <p className="mt-2 text-2xl font-bold text-white">
                    {totalScans}
                  </p>
                </div>

                <Activity
                  size={18}
                  className="text-cyan-300"
                />

              </div>

            </div>

            {/* Completed */}
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    Completed
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-300">
                    {completedScans}
                  </p>
                </div>

                <CheckCircle2
                  size={18}
                  className="text-emerald-300"
                />

              </div>

            </div>

            {/* High risk */}
            <div className="rounded-xl border border-red-400/10 bg-red-400/[0.025] p-4">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    High risk
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-300">
                    {highRiskScans}
                  </p>
                </div>

                <ShieldAlert
                  size={18}
                  className="text-red-300"
                />

              </div>

            </div>

            {/* Average */}
            <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.025] p-4">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    Avg risk score
                  </p>

                  <p className="mt-2 text-2xl font-bold text-amber-300">
                    {averageRisk !== null &&
                    averageRisk !== undefined
                      ? averageRisk.toFixed(2)
                      : "—"}
                  </p>
                </div>

                <Activity
                  size={18}
                  className="text-amber-300"
                />

              </div>

            </div>

          </div>

          {/* Risk breakdown */}
          <div className="grid gap-5 border-t border-white/[0.05] p-5 lg:grid-cols-2">

            <div>

              <p className="text-[9px] uppercase tracking-[0.16em] text-slate-700">
                Risk breakdown
              </p>

              <div className="mt-4 space-y-3">

                <div className="flex items-center justify-between rounded-xl border border-red-400/10 bg-red-400/[0.025] px-4 py-3">

                  <span className="text-xs text-slate-400">
                    High risk
                  </span>

                  <span className="text-sm font-bold text-red-300">
                    {highRiskScans}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl border border-amber-400/10 bg-amber-400/[0.025] px-4 py-3">

                  <span className="text-xs text-slate-400">
                    Medium risk
                  </span>

                  <span className="text-sm font-bold text-amber-300">
                    {mediumRiskScans}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] px-4 py-3">

                  <span className="text-xs text-slate-400">
                    Low risk
                  </span>

                  <span className="text-sm font-bold text-emerald-300">
                    {lowRiskScans}
                  </span>

                </div>

              </div>

            </div>

            <div>

              <p className="text-[9px] uppercase tracking-[0.16em] text-slate-700">
                Processing status
              </p>

              <div className="mt-4 space-y-3">

                <div className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] px-4 py-3">

                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={14}
                      className="text-emerald-300"
                    />

                    <span className="text-xs text-slate-400">
                      Completed
                    </span>

                  </div>

                  <span className="text-sm font-bold text-emerald-300">
                    {completedScans}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl border border-amber-400/10 bg-amber-400/[0.025] px-4 py-3">

                  <div className="flex items-center gap-2">

                    <Clock3
                      size={14}
                      className="text-amber-300"
                    />

                    <span className="text-xs text-slate-400">
                      Pending
                    </span>

                  </div>

                  <span className="text-sm font-bold text-amber-300">
                    {pendingScans}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl border border-red-400/10 bg-red-400/[0.025] px-4 py-3">

                  <div className="flex items-center gap-2">

                    <AlertCircle
                      size={14}
                      className="text-red-300"
                    />

                    <span className="text-xs text-slate-400">
                      Failed
                    </span>

                  </div>

                  <span className="text-sm font-bold text-red-300">
                    {failedScans}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ==================================================
            INTELLIGENCE SUMMARY
        ================================================== */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">

          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                <Database size={18} />
              </div>

              <div>

                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                  Threat intelligence
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  Most common classification
                </p>

              </div>

            </div>

            <p className="mt-5 text-xl font-bold text-violet-300">
              {topThreat
                ? topThreat
                    .toLowerCase()
                    .split("_")
                    .map(
                      (word) =>
                        word
                          .charAt(0)
                          .toUpperCase() +
                        word.slice(1),
                    )
                    .join(" ")
                : "No classification yet"}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Based on your completed investigations.
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <CalendarDays size={18} />
              </div>

              <div>

                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                  Account identifier
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  CyberShield user account
                </p>

              </div>

            </div>

            <p className="mt-5 text-xl font-bold text-cyan-300">
              #{user.id}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Authenticated user identifier returned by the backend.
            </p>

          </div>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}
        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-slate-700 sm:flex-row sm:items-center sm:justify-between">

          <span>
            CyberShield Threat Intelligence
          </span>

          <span>
            Live authenticated account data
          </span>

        </div>

      </div>
    </section>
  );
}

export default Profile;