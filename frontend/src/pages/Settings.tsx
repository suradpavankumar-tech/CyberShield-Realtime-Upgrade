import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  MonitorCog,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Shield,
  Globe2,
  Volume2,
  Download,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useSettings, type AppSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    clearApplicationData,
    saved,
  } = useSettings();

  const { token } = useAuth();
  const [localSaved, setLocalSaved] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (!saved) return;
    setLocalSaved(true);
    const timer = window.setTimeout(() => setLocalSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  function handleToggle(key: keyof AppSettings) {
    updateSetting(key, !settings[key]);
  }

  function handleCopyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  }

  function handleExportSettings() {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "cybershield-settings.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-7">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <SlidersHorizontal size={15} />
              Platform Configuration
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Settings &amp; Policies
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Tune heuristic detection engines, zero-knowledge telemetry, and local analyst interface preferences.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {localSaved && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Preferences Saved
              </span>
            )}
            <button
              type="button"
              onClick={saveSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 shadow-md shadow-cyan-400/20"
            >
              <CheckCircle2 size={14} />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

        {/* Section 1: Defensive Engine Policies */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1220] shadow-xl">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Shield size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Defensive Engine Policies</h2>
                <p className="text-xs text-slate-400">
                  Real-time heuristic evaluation settings executed across scan workflows
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {/* Strict Phishing */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">Pre-Flight Phishing Interception</p>
                  <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                    CORE
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                  Elevates threat scoring for newly registered domains (&lt; 14 days old) and high-risk TLDs
                  frequently observed in deceptive financial campaigns.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.strictPhishingBlock}
                onClick={() => handleToggle("strictPhishingBlock")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.strictPhishingBlock ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.strictPhishingBlock ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Homoglyph Defense */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">Punycode &amp; Homoglyph Deobfuscation</p>
                  <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">
                    SPOOFING
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                  Identifies Cyrillic and unicode character lookalikes masquerading as reputable financial institutions
                  and Indian government portals.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.homoglyphDefense}
                onClick={() => handleToggle("homoglyphDefense")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.homoglyphDefense ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.homoglyphDefense ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Deep Redirect Unpack */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">Anti-Cloaking Redirect Unpacker</p>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                    ANTI-EVASION
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                  Traces and resolves shortened links (bit.ly, t.co, tinyurl) to inspect the ultimate destination
                  before rendering content.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.deepRedirectUnpack}
                onClick={() => handleToggle("deepRedirectUnpack")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.deepRedirectUnpack ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.deepRedirectUnpack ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Zero-Knowledge Telemetry */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">Zero-Knowledge Query Telemetry</p>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                    PRIVACY
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                  Strips personal query parameters, session tokens, and identifying information from URLs prior to
                  threat intelligence queries.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.zeroKnowledgeTelemetry}
                onClick={() => handleToggle("zeroKnowledgeTelemetry")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.zeroKnowledgeTelemetry ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.zeroKnowledgeTelemetry ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Application Interface Preferences */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1220] shadow-xl">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <MonitorCog size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Interface &amp; Alert Preferences</h2>
                <p className="text-xs text-slate-400">Customise how the application surfaces alerts and displays data</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {/* Auto Refresh */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <RefreshCw size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Automatic Intelligence Refresh</p>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">
                    Polls ThreatPulse live radar and dashboard telemetry periodically in the background.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoRefresh}
                onClick={() => handleToggle("autoRefresh")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.autoRefresh ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.autoRefresh ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  <Bell size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Security Push Notifications</p>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">
                    Enables in-browser toast alerts when high or critical risk indicators are flagged.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.securityNotifications}
                onClick={() => handleToggle("securityNotifications")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.securityNotifications ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.securityNotifications ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Sound Alerts */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
                  <Volume2 size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Critical Threat Audio Chime</p>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">
                    Plays an audible ping alert when a critical threat or coercive trap is intercepted.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundAlerts}
                onClick={() => handleToggle("soundAlerts")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.soundAlerts ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.soundAlerts ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Compact Interface */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                  <MonitorCog size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Compact Analyst Layout</p>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">
                    Optimises card padding and table row spacing for high-density multi-display security operations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.compactInterface}
                onClick={() => handleToggle("compactInterface")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings.compactInterface ? "bg-cyan-400" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings.compactInterface ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Browser Extension & Gateway Integration */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#091426] p-6 shadow-xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                <Globe2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Extension Gateway Sync</h3>
                <p className="text-xs text-slate-400">Authenticate CyberShield Chrome Extension with local backend</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyToken}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
              >
                {copiedToken ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Extension Token</span>
                  </>
                )}
              </button>

              <Link
                to="/browser-shield"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08]"
              >
                <span>BrowserShield Hub</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">API Gateway Endpoint</span>
              <p className="mt-1 font-mono text-cyan-300">http://127.0.0.1:8000/api/v1</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">Manifest Version</span>
              <p className="mt-1 font-mono text-emerald-400">Chrome Manifest V3 (0.1.0)</p>
            </div>
          </div>
        </div>

        {/* Section 4: Data Management & Backup */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Export Settings */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                <Download size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Export Configuration</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Download a JSON backup of your active security policies.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportSettings}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Download size={14} />
              <span>Export Settings JSON</span>
            </button>
          </div>

          {/* Reset Defaults */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                <RotateCcw size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Restore Defaults</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Reset interface preferences back to recommended defaults.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetSettings}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <RotateCcw size={14} />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {/* Clear Local Cache */}
          <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.02] p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                <Trash2 size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Clear Local Cache</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Purge browser local preferences. Backend scan logs remain safe.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearApplicationData}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.04] px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-400/[0.08]"
            >
              <Trash2 size={14} />
              <span>Clear Local Storage</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-white/[0.05] pt-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>CyberShield Threat Intelligence Platform</span>
          <span>Client-Side Preferences &bull; Backend Authoritative Security</span>
        </div>
      </div>
    </section>
  );
}