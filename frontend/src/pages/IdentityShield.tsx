import { useState } from "react";
import {
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  Database,
  Loader2,
  Info,
} from "lucide-react";
import {
  checkEmailBreach,
  checkPwnedPasswordPrefix,
  type EmailBreachResponse,
} from "../services/securityModules";

export default function IdentityShield() {
  const [activeTab, setActiveTab] = useState<"email" | "password">("email");

  // Email Breach State
  const [emailInput, setEmailInput] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailBreachResponse | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password k-Anonymity State
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordHash, setPasswordHash] = useState<string | null>(null);
  const [pwnedCount, setPwnedCount] = useState<number | null>(null);
  const [checkedPassword, setCheckedPassword] = useState<boolean>(false);

  // Email check handler
  async function handleEmailCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await checkEmailBreach(emailInput.trim());
      setEmailResult(res);
    } catch (err: any) {
      setEmailError(err?.response?.data?.detail || err.message || "Failed to check email exposure.");
    } finally {
      setEmailLoading(false);
    }
  }

  // Client-side SHA-1 calculation for k-Anonymity
  async function computeSha1Hex(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  // Password k-Anonymity check handler
  async function handlePasswordCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordInput) return;

    setPasswordLoading(true);
    setPasswordError(null);
    setCheckedPassword(false);
    setPwnedCount(null);

    try {
      // 1. Hash locally in browser - raw password NEVER leaves the client!
      const fullHash = await computeSha1Hex(passwordInput);
      setPasswordHash(fullHash);

      const prefix = fullHash.substring(0, 5);
      const suffix = fullHash.substring(5);

      // 2. Query ONLY the 5-character prefix via k-Anonymity
      const data = await checkPwnedPasswordPrefix(prefix);

      // 3. Match suffix client-side
      const matched = data.suffixes.find((item) => item.hash_suffix.toUpperCase() === suffix);
      if (matched) {
        setPwnedCount(matched.count);
      } else {
        setPwnedCount(0);
      }
      setCheckedPassword(true);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.detail || err.message || "Failed to check password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <section className="p-5 sm:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
              <UserCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                  // IDENTITYSHIELD™ CREDENTIAL VAULT
                </span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
                  k-ANONYMITY SHA-1
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                Account Exposure &amp; Compromised Credential Guard
              </h1>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-black/60 p-1 border border-cyan-500/20 font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "email"
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Email &amp; Account Breaches
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "password"
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Password Exposure (k-Anonymity)
            </button>
          </div>
        </div>

        {/* TAB 1: EMAIL BREACH CHECKER */}
        {activeTab === "email" && (
          <div className="space-y-6">
            {/* Input Box */}
            <div className="cyber-card cyber-corner-bracket p-6 space-y-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 cyber-beacon-cyan" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    // DARK WEB DUMP RADAR
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-white tracking-tight">
                  Check Email in Known Data Breach Dumps
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scan your email against verified enterprise breaches and dark web dumps (Domino&apos;s India, BigBasket, Air India, Canva, etc.).
                </p>
              </div>

              <form onSubmit={handleEmailCheck} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500/70" />
                  <input
                    type="email"
                    required
                    placeholder="Enter email address (e.g., yourname@gmail.com)"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded-xl border border-cyan-500/20 bg-[#040812] pl-10 pr-4 py-3 font-mono text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-mono text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition hover:from-cyan-300 hover:to-blue-400 disabled:opacity-50"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Scanning Breach Feeds...
                    </>
                  ) : (
                    "Check Exposure"
                  )}
                </button>
              </form>

              {emailError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* Results Display */}
            {emailResult && (
              <div className="space-y-6">
                {/* Result Overview Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a1220] p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                        emailResult.is_compromised
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {emailResult.is_compromised ? (
                        <ShieldAlert size={32} />
                      ) : (
                        <ShieldCheck size={32} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            emailResult.risk_level === "CRITICAL"
                              ? "bg-red-500/20 text-red-300"
                              : emailResult.risk_level === "HIGH"
                              ? "bg-amber-500/20 text-amber-300"
                              : emailResult.risk_level === "MEDIUM"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {emailResult.risk_level} RISK EXPOSURE
                        </span>
                        <span className="text-xs text-slate-500">
                          {emailResult.breach_count} Breaches Identified
                        </span>
                      </div>
                      <h2 className="mt-1 text-lg font-bold text-white">
                        {emailResult.email}
                      </h2>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-white">
                      {emailResult.risk_score}
                      <span className="text-sm font-semibold text-slate-500">/100</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Identity Threat Score
                    </span>
                  </div>
                </div>

                {/* Compromised Data Classes Tags */}
                {emailResult.data_classes_exposed.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Compromised Data Categories Found in Dumps
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {emailResult.data_classes_exposed.map((dc) => (
                        <span
                          key={dc}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300"
                        >
                          {dc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {emailResult.recommendations.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Recommended Identity Hardening Protocols
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {emailResult.recommendations.map((rec, idx) => (
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

                {/* Detailed Breaches List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Documented Breach Exposures ({emailResult.breaches.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {emailResult.breaches.map((breach) => (
                      <div
                        key={breach.id}
                        className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-white">{breach.title}</h5>
                          <span
                            className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                              breach.severity === "CRITICAL"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {breach.severity}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-slate-500" /> {breach.breach_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database size={13} className="text-slate-500" /> {(breach.pwn_count / 1_000_000).toFixed(1)}M accounts
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {breach.description}
                        </p>

                        <div className="border-t border-white/5 pt-3">
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            Exposed data:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {breach.data_classes.map((dc) => (
                              <span
                                key={dc}
                                className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                              >
                                {dc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PASSWORD EXPOSURE (k-ANONYMITY) */}
        {activeTab === "password" && (
          <div className="space-y-6">
            {/* Educational Privacy Protocol Banner */}
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5 flex items-start gap-3.5">
              <Info size={20} className="shrink-0 text-cyan-400 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1">
                <h4 className="font-bold text-white">
                  Mathematical Privacy Guarantee (k-Anonymity Model)
                </h4>
                <p className="text-slate-300">
                  Your plain password is <strong>never transmitted</strong> over the network. Your browser computes a 40-character SHA-1 hash locally. Only the first 5 characters are sent to the server. The server responds with all known matching suffixes, and the final match is computed 100% inside your browser.
                </p>
              </div>
            </div>

            {/* Password Input Box */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Verify Password Against Compromised Wordlists
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check if a password has been leaked in global credential-stuffing dictionaries without exposing it.
                </p>
              </div>

              <form onSubmit={handlePasswordCheck} className="space-y-4">
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password to test exposure..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#060b14] pl-10 pr-12 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading || !passwordInput}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Hashing & Querying k-Anonymity...
                    </>
                  ) : (
                    "Check Password Safety"
                  )}
                </button>
              </form>

              {passwordError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Password Verification Result */}
            {checkedPassword && pwnedCount !== null && (
              <div className="space-y-6">
                <div
                  className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    pwnedCount > 0
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-emerald-500/30 bg-emerald-500/10"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                        pwnedCount > 0 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {pwnedCount > 0 ? <ShieldAlert size={36} /> : <ShieldCheck size={36} />}
                    </div>
                    <div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          pwnedCount > 0
                            ? "bg-red-500/20 text-red-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {pwnedCount > 0 ? "COMPROMISED PASSWORD" : "SAFE / UNEXPOSED PASSWORD"}
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        {pwnedCount > 0
                          ? `Found in ${pwnedCount.toLocaleString()} Data Breaches`
                          : "No Breaches Found for this Password"}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {pwnedCount > 0
                          ? "This password appears in known cyberattack dictionaries. Attackers routinely test this in automated brute-force scripts."
                          : "This password does not appear in known breach repositories. Continue using distinct passwords across services."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Inspector */}
                {passwordHash && (
                  <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Client-Side SHA-1 k-Anonymity Proof
                    </h4>
                    <div className="rounded-xl bg-[#060b14] p-3 border border-white/5 font-mono text-xs flex flex-wrap items-center gap-1">
                      <span className="text-slate-500">SHA-1:</span>
                      <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold" title="5-char prefix transmitted to server">
                        {passwordHash.substring(0, 5)}
                      </span>
                      <span className="text-slate-400">
                        {passwordHash.substring(5)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      The highlighted 5-character prefix was the only data sent. The remaining 35 characters were matched in your browser.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
