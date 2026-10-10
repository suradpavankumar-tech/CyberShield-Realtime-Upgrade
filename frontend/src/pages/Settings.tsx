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
  Download,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Webhook,
  Send,
  Radio,
  FileText,
  MessageSquare,
  Zap,
  Code,
  AlertTriangle,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useSettings, type AppSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import {
  testAlertChannel,
  getRecentAlertLogs,
  getAlertTemplates,
  type AlertAuditLogItem,
  type TestAlertResponse,
} from "../services/securityModules";

type SettingsTab = "engines" | "privacy" | "alerts" | "api" | "interface" | "compliance";
type AlertChannelType = "slack" | "discord" | "telegram" | "generic";

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("engines");
  const [localSaved, setLocalSaved] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Webhook & Alert Hub state
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<AlertChannelType>("slack");
  const [testSeverity, setTestSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM">("CRITICAL");
  const [testResult, setTestResult] = useState<TestAlertResponse | null>(null);
  const [recentAlertLogs, setRecentAlertLogs] = useState<AlertAuditLogItem[]>([]);
  const [loadingRecentLogs, setLoadingRecentLogs] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templatesData, setTemplatesData] = useState<Record<string, any> | null>(null);
  const [templateViewChannel, setTemplateViewChannel] = useState<AlertChannelType>("slack");
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  useEffect(() => {
    if (!saved) return;
    setLocalSaved(true);
    const timer = window.setTimeout(() => setLocalSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    if (activeTab === "alerts") {
      loadRecentLogs();
    }
  }, [activeTab]);

  async function loadRecentLogs() {
    setLoadingRecentLogs(true);
    try {
      const res = await getRecentAlertLogs();
      setRecentAlertLogs(res.logs || []);
    } catch {
      // ignore
    } finally {
      setLoadingRecentLogs(false);
    }
  }

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
    downloadAnchor.setAttribute("download", "cybershield-security-policy.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  async function handleTestWebhook() {
    if (selectedChannel === "telegram") {
      if (!settings.telegramBotToken.trim() || !settings.telegramChatId.trim()) {
        setWebhookStatus("Both Telegram Bot Token and Chat ID are required.");
        return;
      }
    } else {
      if (!settings.webhookUrl.trim()) {
        setWebhookStatus(`Please configure a ${selectedChannel.toUpperCase()} webhook endpoint URL first.`);
        return;
      }
    }

    setTestingWebhook(true);
    setWebhookStatus(null);
    setTestResult(null);

    try {
      const res = await testAlertChannel({
        channel_type: selectedChannel,
        webhook_url: settings.webhookUrl,
        telegram_bot_token: settings.telegramBotToken,
        telegram_chat_id: settings.telegramChatId,
        severity: testSeverity,
      });
      setTestResult(res);
      setWebhookStatus(
        res.delivered
          ? `Delivered (${res.mode === "SIMULATED_TEST" ? "Simulated Test" : `HTTP ${res.status_code || 200}`} in ${res.latency_ms}ms)`
          : `Delivery Failed: ${res.message}`
      );
      loadRecentLogs();
    } catch (err: any) {
      setWebhookStatus(err?.response?.data?.detail || err.message || "Failed to dispatch test alert.");
    } finally {
      setTestingWebhook(false);
    }
  }

  async function handleOpenTemplates() {
    setShowTemplateModal(true);
    if (!templatesData) {
      try {
        const data = await getAlertTemplates();
        setTemplatesData(data);
      } catch {
        // ignore
      }
    }
  }

  function handleCopyTemplate() {
    if (!templatesData || !templatesData[templateViewChannel]) return;
    navigator.clipboard.writeText(JSON.stringify(templatesData[templateViewChannel], null, 2));
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  }

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: "engines", label: "Detection Engines", icon: Shield },
    { id: "privacy", label: "Zero-Trust Privacy", icon: Lock },
    { id: "alerts", label: "Alert Routing & Webhooks", icon: Bell },
    { id: "api", label: "API & Extensions", icon: Globe2 },
    { id: "interface", label: "Analyst Interface", icon: MonitorCog },
    { id: "compliance", label: "Backup & Compliance", icon: FileText },
  ];

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1250px] space-y-7">
        {/* Executive Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <SlidersHorizontal size={15} />
              Enterprise Security Orchestration
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Platform &amp; Engine Settings
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Configure heuristic engine sensitivity, zero-knowledge telemetry, SOC webhook alerts, and Chromium bridge controls.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {localSaved && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Policies Applied
              </span>
            )}
            <button
              type="button"
              onClick={saveSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
            >
              <CheckCircle2 size={14} />
              <span>Apply Changes</span>
            </button>
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
            TAB 1: DETECTION ENGINES
        ================================================== */}
        {activeTab === "engines" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Heuristic Threat Sensitivity</h3>
                  <p className="text-xs text-slate-400">
                    Defines the threshold for classifying evasive phishing, punycode lookalikes, and zero-day lures
                  </p>
                </div>
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  ACTIVE: {settings.threatSensitivity}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    id: "STANDARD",
                    title: "Standard (Balanced)",
                    desc: "Optimal for general web navigation. Emphasizes confirmed feeds and minimal false positives.",
                  },
                  {
                    id: "AGGRESSIVE",
                    title: "Aggressive (Recommended)",
                    desc: "Flags young domains (< 14 days), unverified SSL issuers, and suspicious SMS payment intents.",
                  },
                  {
                    id: "ZERO_TRUST",
                    title: "Zero-Trust Enterprise",
                    desc: "Blocks unauthenticated domains, deep redirect chains, and requires strict SPF/DMARC.",
                  },
                ].map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => updateSetting("threatSensitivity", tier.id as any)}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      settings.threatSensitivity === tier.id
                        ? "border-cyan-400/50 bg-cyan-400/[0.08] ring-1 ring-cyan-400/30"
                        : "border-white/5 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tier.title}</span>
                      <Radio
                        size={14}
                        className={settings.threatSensitivity === tier.id ? "text-cyan-400" : "text-slate-600"}
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{tier.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Engine Toggles */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] divide-y divide-white/[0.05] shadow-xl">
              <div className="p-6">
                <h3 className="text-base font-bold text-white">Continuous Heuristic Shields</h3>
                <p className="text-xs text-slate-400">Active behavioral filters applied in real-time scans</p>
              </div>

              {/* Pre-Flight Phishing */}
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">Pre-Flight Phishing Interception</p>
                    <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                      CORE DEFENSE
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                    Calculates domain reputation, lexical entropy, and detects credential phishing patterns
                    prior to browser navigation.
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
                    Identifies Cyrillic and unicode character lookalikes designed to impersonate Indian banks
                    (e.g., State Bank of India, HDFC, ICICI).
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

              {/* Anti-Cloaking Redirect */}
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">Anti-Cloaking Redirect Unpacker</p>
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                      ANTI-EVASION
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                    Traces multi-hop URL shorteners (bit.ly, t.co, tinyurl) to expose the ultimate destination host
                    before the client establishes TCP sessions.
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
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 2: ZERO-TRUST PRIVACY
        ================================================== */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Zero-Knowledge Telemetry &amp; Privacy</h3>
                  <p className="text-xs text-slate-400">Protect client anonymity and sensitive token payload data</p>
                </div>
              </div>

              <div className="mt-6 divide-y divide-white/[0.05]">
                {/* Zero-Knowledge Query Telemetry */}
                <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Zero-Knowledge Query Telemetry</p>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                      Strips query parameters, tracking tokens, and session identifiers from URLs prior to querying
                      external intelligence repositories.
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

                {/* Data Retention */}
                <div className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Scan Record Retention Policy</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Specify how long past forensic scans and indicators persist in database storage
                      </p>
                    </div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                      {settings.dataRetention}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {[
                      { id: "30_DAYS", label: "30 Days" },
                      { id: "90_DAYS", label: "90 Days (Default)" },
                      { id: "1_YEAR", label: "1 Year" },
                      { id: "INDEFINITE", label: "Indefinite" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateSetting("dataRetention", item.id as any)}
                        className={`rounded-xl border p-3 text-xs font-semibold transition ${
                          settings.dataRetention === item.id
                            ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                            : "border-white/5 bg-white/[0.02] text-slate-400 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 3: REAL-TIME ALERTS & WEBHOOK DISPATCHER
        ================================================== */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            {/* Main Alert Channel Configuration Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                    <Webhook size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">SOC Incident Alert Routing Hub</h3>
                      <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                        REAL-TIME
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Instantly broadcast high-risk findings to Slack, Discord, Telegram, or custom SIEM pipelines
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenTemplates}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                >
                  <Code size={13} className="text-cyan-400" />
                  <span>Payload Schemas</span>
                </button>
              </div>

              {/* Channel Selector Pills */}
              <div className="mt-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Alert Destination Channel
                </label>
                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: "slack", label: "Slack Webhook", icon: MessageSquare, badge: "BLOCKS" },
                    { id: "discord", label: "Discord Channel", icon: Zap, badge: "EMBEDS" },
                    { id: "telegram", label: "Telegram Bot", icon: Send, badge: "BOT API" },
                    { id: "generic", label: "Generic JSON / SIEM", icon: Globe2, badge: "REST" },
                  ].map((channel) => {
                    const Icon = channel.icon;
                    const isSelected = selectedChannel === channel.id;
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => {
                          setSelectedChannel(channel.id as AlertChannelType);
                          setTestResult(null);
                          setWebhookStatus(null);
                        }}
                        className={`flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition ${
                          isSelected
                            ? "border-cyan-400/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                            : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <Icon size={16} className={isSelected ? "text-cyan-400" : "text-slate-400"} />
                          <span
                            className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                              isSelected ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-slate-500"
                            }`}
                          >
                            {channel.badge}
                          </span>
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                          {channel.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Channel Input Form */}
              <div className="mt-6 rounded-xl border border-white/5 bg-[#050b14] p-4 sm:p-5">
                {selectedChannel === "telegram" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">Telegram Bot Configuration</span>
                      <span className="text-[10px] text-cyan-400">Direct Bot API Dispatch</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">Telegram Bot Token</label>
                      <input
                        type="password"
                        value={settings.telegramBotToken}
                        onChange={(e) => updateSetting("telegramBotToken", e.target.value)}
                        placeholder="bot123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#08101d] px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">Target Chat ID or Channel Handle</label>
                      <input
                        type="text"
                        value={settings.telegramChatId}
                        onChange={(e) => updateSetting("telegramChatId", e.target.value)}
                        placeholder="@SOC_Threat_Feed or -100192837465"
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#08101d] px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                      />
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        Create a bot via @BotFather, paste the token above, and grant it posting permissions in your group/channel.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {selectedChannel === "slack"
                          ? "Slack Incoming Webhook URL"
                          : selectedChannel === "discord"
                          ? "Discord Channel Webhook URL"
                          : "REST / SIEM Webhook Endpoint"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">POST JSON</span>
                    </div>

                    <input
                      type="url"
                      value={settings.webhookUrl}
                      onChange={(e) => updateSetting("webhookUrl", e.target.value)}
                      placeholder={
                        selectedChannel === "slack"
                          ? "https://slack.example.com/api/webhook-inbox"
                          : selectedChannel === "discord"
                          ? "https://discord.example.com/api/webhooks/channel-inbox"
                          : "https://siem.corp.internal/api/v1/cyber-events"
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#08101d] px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                    />

                    {/* Quick Preset Presets */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span>Quick Test URL:</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSetting(
                            "webhookUrl",
                            selectedChannel === "slack"
                              ? "https://test-webhook.example.com/slack"
                              : selectedChannel === "discord"
                              ? "https://test-webhook.example.com/discord"
                              : "https://test-webhook.example.com/alerts"
                          )
                        }
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 hover:bg-white/10"
                      >
                        Load Sandbox Demo Endpoint
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Severity Threshold */}
              <div className="mt-6 border-t border-white/[0.05] pt-5">
                <label className="text-xs font-semibold text-slate-300">Automated Dispatch Severity Threshold</label>
                <p className="mt-0.5 text-xs text-slate-400">
                  Scans meeting or exceeding this severity level will trigger automatic background dispatch
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {[
                    { id: "CRITICAL_ONLY", label: "Critical Only (Score 85+)" },
                    { id: "HIGH_AND_CRITICAL", label: "High & Critical (Score 70+) [Standard]" },
                    { id: "ALL", label: "All Flagged Signals (Score 40+)" },
                  ].map((thresh) => (
                    <button
                      key={thresh.id}
                      type="button"
                      onClick={() => updateSetting("alertThreshold", thresh.id as any)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        settings.alertThreshold === thresh.id
                          ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                          : "border-white/5 bg-white/[0.02] text-slate-400 hover:text-white"
                      }`}
                    >
                      {thresh.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Dispatch Sandbox & Verification */}
              <div className="mt-6 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Live Dispatch Verification
                    </h4>
                    <p className="text-xs text-slate-400">
                      Send an immediate test alert to verify connectivity, firewall traversal, and formatting
                    </p>
                  </div>

                  {/* Test Severity selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Severity:</span>
                    {(["CRITICAL", "HIGH", "MEDIUM"] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setTestSeverity(sev)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                          testSeverity === sev
                            ? sev === "CRITICAL"
                              ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
                              : sev === "HIGH"
                              ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                              : "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {sev}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook}
                      className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition hover:bg-cyan-300 disabled:opacity-50"
                    >
                      {testingWebhook ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>{testingWebhook ? "Dispatching..." : "Send Test Alert"}</span>
                    </button>
                  </div>
                </div>

                {/* Test Feedback Banner */}
                {webhookStatus && (
                  <div
                    className={`mt-4 flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                      testResult?.delivered
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/30 bg-red-500/10 text-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult?.delivered ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-400" />
                      )}
                      <span>{webhookStatus}</span>
                    </div>

                    {testResult && (
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                          {testResult.latency_ms}ms
                        </span>
                        <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase text-cyan-300">
                          {testResult.mode}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dispatched Payload Accordion Preview */}
                {testResult?.payload && (
                  <div className="mt-4 rounded-xl border border-white/5 bg-[#040811] p-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">DISPATCHED {testResult.channel_type} PAYLOAD:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(testResult.payload, null, 2));
                        }}
                        className="flex items-center gap-1 hover:text-cyan-300"
                      >
                        <Copy size={11} />
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="mt-2 max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-slate-300">
                      {JSON.stringify(testResult.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Audio warning toggle */}
              <div className="mt-6 flex items-center justify-between border-t border-white/[0.05] pt-4">
                <div>
                  <p className="text-sm font-semibold text-white">Audio Warning Ping</p>
                  <p className="mt-1 text-xs text-slate-400">Play an audible chime when high or critical findings occur</p>
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
            </div>

            {/* Recent Dispatched Alert Audit Trail Table */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent SOC Alert Dispatch Audit</h3>
                  <p className="text-xs text-slate-400">Telemetry logs of recent real-time alerts sent across channels</p>
                </div>
                <button
                  type="button"
                  onClick={loadRecentLogs}
                  disabled={loadingRecentLogs}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw size={12} className={loadingRecentLogs ? "animate-spin text-cyan-400" : ""} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase text-slate-500">
                      <th className="pb-2.5">Time (UTC)</th>
                      <th className="pb-2.5">Channel</th>
                      <th className="pb-2.5">Destination</th>
                      <th className="pb-2.5">Severity</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {recentAlertLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                          No recent alert notifications dispatched yet. Use "Send Test Alert" above to verify.
                        </td>
                      </tr>
                    ) : (
                      recentAlertLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 font-bold text-white">
                            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">
                              {log.channel_type}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400 max-w-[200px] truncate" title={log.destination}>
                            {log.destination}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                log.severity === "CRITICAL"
                                  ? "bg-red-500/10 text-red-400"
                                  : log.severity === "HIGH"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-emerald-500/10 text-emerald-400"
                              }`}
                            >
                              {log.severity}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                log.status === "DELIVERED"
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-red-500/10 text-red-300"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400">{log.latency_ms}ms</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 4: API & EXTENSIONS
        ================================================== */}
        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-500/20 bg-[#091426] p-6 shadow-xl">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                    <Globe2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Browser Extension Bridge</h3>
                    <p className="text-xs text-slate-400">Chromium Manifest V3 local API gateway status</p>
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

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Local API Gateway</span>
                  <p className="mt-1 font-mono text-cyan-300">http://127.0.0.1:8000/api/v1</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Manifest Engine</span>
                  <p className="mt-1 font-mono text-emerald-400">Chrome MV3 (CyberShield URL Guard v0.1.0)</p>
                </div>
              </div>
            </div>

            {/* External Threat Lookup Fallback */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">External Threat Feeds Fallback</h3>
                  <p className="text-xs text-slate-400">
                    Query public community threat intelligence when offline models require corroboration
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.externalLookupEnabled}
                  onClick={() => handleToggle("externalLookupEnabled")}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    settings.externalLookupEnabled ? "bg-cyan-400" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      settings.externalLookupEnabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 5: ANALYST INTERFACE
        ================================================== */}
        {activeTab === "interface" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-xl divide-y divide-white/[0.05]">
              <div className="pb-4">
                <h3 className="text-base font-bold text-white">Analyst Display Preferences</h3>
                <p className="text-xs text-slate-400">Configure layout density and automatic feed refresh</p>
              </div>

              {/* Auto Refresh */}
              <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Automatic Intelligence Feed Refresh</p>
                  <p className="mt-1 max-w-xl text-xs text-slate-400">
                    Periodically polls ThreatPulse live radar and scan dashboard in the background.
                  </p>
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

              {/* Compact Interface */}
              <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Compact Analyst Layout</p>
                  <p className="mt-1 max-w-xl text-xs text-slate-400">
                    Tightens padding and table rows for high-density multi-monitor workstations.
                  </p>
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
        )}

        {/* ==================================================
            TAB 6: BACKUP & COMPLIANCE
        ================================================== */}
        {activeTab === "compliance" && (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Export Settings */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                  <Download size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Export Policy JSON</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Export a cryptographic JSON backup of your current policies.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportSettings}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Download size={14} />
                <span>Download Policy JSON</span>
              </button>
            </div>

            {/* Reset Defaults */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  <RotateCcw size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Restore Standard Defaults</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Revert all detection heuristics back to balanced values.
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
                  <p className="text-sm font-semibold text-white">Clear Local Storage</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Purge browser local preferences. Backend investigation records remain intact.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearApplicationData}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.04] px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-400/[0.08]"
              >
                <Trash2 size={14} />
                <span>Purge Local Cache</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-white/[0.05] pt-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>CyberShield 2.0 Security Operations Policy Engine</span>
          <span>Zero-Knowledge Telemetry &bull; Certified Defenses</span>
        </div>
      </div>

      {/* Payload Schema & Integration Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#091322] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Code size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Alert Payload &amp; Webhook Integration Specs</h3>
                  <p className="text-[11px] text-slate-400">JSON structures sent to your incident receivers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sub-channel switcher */}
            <div className="mt-4 flex gap-1.5 rounded-xl border border-white/5 bg-[#050b14] p-1">
              {(["slack", "discord", "telegram", "generic"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setTemplateViewChannel(ch)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold uppercase transition ${
                    templateViewChannel === ch
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Code display */}
            <div className="relative mt-4">
              <pre className="max-h-80 overflow-auto rounded-xl border border-white/5 bg-[#040810] p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                {templatesData && templatesData[templateViewChannel]
                  ? JSON.stringify(templatesData[templateViewChannel], null, 2)
                  : "Loading templates from CyberShield API..."}
              </pre>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {copiedTemplate ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedTemplate ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}