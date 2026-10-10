import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Zap,
  Terminal,
  Cpu,
  Radio,
  Lock,
  Volume2,
  VolumeX,
  FastForward,
  Gauge,
} from "lucide-react";

interface CyberBootSequenceProps {
  onComplete: () => void;
}

const TOTAL_DURATION_MS = 30000; // Exact 30.0 seconds official military sequence

const BOOT_PHASES = [
  { id: 1, name: "HARDWARE IGNITION", time: "00:00 - 00:06", desc: "Cold bus power relays & cryogenic pumps" },
  { id: 2, name: "NEURAL PROCESSORS", time: "00:06 - 00:12", desc: "128 Heuristic cores & quantum ciphers" },
  { id: 3, name: "THREAT ENGINES", time: "00:12 - 00:18", desc: "Multi-signal NLP & zero-day heuristics" },
  { id: 4, name: "NATIONAL GRID", time: "00:18 - 00:24", desc: "I4C 1930 & CERT-In telemetry uplinks" },
  { id: 5, name: "SHIELD ARMED", time: "00:24 - 00:30", desc: "Full weapons-free defense lockdown" },
];

const BOOT_LOGS = [
  // Phase 1 (0s - 6s): Hardware Ignition
  { atSec: 0.5, code: "PWR_RELAY_01", text: "Energizing primary 480V high-voltage defense bus...", status: "NOMINAL", color: "text-emerald-400" },
  { atSec: 1.4, code: "CRYO_COOLANT", text: "Liquid helium loop engaged (temperature: 18.2 Kelvin)...", status: "STABLE", color: "text-cyan-400" },
  { atSec: 2.3, code: "ENTROPY_SEED", text: "Harvesting hardware quantum true-random noise (TRNG)...", status: "PRIMED", color: "text-cyan-400" },
  { atSec: 3.4, code: "MEM_ECC_TEST", text: "Parity verification on 64 GB ultra-fast DMA cache...", status: "PASSED", color: "text-emerald-400" },
  { atSec: 4.5, code: "BIOS_SECURE", text: "Validating cryptographic UEFI firmware checksums...", status: "AUTHENTIC", color: "text-cyan-300" },
  { atSec: 5.6, code: "BUS_FABRIC", text: "PCIe Gen 5 high-speed optic fabric synchronizing...", status: "LOCKED", color: "text-emerald-400" },

  // Phase 2 (6s - 12s): Neural Processors & Quantum Ciphers
  { atSec: 6.8, code: "KERNEL_SPINUP", text: "Booting 128-bit hardened defense microkernel (v2.0.4)...", status: "ONLINE", color: "text-cyan-400" },
  { atSec: 7.9, code: "VECTOR_AVX512", text: "Enabling tensor math acceleration units across all cores...", status: "ENGAGED", color: "text-cyan-300" },
  { atSec: 9.0, code: "KYBER_1024", text: "Post-quantum lattice encryption keys generated...", status: "SECURE", color: "text-violet-400" },
  { atSec: 10.1, code: "CIPHER_AES_GCM", text: "Quantum cipher pool armed with 256-bit Galois counter...", status: "ARMED", color: "text-cyan-400" },
  { atSec: 11.2, code: "CORE_MATRIX", text: "128/128 Neural heuristic processing cores synchronized...", status: "100%", color: "text-emerald-400" },

  // Phase 3 (12s - 18s): Threat Engines
  { atSec: 12.5, code: "NLP_TRANSFORMER", text: "Loading 7.8B perimeter threat classification weights...", status: "LOADED", color: "text-cyan-400" },
  { atSec: 13.6, code: "PHISH_URGENCY", text: "Calibrating multilingual social-engineering detectors...", status: "ACTIVE", color: "text-amber-400" },
  { atSec: 14.8, code: "ZERO_DAY_AI", text: "Priming behavioral anomaly heuristic radar...", status: "ARMED", color: "text-rose-400" },
  { atSec: 15.9, code: "APK_SANDBOX", text: "Spooling isolated Android permission analysis environment...", status: "STANDBY", color: "text-cyan-300" },
  { atSec: 17.0, code: "QR_INSPECTOR", text: "Arming multi-hop QR redirect & deep-payload parser...", status: "READY", color: "text-emerald-400" },

  // Phase 4 (18s - 24s): National Grid & Telemetry
  { atSec: 18.4, code: "NAT_TELEMETRY", text: "Connecting to National Cybercrime Helpline (I4C 1930)...", status: "CONNECTED", color: "text-amber-400" },
  { atSec: 19.6, code: "CERT_IN_SYNC", text: "Subscribing to real-time national advisory feed...", status: "STREAMING", color: "text-emerald-400" },
  { atSec: 20.8, code: "FIN_FRAUD_RADAR", text: "RBI & NPCI banking spoofing heuristic monitors...", status: "LISTENING", color: "text-amber-300" },
  { atSec: 22.0, code: "BGP_ROUTING", text: "Establishing global IP prefix hijack inspection socket...", status: "ACTIVE", color: "text-cyan-400" },
  { atSec: 23.2, code: "GRID_LATENCY", text: "Telemetry ping: 0.2ms latency across defense nodes...", status: "OPTIMAL", color: "text-emerald-400" },

  // Phase 5 (24s - 30s): Shield Arming & Final Overcharge
  { atSec: 24.5, code: "BROWSER_SHIELD", text: "Engaging MV3 pre-navigation threat interceptor...", status: "ONLINE", color: "text-cyan-400" },
  { atSec: 25.8, code: "IDENTITY_VAULT", text: "Locking dark web k-Anonymity credential vault...", status: "SECURE", color: "text-violet-400" },
  { atSec: 27.0, code: "REACTOR_MAX", text: "Overcharging central hexagonal plasma reactor core...", status: "OVERCHARGE", color: "text-amber-400" },
  { atSec: 28.4, code: "GRID_LOCKDOWN", text: "All 14 tactical security subsystems synchronized...", status: "PRIMED", color: "text-emerald-400" },
  { atSec: 29.5, code: "SYSTEM_ARMED", text: "CYBERSHIELD 2.0 FULL DEFENSE GRID ENGAGED...", status: "100% ARMED", color: "text-emerald-300" },
];

export default function CyberBootSequence({ onComplete }: CyberBootSequenceProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [isWarpingOut, setIsWarpingOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const soundEnabledRef = useRef(false);
  soundEnabledRef.current = soundEnabled;

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const terminalScrollRef = useRef<HTMLDivElement | null>(null);

  // Play official voice cue safely via Web Speech API
  function playVoiceCue(text: string) {
    if (!soundEnabledRef.current) return;
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        utterance.volume = 0.85;

        // Try to pick an authoritative English voice
        const voices = window.speechSynthesis.getVoices();
        const engVoice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Zira") || v.name.includes("David")));
        if (engVoice) {
          utterance.voice = engVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Speech synthesis skipped gracefully
    }
  }

  // Start Official Soundtrack
  function startOfficialAudio() {
    try {
      if (!audioPlayerRef.current) {
        const audio = new Audio("/audio/cybershield_startup.wav");
        audio.preload = "auto";
        audio.volume = 0.85;
        audioPlayerRef.current = audio;
      }
      void audioPlayerRef.current.play();
    } catch {
      // Fallback
    }
  }

  // Stop Official Soundtrack
  function stopOfficialAudio() {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  // 30-Second Main Animation & Sound Driver
  useEffect(() => {
    const startTime = Date.now();
    let spokenVoice1 = false;
    let spokenVoice2 = false;
    let spokenVoice3 = false;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.floor((elapsed / TOTAL_DURATION_MS) * 100));
      const currentSec = elapsed / 1000;

      setElapsedMs(elapsed);
      setProgress(rawPct);

      // Determine active Phase (1 to 5, each 6 seconds)
      const phaseNum = Math.min(5, Math.floor(currentSec / 6) + 1);
      setCurrentPhase(phaseNum);

      // Voice cues at strategic milestones
      if (soundEnabledRef.current) {
        if (currentSec >= 1.2 && !spokenVoice1) {
          spokenVoice1 = true;
          playVoiceCue("CyberShield system initializing. Defense core active.");
        } else if (currentSec >= 12.2 && !spokenVoice2) {
          spokenVoice2 = true;
          playVoiceCue("Threat matrix online. Synchronizing national radar.");
        } else if (currentSec >= 26.0 && !spokenVoice3) {
          spokenVoice3 = true;
          playVoiceCue("All defense countermeasures online. CyberShield fully armed.");
        }
      }

      // Check for newly triggered terminal logs
      let newestIndex = 0;
      for (let i = 0; i < BOOT_LOGS.length; i++) {
        if (currentSec >= BOOT_LOGS[i].atSec) {
          newestIndex = i;
        } else {
          break;
        }
      }

      setActiveLogIndex((prev) => {
        if (newestIndex > prev) {
          if (terminalScrollRef.current) {
            terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
          }
          return newestIndex;
        }
        return prev;
      });

      // 30 Seconds Completed -> Armed Climax Sequence
      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        setTimeout(() => {
          setIsWarpingOut(true);
          setTimeout(() => {
            stopOfficialAudio();
            onComplete();
          }, 700);
        }, 500);
      }
    }, 35);

    // Keyboard shortcut handlers (ESC to Skip, M to toggle audio)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "m" || e.key === "M") {
        toggleAudio();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
      stopOfficialAudio();
    };
  }, []);

  function handleSkip() {
    stopOfficialAudio();
    setIsWarpingOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  }

  function toggleAudio() {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEnabledRef.current = next;
      if (next) {
        startOfficialAudio();
        playVoiceCue("CyberShield audio engaged.");
      } else {
        stopOfficialAudio();
      }
      return next;
    });
  }

  // Handle click on background to engage audio seamlessly
  function handleContainerClick() {
    if (!soundEnabled) {
      toggleAudio();
    }
  }

  // Calculated Real-time Telemetry
  const currentSeconds = (elapsedMs / 1000).toFixed(1);
  const remainingSeconds = Math.max(0, ((TOTAL_DURATION_MS - elapsedMs) / 1000)).toFixed(1);
  const calculatedVolts = Math.min(480, Math.floor((progress / 100) * 480));
  const activeCoresCount = Math.min(128, Math.floor((progress / 100) * 128));

  return (
    <div
      onClick={handleContainerClick}
      className={`fixed inset-0 z-[9999] flex flex-col justify-between overflow-hidden bg-[#02050e] font-mono text-slate-200 select-none ${
        isWarpingOut
          ? "animate-[cyber-warp-iris-out_0.7s_cubic-bezier(0.16,1,0.3,1)_forwards]"
          : "animate-[cyber-boot-crt_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
      }`}
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 50% 50%, rgba(0, 240, 255, 0.12) 0%, transparent 70%),
          linear-gradient(rgba(0, 240, 255, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 240, 255, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 36px 36px, 36px 36px",
      }}
    >
      {/* Laser Scanline Beam sweep */}
      <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f0ff] animate-[cyber-scanline-down_3.5s_linear_infinite]" />

      {/* CRT Vignette & Screen Curves */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.85)_100%)]" />

      {/* ==================================================
          TOP HUD BAR: BIOS HEADER & CONTROLS
      ================================================== */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 bg-black/70 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="cyber-beacon-cyan inline-block h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 sm:text-[11px]">
            // CYBERSHIELD BIOS 2.0.4 // 30s OFFICIAL SOC POWER-ON
          </span>
          <span className="hidden md:inline-block text-[9px] text-slate-500">
            [SYS_STATE: FULL_GRID_INITIALIZATION]
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Official Audio Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleAudio();
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
              soundEnabled
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:text-white"
            }`}
            title="Toggle official studio audio soundtrack & tactical AI voice (Shortcut: M)"
          >
            {soundEnabled ? <Volume2 size={13} className="text-emerald-400" /> : <VolumeX size={13} />}
            <span>AUDIO {soundEnabled ? "ON [OFFICIAL]" : "OFF (CLICK TO ENABLE)"}</span>
          </button>

          {/* Fast Forward / Skip Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(0,240,255,0.4)]"
            title="Skip sequence and enter website immediately (Shortcut: ESC)"
          >
            <span>FAST FORWARD</span>
            <FastForward size={13} />
          </button>
        </div>
      </header>

      {/* ==================================================
          5-PHASE STEPPER HUD BAR (6 SECONDS PER PHASE)
      ================================================== */}
      <div className="relative z-20 border-b border-white/5 bg-black/40 px-4 py-2 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-1 overflow-x-auto text-[9px] sm:text-[10px]">
          {BOOT_PHASES.map((phase) => {
            const isActive = currentPhase === phase.id;
            const isDone = currentPhase > phase.id;
            return (
              <div
                key={phase.id}
                className={`flex flex-1 items-center gap-2 rounded px-2 py-1 transition ${
                  isActive
                    ? "border border-cyan-500/40 bg-cyan-500/15 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.25)]"
                    : isDone
                      ? "text-emerald-400"
                      : "text-slate-600"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
                    isActive
                      ? "bg-cyan-400 text-black animate-pulse"
                      : isDone
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                        : "bg-white/5 text-slate-500"
                  }`}
                >
                  {isDone ? "✓" : phase.id}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-bold tracking-wider">{phase.name}</div>
                  <div className="hidden text-[8px] text-slate-500 lg:block truncate">{phase.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          CENTERSTAGE: HOLOGRAPHIC SHIELD REACTOR CORE & GAUGES
      ================================================== */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-4 text-center">
        {/* Audio helper notification banner if sound is off */}
        {!soundEnabled && (
          <div className="mb-3 animate-pulse">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleAudio();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/70 px-4 py-1 text-[10px] font-bold text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition hover:border-cyan-300 hover:bg-cyan-900"
            >
              <Volume2 size={13} className="text-cyan-400 animate-bounce" />
              <span>[🔊 CLICK ANYWHERE OR PRESS &apos;M&apos; FOR OFFICIAL STUDIO AUDIO]</span>
            </button>
          </div>
        )}

        {/* Center Holographic Spinning Reactor Rings */}
        <div className="relative mb-4 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
          {/* Outer Rotating Radar Ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/30"
            style={{ animation: "cyber-radar-sweep 8s linear infinite" }}
          />

          {/* Middle Counter-Rotating Tech Ring */}
          <div
            className="absolute inset-3 rounded-full border border-cyan-500/40"
            style={{
              animation: "cyber-reactor-spin-reverse 5s linear infinite",
              borderTopColor: "#00f0ff",
              borderBottomColor: "#10b981",
            }}
          />

          {/* Pulsing Shockwave Rings */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-cyan-400"
            style={{ animation: "cyber-shockwave-expand 2.2s ease-out infinite" }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-emerald-400"
            style={{ animation: "cyber-shockwave-expand 2.2s ease-out 1.1s infinite" }}
          />

          {/* Center Hexagonal Reactor Glow Core */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-cyan-400/60 bg-[rgba(5,15,30,0.92)] shadow-[0_0_40px_rgba(0,240,255,0.5)] backdrop-blur-xl sm:h-28 sm:w-28">
            <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 animate-pulse" />
            <Shield size={44} className="relative z-10 text-cyan-400 drop-shadow-[0_0_15px_#00f0ff]" />
            <Zap size={22} className="absolute z-20 text-emerald-300 drop-shadow-[0_0_8px_#34d399]" />
          </div>
        </div>

        {/* Brand Holographic Typography */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-black tracking-[0.25em] text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.8)] sm:text-3xl md:text-4xl">
              CYBERSHIELD 2.0
            </h1>
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <p className="text-[9px] font-bold tracking-[0.3em] text-cyan-400 sm:text-xs">
            // NATIONAL SOC DEFENSE SUITE // 30s POWER-ON PROCESS
          </p>
        </div>

        {/* Master Progress Bar & Live Ticker */}
        <div className="mt-4 w-full max-w-xl">
          <div className="flex items-center justify-between text-[10px] font-bold sm:text-[11px]">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-cyan-400">PHASE {currentPhase}/5:</span>
              <span className="text-slate-200">{BOOT_PHASES[currentPhase - 1]?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">T+{currentSeconds}s / 30.0s</span>
              <span className="font-mono text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                {progress}%
              </span>
            </div>
          </div>

          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full border border-cyan-500/40 bg-black/60 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(0,240,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500">
            <span>BUS VOLTAGE: {calculatedVolts}V / 480V</span>
            <span>CORES ACTIVE: {activeCoresCount}/128</span>
            <span>REMAINING: {remainingSeconds}s</span>
          </div>
        </div>

        {/* Streaming Real-Time Diagnostic Terminal */}
        <div className="mt-4 w-full max-w-2xl rounded-xl border border-cyan-500/30 bg-[rgba(4,10,22,0.94)] p-3.5 text-left shadow-2xl backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5 text-[9px] text-slate-400">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Terminal size={12} />
              <span className="font-bold tracking-wider">// KERNEL BOOT STREAM (25 MODULES)</span>
            </div>
            <span className="text-[8px] text-slate-500">
              ACTIVE LOGS: {activeLogIndex + 1}/{BOOT_LOGS.length}
            </span>
          </div>

          <div
            ref={terminalScrollRef}
            className="max-h-32 overflow-y-auto space-y-1 font-mono text-[9px] leading-relaxed sm:text-[10px]"
          >
            {BOOT_LOGS.slice(0, activeLogIndex + 1).map((log, index) => (
              <div key={log.code} className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-600">[{log.atSec.toFixed(1)}s]</span>
                  <span className="text-cyan-400 font-bold">{log.code}:</span>
                  <span className="text-slate-300 truncate">{log.text}</span>
                </div>
                <span className={`shrink-0 font-bold ${log.color} ${index === activeLogIndex ? "animate-pulse" : ""}`}>
                  [{log.status}]
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ==================================================
          BOTTOM TELEMETRY STATUS HUD
      ================================================== */}
      <footer className="relative z-20 border-t border-cyan-500/20 bg-black/70 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2.5 text-[9px] text-slate-400 sm:text-[10px]">
          <div className="flex items-center gap-2">
            <Cpu size={13} className="text-cyan-400" />
            <span>NEURAL MATRIX: <strong>{activeCoresCount}/128 CORES ACTIVE</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Gauge size={13} className="text-emerald-400" />
            <span>BUS VOLTAGE: <strong>{calculatedVolts}V // 4.80 GHz</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Radio size={13} className="text-amber-400" />
            <span>I4C 1930 RADAR: <strong>SYNCHRONIZED (0-LATENCY)</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Lock size={13} className="text-cyan-400" />
            <span>ZERO-DAY INTEGRITY: <strong className="text-emerald-300">100% SECURE</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
