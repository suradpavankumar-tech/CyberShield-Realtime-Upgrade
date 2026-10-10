import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Zap,
  Terminal,
  Activity,
  Cpu,
  Radio,
  Lock,
  Volume2,
  VolumeX,
  FastForward,
} from "lucide-react";

interface CyberBootSequenceProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  { time: "0.012s", code: "KERNEL_INIT", text: "Booting 128-bit neural heuristics kernel...", status: "OK", color: "text-emerald-400" },
  { time: "0.048s", code: "ENTROPY_GEN", text: "Quantum cipher pool primed (AES-256-GCM)...", status: "SECURE", color: "text-cyan-400" },
  { time: "0.095s", code: "THREAT_MATRIX", text: "Calibrating multi-signal NLP & phishing models...", status: "ARMED", color: "text-cyan-400" },
  { time: "0.142s", code: "NATIONAL_RADAR", text: "Syncing I4C 1930 & CERT-In emergency feeds...", status: "CONNECTED", color: "text-amber-400" },
  { time: "0.198s", code: "BROWSER_SHIELD", text: "Engaging MV3 link pre-navigation interceptor...", status: "ONLINE", color: "text-emerald-400" },
  { time: "0.264s", code: "IDENTITY_VAULT", text: "Mounting zero-knowledge k-Anonymity registry...", status: "SYNCHED", color: "text-violet-400" },
  { time: "0.320s", code: "GRID_LOCKDOWN", text: "All defensive countermeasures synchronized...", status: "ARMED", color: "text-emerald-300" },
];

export default function CyberBootSequence({ onComplete }: CyberBootSequenceProps) {
  const [progress, setProgress] = useState(0);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [isWarpingOut, setIsWarpingOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  soundEnabledRef.current = soundEnabled;
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Synth
  function playBeep(freq = 880, duration = 0.04) {
    if (!soundEnabledRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio playback silently gracefully skipped
    }
  }

  function playArmedChord() {
    if (!soundEnabledRef.current) return;
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + 0.6);
      });
    } catch {
      // Audio skipped
    }
  }

  // Animation Timeline Driver
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2800; // 2.8 seconds total boot sequence

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.floor((elapsed / duration) * 100));

      setProgress(rawPct);

      // Trigger log lines as progress marches forward
      const targetIndex = Math.min(
        BOOT_LOGS.length - 1,
        Math.floor((rawPct / 90) * BOOT_LOGS.length)
      );

      setActiveLogIndex((prev) => {
        if (targetIndex > prev) {
          playBeep(900 + targetIndex * 150);
          return targetIndex;
        }
        return prev;
      });

      if (rawPct >= 100) {
        clearInterval(interval);
        playArmedChord();

        // Hold armed state momentarily, then trigger warp-iris dissolve
        setTimeout(() => {
          setIsWarpingOut(true);
          setTimeout(() => {
            onComplete();
          }, 650);
        }, 400);
      }
    }, 28);

    // Keyboard shortcut to skip: ESC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSkip() {
    setIsWarpingOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  }

  function toggleAudio() {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next && !audioCtxRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
          if (audioCtxRef.current.state === "suspended") {
            void audioCtxRef.current.resume();
          }
        } catch {
          // ignore
        }
      }
      return next;
    });
  }

  return (
    <div
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
          TOP HUD BAR
      ================================================== */}
      <header className="relative z-20 flex items-center justify-between border-b border-cyan-500/20 bg-black/60 px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="cyber-beacon-cyan inline-block h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-[11px] font-bold tracking-[0.2em] text-cyan-400">
            // CYBERSHIELD BIOS 2.0.4 // SOC COORD: IND-80
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-500">
            [SYS_STATE: POWER_ON_INITIALIZATION]
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Synthesizer Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
              soundEnabled
                ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
            }`}
            title="Toggle cyber sound synthesis"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>AUDIO {soundEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Skip / Fast Forward Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(0,240,255,0.4)]"
          >
            <span>FAST FORWARD</span>
            <FastForward size={13} />
          </button>
        </div>
      </header>

      {/* ==================================================
          CENTERSTAGE: HOLOGRAPHIC SHIELD REACTOR CORE
      ================================================== */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
        {/* Holographic Spinning Energy Reactor Rings */}
        <div className="relative mb-6 flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
          {/* Outer Rotating Radar Ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/30"
            style={{ animation: "cyber-radar-sweep 8s linear infinite" }}
          />

          {/* Middle Counter-Rotating Tech Ring with notches */}
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
            style={{ animation: "cyber-shockwave-expand 2s ease-out infinite" }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-emerald-400"
            style={{ animation: "cyber-shockwave-expand 2s ease-out 1s infinite" }}
          />

          {/* Center Hexagonal Reactor Glow Core */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-cyan-400/60 bg-[rgba(5,15,30,0.9)] shadow-[0_0_35px_rgba(0,240,255,0.5)] backdrop-blur-xl sm:h-32 sm:w-32">
            <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 animate-pulse" />
            <Shield size={52} className="relative z-10 text-cyan-400 drop-shadow-[0_0_15px_#00f0ff]" />
            <Zap size={24} className="absolute z-20 text-emerald-300 drop-shadow-[0_0_8px_#34d399]" />
          </div>
        </div>

        {/* Brand Holographic Typography */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-3xl font-black tracking-[0.25em] text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.8)] sm:text-4xl md:text-5xl">
              CYBERSHIELD 2.0
            </h1>
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-cyan-400 sm:text-xs">
            // TACTICAL CYBER DEFENSE OPERATING SYSTEM // POWERING ON
          </p>
        </div>

        {/* Master Progress Bar */}
        <div className="mt-7 w-full max-w-lg">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-400">
              {progress < 100 ? "CALIBRATING DEFENSE SUITE..." : "ALL DEFENSE PROTOCOLS ARMED"}
            </span>
            <span className="font-mono text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
              {progress}%
            </span>
          </div>

          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-cyan-500/40 bg-black/60 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(0,240,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Streaming Real-Time Diagnostic Terminal */}
        <div className="mt-6 w-full max-w-2xl rounded-xl border border-cyan-500/30 bg-[rgba(4,10,22,0.92)] p-4 text-left shadow-2xl backdrop-blur-md">
          <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Terminal size={12} />
              <span className="font-bold tracking-wider">// KERNEL BOOT DIAGNOSTICS</span>
            </div>
            <span className="text-[9px] text-slate-500">REALTIME EXECUTION</span>
          </div>

          <div className="space-y-1 font-mono text-[10px] leading-relaxed sm:text-[11px]">
            {BOOT_LOGS.slice(0, activeLogIndex + 1).map((log, index) => (
              <div key={log.code} className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-600">[{log.time}]</span>
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
      <footer className="relative z-20 border-t border-cyan-500/20 bg-black/60 px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-cyan-400" />
            <span>NEURAL MATRIX: <strong>128/128 CORES ACTIVE</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            <span>CORE FREQUENCY: <strong>4.80 GHz // AES-256</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Radio size={14} className="text-amber-400" />
            <span>I4C 1930 RADAR: <strong>SYNCHRONIZED (0-LATENCY)</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Lock size={14} className="text-cyan-400" />
            <span>ZERO-DAY INTEGRITY: <strong className="text-emerald-300">100% SECURE</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
