import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Database,
  MonitorCog,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Info,
  LockKeyhole,
} from "lucide-react";

import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

function Settings() {
  const {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    clearApplicationData,
    saved,
  } = useSettings();

  const { user } = useAuth();

  const [localSaved, setLocalSaved] =
    useState(false);

  /*
   * Keep the visible confirmation short-lived.
   */
  useEffect(() => {
    if (!saved) {
      return;
    }

    setLocalSaved(true);

    const timer = window.setTimeout(() => {
      setLocalSaved(false);
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [saved]);

  function handleSettingChange(
    key:
      | "autoRefresh"
      | "securityNotifications"
      | "compactInterface",
    value: boolean,
  ) {
    updateSetting(key, value);

    /*
     * SettingsContext keeps the current value in memory.
     * Persist the changed preference immediately so the
     * browser retains it after reload.
     */
    window.setTimeout(() => {
      saveSettings();
    }, 0);
  }

  function handleSave() {
    saveSettings();
  }

  function handleResetSettings() {
    resetSettings();
  }

  function handleClearApplicationData() {
    clearApplicationData();
  }

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1200px]">

        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              <SlidersHorizontal size={15} />
              System
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Configure CyberShield application behaviour,
              local preferences, and security interface options.
            </p>

            {localSaved && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.035] px-3 py-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={14} />
                Preferences saved locally
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            <CheckCircle2 size={14} />
            Save preferences
          </button>
        </div>

        {/* ==================================================
            APPLICATION PREFERENCES
        ================================================== */}
        <div className="mt-7 rounded-2xl border border-white/10 bg-[#0a1220]">

          <div className="border-b border-white/10 p-5 sm:p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Application preferences
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              CyberShield behaviour
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              These preferences are stored locally in this
              browser. They do not modify backend security data.
            </p>

          </div>

          <div className="divide-y divide-white/[0.05]">

            {/* ==================================================
                AUTO REFRESH
            ================================================== */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <RefreshCw size={17} />
                </div>

                <div>

                  <p className="text-sm font-semibold text-white">
                    Automatic intelligence refresh
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                    Allow supported dashboard and analytics
                    views to refresh their security intelligence
                    automatically.
                  </p>

                </div>

              </div>

              <button
                type="button"
                role="switch"
                aria-checked={settings.autoRefresh}
                onClick={() =>
                  handleSettingChange(
                    "autoRefresh",
                    !settings.autoRefresh,
                  )
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.autoRefresh
                    ? "bg-cyan-400"
                    : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.autoRefresh
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>

            </div>

            {/* ==================================================
                SECURITY NOTIFICATIONS
            ================================================== */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  <Bell size={17} />
                </div>

                <div>

                  <p className="text-sm font-semibold text-white">
                    Security notifications
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                    Enable security-related notifications supported
                    by the CyberShield interface.
                  </p>

                </div>

              </div>

              <button
                type="button"
                role="switch"
                aria-checked={
                  settings.securityNotifications
                }
                onClick={() =>
                  handleSettingChange(
                    "securityNotifications",
                    !settings.securityNotifications,
                  )
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.securityNotifications
                    ? "bg-cyan-400"
                    : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.securityNotifications
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>

            </div>

            {/* ==================================================
                COMPACT INTERFACE
            ================================================== */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                  <MonitorCog size={17} />
                </div>

                <div>

                  <p className="text-sm font-semibold text-white">
                    Compact interface
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                    Store your preference for a denser CyberShield
                    interface. Components can respond to this
                    preference as supported.
                  </p>

                </div>

              </div>

              <button
                type="button"
                role="switch"
                aria-checked={
                  settings.compactInterface
                }
                onClick={() =>
                  handleSettingChange(
                    "compactInterface",
                    !settings.compactInterface,
                  )
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.compactInterface
                    ? "bg-cyan-400"
                    : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.compactInterface
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>

            </div>

          </div>
        </div>

        {/* ==================================================
            CURRENT SESSION
        ================================================== */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220]">

          <div className="border-b border-white/10 p-5 sm:p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Current session
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Authentication environment
            </h2>

          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* Authentication */}
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <ShieldCheck size={17} />
                </div>

                <div>

                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    Authentication
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-300">
                    Active
                  </p>

                </div>

              </div>

            </div>

            {/* User */}
            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <LockKeyhole size={17} />
                </div>

                <div className="min-w-0">

                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    Signed in as
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {user?.email ?? "Authenticated user"}
                  </p>

                </div>

              </div>

            </div>

            {/* Storage */}
            <div className="rounded-xl border border-violet-400/10 bg-violet-400/[0.025] p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                  <Database size={17} />
                </div>

                <div>

                  <p className="text-[9px] uppercase tracking-wider text-slate-700">
                    Preference storage
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    Browser local storage
                  </p>

                </div>

              </div>

            </div>

          </div>
        </div>

        {/* ==================================================
            IMPORTANT INFORMATION
        ================================================== */}
        <div className="mt-5 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Info size={17} />
            </div>

            <div>

              <h3 className="text-sm font-semibold text-white">
                About these settings
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                CyberShield currently stores interface preferences
                locally in your browser. Your investigations,
                threat indicators, risk scores, and analysis
                records remain backend data and are not affected
                when you reset these preferences.
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================
            LOCAL DATA
        ================================================== */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">

          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                <RotateCcw size={17} />
              </div>

              <div>

                <p className="text-sm font-semibold text-white">
                  Restore defaults
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Restore all CyberShield interface preferences
                  to their original default values.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={handleResetSettings}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <RotateCcw size={14} />
              Reset preferences
            </button>

          </div>

          <div className="rounded-2xl border border-red-400/10 bg-red-400/[0.025] p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                <Trash2 size={17} />
              </div>

              <div>

                <p className="text-sm font-semibold text-white">
                  Clear local preferences
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Remove locally stored CyberShield preferences
                  from this browser. Backend investigations are
                  not deleted.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={handleClearApplicationData}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.025] px-4 py-3 text-xs font-semibold text-red-300 transition hover:bg-red-400/[0.06]"
            >
              <Trash2 size={14} />
              Clear local preferences
            </button>

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
            Local application configuration
          </span>

        </div>

      </div>
    </section>
  );
}

export default Settings;