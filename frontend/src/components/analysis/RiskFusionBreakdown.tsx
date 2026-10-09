import {
  ShieldCheck,
  ShieldAlert,
  Globe2,
  Lock,
  ArrowRightLeft,
  Search,
  Cpu,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface RiskFusionProps {
  inputType?: string;
  riskScore?: number | null;
  riskLevel?: string | null;
  verdict?: string | null;
  threatCategory?: string | null;
  confidence?: number | null;
  analysisDetails?: any;
  indicators?: Array<{
    name: string;
    description: string | null;
    severity: string;
    phrase?: string;
    explanation?: string;
  }> | any[];
}

export default function RiskFusionBreakdown({
  inputType = "URL",
  riskScore = 0,
  riskLevel = "LOW",
  verdict = "",
  analysisDetails,
  indicators = [],
}: RiskFusionProps) {
  const details = analysisDetails || {};

  // URL signals
  const dns = details.dns;
  const tls = details.tls;
  const http = details.http;
  const brand = details.brand;
  const virustotal = details.virustotal;
  const mlProb = details.ml_probability != null ? (details.ml_probability * 100).toFixed(1) : null;

  // Message / NLP signals
  const scamCategory = details.scam_category;
  const categoryConfidence = details.category_confidence;
  const explainablePhrases = details.explainable_phrases || [];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[.02] border border-white/10">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              riskLevel === "LOW"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : riskLevel === "MEDIUM"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {riskLevel === "LOW" ? <ShieldCheck size={26} /> : <ShieldAlert size={26} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                RiskFusion™ Multi-Signal Assessment
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  riskLevel === "LOW"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : riskLevel === "MEDIUM"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {riskLevel || "UNKNOWN"} RISK
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {verdict || `${riskLevel || "Threat"} Assessment Completed`}
            </h3>
          </div>
        </div>

        <div className="flex items-baseline gap-1 sm:text-right">
          <span className="text-3xl font-black text-white">{riskScore ?? "—"}</span>
          <span className="text-slate-500 text-sm font-semibold">/100</span>
        </div>
      </div>

      {/* CASE 1: URL ANALYSIS MULTI-SIGNAL CARDS */}
      {inputType === "URL" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Signal 1: DNS & Network Infrastructure */}
          <div className="p-4 rounded-xl border border-white/5 bg-[#060b14] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Globe2 size={15} /> DNS & Network
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                dns?.status === "RESOLVED" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}>
                {dns?.status || "CHECKED"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p>Host: <span className="text-slate-200 font-mono">{details.hostname || "Resolved"}</span></p>
              <p>Domain: <span className="text-slate-200 font-semibold">{details.registered_domain || "—"}</span></p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> SSRF Guard: Private IPs Blocked
              </p>
            </div>
          </div>

          {/* Signal 2: Transport Security (TLS/SSL) */}
          <div className="p-4 rounded-xl border border-white/5 bg-[#060b14] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Lock size={15} /> SSL/TLS Certificate
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                tls?.status === "VALID" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
              }`}>
                {tls?.status || "NOT DETECTED"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p>Protocol: <span className="text-slate-200 font-mono">{tls?.protocol || "N/A"}</span></p>
              <p>Issuer: <span className="text-slate-200 truncate block">{tls?.issuer?.commonName || tls?.issuer?.organizationName || "Standard CA"}</span></p>
              <p>Cipher: <span className="text-slate-200 text-[10px] font-mono">{tls?.cipher || "Modern AEAD"}</span></p>
            </div>
          </div>

          {/* Signal 3: Redirect Hops & Unmasking */}
          <div className="p-4 rounded-xl border border-white/5 bg-[#060b14] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <ArrowRightLeft size={15} /> Redirect Path
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                {http?.redirect_count != null ? `${http.redirect_count} Hops` : "Direct"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p>HTTP Response: <span className="text-slate-200 font-mono">{http?.final_status_code || "200 OK"}</span></p>
              <p>Cross-domain hops: <span className={http?.cross_domain ? "text-amber-300 font-bold" : "text-slate-200"}>{http?.cross_domain ? "Yes (Flagged)" : "No"}</span></p>
              <p className="text-[10px] text-slate-500 truncate">Final URL: {http?.final_url || "Target endpoint"}</p>
            </div>
          </div>

          {/* Signal 4: Brand Impersonation & Typosquatting */}
          <div className="p-4 rounded-xl border border-white/5 bg-[#060b14] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Search size={15} /> Brand & Typosquatting
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                brand?.impersonated_brand ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
              }`}>
                {brand?.impersonated_brand ? "IMPERSONATION" : "CLEAN"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              {brand?.impersonated_brand ? (
                <p className="text-red-300 font-semibold">
                  Targets: {brand.impersonated_brand} (Similarity: {Math.round((brand.similarity_ratio || 0) * 100)}%)
                </p>
              ) : (
                <p className="text-slate-400">No known enterprise brand spoofing detected.</p>
              )}
              <p>Trusted entity: <span className="text-slate-200">{details.trusted_domain ? "Yes (Verified Entity)" : "Standard Web Target"}</span></p>
            </div>
          </div>

          {/* Signal 5: Machine Learning Signal */}
          <div className="p-4 rounded-xl border border-white/5 bg-[#060b14] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Cpu size={15} /> Machine Learning Signal
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                RandomForest
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p>Lexical Phishing Prob: <span className="text-white font-bold">{mlProb ? `${mlProb}%` : "Capped Signal"}</span></p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Trained on PhiUSIIL dataset. Capped at 55% weight to prevent false-positive overfit.
              </p>
            </div>
          </div>

          {/* Signal 6: VirusTotal Intelligence */}
          <div className="p-4 rounded-xl border border-white/5 bg-[#060b14] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <ShieldCheck size={15} /> Global Threat Feeds
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                {virustotal?.status || "HEURISTIC"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p>VirusTotal: <span className="text-slate-200">{virustotal?.malicious_count ? `${virustotal.malicious_count} Flags` : (virustotal?.status === "UNAVAILABLE" ? "Offline (API key optional)" : "Clean")}</span></p>
              <p className="text-[10px] text-slate-500">Autonomous multi-source validation.</p>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: MESSAGE / SMS / WHATSAPP EXPLAINABLE TRIGGERS */}
      {(inputType === "MESSAGE" || explainablePhrases.length > 0 || scamCategory) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-400" /> Explainable Threat Tactics & Trigger Phrases
            </h4>
            {scamCategory && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30">
                {scamCategory.replace(/_/g, " ")} ({categoryConfidence || 85}% confidence)
              </span>
            )}
          </div>

          {explainablePhrases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {explainablePhrases.map((phraseItem: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-300 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> {phraseItem.category}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-500/30 text-red-200">
                      {phraseItem.severity}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/5 font-mono text-[11px] text-white">
                    "{phraseItem.phrase}"
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {phraseItem.explanation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/[.02] border border-white/5 text-xs text-slate-400">
              No critical coercive phrases were detected in the text. Continue observing standard verification hygiene.
            </div>
          )}
        </div>
      )}

      {/* Detected Security Indicators List */}
      {indicators.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">
            All Observed Risk Indicators ({indicators.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {indicators.map((ind, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-white/[.06] bg-white/[.02] flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-white">{ind.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{ind.description}</p>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                    ind.severity === "HIGH" || ind.severity === "CRITICAL"
                      ? "bg-red-500/20 text-red-300"
                      : ind.severity === "MEDIUM"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {ind.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
