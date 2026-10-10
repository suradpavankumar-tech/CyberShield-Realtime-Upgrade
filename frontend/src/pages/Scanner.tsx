import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Mail,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Clock3,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  analyzeEmail,
  analyzeMessage,
  analyzeUrl,
} from "../services/analysisService";

import type {
  AnalysisResponse,
  InputType,
} from "../types/analysis";
import RiskFusionBreakdown from "../components/analysis/RiskFusionBreakdown";

type ScannerMode = {
  type: InputType;
  label: string;
  description: string;
  placeholder: string;
  icon: typeof Link2;
};

const modes: ScannerMode[] = [
  {
    type: "URL",
    label: "URL",
    description:
      "Inspect a website address for phishing and malicious URL signals.",
    placeholder:
      "https://example.com/login/verify",
    icon: Link2,
  },
  {
    type: "MESSAGE",
    label: "Message",
    description:
      "Analyze suspicious SMS, chat messages, or social-engineering content.",
    placeholder:
      "Paste the suspicious message you received...",
    icon: FileText,
  },
  {
    type: "EMAIL",
    label: "Email",
    description:
      "Investigate email headers, content, requests, and embedded URLs.",
    placeholder:
      "From: sender@example.com\nTo: you@example.com\nSubject: Urgent account verification\n\nPaste the complete email content here...",
    icon: Mail,
  },
];

function formatCategory(category: string | null) {
  if (!category) {
    return "Unclassified";
  }

  return category
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function getRiskClasses(level: string | null) {
  switch (level) {
    case "CRITICAL":
      return {
        panel: "border-red-500/30 bg-red-500/[0.07]",
        icon: "bg-red-500/15 text-red-200",
        text: "text-red-200",
        badge: "border-red-500/30 bg-red-500/15 text-red-200",
      };

    case "HIGH":
      return {
        panel:
          "border-red-400/20 bg-red-400/[0.045]",
        icon:
          "bg-red-400/10 text-red-300",
        text: "text-red-300",
        badge:
          "border-red-400/20 bg-red-400/10 text-red-300",
      };

    case "MEDIUM":
      return {
        panel:
          "border-amber-400/20 bg-amber-400/[0.045]",
        icon:
          "bg-amber-400/10 text-amber-300",
        text: "text-amber-300",
        badge:
          "border-amber-400/20 bg-amber-400/10 text-amber-300",
      };

    case "LOW":
      return {
        panel:
          "border-emerald-400/20 bg-emerald-400/[0.045]",
        icon:
          "bg-emerald-400/10 text-emerald-300",
        text: "text-emerald-300",
        badge:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      };

    default:
      return {
        panel:
          "border-white/10 bg-white/[0.02]",
        icon:
          "bg-white/[0.05] text-slate-400",
        text: "text-slate-300",
        badge:
          "border-white/10 bg-white/[0.03] text-slate-400",
      };
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300";

    case "FAILED":
      return "border-red-400/15 bg-red-400/[0.05] text-red-300";

    case "PENDING":
      return "border-amber-400/15 bg-amber-400/[0.05] text-amber-300";

    default:
      return "border-white/10 bg-white/[0.03] text-slate-400";
  }
}

function getErrorMessage(error: any) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (
    Array.isArray(detail) &&
    detail.length > 0
  ) {
    return (
      detail[0]?.msg ||
      "The backend rejected this investigation."
    );
  }

  if (
    typeof error?.response?.data?.message ===
    "string"
  ) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return "Unable to complete the investigation.";
}

function Scanner() {
  const navigate = useNavigate();

  const [inputType, setInputType] =
    useState<InputType>("URL");

  const [content, setContent] = useState("");

  const [result, setResult] =
    useState<AnalysisResponse | null>(null);

  const [scanning, setScanning] =
    useState(false);

  const [error, setError] =
    useState("");

  const currentMode = useMemo(
    () =>
      modes.find(
        (mode) => mode.type === inputType,
      ) ?? modes[0],
    [inputType],
  );

  const characterCount = content.length;

  function changeMode(type: InputType) {
    setInputType(type);
    setContent("");
    setResult(null);
    setError("");
  }

  function resetScanner() {
    setContent("");
    setResult(null);
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedContent =
      content.trim();

    if (!trimmedContent) {
      setError(
        `Enter ${inputType.toLowerCase()} content before starting the investigation.`,
      );

      setResult(null);

      return;
    }

    try {
      setScanning(true);
      setError("");
      setResult(null);

      let response: AnalysisResponse;

      if (inputType === "URL") {
        response =
          await analyzeUrl(trimmedContent);
      } else if (inputType === "MESSAGE") {
        response =
          await analyzeMessage(trimmedContent);
      } else {
        response =
          await analyzeEmail(trimmedContent);
      }

      setResult(response);

      /*
       * The backend may return a FAILED analysis
       * as a valid AnalysisResponse.
       *
       * Therefore we do not treat every HTTP 200
       * response as a successful investigation.
       */
      if (
        response.status === "FAILED" &&
        response.error_message
      ) {
        setError(response.error_message);
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setScanning(false);
    }
  }

  const riskClasses = getRiskClasses(
    result?.risk_level ?? null,
  );

  const isFailed =
    result?.status === "FAILED";

  const isPending =
    result?.status === "PENDING";

  const isCompleted =
    result?.status === "COMPLETED";

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              <span className="cyber-beacon-cyan inline-block h-2 w-2 rounded-full bg-cyan-400" />
              // TARGET TRIAGE ENGINE // SECTOR 02 // REAL-TIME FUSION
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.2)] sm:text-4xl">
              Forensic Signal Investigation
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-sm">
              Inspect URLs, messages, and emails through CyberShield&apos;s multi-engine heuristics, WHOIS enrichment, and neural threat fusion.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 font-mono shadow-[0_0_12px_rgba(52,211,153,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
              ENGINES ONLINE // 0-LATENCY
            </span>
          </div>
        </div>

        {/* Investigation mode selector */}
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const active = mode.type === inputType;

            return (
              <button
                key={mode.type}
                type="button"
                onClick={() => changeMode(mode.type)}
                disabled={scanning}
                className={`cyber-card cyber-corner-bracket group relative overflow-hidden p-5 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                  active
                    ? "border-cyan-400/50 bg-cyan-500/[0.08] shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                    : "hover:border-cyan-500/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${
                      active
                        ? "bg-cyan-400/20 text-cyan-300 ring-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                        : "bg-white/[0.04] text-slate-400 ring-white/10"
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  {active && (
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-400/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                      ARMED
                    </span>
                  )}
                </div>

                <h2 className="mt-4 font-mono text-sm font-bold text-white tracking-wide">
                  {mode.label} Vector
                </h2>

                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Workspace */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_390px]">

          {/* Input panel */}
          <div className="cyber-card cyber-corner-bracket relative overflow-hidden">
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent ${
                scanning ? "cyber-radar-beam opacity-100" : "opacity-30"
              }`}
            />

            <div className="border-b border-white/[0.08] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 cyber-beacon-cyan" />
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      // INVESTIGATION INPUT // TARGET BUFFER
                    </p>
                  </div>

                  <h2 className="mt-1 text-lg font-bold text-white tracking-tight">
                    {currentMode.label} Intelligence Payload
                  </h2>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                  <currentMode.icon size={17} />
                </div>
              </div>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                {currentMode.description}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6"
            >
              <label
                htmlFor="scanner-content"
                className="mb-2 block font-mono text-xs font-semibold text-slate-300"
              >
                {inputType === "URL"
                  ? "// SUSPICIOUS URL TARGET"
                  : inputType === "MESSAGE"
                    ? "// SUSPICIOUS MESSAGE CONTENT"
                    : "// RAW EMAIL RFC-822 HEADERS & BODY"}
              </label>

              <textarea
                id="scanner-content"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                disabled={scanning}
                placeholder={
                  currentMode.placeholder
                }
                rows={
                  inputType === "EMAIL"
                    ? 15
                    : 10
                }
                className="w-full resize-y rounded-xl border border-cyan-500/20 bg-[#040812] px-4 py-3.5 font-mono text-xs leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:ring-1 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-500">
                <span>
                  {inputType === "URL"
                    ? "Target must include scheme (http:// or https://)"
                    : inputType === "EMAIL"
                      ? "Include headers (Received, Return-Path, DKIM-Signature) for maximum forensics"
                      : "Paste raw text payload with all character sequences intact"}
                </span>

                <span className="text-cyan-400">
                  {characterCount.toLocaleString()}{" "}
                  chars
                </span>
              </div>

              {/* API / validation error */}
              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.08] p-4 font-mono shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                  <AlertTriangle
                    size={17}
                    className="mt-0.5 shrink-0 text-red-400"
                  />

                  <div>
                    <p className="text-xs font-bold text-red-300">
                      // INVESTIGATION REJECTED / PIPELINE ERROR
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={resetScanner}
                  disabled={
                    scanning ||
                    (!content &&
                      !result &&
                      !error)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={14} />
                  Clear workspace
                </button>

                <button
                  type="submit"
                  disabled={
                    scanning ||
                    !content.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-mono text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition hover:from-cyan-300 hover:to-blue-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {scanning ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                      Evaluating Signals…
                    </>
                  ) : (
                    <>
                      <ScanSearch size={15} />
                      Execute {inputType} Forensics
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Investigation information */}
          <div className="space-y-5">
            <div className="cyber-card cyber-corner-bracket p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/20">
                  <Sparkles size={17} />
                </div>

                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    // ANALYSIS PIPELINE
                  </p>

                  <h3 className="mt-1 text-sm font-bold text-white tracking-tight">
                    Multi-Signal Neural Engine
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Input validation",
                  "Threat intelligence",
                  "Behavioral / NLP analysis",
                  "Risk classification",
                  "Explainable indicators",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[9px] font-bold text-slate-500">
                      {index + 1}
                    </div>

                    <span className="text-xs text-slate-500">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={17}
                  className="text-cyan-300"
                />

                <p className="text-xs font-semibold text-white">
                  Investigation guidance
                </p>
              </div>

              <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-600">
                <li>
                  • Do not open suspicious links before
                  investigating them.
                </li>

                <li>
                  • For emails, provide headers and body
                  content when available.
                </li>

                <li>
                  • Treat the risk score as an analytical
                  signal, not a guarantee of safety.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Real backend result */}
        {result && (
          <div
            className={`mt-5 rounded-2xl border p-5 sm:p-6 ${riskClasses.panel}`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${riskClasses.icon}`}
                >
                  {isFailed ? (
                    <XCircle size={22} />
                  ) : isPending ? (
                    <Clock3 size={22} />
                  ) : result.risk_level ===
                      "CRITICAL" ||
                    result.risk_level ===
                      "HIGH" ||
                    result.risk_level ===
                      "MEDIUM" ? (
                    <ShieldAlert size={22} />
                  ) : (
                    <ShieldCheck size={22} />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {isFailed
                        ? "Investigation failed"
                        : isPending
                          ? "Investigation pending"
                          : "Investigation complete"}
                    </span>

                    <span
                      className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                        result.status,
                      )}`}
                    >
                      {result.status}
                    </span>

                    {result.risk_level && (
                      <span
                        className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${riskClasses.badge}`}
                      >
                        {result.risk_level}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-2 text-xl font-bold text-white">
                    {formatCategory(
                      result.threat_category,
                    )}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Scan #{result.scan_id} •{" "}
                    {result.input_type} investigation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-7">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    Risk score
                  </p>

                  <p
                    className={`mt-1 text-4xl font-bold ${riskClasses.text}`}
                  >
                    {result.risk_score ??
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    Confidence
                  </p>

                  <p className="mt-1 text-2xl font-bold text-white">
                    {result.confidence !==
                    null
                      ? `${result.confidence}%`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {result.verdict && (
              <div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Final assessment
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {result.verdict}
                </p>
                {result.analysis_details?.ml && (
                  <p className="mt-2 text-xs text-slate-500">
                    ML phishing probability: {result.analysis_details.ml.phishing_probability}% — ML is treated as one signal, not the final verdict.
                  </p>
                )}
              </div>
            )}

            <div className="mt-5">
              <RiskFusionBreakdown
                inputType={result.input_type}
                riskScore={result.risk_score}
                riskLevel={result.risk_level}
                verdict={result.verdict}
                analysisDetails={result.analysis_details}
                indicators={result.indicators}
              />
            </div>

            {/* Failed analysis information */}
            {isFailed && (
              <div className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-red-300"
                  />

                  <div>
                    <p className="text-xs font-semibold text-red-300">
                      Backend analysis failure
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {result.error_message ||
                        "The analysis pipeline returned a failed status without an additional error message."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending information */}
            {isPending && (
              <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <Clock3
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-300"
                  />

                  <div>
                    <p className="text-xs font-semibold text-amber-300">
                      Analysis is still pending
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      The backend has not returned a final
                      classification yet. You can open the
                      investigation to inspect its current state.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Result indicators */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
                  Threat category
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatCategory(
                    result.threat_category,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
                  Evidence signals
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {result.indicators.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
                  Scan status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2
                      size={14}
                      className="text-emerald-400"
                    />
                  ) : isFailed ? (
                    <XCircle
                      size={14}
                      className="text-red-300"
                    />
                  ) : (
                    <Clock3
                      size={14}
                      className="text-amber-300"
                    />
                  )}

                  <span className="text-sm font-semibold text-white">
                    {result.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Indicator list */}
            {result.indicators.length > 0 && (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="border-b border-white/[0.06] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Detected intelligence
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Security indicators returned by the analysis backend.
                  </p>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {result.indicators.map(
                    (indicator) => (
                      <div
                        key={indicator.id}
                        className="p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-white">
                                {indicator.name}
                              </span>

                              <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                {indicator.indicator_type}
                              </span>
                            </div>

                            {indicator.description && (
                              <p className="mt-2 text-xs leading-5 text-slate-600">
                                {indicator.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-left sm:text-right">
                            <p className="text-[8px] uppercase tracking-wider text-slate-700">
                              Score
                            </p>

                            <p className="mt-1 text-sm font-bold text-white">
                              {indicator.score}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] text-slate-700">
                          <span>
                            Severity:{" "}
                            {indicator.severity}
                          </span>

                          <span className="h-1 w-1 rounded-full bg-slate-700" />

                          <span>
                            Source:{" "}
                            {indicator.source}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Result actions */}
            <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.06] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetScanner}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                <RotateCcw size={14} />

                New investigation
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/scan/${result.scan_id}`,
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                View full investigation

                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <span>
            CyberShield Threat Intelligence
          </span>

          <span>
            Real-time analysis • FastAPI backend
          </span>
        </div>
      </div>
    </section>
  );
}

export default Scanner;