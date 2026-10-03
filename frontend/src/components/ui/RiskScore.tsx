import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShieldAlert,
} from "lucide-react";

import type { RiskLevel } from "../../types/analysis";

interface RiskScoreProps {
  score: number | null;
  level: RiskLevel | null;
  confidence: number | null;
}

function getRiskConfig(level: RiskLevel | null) {
  switch (level) {
    case "HIGH":
      return {
        label: "High Risk",
        description:
          "The analysis identified signals associated with a potentially malicious or dangerous input.",
        icon: ShieldAlert,
        scoreClass: "text-red-300",
        iconClass: "text-red-300",
        iconBackground: "bg-red-400/10",
        borderClass: "border-red-400/15",
        barClass: "bg-red-400",
        trackClass: "bg-red-400/10",
      };

    case "MEDIUM":
      return {
        label: "Medium Risk",
        description:
          "The analysis identified suspicious characteristics that require additional attention.",
        icon: AlertTriangle,
        scoreClass: "text-amber-300",
        iconClass: "text-amber-300",
        iconBackground: "bg-amber-400/10",
        borderClass: "border-amber-400/15",
        barClass: "bg-amber-400",
        trackClass: "bg-amber-400/10",
      };

    case "LOW":
      return {
        label: "Low Risk",
        description:
          "No significant malicious indicators were identified by the analysis pipeline.",
        icon: CheckCircle2,
        scoreClass: "text-emerald-300",
        iconClass: "text-emerald-300",
        iconBackground: "bg-emerald-400/10",
        borderClass: "border-emerald-400/15",
        barClass: "bg-emerald-400",
        trackClass: "bg-emerald-400/10",
      };

    default:
      return {
        label: "Not Classified",
        description:
          "A final risk classification is not currently available for this investigation.",
        icon: Shield,
        scoreClass: "text-slate-400",
        iconClass: "text-slate-400",
        iconBackground: "bg-white/[0.04]",
        borderClass: "border-white/10",
        barClass: "bg-slate-500",
        trackClass: "bg-white/[0.05]",
      };
  }
}

function clampScore(score: number | null) {
  if (score === null || !Number.isFinite(score)) {
    return 0;
  }

  return Math.min(100, Math.max(0, score));
}

function formatScore(score: number | null) {
  if (score === null || !Number.isFinite(score)) {
    return "—";
  }

  return Number.isInteger(score)
    ? String(score)
    : score.toFixed(2);
}

function RiskScore({
  score,
  level,
  confidence,
}: RiskScoreProps) {
  const config = getRiskConfig(level);
  const Icon = config.icon;

  const normalizedScore = clampScore(score);
  const normalizedConfidence =
    confidence === null ||
    !Number.isFinite(confidence)
      ? null
      : Math.min(100, Math.max(0, confidence));

  return (
    <div
      className={`rounded-2xl border ${config.borderClass} bg-[#0a1220] p-5 sm:p-6`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Security assessment
          </p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Risk score
          </h2>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.iconBackground} ${config.iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>

      {/* Score */}
      <div className="mt-7 flex items-end gap-3">
        <span
          className={`text-5xl font-bold tracking-tight ${config.scoreClass}`}
        >
          {formatScore(score)}
        </span>

        {score !== null && (
          <span className="mb-1.5 text-xs text-slate-600">
            / 100
          </span>
        )}
      </div>

      {/* Risk classification */}
      <div className="mt-4">
        <div
          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${config.borderClass} ${config.iconClass} ${config.iconBackground}`}
        >
          {config.label}
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider">
          <span className="text-slate-600">
            Risk intensity
          </span>

          <span className={config.scoreClass}>
            {score !== null
              ? `${Math.round(normalizedScore)}%`
              : "Unavailable"}
          </span>
        </div>

        <div
          className={`mt-2 h-2 overflow-hidden rounded-full ${config.trackClass}`}
        >
          <div
            className={`h-full rounded-full ${config.barClass} transition-all duration-500`}
            style={{
              width: `${normalizedScore}%`,
            }}
          />
        </div>
      </div>

      {/* Confidence */}
      <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Model confidence
          </span>

          <span className="text-sm font-bold text-cyan-300">
            {normalizedConfidence !== null
              ? `${normalizedConfidence}%`
              : "—"}
          </span>
        </div>

        {normalizedConfidence !== null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-500"
              style={{
                width: `${normalizedConfidence}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="mt-5 border-t border-white/[0.05] pt-4">
        <p className="text-xs leading-5 text-slate-600">
          {config.description}
        </p>
      </div>
    </div>
  );
}

export default RiskScore;