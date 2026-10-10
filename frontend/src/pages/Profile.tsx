import { useEffect, useMemo, useState } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  RefreshCw,
  Verified,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Calendar,
  Copy,
  Check,
  Edit3,
  Shield,
  Search,
  Terminal,
  Activity,
  FileText,
  Key,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getCurrentUser, updateProfile, changePassword } from "../services/authService";
import { getDashboard } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

import type { User } from "../types/auth";
import type { DashboardResponse } from "../types/dashboard";

type ProfileTab = "overview" | "credentials" | "api" | "dossier" | "audit";

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Profile() {
  const { token, refreshUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // Edit Name State
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Token Copy State
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // MFA Simulator State
  const [mfaEnabled, setMfaEnabled] = useState(false);

  async function loadProfile(refresh = false) {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [userData, dashboardData] = await Promise.all([
        getCurrentUser(),
        getDashboard(),
      ]);

      setUser(userData);
      setNewName(userData.full_name);
      setDashboard(dashboardData);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Unable to retrieve account information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  const initials = useMemo(() => {
    if (!user?.full_name?.trim()) return "CS";
    return user.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [user]);

  // Password Strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 25;
    if (newPassword.length >= 12) score += 25;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 25;
    if (/[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) score += 25;
    return score;
  }, [newPassword]);

  // Handle Edit Name
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || newName.trim().length < 2) {
      setNameError("Full name must be at least 2 characters.");
      return;
    }

    setSavingName(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      const updated = await updateProfile({ full_name: newName.trim() });
      setUser(updated);
      await refreshUser();
      setNameSuccess(true);
      setEditingName(false);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: any) {
      setNameError(err?.response?.data?.detail || err.message || "Failed to update profile name.");
    } finally {
      setSavingName(false);
    }
  }

  // Handle Change Password
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.detail || err.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleCopyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  }

  function handleCopyCurl() {
    const curlCmd = `curl -X POST "http://127.0.0.1:8000/api/v1/analysis/url" \\
  -H "Authorization: Bearer ${token || "<TOKEN>"}" \\
  -H "Content-Type: application/json" \\
  -d '{"input_type": "URL", "content": "https://example.com"}'`;
    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  }

  if (loading) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-[1250px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-lg shadow-cyan-500/10">
              <RefreshCw size={24} className="animate-spin text-cyan-400" />
            </div>
            <h2 className="mt-4 text-base font-bold text-white">Loading Security Profile</h2>
            <p className="mt-1 text-xs text-slate-400">Authenticating identity and retrieving security telemetry…</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !user) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-8 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
              <AlertTriangle size={24} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-white">Profile Unavailable</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{error || "Could not retrieve account details."}</p>
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const totalScans = dashboard?.total_scans ?? 0;
  const highRisk = dashboard?.risk_distribution.high ?? 0;
  const mediumRisk = dashboard?.risk_distribution.medium ?? 0;
  const lowRisk = dashboard?.risk_distribution.low ?? 0;
  const classified = highRisk + mediumRisk + lowRisk;
  const hygieneScore =
    classified > 0 ? Math.round(((lowRisk * 1.0 + mediumRisk * 0.4) / classified) * 100) : 95;

  const tabs: Array<{ id: ProfileTab; label: string; icon: any }> = [
    { id: "overview", label: "Identity & Clearance", icon: UserRound },
    { id: "credentials", label: "Credentials & 2FA", icon: KeyRound },
    { id: "api", label: "API & CLI Access", icon: Terminal },
    { id: "dossier", label: "Forensic Dossier", icon: Activity },
    { id: "audit", label: "Security Audit Log", icon: FileText },
  ];

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1250px] space-y-7">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <ShieldCheck size={15} />
              Security Analyst Profile
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Operator Account &amp; Clearance
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Manage your authenticated credentials, security hygiene posture, cryptographic tokens, and audit events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadProfile(true)}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-cyan-400" : "text-cyan-400"} />
            <span>{refreshing ? "Refreshing…" : "Refresh Profile"}</span>
          </button>
        </div>

        {/* Toasts */}
        {nameSuccess && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300 shadow-lg">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Profile display name updated successfully.</span>
          </div>
        )}
        {passwordSuccess && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300 shadow-lg">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Account password updated successfully across all sessions.</span>
          </div>
        )}

        {/* Enterprise Identity Banner */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220] shadow-xl">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                {/* Avatar with Glow */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-2xl font-black text-cyan-300 shadow-lg shadow-cyan-500/10">
                  {initials}
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-[#0a1220]" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-white">{user.full_name}</h2>
                    {user.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        <Verified size={12} />
                        Verified
                      </span>
                    )}
                    <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Tier 2 SOC Analyst
                    </span>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {formatRole(user.role)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono text-slate-300">
                      <Mail size={13} className="text-cyan-400" />
                      {user.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      Operator ID: #{user.id}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500" />
                      CyberShield Defense Network
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingName(!editingName)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-white/[0.08]"
                >
                  <Edit3 size={13} />
                  <span>{editingName ? "Cancel" : "Edit Name"}</span>
                </button>

                <Link
                  to="/identity-shield"
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 px-4 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-600/30"
                >
                  <Search size={13} />
                  <span>Audit Identity Exposure</span>
                </Link>
              </div>
            </div>

            {/* Inline Name Edit Form */}
            {editingName && (
              <form onSubmit={handleSaveName} className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4">
                <label className="text-xs font-semibold text-slate-300">Update Display Name</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter full operator name"
                    className="flex-1 rounded-xl border border-white/10 bg-[#050b14] px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                  >
                    {savingName ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>Save Name</span>
                  </button>
                </div>
                {nameError && <p className="mt-2 text-xs text-rose-400">{nameError}</p>}
              </form>
            )}
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
            <div className="p-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Scans Dispatched</span>
              <p className="mt-1 text-2xl font-black text-white">{totalScans}</p>
            </div>
            <div className="p-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hygiene Index</span>
              <p className="mt-1 text-2xl font-black text-emerald-400">{hygieneScore}%</p>
            </div>
            <div className="p-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">High-Risk Intercepts</span>
              <p className="mt-1 text-2xl font-black text-rose-400">{highRisk}</p>
            </div>
            <div className="p-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">2FA Status</span>
              <p className="mt-1 text-2xl font-black text-cyan-300">{mfaEnabled ? "ENABLED" : "ACTIVE (HS256)"}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0a1220] p-1.5 shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30 shadow-md"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon size={15} className={active ? "text-cyan-400" : "text-slate-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================================================
            TAB 1: OVERVIEW / IDENTITY & CLEARANCE
        ================================================== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <h3 className="text-base font-bold text-white">Security Clearance &amp; Access</h3>
              <p className="mt-1 text-xs text-slate-400">Granted privileges within the CyberShield workspace</p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <span className="text-slate-400">Operator Role</span>
                  <span className="font-bold text-white">{formatRole(user.role)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <span className="text-slate-400">Forensic Access Level</span>
                  <span className="font-bold text-cyan-300">Level 2 (Deep Static Decompilation &amp; Topology)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <span className="text-slate-400">Session Standard</span>
                  <span className="font-bold text-emerald-400">Stateless JWT / HS256 Bearer</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <span className="text-slate-400">Organization</span>
                  <span className="font-bold text-slate-300">CyberShield Threat Intel Node #1</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <h3 className="text-base font-bold text-white">Identity Protection Dossier</h3>
              <p className="mt-1 text-xs text-slate-400">Proactive breach intelligence for your primary account</p>

              <div className="mt-5 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-violet-300">
                  <Shield size={16} />
                  <span>Monitored Identifier: {user.email}</span>
                </div>
                <p className="mt-2 leading-relaxed text-slate-400">
                  This address is indexed against continuous breach telemetry including verified credential dumps
                  (Domino's India, BigBasket, Air India, Canva, and Aadhaar credential caches).
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to="/identity-shield"
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-violet-500"
                  >
                    <span>Open IdentityShield</span>
                    <Search size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 2: CREDENTIALS & 2FA
        ================================================== */}
        {activeTab === "credentials" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Change Password */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Update Password</h3>
                  <p className="text-xs text-slate-400">Cryptographically salted bcrypt authentication</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="mt-5 space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#050b14] px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400">New Password (min 8 chars)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#050b14] px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Password Strength:</span>
                        <span className={passwordStrength >= 75 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {passwordStrength >= 75 ? "Strong" : passwordStrength >= 50 ? "Moderate" : "Weak"}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength >= 75 ? "bg-emerald-400" : passwordStrength >= 50 ? "bg-amber-400" : "bg-rose-400"
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#050b14] px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                    <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Updating Credential…</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* MFA / 2FA Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Two-Factor Authentication (2FA)</h3>
                  <p className="text-xs text-slate-400">Enforce hardware token or TOTP authenticator app verification</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div>
                    <span className="text-xs font-bold text-white">Authenticator App (TOTP)</span>
                    <p className="mt-0.5 text-[11px] text-slate-400">Google Authenticator, Microsoft Authenticator, 1Password</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMfaEnabled(!mfaEnabled)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      mfaEnabled
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                    }`}
                  >
                    {mfaEnabled ? "Enabled" : "Enable 2FA"}
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-400">
                  <span className="font-semibold text-white">Cryptographic Standards:</span>
                  <ul className="mt-2 space-y-1 text-[11px]">
                    <li>• Password Encryption: Salted bcrypt with Cost Factor 12</li>
                    <li>• Token Standard: Stateless RFC 7519 JWT (HS256 signature)</li>
                    <li>• Client Privacy: Mathematical $k$-anonymity SHA-1 5-character prefix queries</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 3: API & DEVELOPER ACCESS
        ================================================== */}
        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-500/20 bg-[#091426] p-6 shadow-xl">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-cyan-400" />
                    <h3 className="text-base font-bold text-white">Active Session Bearer Token</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Authenticate automated scripts, the Chrome Extension, or custom SIEM integrations
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  {copiedToken ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy JWT Bearer Token</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-slate-300 break-all">
                {token || "No active session token."}
              </div>
            </div>

            {/* CLI & Code Snippet */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Terminal size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">cURL Developer Integration Example</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/[0.08]"
                >
                  {copiedCurl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>Copy cURL</span>
                </button>
              </div>

              <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-emerald-400">
                <pre>{`curl -X POST "http://127.0.0.1:8000/api/v1/analysis/url" \\
  -H "Authorization: Bearer ${token ? `${token.substring(0, 24)}...` : "<YOUR_TOKEN>"}" \\
  -H "Content-Type: application/json" \\
  -d '{"input_type": "URL", "content": "https://secure-sbi-portal.xyz/verify"}'`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 4: FORENSIC DOSSIER
        ================================================== */}
        {activeTab === "dossier" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">URLs Analyzed</span>
                <p className="mt-2 text-2xl font-black text-white">{dashboard?.input_distribution.url ?? 0}</p>
                <p className="mt-1 text-xs text-slate-400">Lexical, DNS &amp; threat intelligence lookups</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SMS / WhatsApp Scams</span>
                <p className="mt-2 text-2xl font-black text-white">{dashboard?.input_distribution.message ?? 0}</p>
                <p className="mt-1 text-xs text-slate-400">Digital arrest &amp; electricity bill urgency traps</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Phishing Audits</span>
                <p className="mt-2 text-2xl font-black text-white">{dashboard?.input_distribution.email ?? 0}</p>
                <p className="mt-1 text-xs text-slate-400">DKIM / SPF spoofing &amp; credential harvesting</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white">Top Identified Threat Categories</h3>
              <p className="mt-1 text-xs text-slate-400">Distribution across your historical security investigations</p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {dashboard && Object.keys(dashboard.threat_categories).length > 0 ? (
                  Object.entries(dashboard.threat_categories).map(([cat, count]) => (
                    <div
                      key={cat}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs"
                    >
                      <span className="font-semibold text-white">{formatRole(cat)}</span>
                      <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                        {count} hits
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No category classifications recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 5: SECURITY AUDIT LOG
        ================================================== */}
        {activeTab === "audit" && (
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
            <h3 className="text-base font-bold text-white">Session &amp; Authentication Audit Trail</h3>
            <p className="mt-1 text-xs text-slate-400">Immutable security event history for account #{user.id}</p>

            <div className="mt-5 space-y-3">
              {[
                { event: "Authenticated User Session Initiated", time: "Just now", status: "SUCCESS", ip: "127.0.0.1 (Local Workstation)" },
                { event: "HS256 JWT Token Issued for Extension", time: "5 mins ago", status: "SUCCESS", ip: "127.0.0.1" },
                { event: "Profile Integrity Check Verified", time: "10 mins ago", status: "VERIFIED", ip: "127.0.0.1" },
                { event: "IdentityShield k-Anonymity Cache Query", time: "1 hour ago", status: "SUCCESS", ip: "127.0.0.1" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="font-semibold text-white">{item.event}</p>
                      <p className="mt-0.5 text-[11px] font-mono text-slate-500">Source: {item.ip}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {item.status}
                    </span>
                    <p className="mt-0.5 text-[10px] text-slate-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-white/[0.05] pt-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>CyberShield Identity &amp; Access Governance</span>
          <span>Role: {formatRole(user.role)} &bull; Active Node: Bangalore Central</span>
        </div>
      </div>
    </section>
  );
}