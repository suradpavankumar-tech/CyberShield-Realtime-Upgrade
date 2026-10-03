import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSearch,
  Filter,
  Link2,
  Loader2,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  deleteScan,
  getScans,
} from "../services/analysisService";

import type {
  InputType,
  RiskLevel,
  ScanStatus,
  ScanSummary,
} from "../types/analysis";



type TypeFilter =
  | "ALL"
  | InputType;

type RiskFilter =
  | "ALL"
  | RiskLevel;

type StatusFilter =
  | "ALL"
  | ScanStatus;


const PAGE_SIZE = 20;

const HISTORY_POLL_INTERVAL = 5_000;


/*
 * =========================================================
 * FORMATTING
 * =========================================================
 */

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


/*
 * =========================================================
 * ICONS
 * =========================================================
 */

function getTypeIcon(
  type: InputType,
) {
  switch (type) {

    case "URL":
      return Link2;

    case "MESSAGE":
      return MessageSquareText;

    case "EMAIL":
      return Mail;

    default:
      return FileSearch;

  }
}


/*
 * =========================================================
 * RISK STYLING
 * =========================================================
 */

function getRiskClasses(
  level: RiskLevel | null,
) {

  switch (level) {

    case "HIGH":
      return {
        badge:
          "border-red-400/15 bg-red-400/[0.06] text-red-300",
        score:
          "text-red-300",
        dot:
          "bg-red-400",
      };

    case "MEDIUM":
      return {
        badge:
          "border-amber-400/15 bg-amber-400/[0.06] text-amber-300",
        score:
          "text-amber-300",
        dot:
          "bg-amber-400",
      };

    case "LOW":
      return {
        badge:
          "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300",
        score:
          "text-emerald-300",
        dot:
          "bg-emerald-400",
      };

    default:
      return {
        badge:
          "border-white/10 bg-white/[0.03] text-slate-500",
        score:
          "text-slate-500",
        dot:
          "bg-slate-600",
      };

  }

}


/*
 * =========================================================
 * STATUS STYLING
 * =========================================================
 */

function getStatusClasses(
  status: ScanStatus,
) {

  switch (status) {

    case "COMPLETED":
      return "text-emerald-300";

    case "FAILED":
      return "text-red-300";

    case "PENDING":
      return "text-amber-300";

    default:
      return "text-slate-500";

  }

}


/*
 * =========================================================
 * ERROR EXTRACTION
 * =========================================================
 */

function getErrorMessage(
  error: any,
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
      "The backend rejected the history request."
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


  return "Unable to load investigation history.";

}


/*
 * =========================================================
 * HISTORY PAGE
 * =========================================================
 */

function History() {

  const [
    scans,
    setScans,
  ] =
    useState<ScanSummary[]>([]);


  const [
    total,
    setTotal,
  ] =
    useState(0);


  const [
    page,
    setPage,
  ] =
    useState(1);


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
    polling,
    setPolling,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      "ALL",
    );


  const [
    riskFilter,
    setRiskFilter,
  ] =
    useState<RiskFilter>(
      "ALL",
    );


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "ALL",
    );


  const [
    deletingId,
    setDeletingId,
  ] =
    useState<number | null>(
      null,
    );


  /*
   * =======================================================
   * LOAD HISTORY
   * =======================================================
   *
   * All records come from the authenticated backend.
   */

  const loadScans =
    useCallback(
      async (
        targetPage: number,
        refresh = false,
        silent = false,
      ) => {

        try {

          if (refresh) {

            setRefreshing(
              true,
            );

          } else if (!silent) {

            setLoading(
              true,
            );

          }


          if (!silent) {
            setError("");
          }


          const response =
            await getScans({
              page: targetPage,
              page_size:
                PAGE_SIZE,

              ...(typeFilter !==
              "ALL"
                ? {
                    input_type:
                      typeFilter,
                  }
                : {}),

              ...(riskFilter !==
              "ALL"
                ? {
                    risk_level:
                      riskFilter,
                  }
                : {}),

              ...(statusFilter !==
              "ALL"
                ? {
                    status_filter:
                      statusFilter,
                  }
                : {}),
            });


          setScans(
            response.scans,
          );

          setTotal(
            response.total,
          );

          setPage(
            targetPage,
          );


          return response;

        } catch (err: any) {

          const message =
            getErrorMessage(
              err,
            );


          if (!silent) {

            setError(
              message,
            );

            setScans([]);

            setTotal(0);

          }


          return null;

        } finally {

          if (!silent) {

            setLoading(false);

          }

          if (refresh) {

            setRefreshing(
              false,
            );

          }

        }

      },
      [
        typeFilter,
        riskFilter,
        statusFilter,
      ],
    );


  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {

    void loadScans(1);

  }, [loadScans]);


  /*
   * =======================================================
   * REAL-TIME PENDING SCAN REFRESH
   * =======================================================
   *
   * History automatically checks the backend while
   * the currently visible page contains PENDING scans.
   *
   * No fake status transition is performed locally.
   */

  const hasPendingScans =
    useMemo(
      () =>
        scans.some(
          (scan) =>
            scan.status ===
            "PENDING",
        ),
      [scans],
    );


  useEffect(() => {

    if (
      !hasPendingScans
    ) {

      setPolling(false);

      return;

    }


    setPolling(true);


    let cancelled =
      false;


    const interval =
      window.setInterval(
        async () => {

          if (cancelled) {
            return;
          }


          const response =
            await loadScans(
              page,
              false,
              true,
            );


          if (
            !response
          ) {
            return;
          }


          const stillPending =
            response.scans.some(
              (scan) =>
                scan.status ===
                "PENDING",
            );


          if (
            !stillPending
          ) {

            setPolling(
              false,
            );

          }

        },
        HISTORY_POLL_INTERVAL,
      );


    return () => {

      cancelled = true;

      window.clearInterval(
        interval,
      );

      setPolling(false);

    };

  }, [
    hasPendingScans,
    page,
    loadScans,
  ]);


  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  async function handleDelete(
    scanId: number,
  ) {

    const confirmed =
      window.confirm(
        `Delete investigation #${scanId}?\n\nThis will permanently remove the scan from your investigation history.`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingId(
        scanId,
      );

      setError("");


      await deleteScan(
        scanId,
      );


      const remaining =
        scans.length - 1;


      const nextPage =
        remaining === 0 &&
        page > 1
          ? page - 1
          : page;


      await loadScans(
        nextPage,
        true,
      );

    } catch (err: any) {

      setError(
        getErrorMessage(
          err,
        ),
      );

    } finally {

      setDeletingId(
        null,
      );

    }

  }


  /*
   * =======================================================
   * LOCAL SEARCH
   * =======================================================
   */

  const filteredScans =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      if (!query) {
        return scans;
      }


      return scans.filter(
        (scan) => {

          const values = [
            String(
              scan.scan_id,
            ),

            scan.input_type,

            scan.status,

            scan.risk_level ??
              "",

            scan.threat_category ??
              "",

            String(
              scan.risk_score ??
                "",
            ),

            String(
              scan.confidence ??
                "",
            ),
          ];


          return values.some(
            (value) =>
              value
                .toLowerCase()
                .includes(
                  query,
                ),
          );

        },
      );

    }, [
      scans,
      search,
    ]);


  /*
   * =======================================================
   * PAGINATION
   * =======================================================
   */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
          PAGE_SIZE,
      ),
    );


  const hasPreviousPage =
    page > 1;


  const hasNextPage =
    page <
    totalPages;


  const visibleStart =
    total === 0
      ? 0
      : (page - 1) *
          PAGE_SIZE +
        1;


  const visibleEnd =
    Math.min(
      page *
        PAGE_SIZE,
      total,
    );


  function goToPage(
    nextPage: number,
  ) {

    if (
      nextPage < 1 ||
      nextPage >
        totalPages ||
      nextPage === page
    ) {
      return;
    }


    setSearch("");


    void loadScans(
      nextPage,
    );

  }


  function clearFilters() {

    setSearch("");

    setTypeFilter(
      "ALL",
    );

    setRiskFilter(
      "ALL",
    );

    setStatusFilter(
      "ALL",
    );

  }


  const hasFilters =
    Boolean(search) ||
    typeFilter !== "ALL" ||
    riskFilter !== "ALL" ||
    statusFilter !== "ALL";


  /*
   * =======================================================
   * LOADING
   * =======================================================
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


            <h2 className="mt-5 text-lg font-semibold text-white">
              Loading investigation history
            </h2>


            <p className="mt-2 text-sm text-slate-600">
              Retrieving your real CyberShield scan records.
            </p>

          </div>

        </div>

      </section>

    );

  }


  /*
   * =======================================================
   * UI
   * =======================================================
   */

  return (

    <section className="p-5 sm:p-6">

      <div className="mx-auto max-w-[1400px]">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">

              <FileSearch
                size={15}
              />

              Investigation history

            </div>


            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Scan history
            </h1>


            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review, filter, investigate, and remove previously analyzed security events.
            </p>

          </div>


          <div className="flex flex-wrap items-center gap-2">


            {polling && (

              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/10 bg-amber-400/[0.035] px-3 py-2.5 text-[10px] font-semibold text-amber-300">

                <span className="relative flex h-1.5 w-1.5">

                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />

                  <span className="relative h-1.5 w-1.5 rounded-full bg-amber-400" />

                </span>

                Checking pending scans

              </div>

            )}


            <button
              type="button"
              onClick={() =>
                void loadScans(
                  page,
                  true,
                )
              }
              disabled={
                refreshing
              }
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >

              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />


              {refreshing
                ? "Refreshing..."
                : "Refresh history"}

            </button>

          </div>

        </div>


        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">


          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
              Total records
            </p>


            <p className="mt-2 text-2xl font-bold text-white">
              {total}
            </p>


            <p className="mt-1 text-[10px] text-slate-600">
              Matching backend records
            </p>

          </div>


          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
              Current page
            </p>


            <p className="mt-2 text-2xl font-bold text-cyan-300">

              {total === 0
                ? 0
                : page}

              <span className="text-sm font-medium text-slate-600">

                {" "}
                /{" "}
                {totalPages}

              </span>

            </p>


            <p className="mt-1 text-[10px] text-slate-600">
              {visibleStart}–{visibleEnd} currently visible
            </p>

          </div>


          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">

            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
              Visible results
            </p>


            <p className="mt-2 text-2xl font-bold text-white">
              {filteredScans.length}
            </p>


            <p className="mt-1 text-[10px] text-slate-600">
              After local search
            </p>

          </div>

        </div>


        {/* ==================================================
            FILTER BAR
        ================================================== */}

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1220] p-4">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">


            <div className="relative min-w-0 flex-1">

              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />


              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search scan ID, category, risk, status..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.025] py-3 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/25 focus:bg-cyan-400/[0.02]"
              />

            </div>


            <select
              value={
                typeFilter
              }
              onChange={(
                event,
              ) =>
                setTypeFilter(
                  event.target
                    .value as TypeFilter,
                )
              }
              className="rounded-xl border border-white/10 bg-[#0b1423] px-3 py-3 text-xs font-medium text-slate-400 outline-none transition focus:border-cyan-400/25"
            >

              <option value="ALL">
                All input types
              </option>

              <option value="URL">
                URLs
              </option>

              <option value="MESSAGE">
                Messages
              </option>

              <option value="EMAIL">
                Emails
              </option>

            </select>


            <select
              value={
                riskFilter
              }
              onChange={(
                event,
              ) =>
                setRiskFilter(
                  event.target
                    .value as RiskFilter,
                )
              }
              className="rounded-xl border border-white/10 bg-[#0b1423] px-3 py-3 text-xs font-medium text-slate-400 outline-none transition focus:border-cyan-400/25"
            >

              <option value="ALL">
                All risk levels
              </option>

              <option value="HIGH">
                High risk
              </option>

              <option value="MEDIUM">
                Medium risk
              </option>

              <option value="LOW">
                Low risk
              </option>

            </select>


            <select
              value={
                statusFilter
              }
              onChange={(
                event,
              ) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter,
                )
              }
              className="rounded-xl border border-white/10 bg-[#0b1423] px-3 py-3 text-xs font-medium text-slate-400 outline-none transition focus:border-cyan-400/25"
            >

              <option value="ALL">
                All statuses
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="FAILED">
                Failed
              </option>

            </select>


            <button
              type="button"
              onClick={
                clearFilters
              }
              disabled={
                !hasFilters
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-xs font-semibold text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >

              <Filter
                size={14}
              />

              Clear

            </button>

          </div>


          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-700">

            <Filter
              size={12}
            />

            <span>
              Type, risk level, and status filters are processed by the backend.
            </span>

          </div>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-400/[0.035] p-5">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-300"
            />


            <div className="min-w-0">

              <h3 className="text-sm font-semibold text-red-300">
                Unable to load history
              </h3>


              <p className="mt-1 text-xs leading-5 text-slate-500">
                {error}
              </p>


              <button
                type="button"
                onClick={() =>
                  void loadScans(
                    page,
                    true,
                  )
                }
                className="mt-3 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                Try again
              </button>

            </div>

          </div>

        )}


        {/* ==================================================
            RESULTS
        ================================================== */}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220]">

          <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Investigation records
              </p>


              <h2 className="mt-1 text-lg font-semibold text-white">
                {filteredScans.length} visible results
              </h2>

            </div>


            <div className="flex items-center gap-2 text-[10px] text-slate-600">

              <FileSearch
                size={13}
              />

              Backend page{" "}
              {total === 0
                ? 0
                : page}{" "}
              of{" "}
              {totalPages}

            </div>

          </div>


          {filteredScans.length ===
          0 ? (

            <div className="flex min-h-[350px] items-center justify-center p-8">

              <div className="max-w-sm text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-slate-600">

                  <FileSearch
                    size={24}
                  />

                </div>


                <h3 className="mt-5 text-lg font-semibold text-white">
                  No investigations found
                </h3>


                <p className="mt-2 text-sm leading-6 text-slate-600">

                  {hasFilters
                    ? "No scan records match the current search and filters."
                    : "No investigation records have been created yet."}

                </p>


                {hasFilters && (

                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Clear filters
                  </button>

                )}

              </div>

            </div>

          ) : (

            <div className="divide-y divide-white/[0.05]">

              {filteredScans.map(
                (scan) => {

                  const TypeIcon =
                    getTypeIcon(
                      scan.input_type,
                    );


                  const riskClasses =
                    getRiskClasses(
                      scan.risk_level,
                    );


                  const isPending =
                    scan.status ===
                    "PENDING";


                  return (

                    <div
                      key={
                        scan.scan_id
                      }
                      className="group flex flex-col gap-4 p-4 transition hover:bg-white/[0.018] sm:p-5 lg:flex-row lg:items-center"
                    >


                      {/* INPUT */}

                      <div className="flex min-w-0 flex-1 items-center gap-3">

                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.035] text-slate-500">

                          <TypeIcon
                            size={17}
                          />


                          {isPending && (

                            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">

                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-50" />

                              <span className="relative h-2.5 w-2.5 rounded-full bg-amber-400" />

                            </span>

                          )}

                        </div>


                        <div className="min-w-0">

                          <div className="flex items-center gap-2">

                            <span className="text-xs font-bold text-white">
                              #{scan.scan_id}
                            </span>


                            <span className="rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-600">
                              {scan.input_type}
                            </span>

                          </div>


                          <p className="mt-1 truncate text-xs text-slate-600">
                            {formatCategory(
                              scan.threat_category,
                            )}
                          </p>

                        </div>

                      </div>


                      {/* RISK */}

                      <div className="flex items-center gap-3 lg:w-[145px]">

                        <span
                          className={`text-xl font-bold ${riskClasses.score}`}
                        >
                          {scan.risk_score ??
                            "—"}
                        </span>


                        <div className="flex items-center gap-1.5">

                          <span
                            className={`h-1.5 w-1.5 rounded-full ${riskClasses.dot}`}
                          />


                          <span
                            className={`rounded-lg border px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${riskClasses.badge}`}
                          >
                            {scan.risk_level ??
                              "N/A"}
                          </span>

                        </div>

                      </div>


                      {/* CONFIDENCE */}

                      <div className="lg:w-[110px]">

                        <p className="text-[9px] uppercase tracking-wider text-slate-700">
                          Confidence
                        </p>


                        <p className="mt-1 text-xs font-semibold text-slate-300">

                          {scan.confidence !==
                          null
                            ? `${scan.confidence}%`
                            : "—"}

                        </p>

                      </div>


                      {/* STATUS */}

                      <div className="lg:w-[130px]">

                        <p className="text-[9px] uppercase tracking-wider text-slate-700">
                          Status
                        </p>


                        <div className="mt-1 flex items-center gap-2">

                          {isPending && (

                            <RefreshCw
                              size={11}
                              className="animate-spin text-amber-400"
                            />

                          )}


                          <p
                            className={`text-xs font-semibold ${getStatusClasses(
                              scan.status,
                            )}`}
                          >
                            {scan.status}
                          </p>

                        </div>

                      </div>


                      {/* DATE */}

                      <div className="hidden lg:block lg:w-[185px]">

                        <div className="flex items-center gap-2 text-[10px] text-slate-600">

                          <CalendarDays
                            size={13}
                          />

                          {formatDate(
                            scan.created_at,
                          )}

                        </div>


                        {scan.completed_at && (

                          <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-700">

                            <Clock3
                              size={12}
                            />

                            Completed{" "}

                            {formatDate(
                              scan.completed_at,
                            )}

                          </div>

                        )}

                      </div>


                      {/* ACTIONS */}

                      <div className="flex items-center gap-2">

                        <Link
                          to={`/scan/${scan.scan_id}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5 text-[10px] font-semibold text-slate-400 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.04] hover:text-cyan-300 sm:flex-none"
                        >

                          Investigate

                          <ChevronRight
                            size={13}
                          />

                        </Link>


                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              scan.scan_id,
                            )
                          }
                          disabled={
                            deletingId ===
                            scan.scan_id
                          }
                          title="Delete investigation"
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-600 transition hover:border-red-400/15 hover:bg-red-400/[0.04] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          {deletingId ===
                          scan.scan_id ? (

                            <Loader2
                              size={14}
                              className="animate-spin"
                            />

                          ) : (

                            <Trash2
                              size={14}
                            />

                          )}

                        </button>

                      </div>

                    </div>

                  );

                },
              )}

            </div>

          )}


          {/* ==================================================
              PAGINATION
          ================================================== */}

          {total > 0 && (

            <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-[10px] text-slate-600">

                Showing{" "}

                <span className="font-semibold text-slate-400">
                  {visibleStart}
                </span>{" "}

                to{" "}

                <span className="font-semibold text-slate-400">
                  {visibleEnd}
                </span>{" "}

                of{" "}

                <span className="font-semibold text-slate-400">
                  {total}
                </span>{" "}

                investigations

              </p>


              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      page - 1,
                    )
                  }
                  disabled={
                    !hasPreviousPage
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] font-semibold text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >

                  <ChevronLeft
                    size={13}
                  />

                  Previous

                </button>


                <span className="min-w-[80px] text-center text-[10px] font-semibold text-slate-500">

                  Page {page} /{" "}
                  {totalPages}

                </span>


                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      page + 1,
                    )
                  }
                  disabled={
                    !hasNextPage
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] font-semibold text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >

                  Next

                  <ChevronRight
                    size={13}
                  />

                </button>

              </div>

            </div>

          )}

        </div>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-slate-700 sm:flex-row sm:items-center sm:justify-between">

          <span>
            CyberShield Threat Intelligence
          </span>


          <span className="flex items-center gap-1.5">

            <span
              className={`relative flex h-1.5 w-1.5 ${
                polling
                  ? ""
                  : ""
              }`}
            >

              <span
                className={`relative h-1.5 w-1.5 rounded-full ${
                  polling
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
              />

            </span>


            {polling
              ? "Monitoring pending backend analysis"
              : "Live backend investigation records"}

          </span>

        </div>

      </div>

    </section>

  );




}


export default History;