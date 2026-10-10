import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import {
  QrCode,
  UploadCloud,
  Camera,
  CameraOff,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import api from "../services/api";

interface AnalysisResult {
  scan_id: number;
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  threat_category: string | null;
  confidence: number | null;
  verdict: string | null;
  analysis_details?: any;
  indicators: Array<{
    name: string;
    description: string;
    severity: string;
    score?: number;
  }>;
}

interface UpiDetails {
  payeeAddress: string;
  payeeName: string;
  amount: string;
  note: string;
  merchantCode: string;
}

export default function QRShield() {
  const [decodedData, setDecodedData] = useState<string | null>(null);
  const [qrType, setQrType] = useState<"URL" | "UPI" | "TEXT" | null>(null);
  const [upiDetails, setUpiDetails] = useState<UpiDetails | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Paste image handler from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function stopCamera() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tickCamera);
      }
    } catch {
      setError("Unable to access camera. Please allow camera permissions or upload an image instead.");
      setCameraActive(false);
    }
  };

  const tickCamera = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(tickCamera);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code && code.data) {
      stopCamera();
      processQrCode(code.data);
      return;
    }

    animFrameRef.current = requestAnimationFrame(tickCamera);
  };

  function handleImageFile(file: File) {
    setError(null);
    setAnalysisResult(null);
    setDecodedData(null);
    setQrType(null);
    setUpiDetails(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Failed to create image canvas context.");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          processQrCode(code.data);
        } else {
          setError("No QR code detected in this image. Please ensure the QR code is clear and well-lit.");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processQrCode = async (raw: string) => {
    const trimmed = raw.trim();
    setDecodedData(trimmed);

    // Check if it's a UPI Intent
    if (trimmed.toLowerCase().startsWith("upi://pay")) {
      setQrType("UPI");
      try {
        const url = new URL(trimmed);
        const params = url.searchParams;
        setUpiDetails({
          payeeAddress: params.get("pa") || "Unknown",
          payeeName: params.get("pn") || "Unknown",
          amount: params.get("am") || "Any amount (unfixed)",
          note: params.get("tn") || "None",
          merchantCode: params.get("mc") || "None",
        });
      } catch {
        // manual query parse fallback
        setUpiDetails({
          payeeAddress: "Parsed from intent",
          payeeName: "Unknown",
          amount: "Any amount",
          note: "None",
          merchantCode: "None",
        });
      }
      return;
    }

    // Check if it's a Web URL
    if (/^https?:\/\//i.test(trimmed)) {
      setQrType("URL");
      await analyzeExtractedUrl(trimmed);
      return;
    }

    // Plain text or other protocol
    setQrType("TEXT");
  };

  const analyzeExtractedUrl = async (url: string) => {
    setLoadingAnalysis(true);
    setError(null);
    try {
      const response = await api.post<AnalysisResult>("/analysis/url", {
        input_type: "URL",
        content: url,
      });
      setAnalysisResult(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to run CyberShield threat analysis on this URL.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <section className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">
            <QrCode size={26} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-cyan-400 font-bold">
              Visual Threat Detection
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              QRShield — Malicious QR Code Inspector
            </h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Scammers place deceptive QR codes on parking meters, utility bills, courier packages, and OLX ads.
          QRShield decodes the embedded content and subjects target destinations to CyberShield's multi-signal threat engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Scan or Upload QR Code</span>
              <span className="text-[10px] text-cyan-400 font-normal">Supports PNG, JPG, WebP</span>
            </h2>

            {/* Drop / Select zone */}
            <label className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[.01] hover:bg-cyan-500/[.02]">
              <UploadCloud size={32} className="text-cyan-400 mb-2" />
              <p className="text-xs font-bold text-white">Choose QR Image or Drag & Drop</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Ctrl+V</kbd> to paste a screenshot directly!
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className="hidden"
              />
            </label>

            {/* Camera Option */}
            <div className="pt-2 border-t border-white/10">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-cyan-400/40 bg-white/[.03] hover:bg-white/[.06] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Camera size={16} className="text-cyan-400" />
                  Scan with Device Camera
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-cyan-400/40 bg-black aspect-video flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-2 border-cyan-400/50 rounded-lg pointer-events-none animate-pulse m-6" />
                  </div>
                  <button
                    onClick={stopCamera}
                    className="w-full py-2 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <CameraOff size={15} />
                    Stop Camera
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Educational Quick Tip */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-400">
              <AlertTriangle size={14} /> Golden Rule of UPI QR Codes
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In India, scanning a QR code is <strong>ONLY</strong> for paying money out of your account.
              You <strong>NEVER</strong> need to scan a QR code or enter your 4/6-digit UPI PIN to receive money or refunds.
            </p>
          </div>
        </div>

        {/* Right Column: Decoded Content & Threat Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-5 min-h-[460px]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Decoded Content & Threat Assessment
            </h2>

            {!decodedData && !loadingAnalysis && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-3">
                <QrCode size={48} className="stroke-[1.2] opacity-30 text-cyan-400" />
                <p className="text-xs">Upload or scan a QR code on the left to inspect its destination.</p>
              </div>
            )}

            {loadingAnalysis && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
                <Loader2 size={36} className="animate-spin text-cyan-400" />
                <p className="text-xs font-semibold text-white">Analyzing extracted URL with CyberShield real-time engines...</p>
                <p className="text-[11px] text-slate-500">Checking DNS resolution, SSL certificates, redirect hops, and reputation feeds.</p>
              </div>
            )}

            {decodedData && !loadingAnalysis && (
              <div className="space-y-5">
                {/* Raw Decoded String */}
                <div className="p-3.5 rounded-xl bg-[#060b14] border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Decoded Payload ({qrType})</span>
                  <p className="font-mono text-xs text-cyan-300 break-all select-all">{decodedData}</p>
                </div>

                {/* Case 1: UPI PAYMENT QR */}
                {qrType === "UPI" && upiDetails && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                        <AlertTriangle size={18} />
                        PAYMENT DEBIT WARNING
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        This QR code triggers an <strong>outgoing UPI payment</strong>. If someone asked you to scan this to "receive prize money", "get an OLX advance", or "receive a refund", <strong>THIS IS A SCAM</strong>.
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[.02] border border-white/[.08] p-4 space-y-3 text-xs">
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">UPI Transaction Parameters</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Payee Name (pn)</span>
                          <span className="text-white font-medium">{upiDetails.payeeName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Payee VPA (pa)</span>
                          <span className="text-white font-mono">{upiDetails.payeeAddress}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Requested Amount (am)</span>
                          <span className="text-amber-400 font-bold">{upiDetails.amount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Transaction Note (tn)</span>
                          <span className="text-slate-300">{upiDetails.note}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Case 2: URL ANALYSIS RESULT */}
                {qrType === "URL" && analysisResult && (
                  <div className="space-y-4">
                    {/* Top Verdict Header */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[.02] border border-white/[.08]">
                      <div className="flex items-center gap-3">
                        {analysisResult.risk_level === "LOW" ? (
                          <ShieldCheck size={28} className="text-emerald-400" />
                        ) : (
                          <ShieldAlert size={28} className="text-red-400" />
                        )}
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">CyberShield Risk Verdict</p>
                          <h3 className="text-xl font-black text-white">
                            {analysisResult.risk_level || "UNKNOWN"} RISK
                          </h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white">{analysisResult.risk_score ?? "—"}</span>
                        <span className="text-slate-500 text-xs">/100</span>
                      </div>
                    </div>

                    {/* Verdict description */}
                    {analysisResult.verdict && (
                      <p className="text-xs text-slate-300 bg-white/[.02] p-3 rounded-lg border border-white/5">
                        {analysisResult.verdict}
                      </p>
                    )}

                    {/* Indicators list */}
                    {analysisResult.indicators && analysisResult.indicators.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                          Detected Security Indicators
                        </p>
                        <div className="space-y-2">
                          {analysisResult.indicators.map((ind, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-white/[.06] bg-white/[.02] flex items-start justify-between gap-3 text-xs"
                            >
                              <div>
                                <p className="font-bold text-white">{ind.name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{ind.description}</p>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
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
                )}

                {/* Case 3: PLAIN TEXT */}
                {qrType === "TEXT" && (
                  <div className="p-4 rounded-xl bg-white/[.02] border border-white/5 text-xs text-slate-300 space-y-2">
                    <p className="font-semibold text-white">Plain Text QR Content</p>
                    <p className="text-slate-400">
                      This QR code contains static text. No external URLs or automated payment intents were detected.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
