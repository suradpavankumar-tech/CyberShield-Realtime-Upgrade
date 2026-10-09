import { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  UploadCloud,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  uploadMobileApk,
  listMobileScans,
  deleteMobileScan,
  type MobileResult,
  type MobileSummary,
} from "../services/securityModules";

export default function AppShield() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MobileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<MobileSummary[]>([]);
  const [copiedHash, setCopiedHash] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadScanHistory();
  }, []);

  async function loadScanHistory() {
    try {
      const data = await listMobileScans();
      setHistory(data.scans || []);
    } catch {
      // Ignore background history load failures
    }
  }

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".apk")) {
      setError("Only Android application package (.apk) files are supported.");
      return;
    }
    setError(null);
    setFile(selected);
  }

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await uploadMobileApk(file);
      setResult(res);
      loadScanHistory();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to analyze APK.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDeleteScan(id: number) {
    try {
      await deleteMobileScan(id);
      setHistory((prev) => prev.filter((s) => s.scan_id !== id));
      if (result && result.scan_id === id) {
        setResult(null);
        setFile(null);
      }
    } catch {
      // Ignore delete failure
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }

  // Extract hazard signatures from evidence
  const evidence = (result?.evidence || {}) as Record<string, any>;
  const hazardSignatures: any[] = evidence.hazard_signatures || [];
  const sha256 = (evidence.sha256 as string) || "—";
  const appName = (evidence.app_name as string) || null;
  const minSdk = (evidence.min_sdk as string) || "—";
  const targetSdk = (evidence.target_sdk as string) || "—";

  // Filter findings by selected category
  const findings = result?.findings || [];
  const filteredFindings =
    selectedCategory === "ALL"
      ? findings
      : findings.filter((f) => f.category === selectedCategory);

  const categories = Array.from(new Set(findings.map((f) => f.category)));

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
              <Smartphone size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                  AppShield™ Static Forensics
                </span>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                  Androguard Engine
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Android APK Threat & Privacy Analyzer
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Scans Performed: <strong className="text-white">{history.length}</strong>
            </span>
          </div>
        </div>

        {/* Upload Box / Drag & Drop */}
        {!result && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                dragActive
                  ? "border-cyan-400 bg-cyan-500/[0.05]"
                  : "border-white/10 bg-[#0a1220] hover:border-cyan-500/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
                <UploadCloud size={32} />
              </div>

              <h3 className="mt-4 text-base font-bold text-white">
                {file ? file.name : "Select or drag an Android APK file"}
              </h3>

              <p className="mt-1 text-xs text-slate-400 max-w-md">
                {file
                  ? `Ready for forensic decompilation (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
                  : "Supports .apk binaries up to 100 MB. Performs static manifest inspection, permission hazard analysis, and trojan signature extraction."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Choose File
                </button>

                {file && (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Decompiling & Analyzing...
                      </>
                    ) : (
                      "Run AppShield Analysis"
                    )}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Quick Threat Info Card */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0a1220] p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Why Analyze APKs?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Malicious actors distribute sideloaded APKs disguised as:
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <strong>Fake Banking Rewards / KYC Updates</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <strong>Electricity Board Bill Verification Apps</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <strong>Illegal Instant Loan & Harassment Apps</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <strong>Customer Support Remote Access (AnyDesk clones)</strong>
                </li>
              </ul>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300/90 leading-normal">
                AppShield performs static sandbox analysis without executing code on your host machine.
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="space-y-6">
            {/* Top Bar with Verdict & Reset */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a1220] p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                    result.risk_level === "CRITICAL"
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : result.risk_level === "HIGH"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : result.risk_level === "MEDIUM"
                      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {result.risk_level === "CRITICAL" || result.risk_level === "HIGH" ? (
                    <ShieldAlert size={32} />
                  ) : (
                    <ShieldCheck size={32} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        result.risk_level === "CRITICAL"
                          ? "bg-red-500/20 text-red-300"
                          : result.risk_level === "HIGH"
                          ? "bg-amber-500/20 text-amber-300"
                          : result.risk_level === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {result.risk_level} RISK VERDICT
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      #{result.scan_id}
                    </span>
                  </div>

                  <h2 className="mt-1 text-xl font-bold text-white">
                    {appName ? `${appName} (${result.package_name})` : result.package_name || result.filename}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-black text-white">
                    {result.risk_score}
                    <span className="text-sm font-semibold text-slate-500">/100</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Hazard Score
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Scan Another APK
                </button>
              </div>
            </div>

            {/* Binary Metadata Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/5 bg-[#060b14] p-3.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Target / Min SDK
                </span>
                <p className="mt-1 text-sm font-bold text-white font-mono">
                  Android {targetSdk} / {minSdk}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#060b14] p-3.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Permissions Declared
                </span>
                <p className="mt-1 text-sm font-bold text-cyan-400">
                  {result.permissions.length} total ({findings.length} sensitive)
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#060b14] p-3.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Hazard Signatures
                </span>
                <p className={`mt-1 text-sm font-bold ${hazardSignatures.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {hazardSignatures.length} Detected
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#060b14] p-3.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  SHA-256 Checksum
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="truncate text-xs font-mono text-slate-300" title={sha256}>
                    {sha256}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(sha256)}
                    className="shrink-0 text-slate-400 hover:text-white"
                  >
                    {copiedHash ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* HAZARD COMBINATIONS (if any) */}
            {hazardSignatures.length > 0 && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-red-300">
                  <AlertTriangle size={18} className="text-red-400" />
                  <span>High-Hazard Malware Signatures Detected</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {hazardSignatures.map((sig: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-red-500/20 bg-black/40 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{sig.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 uppercase">
                          {sig.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {sig.description}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sig.matched_permissions?.map((perm: string) => (
                          <span
                            key={perm}
                            className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300"
                          >
                            {perm.replace("android.permission.", "")}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations & Containment */}
            {result.recommendations?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Defensive Containment & Security Guidelines
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {result.recommendations.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300"
                    >
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-cyan-400" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions Explorer */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Declared Permissions & Privacy Impact
                  </h3>
                  <p className="text-xs text-slate-500">
                    Categorized analysis of device privileges requested by this APK
                  </p>
                </div>

                {/* Category filter tabs */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                      selectedCategory === "ALL"
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({findings.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                        selectedCategory === cat
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Findings grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-white/5 bg-[#060b14] p-4 space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {finding.category}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            finding.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-300"
                              : finding.severity === "HIGH"
                              ? "bg-amber-500/20 text-amber-300"
                              : finding.severity === "MEDIUM"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>
                      <h5 className="mt-1 text-xs font-bold text-white font-mono break-all">
                        {finding.permission.replace("android.permission.", "")}
                      </h5>
                      <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                        {finding.description}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-2 text-[10px] text-slate-500">
                      Hazard Weight: +{finding.score} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scan History Drawer */}
        {history.length > 0 && !result && (
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Mobile Scans
            </h3>
            <div className="divide-y divide-white/5">
              {history.map((scan) => (
                <div
                  key={scan.scan_id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        scan.risk_level === "CRITICAL" || scan.risk_level === "HIGH"
                          ? "bg-red-400"
                          : scan.risk_level === "MEDIUM"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-white">
                        {scan.package_name || scan.filename}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-500 font-mono">
                        #{scan.scan_id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">
                      {scan.risk_score ?? "—"}/100
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteScan(scan.scan_id)}
                      className="text-slate-500 hover:text-red-400"
                      title="Delete scan record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
