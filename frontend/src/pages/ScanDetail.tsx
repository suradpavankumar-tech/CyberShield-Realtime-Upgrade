import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileSearch,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
  Bell,
  Send,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import RiskScore from "../components/ui/RiskScore";
import ThreatIndicators from "../components/ui/ThreatIndicators";
import RiskFusionBreakdown from "../components/analysis/RiskFusionBreakdown";

import {
  deleteScan,
  getScan,
} from "../services/analysisService";
import { dispatchScanAlert } from "../services/securityModules";

import type {
  AnalysisResponse,
  RiskLevel,
} from "../types/analysis";


function formatCategory(
  category: string | null,
) {
  if (!category) {
    return "Unclassified";
  }

  return category
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}


function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


function getStatusClasses(
  status: string,
) {
  switch (
    status.toUpperCase()
  ) {

    case "COMPLETED":
      return "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300";

    case "FAILED":
      return "border-red-400/15 bg-red-400/[0.05] text-red-300";

    case "PENDING":
      return "border-amber-400/15 bg-amber-400/[0.05] text-amber-300";

    default:
      return "border-white/10 bg-white/[0.03] text-slate-400";

  }
}


function getRiskClasses(
  level: RiskLevel | null,
) {
  switch (level) {

    case "CRITICAL":
      return {
        container: "border-red-500/25 bg-red-500/[0.06]",
        icon: "text-red-200",
        text: "text-red-200",
      };

    case "HIGH":
      return {
        container:
          "border-red-400/15 bg-red-400/[0.035]",
        icon:
          "text-red-300",
        text:
          "text-red-300",
      };

    case "MEDIUM":
      return {
        container:
          "border-amber-400/15 bg-amber-400/[0.035]",
        icon:
          "text-amber-300",
        text:
          "text-amber-300",
      };

    case "LOW":
      return {
        container:
          "border-emerald-400/15 bg-emerald-400/[0.035]",
        icon:
          "text-emerald-300",
        text:
          "text-emerald-300",
      };

    default:
      return {
        container:
          "border-white/10 bg-white/[0.02]",
        icon:
          "text-slate-500",
        text:
          "text-slate-400",
      };

  }
}


function getErrorMessage(
  error: any,
  fallback: string,
) {

  const detail =
    error?.response?.data?.detail;


  if (
    typeof detail ===
    "string"
  ) {
    return detail;
  }


  if (
    Array.isArray(detail) &&
    detail.length > 0
  ) {

    return (
      detail[0]?.msg ||
      fallback
    );

  }


  if (
    typeof error?.response
      ?.data?.message ===
    "string"
  ) {

    return (
      error.response.data.message
    );

  }


  if (
    typeof error?.userMessage ===
    "string"
  ) {

    return error.userMessage;

  }


  if (
    typeof error?.message ===
    "string"
  ) {

    return error.message;

  }


  return fallback;
}


function ScanDetail() {

  const {
    scanId,
  } =
    useParams<{
      scanId: string;
    }>();


  const navigate =
    useNavigate();


  const [
    scan,
    setScan,
  ] =
    useState<AnalysisResponse | null>(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    deleting,
    setDeleting,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    actionError,
    setActionError,
  ] =
    useState("");


  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] =
    useState(false);


  const [
    polling,
    setPolling,
  ] =
    useState(false);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertChannel, setAlertChannel] = useState<"slack" | "discord" | "telegram" | "generic">("slack");
  const [alertWebhookUrl, setAlertWebhookUrl] = useState("");
  const [alertTgToken, setAlertTgToken] = useState("");
  const [alertTgChatId, setAlertTgChatId] = useState("");
  const [dispatchingAlert, setDispatchingAlert] = useState(false);
  const [alertDispatchResult, setAlertDispatchResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleDispatchAlert() {
    if (!scan) return;
    setDispatchingAlert(true);
    setAlertDispatchResult(null);
    try {
      const res = await dispatchScanAlert({
        scan_id: scan.scan_id,
        channel_type: alertChannel,
        webhook_url: alertWebhookUrl.trim() || undefined,
        telegram_bot_token: alertTgToken.trim() || undefined,
        telegram_chat_id: alertTgChatId.trim() || undefined,
      });
      setAlertDispatchResult({
        success: res.success,
        message: res.message || "Alert dispatched successfully.",
      });
    } catch (err: any) {
      setAlertDispatchResult({
        success: false,
        message: err?.response?.data?.detail || err.message || "Alert dispatch failed.",
      });
    } finally {
      setDispatchingAlert(false);
    }
  }


  /*
   * ==================================================
   * VALIDATE SCAN ID
   * ==================================================
   */

  const getNumericScanId =
    useCallback(() => {

      if (!scanId) {
        return null;
      }


      const numericId =
        Number(scanId);


      if (
        !Number.isInteger(
          numericId,
        ) ||
        numericId <= 0
      ) {

        return null;

      }


      return numericId;

    }, [scanId]);


  /*
   * ==================================================
   * LOAD INVESTIGATION
   * ==================================================
   */

  const loadScan =
    useCallback(
      async (
        options?: {
          silent?: boolean;
        },
      ) => {

        const numericId =
          getNumericScanId();


        if (!numericId) {

          setError(
            scanId
              ? "Invalid scan ID."
              : "No scan ID was provided.",
          );

          setLoading(false);

          return null;

        }


        try {

          if (
            !options?.silent
          ) {

            setLoading(true);

          }


          setError("");


          const result =
            await getScan(
              numericId,
            );


          setScan(result);


          return result;

        } catch (err: any) {

          const message =
            getErrorMessage(
              err,
              "Unable to retrieve this investigation.",
            );


          if (
            !options?.silent
          ) {

            setError(
              message,
            );

          } else {

            setActionError(
              message,
            );

          }


          return null;

        } finally {

          if (
            !options?.silent
          ) {

            setLoading(false);

          }

        }

      },
      [
        getNumericScanId,
        scanId,
      ],
    );


  /*
   * ==================================================
   * INITIAL LOAD
   * ==================================================
   */

  useEffect(() => {

    let mounted = true;


    async function initialLoad() {

      if (!mounted) {
        return;
      }


      await loadScan();

    }


    void initialLoad();


    return () => {

      mounted = false;

    };

  }, [loadScan]);


  /*
   * ==================================================
   * AUTOMATIC PENDING POLLING
   * ==================================================
   *
   * The backend remains the source of truth.
   *
   * We only poll while the current scan is PENDING.
   *
   * Polling stops automatically when:
   *
   * PENDING → COMPLETED
   * PENDING → FAILED
   *
   * This avoids:
   *
   * - unnecessary requests
   * - infinite polling
   * - client-side fabricated status
   * ==================================================
   */

  useEffect(() => {

    if (
      !scan ||
      scan.status !== "PENDING"
    ) {

      setPolling(false);

      return;

    }


    setPolling(true);


    const interval =
      window.setInterval(
        async () => {

          const result =
            await loadScan({
              silent: true,
            });


          if (
            result &&
            result.status !==
              "PENDING"
          ) {

            /*
             * The next React render will stop
             * the interval because scan.status
             * is now terminal.
             */

            setPolling(false);

          }

        },
        3_000,
      );


    return () => {

      window.clearInterval(
        interval,
      );

    };

  }, [
    scan?.scan_id,
    scan?.status,
    loadScan,
  ]);


  /*
   * ==================================================
   * MANUAL REFRESH
   * ==================================================
   */

  async function refreshScan() {

    try {

      setRefreshing(true);
      setActionError("");


      await loadScan({
        silent: true,
      });

    } finally {

      setRefreshing(false);

    }

  }


  /*
   * ==================================================
   * DELETE INVESTIGATION
   * ==================================================
   */

  async function handleDelete() {

    const numericId =
      getNumericScanId();


    if (!numericId) {
      return;
    }


    try {

      setDeleting(true);
      setActionError("");


      await deleteScan(
        numericId,
      );


      setShowDeleteConfirm(
        false,
      );


      navigate(
        "/history",
        {
          replace: true,
        },
      );

    } catch (err: any) {

      setActionError(
        getErrorMessage(
          err,
          "Unable to delete this investigation.",
        ),
      );


      setDeleting(false);
      setShowDeleteConfirm(
        false,
      );

    }

  }


  /*
   * ==================================================
   * LOADING
   * ==================================================
   */

  if (loading) {

    return (

      <section className="p-5 sm:p-6">

        <div className="mx-auto flex min-h-[650px] max-w-[1400px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">

              <Loader2
                size={25}
                className="animate-spin"
              />

            </div>


            <p className="mt-4 text-sm font-semibold text-white">
              Loading investigation
            </p>


            <p className="mt-1 text-xs leading-5 text-slate-600">
              Retrieving the latest backend analysis...
            </p>

          </div>

        </div>

      </section>

    );

  }


  /*
   * ==================================================
   * ERROR
   * ==================================================
   */

  if (
    error ||
    !scan
  ) {

    return (

      <section className="p-5 sm:p-6">

        <div className="mx-auto flex min-h-[650px] max-w-[1400px] items-center justify-center">

          <div className="w-full max-w-md rounded-2xl border border-red-400/15 bg-red-400/[0.035] p-7 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">

              <AlertCircle
                size={22}
              />

            </div>


            <h2 className="mt-4 text-lg font-semibold text-white">
              Investigation unavailable
            </h2>


            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "The requested investigation could not be retrieved."}
            </p>


            <div className="mt-6 flex justify-center gap-2">

              <button
                type="button"
                onClick={() =>
                  void loadScan()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
              >

                <RefreshCw
                  size={14}
                />

                Try again

              </button>


              <Link
                to="/history"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >

                <ArrowLeft
                  size={14}
                />

                History

              </Link>

            </div>

          </div>

        </div>

      </section>

    );

  }


  const riskClasses =
    getRiskClasses(
      scan.risk_level,
    );


  const isFailed =
    scan.status ===
    "FAILED";


  const isPending =
    scan.status ===
    "PENDING";


  const isCompleted =
    scan.status ===
    "COMPLETED";


  return (

    <>

      <section className="p-5 sm:p-6">

        <div className="mx-auto max-w-[1400px]">


          {/* ==================================================
              TOP BAR
          ================================================== */}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <Link
              to="/history"
              className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-cyan-300"
            >

              <ArrowLeft
                size={15}
              />

              Back to investigations

            </Link>


            <div className="flex flex-wrap items-center gap-2">

              <span
                className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                  scan.status,
                )}`}
              >

                {scan.status}

              </span>


              {polling && (

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-2.5 py-1 text-[9px] font-semibold text-cyan-300">

                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />

                  Live status

                </span>

              )}


              <button
                type="button"
                onClick={() =>
                  void refreshScan()
                }
                disabled={
                  refreshing
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[10px] font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >

                <RefreshCw
                  size={13}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh

              </button>


              <button
                type="button"
                onClick={() => {
                  setShowAlertModal(true);
                  setAlertDispatchResult(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-300 transition hover:bg-amber-500/20"
              >
                <Bell
                  size={13}
                  className="text-amber-400"
                />
                Broadcast Alert
              </button>


              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(
                    true,
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.025] px-3 py-2 text-[10px] font-semibold text-red-300 transition hover:bg-red-400/[0.06]"
              >

                <Trash2
                  size={13}
                />

                Delete

              </button>

            </div>

          </div>


          {/* ==================================================
              ACTION ERROR
          ================================================== */}

          {actionError && (

            <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.035] px-4 py-3 text-xs text-red-300">

              {actionError}

            </div>

          )}


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220] p-5 sm:p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">

                    Scan #{scan.scan_id}

                  </span>


                  {scan.risk_level && (

                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${riskClasses.container} ${riskClasses.text}`}
                    >

                      {scan.risk_level}
                      {" "}
                      RISK

                    </span>

                  )}

                </div>


                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Security Investigation
                </h1>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Detailed analysis generated by the CyberShield security engine.
                </p>

              </div>


              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${riskClasses.container}`}
              >

                {scan.risk_level ===
                "HIGH" ? (

                  <ShieldAlert
                    size={20}
                    className={
                      riskClasses.icon
                    }
                  />

                ) : (

                  <ShieldCheck
                    size={20}
                    className={
                      riskClasses.icon
                    }
                  />

                )}


                <div>

                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Threat classification
                  </p>


                  <p className="mt-1 text-xs font-semibold text-white">
                    {formatCategory(
                      scan.threat_category,
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              MAIN INTELLIGENCE
          ================================================== */}

          <div className="mt-5 grid gap-5 lg:grid-cols-[380px_1fr]">


            {/* LEFT */}

            <div>

              <RiskScore
                score={
                  scan.risk_score
                }
                level={
                  scan.risk_level
                }
                confidence={
                  scan.confidence
                }
              />


              {/* Metadata */}

              <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220]">

                <div className="border-b border-white/10 p-5">

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Investigation metadata
                  </p>

                </div>


                <div className="divide-y divide-white/[0.05]">


                  <div className="flex items-center justify-between gap-4 p-4">

                    <div className="flex items-center gap-2.5">

                      <FileSearch
                        size={15}
                        className="text-slate-600"
                      />

                      <span className="text-xs text-slate-500">
                        Scan ID
                      </span>

                    </div>


                    <span className="text-xs font-semibold text-white">
                      #{scan.scan_id}
                    </span>

                  </div>


                  <div className="flex items-center justify-between gap-4 p-4">

                    <div className="flex items-center gap-2.5">

                      <ShieldCheck
                        size={15}
                        className="text-slate-600"
                      />

                      <span className="text-xs text-slate-500">
                        Input type
                      </span>

                    </div>


                    <span className="text-xs font-semibold text-white">
                      {scan.input_type}
                    </span>

                  </div>


                  <div className="flex items-center justify-between gap-4 p-4">

                    <div className="flex items-center gap-2.5">

                      <CalendarClock
                        size={15}
                        className="text-slate-600"
                      />

                      <span className="text-xs text-slate-500">
                        Created
                      </span>

                    </div>


                    <span className="text-right text-[11px] text-slate-300">
                      {formatDate(
                        scan.created_at,
                      )}
                    </span>

                  </div>


                  <div className="flex items-center justify-between gap-4 p-4">

                    <div className="flex items-center gap-2.5">

                      <Clock3
                        size={15}
                        className="text-slate-600"
                      />

                      <span className="text-xs text-slate-500">
                        Completed
                      </span>

                    </div>


                    <span className="text-right text-[11px] text-slate-300">
                      {formatDate(
                        scan.completed_at,
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>


            {/* RIGHT */}

            <div>


              {/* Classification */}

              <div className="grid gap-3 sm:grid-cols-3">


                <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    Threat category
                  </p>


                  <p className="mt-2 truncate text-sm font-semibold text-white">
                    {formatCategory(
                      scan.threat_category,
                    )}
                  </p>

                </div>


                <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    Confidence
                  </p>


                  <p className="mt-2 text-2xl font-bold text-cyan-300">
                    {scan.confidence !==
                    null
                      ? `${scan.confidence}%`
                      : "—"}
                  </p>

                </div>


                <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    Indicators
                  </p>


                  <p className="mt-2 text-2xl font-bold text-white">
                    {
                      scan
                        .indicators
                        .length
                    }
                  </p>

                </div>

              </div>


              {/* Indicators */}

              <div className="mt-5">

                <ThreatIndicators
                  indicators={
                    scan.indicators
                  }
                />

              </div>


              {/* RiskFusion Multi-Signal Breakdown */}
              <div className="mt-5">
                <RiskFusionBreakdown
                  inputType={scan.input_type}
                  threatCategory={scan.threat_category}
                  indicators={scan.indicators}
                  analysisDetails={(scan as any).details || (scan as any).analysis_details}
                  riskScore={scan.risk_score}
                  confidence={scan.confidence ?? undefined}
                />
              </div>


              {/* FAILED */}

              {isFailed && (

                <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-400/[0.035] p-5">

                  <div className="flex gap-3">

                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-red-300"
                    />


                    <div>

                      <h3 className="text-sm font-semibold text-red-300">
                        Analysis failed
                      </h3>


                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {scan.error_message ||
                          "The backend reported an unsuccessful analysis without an error message."}
                      </p>

                    </div>

                  </div>

                </div>

              )}


              {/* COMPLETED */}

              {isCompleted && (

                <div className="mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.025] p-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">

                      <CheckCircle2
                        size={18}
                      />

                    </div>


                    <div>

                      <p className="text-sm font-semibold text-white">
                        Investigation completed
                      </p>


                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        This result was returned by the CyberShield analysis pipeline and persisted as scan #{scan.scan_id}.
                      </p>

                    </div>

                  </div>

                </div>

              )}


              {/* PENDING */}

              {isPending && (

                <div className="mt-5 rounded-2xl border border-amber-400/10 bg-amber-400/[0.025] p-5">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">

                      {polling ? (

                        <RefreshCw
                          size={18}
                          className="animate-spin"
                        />

                      ) : (

                        <Clock3
                          size={18}
                        />

                      )}

                    </div>


                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-white">
                        Investigation pending
                      </p>


                      <p className="mt-1 text-xs leading-5 text-slate-600">

                        {polling
                          ? "CyberShield is automatically checking the backend for the latest analysis result."
                          : "The analysis has not reached a final state yet."}

                      </p>


                      {polling && (

                        <div className="mt-3 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wider text-cyan-400">

                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />

                          Automatic status polling active

                        </div>

                      )}

                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      void refreshScan()
                    }
                    disabled={
                      refreshing
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3.5 py-2.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <RefreshCw
                      size={14}
                      className={
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                    />

                    Check now

                  </button>

                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-slate-700 sm:flex-row sm:items-center sm:justify-between">

            <span>
              CyberShield Threat Intelligence
            </span>


            <span className="flex items-center gap-1.5">

              {polling && (
                <span className="relative flex h-1.5 w-1.5">

                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />

                  <span className="relative h-1.5 w-1.5 rounded-full bg-cyan-400" />

                </span>
              )}

              Investigation #{scan.scan_id}
              {" • "}
              {polling
                ? "Checking live backend status"
                : "Live backend data"}

            </span>

          </div>

        </div>

      </section>


      {/* ==================================================
          DELETE CONFIRMATION
      ================================================== */}

      {showDeleteConfirm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-5 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1220] p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 text-red-300">

                <Trash2
                  size={18}
                />

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(
                    false,
                  )
                }
                disabled={
                  deleting
                }
                aria-label="Close delete confirmation"
                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              >

                <X size={16} />

              </button>

            </div>


            <h2 className="mt-5 text-lg font-semibold text-white">
              Delete investigation?
            </h2>


            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will permanently remove scan #
              {scan.scan_id} and its stored threat indicators from your CyberShield investigation history.
            </p>


            <div className="mt-6 flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(
                    false,
                  )
                }
                disabled={
                  deleting
                }
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                disabled={
                  deleting
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {deleting && (

                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

                )}


                {deleting
                  ? "Deleting..."
                  : "Delete investigation"}

              </button>

            </div>

          </div>

        </div>

      )}

      {/* ==================================================
          BROADCAST SOC ALERT MODAL
      ================================================== */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#091322] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Broadcast Real-time Incident Alert</h3>
                  <p className="text-[11px] text-slate-400">Dispatch finding to SIEM, Slack, or Telegram</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Channel
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {(["slack", "discord", "telegram", "generic"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setAlertChannel(ch)}
                      className={`rounded-lg py-2 text-center text-xs font-bold uppercase transition ${
                        alertChannel === ch
                          ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Endpoint configuration */}
              {alertChannel === "telegram" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Telegram Bot Token (or leave blank to use default)</label>
                    <input
                      type="password"
                      value={alertTgToken}
                      onChange={(e) => setAlertTgToken(e.target.value)}
                      placeholder="bot123456789:ABC-DEF..."
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#050b14] px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Target Chat ID / Handle</label>
                    <input
                      type="text"
                      value={alertTgChatId}
                      onChange={(e) => setAlertTgChatId(e.target.value)}
                      placeholder="@SOC_Threat_Feed or 123456789"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#050b14] px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">
                    Webhook Destination URL (or leave blank to use settings default)
                  </label>
                  <input
                    type="url"
                    value={alertWebhookUrl}
                    onChange={(e) => setAlertWebhookUrl(e.target.value)}
                    placeholder="https://test-webhook.example.com/alerts or https://siem..."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#050b14] px-3 py-2 font-mono text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}

              {/* Finding Summary Preview */}
              <div className="rounded-xl border border-white/5 bg-[#050b14] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-400">Scan #{scan?.scan_id}</span>
                  <span className={`font-bold ${scan?.risk_level === "CRITICAL" ? "text-red-400" : "text-amber-400"}`}>
                    {scan?.risk_level} ({scan?.risk_score}/100)
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-slate-300">
                  {scan?.verdict || scan?.threat_category || `${scan?.input_type} Incident #${scan?.scan_id}`}
                </p>
              </div>

              {/* Result banner */}
              {alertDispatchResult && (
                <div
                  className={`rounded-xl border p-3 text-xs font-semibold ${
                    alertDispatchResult.success
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alertDispatchResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    <span>{alertDispatchResult.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDispatchAlert}
                disabled={dispatchingAlert}
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
              >
                {dispatchingAlert ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>{dispatchingAlert ? "Broadcasting..." : "Dispatch Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </>

  );

}


export default ScanDetail;