import { useState } from "react";
import {
  Globe2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Lock,
  Layers,
  RefreshCw,
  Sliders,
  Sparkles,
  Info,
  Terminal,
  Download,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { analyzeUrl } from "../services/analysisService";
import type { AnalysisResponse } from "../types/analysis";

interface ProtectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tag: string;
}

export default function BrowserShield() {
  const { token, user } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Link Interception Simulator state
  const [testUrl, setTestUrl] = useState("http://secure-sbi-login.fraudulent-portal.xyz/verify-kyc");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<AnalysisResponse | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [showBypassWarning, setShowBypassWarning] = useState(false);

  // Protection Toggles State
  const [rules, setRules] = useState<ProtectionRule[]>([
    {
      id: "preflight_intercept",
      name: "Pre-Flight Link Interception",
      description: "Intercepts hyperlinked navigation clicks before full DOM rendering to evaluate threat signatures.",
      enabled: true,
      tag: "CORE DEFENSE",
    },
    {
      id: "homoglyph_defense",
      name: "Punycode & Homoglyph Deobfuscation",
      description: "Identifies Cyrillic and unicode character lookalikes masquerading as reputable financial institutions.",
      enabled: true,
      tag: "SPOOFING",
    },
    {
      id: "redirect_unpacker",
      name: "Anti-Cloaking Redirect Unpacker",
      description: "Unravels multi-hop shortener chains (bit.ly, t.co, tinyurl) before browser navigation occurs.",
      enabled: true,
      tag: "EVASION",
    },
    {
      id: "digital_arrest_heuristics",
      name: "Digital Arrest & KYC Coercion Traps",
      description: "Hard-blocks counterfeit police, customs, court summons, and APK auto-download payloads.",
      enabled: true,
      tag: "REGIONAL",
    },
    {
      id: "zero_knowledge",
      name: "Zero-Knowledge Query Telemetry",
      description: "Strips query tokens and user identifiers prior to threat intelligence hash lookups.",
      enabled: true,
      tag: "PRIVACY",
    },
  ]);

  const presetUrls = [
    {
      label: "Bank Phishing Impersonator",
      url: "http://secure-sbi-login.fraudulent-portal.xyz/verify-kyc",
      type: "DANGER",
    },
    {
      label: "Digital Arrest Summons Trap",
      url: "http://cbi-arrest-warrant-notice.gov-verify.cc/court-order.html",
      type: "CRITICAL",
    },
    {
      label: "UPI Lottery / Recharge Scam",
      url: "http://claim-free-recharge-gift-2026.click/spin-wheel",
      type: "HIGH",
    },
    {
      label: "Legitimate State Bank Portal",
      url: "https://www.onlinesbi.sbi",
      type: "SAFE",
    },
    {
      label: "Legitimate Developer Cloud",
      url: "https://github.com",
      type: "SAFE",
    },
  ];

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }

  function handleCopyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  }

  function handleCopyPath() {
    navigator.clipboard.writeText("C:\\Users\\PAVAN SURAD\\OneDrive\\Documents\\CyberShield_Realtime_Upgrade\\extension");
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2500);
  }

  async function handleSimulate(urlOverride?: string) {
    const target = (urlOverride || testUrl).trim();
    if (!target) return;

    setSimulating(true);
    setSimulationError(null);
    setSimulationResult(null);
    setShowBypassWarning(false);

    try {
      const res = await analyzeUrl(target);
      setSimulationResult(res);
    } catch (err: any) {
      setSimulationError(err?.response?.data?.detail || err.message || "Failed to intercept URL.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="cyber-card cyber-corner-bracket relative overflow-hidden p-8 shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75 cyber-radar-beam" />
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <Globe2 size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wide text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.2)] md:text-3xl">
                  BrowserShield // MV3 RADAR
                </h1>
                <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                  // PRE-NAVIGATION INTERCEPTOR &amp; CHROMIUM EXTENSION ENGINE
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              BrowserShield guards your browsing workflow by vetting hyperlinks before your browser
              loads them. Built with zero-knowledge telemetry, lookalike domain interception, and
              instant safe-browsing warnings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
              Manifest V3 Engine Active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300">
              <Lock size={12} />
              Zero-Knowledge Mode
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cyber-card cyber-corner-bracket p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-[0_0_18px_rgba(52,211,153,0.15)]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">// ENGINE STATE</span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">ONLINE</div>
          <p className="mt-1 text-xs text-slate-400">127.0.0.1:8000 URL Intelligence Gateway</p>
        </div>

        <div className="cyber-card cyber-corner-bracket p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-[0_0_18px_rgba(0,240,255,0.15)]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">// INTERCEPT LATENCY</span>
            <Sparkles size={18} className="text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-white">&lt; 85 ms</div>
          <p className="mt-1 text-xs text-slate-400">Fast local heuristics &amp; multi-signal scan</p>
        </div>

        <div className="cyber-card cyber-corner-bracket p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-[0_0_18px_rgba(139,92,246,0.15)]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">// EXTENSION SUPPORT</span>
            <Layers size={18} className="text-violet-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-violet-300">Chrome &amp; Edge</div>
          <p className="mt-1 text-xs text-slate-400">Brave, Opera, Vivaldi Chromium runtime</p>
        </div>

        <div className="cyber-card cyber-corner-bracket p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-[0_0_18px_rgba(0,240,255,0.15)]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">// SHIELD POLICIES</span>
            <Sliders size={18} className="text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {rules.filter((r) => r.enabled).length} / {rules.length} Active
          </div>
          <p className="mt-1 text-xs text-slate-400">Anti-coercion &amp; spoofing enabled</p>
        </div>
      </div>

      {/* Main Content Grid: Extension Setup & Token Manager */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Extension Setup Guide & JWT Token Card */}
        <div className="space-y-6 lg:col-span-5">
          {/* Extension Quick Install Guide */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1324] p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <Download size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Browser Extension Setup</h3>
                <p className="text-xs text-slate-400">Install in 30 seconds via Chrome Developer Mode</p>
              </div>
            </div>

            <ol className="mt-5 space-y-4 text-xs text-slate-300">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-bold text-cyan-300">
                  1
                </span>
                <div>
                  <span className="font-semibold text-white">Open Extensions Manager:</span>
                  <p className="mt-0.5 text-slate-400">
                    Navigate to <code className="rounded bg-black/40 px-1.5 py-0.5 text-cyan-300">chrome://extensions</code> in your Chromium browser.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-bold text-cyan-300">
                  2
                </span>
                <div>
                  <span className="font-semibold text-white">Toggle Developer Mode:</span>
                  <p className="mt-0.5 text-slate-400">
                    Turn on the <span className="text-white font-medium">Developer mode</span> switch at the top-right corner.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-bold text-cyan-300">
                  3
                </span>
                <div>
                  <span className="font-semibold text-white">Click "Load unpacked":</span>
                  <p className="mt-0.5 text-slate-400">
                    Select the local extension folder included with CyberShield:
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[11px] text-slate-300">
                    <span className="truncate">CyberShield_Realtime_Upgrade\extension</span>
                    <button
                      type="button"
                      onClick={handleCopyPath}
                      className="shrink-0 rounded p-1 text-slate-400 hover:text-cyan-300"
                      title="Copy absolute folder path"
                    >
                      {copiedPath ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-bold text-cyan-300">
                  4
                </span>
                <div>
                  <span className="font-semibold text-white">Paste Authentication Token:</span>
                  <p className="mt-0.5 text-slate-400">
                    Click the CyberShield extension icon, select <span className="text-white font-medium">Extension settings</span>, and paste your JWT token below.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* User Session JWT Token Card */}
          <div className="rounded-2xl border border-cyan-500/20 bg-[#091426] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Active Session Extension Token</h3>
              </div>
              <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                {user?.email || "Authenticated"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              This token authorizes the Chrome extension to query your private CyberShield URL intelligence engine.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">JWT Bearer Token</span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="flex items-center gap-1.5 rounded-md bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  {copiedToken ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Token</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] text-slate-400">
                {token ? `${token.substring(0, 36)}••••••••••••••••••••••••••••••` : "No session token available"}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
              <Info size={14} className="shrink-0 text-cyan-400" />
              <span>Token is stored securely in browser local storage and never exposed publicly.</span>
            </div>
          </div>

          {/* Security Shields Toggles */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1324] p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white">Active Protection Shields</h3>
            <p className="mt-1 text-xs text-slate-400">
              Configure real-time behavioral heuristics executed upon link intercept.
            </p>

            <div className="mt-4 space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => toggleRule(rule.id)}
                  className="flex cursor-pointer items-start justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-cyan-500/30 hover:bg-white/[0.04]"
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{rule.name}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                        {rule.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-tight text-slate-400">{rule.description}</p>
                  </div>
                  <div
                    className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
                      rule.enabled ? "bg-cyan-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                        rule.enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Link Interceptor & Safe Browsing Simulator */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-white/10 bg-[#0a1324] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Live Link Interceptor Simulator</h3>
                  <p className="text-xs text-slate-400">
                    Test how BrowserShield intercepts and neutralizes risky links prior to navigation
                  </p>
                </div>
              </div>
            </div>

            {/* Target Input */}
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Navigation Destination URL
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://example.com/login"
                  className="flex-1 rounded-xl border border-white/10 bg-[#050b14] px-4 py-3 font-mono text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => handleSimulate()}
                  disabled={simulating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  {simulating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Intercepting…</span>
                    </>
                  ) : (
                    <>
                      <Globe2 size={16} />
                      <span>Test Intercept</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quick Test Scenarios
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {presetUrls.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTestUrl(preset.url);
                      handleSimulate(preset.url);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:bg-white/[0.08]"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        preset.type === "CRITICAL"
                          ? "bg-rose-500"
                          : preset.type === "DANGER" || preset.type === "HIGH"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {simulationError && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                <AlertTriangle size={18} className="shrink-0 text-rose-400" />
                <div>
                  <span className="font-bold">Interception Error:</span> {simulationError}
                </div>
              </div>
            )}

            {/* Intercept Result Showcase */}
            {simulationResult && (
              <div className="mt-6 space-y-5">
                {/* Simulated Chrome Browser Warning Banner */}
                {simulationResult.risk_level === "CRITICAL" ||
                simulationResult.risk_level === "HIGH" ||
                (simulationResult.risk_score != null && simulationResult.risk_score >= 60) ? (
                  /* CRITICAL / HIGH WARNING SCREEN */
                  <div className="overflow-hidden rounded-2xl border-2 border-rose-500/60 bg-gradient-to-b from-[#200b12] to-[#0e0508] p-6 shadow-2xl">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40">
                        <ShieldAlert size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
                            ACCESS BLOCKED
                          </span>
                          <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            RISK SCORE: {simulationResult.risk_score}/100
                          </span>
                          <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            CATEGORY: {simulationResult.threat_category || "PHISHING"}
                          </span>
                        </div>

                        <h4 className="mt-2 text-xl font-black text-rose-100">
                          CyberShield Intercepted a Deceptive Destination
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-rose-200/90">
                          BrowserShield prevented this page from loading in your browser. Visiting{" "}
                          <span className="font-mono font-bold underline break-all">
                            {testUrl}
                          </span>{" "}
                          may compromise your financial credentials, OTP tokens, or install unauthorized software.
                        </p>

                        <div className="mt-4 rounded-xl border border-rose-500/20 bg-black/40 p-3 text-xs text-rose-300">
                          <span className="font-bold text-rose-200">Recommended Action:</span>{" "}
                          {simulationResult.analysis_details?.recommendation ||
                            simulationResult.analysis_details?.recommendations?.[0] ||
                            "Immediately close this tab or return to safety. Do not supply passwords, banking PINs, or download attachments."}
                        </div>

                        {/* Interactive Warning Action Buttons */}
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSimulationResult(null);
                              setTestUrl("https://www.onlinesbi.sbi");
                            }}
                            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-rose-500"
                          >
                            <ShieldCheck size={16} />
                            <span>Return to Safety (Recommended)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowBypassWarning(!showBypassWarning)}
                            className="rounded-xl border border-rose-500/40 bg-transparent px-4 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"
                          >
                            Advanced / Details
                          </button>
                        </div>

                        {showBypassWarning && (
                          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
                            <span className="font-bold">Bypass Notice:</span> CyberShield's real-time browser extension
                            actively flags unverified TLS certificates, suspicious domain ages, and known brand impersonation.
                            Proceeding will expose raw network connections to this unverified host.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* LOW / SAFE SCREEN */
                  <div className="overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-[#092015] to-[#040e09] p-6 shadow-2xl">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40">
                        <ShieldCheck size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
                            DESTINATION VERIFIED SAFE
                          </span>
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            RISK SCORE: {simulationResult.risk_score ?? 0}/100
                          </span>
                        </div>

                        <h4 className="mt-2 text-xl font-black text-emerald-100">
                          No Deceptive Indicators Identified
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-emerald-200/90">
                          The destination domain matches verified authenticity parameters. Browser navigation is permitted
                          under standard continuous protection monitoring.
                        </p>

                        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-black/40 p-3 text-xs text-emerald-300">
                          <span className="font-bold text-emerald-200">Guidance:</span> Regular browser hygiene applies. Always
                          ensure the browser lock icon is green and certificate issuer is reputable.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidence Indicators Inspection */}
                <div className="rounded-xl border border-white/10 bg-[#080f1c] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Heuristic Evidence &amp; Detected Tactics
                    </span>
                    <span className="text-xs text-slate-500">
                      {simulationResult.indicators?.length || 0} indicators flagged
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {simulationResult.indicators && simulationResult.indicators.length > 0 ? (
                      simulationResult.indicators.map((ind, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">{ind.name}</span>
                            {ind.description && (
                              <p className="mt-0.5 text-[11px] text-slate-400">{ind.description}</p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                              ind.severity === "HIGH" || ind.severity === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {ind.severity} (+{ind.score})
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 text-center text-xs text-slate-500">
                        No malicious indicators detected for this destination.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
