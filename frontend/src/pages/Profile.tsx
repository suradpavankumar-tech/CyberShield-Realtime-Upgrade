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
  Clock,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getCurrentUser, updateProfile, changePassword } from "../services/authService";
import { getDashboard } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

import type { User } from "../types/auth";
import type { DashboardResponse } from "../types/dashboard";

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

  // Edit Profile State
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Change Password State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Token Copy State
  const [copiedToken, setCopiedToken] = useState(false);

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

  // Initials
  const initials = useMemo(() => {
    if (!user?.full_name?.trim()) return "CS";
    return user.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [user]);

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
      setShowPasswordForm(false);
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

  if (loading) {
    return (
      <section className="p-5 sm:p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-[1200px] items-center justify-center">
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

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-7">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <UserRound size={15} />
              Identity &amp; Credentials
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Account Profile
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Manage your authenticated credentials, security hygiene posture, and active session tokens.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadProfile(true)}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-cyan-400" : "text-cyan-400"} />
            <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>

        {/* Name Updated Toast */}
        {nameSuccess && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300 shadow-lg">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Profile name updated successfully.</span>
          </div>
        )}

        {/* Password Updated Toast */}
        {passwordSuccess && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300 shadow-lg">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Password updated successfully.</span>
          </div>
        )}

        {/* Identity & Profile Overview Card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220] shadow-xl">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                {/* Avatar with Glow */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-2xl font-black text-cyan-300 shadow-lg shadow-cyan-500/10">
                  {initials}
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
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {formatRole(user.role)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-cyan-400" />
                      {user.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      Account #{user.id}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500" />
                      Active Member
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Name Button */}
              <button
                type="button"
                onClick={() => setEditingName(!editingName)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-white/[0.08]"
              >
                <Edit3 size={13} />
                <span>{editingName ? "Cancel" : "Edit Name"}</span>
              </button>
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
                    placeholder="Enter your full name"
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

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10 sm:grid-cols-4">
            <div className="p-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Scans</span>
              <p className="mt-1 text-2xl font-black text-white">{totalScans}</p>
            </div>
            <div className="p-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hygiene Score</span>
              <p className="mt-1 text-2xl font-black text-emerald-400">{hygieneScore}%</p>
            </div>
            <div className="p-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">High Risk Signals</span>
              <p className="mt-1 text-2xl font-black text-rose-400">{highRisk}</p>
            </div>
            <div className="p-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Account Status</span>
              <p className="mt-1 text-2xl font-black text-cyan-300">ACTIVE</p>
            </div>
          </div>
        </div>

        {/* Security & Credentials Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Change Password Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Password &amp; Security</h3>
                  <p className="text-xs text-slate-400">Manage your master authentication credential</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"
              >
                {showPasswordForm ? "Close" : "Change Password"}
              </button>
            </div>

            {showPasswordForm ? (
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
                      <span>Updating Password…</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs leading-relaxed text-slate-400">
                  Your password is cryptographically protected with salted bcrypt hashing. It is never logged or stored in plaintext.
                </p>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <span className="text-slate-400">Password Encryption</span>
                  <span className="font-mono font-bold text-emerald-400">Bcrypt $2b$ Cost 12</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <span className="text-slate-400">2FA / Multi-Factor</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">OPTIONAL</span>
                </div>
              </div>
            )}
          </div>

          {/* IdentityShield Breach Audit Callout */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#120e24] to-[#0a1220] p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Identity Exposure Health</h3>
                <p className="text-xs text-slate-400">Continuous breach monitoring for your email</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Monitored Account:</span>
                <span className="font-mono text-xs font-bold text-white">{user.email}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Scan your email address against our catalog of verified data breaches (Domino's India, BigBasket, Air India, Canva, and Aadhaar credential caches).
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/identity-shield"
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500"
              >
                <Search size={14} />
                <span>Run Identity Audit</span>
              </Link>

              <Link
                to="/identity-shield"
                className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-transparent px-4 py-2.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/10"
              >
                <KeyRound size={14} />
                <span>k-Anonymity Password Test</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Active Session & Extension JWT Token Card */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#091426] p-6 shadow-xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white">Active Session Token (JWT Bearer)</h3>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Use this cryptographic token to authenticate the Chrome Extension or CLI automation tools.
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
                  <span>Token Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Session Token</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-slate-400 break-all">
            {token ? `${token.substring(0, 48)}••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••` : "No session token available."}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
            <Clock size={12} className="text-cyan-400" />
            <span>Tokens are stateless, cryptographically signed with HS256, and expire after 24 hours.</span>
          </div>
        </div>
      </div>
    </section>
  );
}