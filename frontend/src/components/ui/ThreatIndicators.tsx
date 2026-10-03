import {
  AlertTriangle,
  ExternalLink,
  Info,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import type { ThreatIndicator } from "../../types/analysis";

interface ThreatIndicatorsProps {
  indicators: ThreatIndicator[];
}

interface SeverityConfig {
  label: string;
  textClass: string;
  borderClass: string;
  backgroundClass: string;
  iconBackgroundClass: string;
  icon: typeof ShieldAlert;
}

function getSeverityConfig(
  severity: string | null | undefined,
): SeverityConfig {
  const normalized = String(
    severity ?? "",
  )
    .trim()
    .toUpperCase();

  if (
    normalized === "CRITICAL" ||
    normalized === "HIGH"
  ) {
    return {
      label:
        normalized === "CRITICAL"
          ? "Critical"
          : "High",
      textClass: "text-red-300",
      borderClass: "border-red-400/15",
      backgroundClass: "bg-red-400/[0.035]",
      iconBackgroundClass: "bg-red-400/10",
      icon: ShieldAlert,
    };
  }

  if (
    normalized === "MEDIUM" ||
    normalized === "MODERATE"
  ) {
    return {
      label: "Medium",
      textClass: "text-amber-300",
      borderClass: "border-amber-400/15",
      backgroundClass: "bg-amber-400/[0.035]",
      iconBackgroundClass: "bg-amber-400/10",
      icon: AlertTriangle,
    };
  }

  if (
    normalized === "LOW" ||
    normalized === "INFO" ||
    normalized === "INFORMATIONAL"
  ) {
    return {
      label:
        normalized === "INFO" ||
        normalized === "INFORMATIONAL"
          ? "Informational"
          : "Low",
      textClass: "text-emerald-300",
      borderClass: "border-emerald-400/15",
      backgroundClass: "bg-emerald-400/[0.035]",
      iconBackgroundClass: "bg-emerald-400/10",
      icon: ShieldCheck,
    };
  }

  return {
    label: severity?.trim() || "Unknown",
    textClass: "text-slate-300",
    borderClass: "border-white/10",
    backgroundClass: "bg-white/[0.02]",
    iconBackgroundClass: "bg-white/[0.04]",
    icon: Info,
  };
}

function formatValue(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatScore(score: number | null | undefined) {
  if (
    score === null ||
    score === undefined ||
    !Number.isFinite(score)
  ) {
    return "—";
  }

  return Number.isInteger(score)
    ? String(score)
    : score.toFixed(2);
}

function ThreatIndicators({
  indicators,
}: ThreatIndicatorsProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220]">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Threat intelligence
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Threat indicators
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
              Security indicators returned by the CyberShield
              analysis pipeline for this investigation.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] px-3 py-2">
            <span className="text-sm font-bold text-cyan-300">
              {indicators.length}
            </span>

            <span className="ml-1.5 text-[9px] font-medium uppercase tracking-wider text-slate-600">
              detected
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}
      {indicators.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <ShieldCheck size={24} />
            </div>

            <h3 className="mt-5 text-sm font-semibold text-white">
              No threat indicators detected
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              The analysis response did not contain any
              threat indicators for this investigation.
            </p>
          </div>
        </div>
      ) : (
        /* ===================================================
           INDICATOR LIST
        =================================================== */
        <div className="divide-y divide-white/[0.05]">
          {indicators.map((indicator, index) => {
            const severity = getSeverityConfig(
              indicator.severity,
            );

            const SeverityIcon = severity.icon;

            return (
              <article
                key={`${indicator.id}-${index}`}
                className={`p-5 transition hover:bg-white/[0.018] sm:p-6 ${severity.backgroundClass}`}
              >
                {/* =================================================
                    TITLE ROW
                ================================================= */}
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${severity.iconBackgroundClass} ${severity.textClass}`}
                  >
                    <SeverityIcon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-700">
                        Indicator {index + 1}
                      </span>

                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${severity.borderClass} ${severity.textClass}`}
                      >
                        {severity.label}
                      </span>
                    </div>

                    <h3 className="mt-1 text-sm font-semibold text-white">
                      {indicator.name ||
                        "Unnamed indicator"}
                    </h3>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 text-right">
                    <p className="text-[8px] uppercase tracking-wider text-slate-700">
                      Score
                    </p>

                    <p
                      className={`mt-0.5 text-lg font-bold ${severity.textClass}`}
                    >
                      {formatScore(indicator.score)}
                    </p>
                  </div>
                </div>

                {/* =================================================
                    CORE METADATA
                ================================================= */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                      Indicator type
                    </p>

                    <p className="mt-1.5 text-xs font-semibold text-slate-300">
                      {formatValue(
                        indicator.indicator_type,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                      Intelligence source
                    </p>

                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <ShieldCheck
                        size={13}
                        className="shrink-0 text-cyan-300"
                      />

                      {indicator.source ||
                        "Internal analysis"}
                    </p>
                  </div>
                </div>

                {/* =================================================
                    DESCRIPTION
                ================================================= */}
                {indicator.description && (
                  <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-start gap-2.5">
                      <Info
                        size={14}
                        className="mt-0.5 shrink-0 text-slate-600"
                      />

                      <div className="min-w-0">
                        <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                          Indicator details
                        </p>

                        <p className="mt-1.5 text-xs leading-5 text-slate-500">
                          {indicator.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* =================================================
                    SOURCE + ID
                ================================================= */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
                  <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-700">
                    <span>
                      Indicator #{indicator.id}
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-700" />

                    <span>
                      {formatValue(
                        indicator.indicator_type,
                      )}
                    </span>
                  </div>

                  {indicator.source && (
                    <div className="inline-flex items-center gap-1.5 text-[9px] text-slate-600">
                      <ExternalLink size={11} />

                      <span className="max-w-[220px] truncate">
                        {indicator.source}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ThreatIndicators;