import { useState, useEffect } from "react";
import {
  AlertOctagon,
  PhoneCall,
  ShieldAlert,
  CreditCard,
  Smartphone,
  UserX,
  Copy,
  CheckCircle2,
  ExternalLink,
  Printer,
  Clock,
} from "lucide-react";

interface IncidentForm {
  victimName: string;
  victimPhone: string;
  incidentDate: string;
  lossAmount: string;
  scammerPhone: string;
  scammerUpiOrAccount: string;
  utrNumbers: string;
  bankName: string;
  summary: string;
}

const BANK_HELPLINES = [
  { name: "State Bank of India (SBI)", phone: "1800 1234", alt: "1800 2100" },
  { name: "HDFC Bank", phone: "1800 1600", alt: "1800 202 6161" },
  { name: "ICICI Bank", phone: "1800 1080", alt: "1800 102 4242" },
  { name: "Axis Bank", phone: "1800 419 0068", alt: "1800 103 5577" },
  { name: "Punjab National Bank (PNB)", phone: "1800 180 2222", alt: "1800 103 2222" },
  { name: "Bank of Baroda", phone: "1800 5700", alt: "1800 258 4455" },
  { name: "Kotak Mahindra Bank", phone: "1860 266 2666", alt: "1800 209 0000" },
];

export default function FraudEmergencyAssistant() {
  const [activeTab, setActiveTab] = useState<"financial" | "digital_arrest" | "malicious_apk" | "account_takeover">("financial");
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<IncidentForm>(() => {
    const saved = localStorage.getItem("cybershield_emergency_form");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      victimName: "",
      victimPhone: "",
      incidentDate: new Date().toISOString().slice(0, 16),
      lossAmount: "",
      scammerPhone: "",
      scammerUpiOrAccount: "",
      utrNumbers: "",
      bankName: "",
      summary: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("cybershield_emergency_form", JSON.stringify(form));
  }, [form]);

  const toggleCheck = (id: string) => {
    setCheckedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateComplaintText = () => {
    return `FORMAL CYBERCRIME COMPLAINT DRAFT
Generated via CyberShield Emergency Incident Response Assistant
Submitted for: National Cyber Crime Reporting Portal (cybercrime.gov.in) / Police FIR

1. COMPLAINANT INFORMATION:
Name: ${form.victimName || "[Your Full Name]"}
Contact Phone: ${form.victimPhone || "[Your Phone Number]"}
Date & Time of Incident: ${form.incidentDate || new Date().toLocaleString()}

2. FINANCIAL IMPACT:
Total Financial Loss: INR ${form.lossAmount || "0"}
Complainant Bank: ${form.bankName || "[Bank Name]"}
Transaction Reference / UTR Number(s): ${form.utrNumbers || "[UTR / Ref Numbers]"}

3. SUSPECT DETAILS:
Suspect Phone Number / WhatsApp: ${form.scammerPhone || "Not provided / Unknown"}
Suspect Beneficiary UPI ID / Account Number: ${form.scammerUpiOrAccount || "Not provided"}

4. INCIDENT SUMMARY:
Category: ${activeTab.toUpperCase().replace("_", " ")}
Incident Description:
${form.summary || "[Describe how the scam occurred, what link was clicked or what calls were received]"}

5. ACTIONS ALREADY TAKEN BY COMPLAINANT:
${Object.entries(checkedSteps)
  .filter(([_, v]) => v)
  .map(([k]) => `- Completed: ${k}`)
  .join("\n") || "- Emergency response checklist initiated"}

6. REQUESTED LAW ENFORCEMENT & BANK RELIEF:
1. Immediate lien/freeze on the recipient fraudulent bank accounts/UPI wallets.
2. Inter-bank coordination under Citizen Financial Cyber Fraud Reporting System (Helpline 1930).
3. Registration of formal First Information Report (FIR) under relevant sections of the Information Technology Act 2000 and the Bharatiya Nyaya Sanhita (BNS).
`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateComplaintText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
              <AlertOctagon size={18} className="animate-pulse" />
              Immediate Incident Containment
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Fraud Emergency Assistant
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Targeted by a scam or lost money? Follow these decisive containment steps right now.
              Every minute counts in freezing fraudulent transactions and preserving evidence.
            </p>
          </div>

          {/* Quick Helpline Hotline Card */}
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/50">
              <PhoneCall size={24} className="text-white animate-bounce" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-red-300 font-semibold">
                National Cybercrime Helpline
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="tel:1930"
                  className="text-2xl font-black text-white hover:text-red-300 transition-colors"
                >
                  Dial 1930
                </a>
                <span className="text-[10px] bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full font-bold">
                  24x7 Free
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Citizen Financial Cyber Fraud Reporting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Category Selection Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: "financial", label: "Financial / UPI / Bank Fraud", icon: CreditCard, color: "text-amber-400" },
          { id: "digital_arrest", label: "Digital Arrest / Police Extortion", icon: ShieldAlert, color: "text-red-400" },
          { id: "malicious_apk", label: "Malicious APK / Remote App", icon: Smartphone, color: "text-cyan-400" },
          { id: "account_takeover", label: "Account Hacked / OTP Shared", icon: UserX, color: "text-purple-400" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-bold"
                  : "bg-white/[.04] text-slate-300 hover:bg-white/[.08] hover:text-white"
              }`}
            >
              <Icon size={16} className={isActive ? "text-slate-950" : tab.color} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Containment Protocol & Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: FINANCIAL FRAUD */}
          {activeTab === "financial" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                <Clock className="shrink-0 text-amber-400 mt-0.5" size={18} />
                <div>
                  <span className="font-bold">Golden Hour Notice:</span> If money was deducted within the last 2 hours, immediately calling <span className="underline font-extrabold">1930</span> allows the portal to notify the recipient bank system to freeze the disputed transaction before the fraudster withdraws the cash at an ATM.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-cyan-400" />
                  Immediate Action Checklist (Step-by-Step)
                </h2>

                <div className="space-y-3">
                  {[
                    {
                      id: "Call 1930 Immediately",
                      title: "Step 1: Call 1930 or submit on cybercrime.gov.in",
                      desc: "Provide your account number, transaction UTR / Reference ID, suspect UPI ID/phone number, and exact timestamp. An incident token will be generated.",
                    },
                    {
                      id: "Notify Your Home Bank",
                      title: "Step 2: Contact your bank's fraud reporting desk",
                      desc: "Ask the fraud desk to flag the debit as UNAUTHORIZED / SCAM and send a hold request to the beneficiary bank.",
                    },
                    {
                      id: "Block Netbanking / Cards",
                      title: "Step 3: Temporarily lock Netbanking & UPI access",
                      desc: "Use your official bank mobile app to disable UPI transactions and international debit to prevent secondary unauthorized charges.",
                    },
                    {
                      id: "Preserve Transaction Screenshots",
                      title: "Step 4: Take pristine unedited screenshots",
                      desc: "Capture the full payment passbook entry showing the 12-digit UTR number, beneficiary name, and UPI reference.",
                    },
                  ].map((step) => (
                    <label
                      key={step.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[.06] bg-white/[.02] hover:bg-white/[.05] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedSteps[step.id]}
                        onChange={() => toggleCheck(step.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
                      />
                      <div>
                        <p className={`text-xs font-bold ${checkedSteps[step.id] ? "line-through text-slate-500" : "text-white"}`}>
                          {step.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bank Directory */}
              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6">
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Direct Bank Fraud Reporting Toll-Free Numbers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BANK_HELPLINES.map((bank) => (
                    <div key={bank.name} className="p-3 rounded-xl bg-white/[.03] border border-white/[.05] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">{bank.name}</p>
                        <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{bank.phone}</p>
                      </div>
                      <a
                        href={`tel:${bank.phone.replace(/\s+/g, "")}`}
                        className="text-[10px] bg-white/10 hover:bg-cyan-500 hover:text-slate-950 font-bold px-2.5 py-1 rounded-lg text-white transition-colors"
                      >
                        Call
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIGITAL ARREST */}
          {activeTab === "digital_arrest" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-5 text-white space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <ShieldAlert size={20} />
                  CRITICAL REALITY CHECK: YOU ARE COMPLETELY SAFE
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  <strong>Indian Law & Police Protocols:</strong> There is legally <strong>NO SUCH THING AS "DIGITAL ARREST"</strong> in the Indian Penal Code, Criminal Procedure Code, or Bharatiya Nyaya Sanhita (BNS).
                  The CBI, ED, Narcotics Control Bureau (NCB), Mumbai Police, and judges <strong>NEVER</strong> conduct interrogations, trials, or demand money clearance over Skype, WhatsApp video, or Telegram.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-red-400" />
                  What You Must Do Right Now
                </h2>

                <div className="space-y-3">
                  {[
                    {
                      id: "Disconnect Video Call",
                      title: "1. Disconnect the call immediately",
                      desc: "Hang up on Skype, WhatsApp, or phone. The scammers use psychological fear and isolation. You will NOT be arrested for hanging up.",
                    },
                    {
                      id: "DO NOT Send Any Money",
                      title: "2. Under NO circumstance transfer money to 'verify funds'",
                      desc: "Scammers claim transferring money to an 'RBI safe account' or 'police clearance account' will clear your name. These are fraudulent mule accounts.",
                    },
                    {
                      id: "Talk to a Trusted Family Member",
                      title: "3. Break the isolation",
                      desc: "Scammers order you not to tell anyone. Call a trusted friend, family member, or local police station immediately. Talking to others breaks the panic spell.",
                    },
                    {
                      id: "Report to Cyber Police",
                      title: "4. Report the Skype ID & Phone to 1930 / Chakshu Portal",
                      desc: "Report on Sanchar Saathi's Chakshu portal (sancharsaathi.gov.in) and 1930 to have the imposter's number blocked across Indian telecom networks.",
                    },
                  ].map((step) => (
                    <label
                      key={step.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[.06] bg-white/[.02] hover:bg-white/[.05] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedSteps[step.id]}
                        onChange={() => toggleCheck(step.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-red-500 focus:ring-red-400 bg-slate-900"
                      />
                      <div>
                        <p className={`text-xs font-bold ${checkedSteps[step.id] ? "line-through text-slate-500" : "text-white"}`}>
                          {step.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MALICIOUS APK */}
          {activeTab === "malicious_apk" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-cyan-200 text-xs sm:text-sm">
                <strong>Device Isolation Priority:</strong> Rogue Android apps (fake courier APKs, PM Yojana apps, AnyDesk screen-sharing) hijack SMS permissions to read two-factor authentication OTPs silently.
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-cyan-400" />
                  Device Disinfection Protocol
                </h2>

                <div className="space-y-3">
                  {[
                    {
                      id: "Enable Airplane Mode",
                      title: "1. Turn on Airplane Mode immediately",
                      desc: "Cutting Wi-Fi and mobile data instantly severs the remote command-and-control connection used by spyware to exfiltrate your screens and OTPs.",
                    },
                    {
                      id: "Remove SIM Card",
                      title: "2. Eject your SIM card temporarily",
                      desc: "Insert it into a basic secondary phone if you need to receive genuine bank OTPs to reset passwords safely.",
                    },
                    {
                      id: "Boot in Safe Mode",
                      title: "3. Boot Android into Safe Mode",
                      desc: "Hold Power off -> Long-press 'Restart' until 'Safe Mode' appears. Third-party malicious APKs are prevented from running, allowing you to uninstall them under Settings > Apps.",
                    },
                    {
                      id: "Reset Bank & UPI Passwords",
                      title: "4. Change credentials from another device",
                      desc: "Use a clean computer or family member's phone to change your Netbanking passwords and UPI MPIN.",
                    },
                  ].map((step) => (
                    <label
                      key={step.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[.06] bg-white/[.02] hover:bg-white/[.05] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedSteps[step.id]}
                        onChange={() => toggleCheck(step.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
                      />
                      <div>
                        <p className={`text-xs font-bold ${checkedSteps[step.id] ? "line-through text-slate-500" : "text-white"}`}>
                          {step.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT TAKEOVER */}
          {activeTab === "account_takeover" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 text-purple-200 text-xs sm:text-sm">
                <strong>Session Revocation Protocol:</strong> If you shared an OTP or your WhatsApp/Google account was signed into from an unknown device, revoke all active sessions immediately.
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-purple-400" />
                  Account Recovery Steps
                </h2>

                <div className="space-y-3">
                  {[
                    {
                      id: "Revoke Linked Devices",
                      title: "1. Terminate all active sessions",
                      desc: "For WhatsApp: Settings > Linked Devices > Log out of all computers. For Google: Manage Account > Security > Your Devices > Sign out unrecognized devices.",
                    },
                    {
                      id: "Warn Contacts",
                      title: "2. Alert your close contacts via alternate channel",
                      desc: "Scammers immediately broadcast urgent loan / medical emergency messages to your contact list asking for UPI transfers.",
                    },
                    {
                      id: "Enable Hardware 2FA",
                      title: "3. Enable App-Based Authenticator 2FA",
                      desc: "Switch from SMS-based 2FA to Google Authenticator or Microsoft Authenticator to protect against SIM-swap attacks.",
                    },
                  ].map((step) => (
                    <label
                      key={step.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[.06] bg-white/[.02] hover:bg-white/[.05] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedSteps[step.id]}
                        onChange={() => toggleCheck(step.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-purple-500 focus:ring-purple-400 bg-slate-900"
                      />
                      <div>
                        <p className={`text-xs font-bold ${checkedSteps[step.id] ? "line-through text-slate-500" : "text-white"}`}>
                          {step.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Official Portals Link Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
              <ExternalLink size={14} /> Official Government & Law Enforcement Portals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/[.03] border border-white/[.05] hover:border-cyan-500/40 text-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">National Cyber Crime Portal</p>
                  <p className="text-[11px] text-slate-400">cybercrime.gov.in</p>
                </div>
                <ExternalLink size={14} className="text-cyan-400" />
              </a>

              <a
                href="https://sancharsaathi.gov.in"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/[.03] border border-white/[.05] hover:border-cyan-500/40 text-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">Sanchar Saathi (Chakshu)</p>
                  <p className="text-[11px] text-slate-400">Block fraud calls / IMEIs</p>
                </div>
                <ExternalLink size={14} className="text-cyan-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Incident Evidence Locker & Complaint Generator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Incident Evidence Locker
                </h2>
                <p className="text-[11px] text-slate-400">
                  Fill in the incident details to compile an official cybercrime complaint report.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={form.victimName}
                  onChange={(e) => setForm({ ...form, victimName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl bg-[#060b14] border border-white/10 p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Your Phone</label>
                  <input
                    type="text"
                    value={form.victimPhone}
                    onChange={(e) => setForm({ ...form, victimPhone: e.target.value })}
                    placeholder="e.g. 98XXXXXXXX"
                    className="w-full rounded-xl bg-[#060b14] border border-white/10 p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Loss Amount (INR)</label>
                  <input
                    type="text"
                    value={form.lossAmount}
                    onChange={(e) => setForm({ ...form, lossAmount: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full rounded-xl bg-[#060b14] border border-white/10 p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Scammer Contact / Phone Number</label>
                <input
                  type="text"
                  value={form.scammerPhone}
                  onChange={(e) => setForm({ ...form, scammerPhone: e.target.value })}
                  placeholder="e.g. +91 8765432109 or Skype ID"
                  className="w-full rounded-xl bg-[#060b14] border border-white/10 p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Scammer UPI VPA / Account Number</label>
                <input
                  type="text"
                  value={form.scammerUpiOrAccount}
                  onChange={(e) => setForm({ ...form, scammerUpiOrAccount: e.target.value })}
                  placeholder="e.g. fraudpayee@ybl or A/C 91987654321"
                  className="w-full rounded-xl bg-[#060b14] border border-white/10 p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Transaction Ref / 12-digit UTR Numbers</label>
                <input
                  type="text"
                  value={form.utrNumbers}
                  onChange={(e) => setForm({ ...form, utrNumbers: e.target.value })}
                  placeholder="e.g. 428719028341, 428719028990"
                  className="w-full rounded-xl bg-[#060b14] border border-white/10 p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Brief Description of What Happened</label>
                <textarea
                  rows={3}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Received a call claiming power would be cut tonight, clicked a link and entered PIN..."
                  className="w-full rounded-xl bg-[#060b14] border border-white/10 p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Generated Draft Output Box */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Complaint Report Preview</span>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors"
                  >
                    {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {copied ? "Copied!" : "Copy Report"}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
                  >
                    <Printer size={13} />
                    Print
                  </button>
                </div>
              </div>

              <pre className="rounded-xl bg-[#060b14] border border-white/5 p-3.5 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-56 leading-relaxed whitespace-pre-wrap select-all">
                {generateComplaintText()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
