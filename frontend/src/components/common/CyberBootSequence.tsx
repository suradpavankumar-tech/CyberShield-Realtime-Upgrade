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

const TOTAL_DURATION_MS = 50000; // 50.0 seconds total military boot sequence

const BOOT_PHASES = [
  { id: 1, name: "HARDWARE IGNITION", time: "00:00 - 00:10", desc: "Cold bus power relays & cryogenic pumps" },
  { id: 2, name: "NEURAL PROCESSORS", time: "00:10 - 00:20", desc: "128 Heuristic cores & quantum ciphers" },
  { id: 3, name: "THREAT ENGINES", time: "00:20 - 00:30", desc: "Multi-signal NLP & zero-day heuristics" },
  { id: 4, name: "NATIONAL GRID", time: "00:30 - 00:40", desc: "I4C 1930 & CERT-In telemetry uplinks" },
  { id: 5, name: "SHIELD ARMED", time: "00:40 - 00:50", desc: "Full weapons-free defense lockdown" },
];

const BOOT_LOGS = [
  // Phase 1 (0s - 10s): Hardware Ignition
  { atSec: 0.8, code: "PWR_RELAY_01", text: "Energizing primary 480V high-voltage defense bus...", status: "NOMINAL", color: "text-emerald-400" },
  { atSec: 2.2, code: "CRYO_COOLANT", text: "Liquid helium loop engaged (temperature: 18.2 Kelvin)...", status: "STABLE", color: "text-cyan-400" },
  { atSec: 3.8, code: "ENTROPY_SEED", text: "Harvesting hardware quantum true-random noise (TRNG)...", status: "PRIMED", color: "text-cyan-400" },
  { atSec: 5.4, code: "MEM_ECC_TEST", text: "Parity verification on 64 GB ultra-fast DMA cache...", status: "PASSED", color: "text-emerald-400" },
  { atSec: 7.2, code: "BIOS_SECURE", text: "Validating cryptographic UEFI firmware checksums...", status: "AUTHENTIC", color: "text-cyan-300" },
  { atSec: 9.0, code: "BUS_INTERCONNECT", text: "PCIe Gen 5 high-speed optic fabric synchronizing...", status: "LOCKED", color: "text-emerald-400" },

  // Phase 2 (10s - 20s): Neural Processors & Quantum Ciphers
  { atSec: 10.6, code: "KERNEL_SPINUP", text: "Booting 128-bit hardened defense microkernel (v2.0.4)...", status: "ONLINE", color: "text-cyan-400" },
  { atSec: 12.3, code: "VECTOR_AVX512", text: "Enabling tensor math acceleration units across all cores...", status: "ENGAGED", color: "text-cyan-300" },
  { atSec: 14.1, code: "KYBER_1024", text: "Post-quantum lattice encryption keys generated...", status: "SECURE", color: "text-violet-400" },
  { atSec: 15.9, code: "CIPHER_AES_GCM", text: "Quantum cipher pool armed with 256-bit Galois counter...", status: "ARMED", color: "text-cyan-400" },
  { atSec: 17.6, code: "ZK_PROOFS", text: "Zero-knowledge verification registers allocated...", status: "READY", color: "text-violet-300" },
  { atSec: 19.2, code: "CORE_MATRIX", text: "128/128 Neural heuristic processing cores synchronized...", status: "100%", color: "text-emerald-400" },

  // Phase 3 (20s - 30s): Threat Engines
  { atSec: 20.8, code: "NLP_TRANSFORMER", text: "Loading 7.8B perimeter threat classification weights...", status: "LOADED", color: "text-cyan-400" },
  { atSec: 22.5, code: "PHISH_URGENCY", text: "Calibrating multilingual social-engineering detectors...", status: "ACTIVE", color: "text-amber-400" },
  { atSec: 24.2, code: "ZERO_DAY_AI", text: "Priming behavioral anomaly heuristic radar...", status: "ARMED", color: "text-rose-400" },
  { atSec: 26.0, code: "APK_SANDBOX", text: "Spooling isolated Android permission analysis environment...", status: "STANDBY", color: "text-cyan-300" },
  { atSec: 27.8, code: "QR_INSPECTOR", text: "Arming multi-hop QR redirect & deep-payload parser...", status: "READY", color: "text-emerald-400" },
  { atSec: 29.4, code: "EMAIL_SPF_DKIM", text: "Forensic header authentication validator online...", status: "ONLINE", color: "text-cyan-400" },

  // Phase 4 (30s - 40s): National Grid & Telemetry
  { atSec: 30.9, code: "NAT_TELEMETRY", text: "Connecting to National Cybercrime Helpline (I4C 1930)...", status: "CONNECTED", color: "text-amber-400" },
  { atSec: 32.6, code: "CERT_IN_SYNC", text: "Subscribing to real-time national advisory feed...", status: "STREAMING", color: "text-emerald-400" },
  { atSec: 34.4, code: "FIN_FRAUD_RADAR", text: "RBI & NPCI banking spoofing heuristic monitors...", status: "LISTENING", color: "text-amber-300" },
  { atSec: 36.2, code: "BGP_ROUTING", text: "Establishing global IP prefix hijack inspection socket...", status: "ACTIVE", color: "text-cyan-400" },
  { atSec: 38.0, code: "STATE_EMERGENCY", text: "Mounting Pan-India emergency directory (Dial 112)...", status: "MAPPED", color: "text-emerald-300" },
  { atSec: 39.5, code: "GRID_LATENCY", text: "Telemetry ping: 0.2ms latency across defense nodes...", status: "OPTIMAL", color: "text-emerald-400" },

  // Phase 5 (40s - 50s): Shield Arming & Final Overcharge
  { atSec: 40.8, code: "BROWSER_SHIELD", text: "Engaging MV3 pre-navigation threat interceptor...", status: "ONLINE", color: "text-cyan-400" },
  { atSec: 42.4, code: "IDENTITY_VAULT", text: "Locking dark web k-Anonymity credential vault...", status: "SECURE", color: "text-violet-400" },
  { atSec: 44.0, code: "FIREWALL_STATE", text: "Activating deep packet inspection barrier filters...", status: "ARMED", color: "text-emerald-400" },
  { atSec: 45.8, code: "THREAT_GRAPH", text: "Synchronizing multi-target threat correlation nodes...", status: "SYNCHED", color: "text-cyan-300" },
  { atSec: 47.4, code: "REACTOR_OVERCHARGE", text: "Pumping plasma reactor core to 120% military power...", status: "OVERCHARGE", color: "text-amber-400" },
  { atSec: 48.8, code: "GRID_LOCKDOWN", text: "All 14 tactical security subsystems synchronized...", status: "PRIMED", color: "text-emerald-400" },
  { atSec: 49.6, code: "SYSTEM_ARMED", text: "CYBERSHIELD 2.0 FULL DEFENSE GRID ENGAGED...", status: "100% ARMED", color: "text-emerald-300" },
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

  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneSubRef = useRef<OscillatorNode | null>(null);
  const droneFilterRef = useRef<BiquadFilterNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const lastPingSecRef = useRef(0);
  const lastPhaseRef = useRef(1);
  const terminalScrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize or resume AudioContext
  function getAudioContext(): AudioContext | null {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }

  // Start continuous reactor spooling drone
  function startContinuousDrone() {
    const ctx = getAudioContext();
    if (!ctx || droneOscRef.current) return;

    try {
      // Primary Turbine Drone Oscillator
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(42, ctx.currentTime);

      sub.type = "sine";
      sub.frequency.setValueAtTime(32, ctx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(110, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.065, ctx.currentTime + 1.2);

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      sub.start();

      droneOscRef.current = osc;
      droneSubRef.current = sub;
      droneFilterRef.current = filter;
      droneGainRef.current = gain;
    } catch {
      // Audio graceful fallback
    }
  }

  // Stop continuous reactor spooling drone
  function stopContinuousDrone() {
    if (droneGainRef.current && audioCtxRef.current) {
      try {
        const ctx = audioCtxRef.current;
        droneGainRef.current.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        setTimeout(() => {
          droneOscRef.current?.stop();
          droneSubRef.current?.stop();
          droneOscRef.current = null;
          droneSubRef.current = null;
          droneFilterRef.current = null;
          droneGainRef.current = null;
        }, 350);
      } catch {
        // ignore
      }
    }
  }

  // Update drone pitch & filter over the 50-second timeline
  function updateDronePitch(pct: number) {
    if (!droneOscRef.current || !droneFilterRef.current || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      // Spool up from 42Hz to 210Hz
      const targetFreq = 42 + (pct / 100) * 168;
      droneOscRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);

      // Sub bass follows octave below
      if (droneSubRef.current) {
        droneSubRef.current.frequency.setTargetAtTime(targetFreq * 0.5, ctx.currentTime, 0.1);
      }

      // Filter opens from 110Hz to 850Hz as reactor charges
      const targetCutoff = 110 + (pct / 100) * 740;
      droneFilterRef.current.frequency.setTargetAtTime(targetCutoff, ctx.currentTime, 0.1);
    } catch {
      // ignore
    }
  }

  // Rhythmic Radar Sonar Ping
  function playRadarPing() {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // ignore
    }
  }

  // Terminal Log Packet Chirp
  function playPacketChirp(logIndex: number) {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = logIndex % 2 === 0 ? "sine" : "triangle";
      const baseFreq = 850 + (logIndex % 8) * 110;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 240, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // ignore
    }
  }

  // Phase Transition Chime
  function playPhaseChime(phaseNum: number) {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const baseNotes = [440, 523.25, 587.33, 659.25, 783.99];
      const note = baseNotes[phaseNum - 1] || 440;

      [note, note * 1.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.55);
      });
    } catch {
      // ignore
    }
  }

  // Climax "ALL SYSTEMS ARMED" Final Overcharge Fanfare
  function playClimaxChord() {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Powerful cyber chord: C3, C4, E4, G4, C5 + Sub bass boom
      const chord = [130.81, 261.63, 329.63, 392.0, 523.25, 659.25];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx < 2 ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.03);

        gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.03);
        osc.stop(ctx.currentTime + 1.45);
      });
    } catch {
      // ignore
    }
  }

  // 50-Second Main Animation & Sound Driver
  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.floor((elapsed / TOTAL_DURATION_MS) * 100));
      const currentSec = elapsed / 1000;

      setElapsedMs(elapsed);
      setProgress(rawPct);

      // Determine active Phase (1 to 5)
      const phaseNum = Math.min(5, Math.floor(currentSec / 10) + 1);
      setCurrentPhase(phaseNum);

      if (phaseNum !== lastPhaseRef.current) {
        lastPhaseRef.current = phaseNum;
        playPhaseChime(phaseNum);
      }

      // Update Spooling Drone Pitch
      if (soundEnabledRef.current) {
        updateDronePitch(rawPct);
      }

      // Rhythmic Sonar Ping every 2.5 seconds
      if (currentSec - lastPingSecRef.current >= 2.5) {
        lastPingSecRef.current = currentSec;
        playRadarPing();
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
          playPacketChirp(newestIndex);
          // Auto-scroll terminal to bottom
          if (terminalScrollRef.current) {
            terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
          }
          return newestIndex;
        }
        return prev;
      });

      // 50 Seconds Completed -> Armed Climax Sequence
      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        playClimaxChord();
        stopContinuousDrone();

        // Hold armed state momentarily, then trigger warp iris dissolve
        setTimeout(() => {
          setIsWarpingOut(true);
          setTimeout(() => {
            onComplete();
          }, 700);
        }, 600);
      }
    }, 40);

    // Keyboard shortcut handlers (ESC or Space to Skip, M to toggle mute)
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
      stopContinuousDrone();
    };
  }, []);

  function handleSkip() {
    stopContinuousDrone();
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
        startContinuousDrone();
        playRadarPing();
      } else {
        stopContinuousDrone();
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
            // CYBERSHIELD BIOS 2.0.4 // 50s TACTICAL POWER-ON
          </span>
          <span className="hidden md:inline-block text-[9px] text-slate-500">
            [SYS_STATE: FULL_GRID_INITIALIZATION]
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent Audio Toggle */}
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
            title="Toggle military reactor audio synthesis (Shortcut: M)"
          >
            {soundEnabled ? <Volume2 size={13} className="text-emerald-400" /> : <VolumeX size={13} />}
            <span>AUDIO {soundEnabled ? "ON [TACTICAL]" : "OFF (CLICK TO ENABLE)"}</span>
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
          5-PHASE STEPPER HUD BAR
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
              <span>[🔊 CLICK ANYWHERE OR PRESS &apos;M&apos; TO ENGAGE TACTICAL AUDIO STREAM]</span>
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
            style={{ animation: "cyber-shockwave-expand 2.5s ease-out infinite" }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-emerald-400"
            style={{ animation: "cyber-shockwave-expand 2.5s ease-out 1.25s infinite" }}
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
            // NATIONAL SOC DEFENSE SUITE // 50s POWER-ON INITIALIZATION
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
              <span className="text-slate-400">T+{currentSeconds}s / 50.0s</span>
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
              <span className="font-bold tracking-wider">// KERNEL BOOT STREAM (30 MODULES)</span>
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
