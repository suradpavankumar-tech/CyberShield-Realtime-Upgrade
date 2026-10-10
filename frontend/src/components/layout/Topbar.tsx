import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserRound,
  X,
  XCircle,
  Activity,
  Power,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { getDashboard } from "../../services/dashboardService";


interface TopbarProps {
  onMenuClick: () => void;
  onMobileMenuClick: () => void;
}


interface SecurityNotification {
  id: string;
  title: string;
  description: string;
  type:
    | "HIGH"
    | "FAILED"
    | "PENDING";
  actionPath: string;
}


const NOTIFICATION_READ_KEY =
  "cybershield_notification_read";


function Topbar({
  onMenuClick,
  onMobileMenuClick,
}: TopbarProps) {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  const {
    user,
    logout,
  } = useAuth();


  const {
    settings,
  } = useSettings();


  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);


  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);


  const [
    notifications,
    setNotifications,
  ] = useState<
    SecurityNotification[]
  >([]);


  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);


  const [
    notificationsLoaded,
    setNotificationsLoaded,
  ] = useState(false);


  const [
    readNotificationIds,
    setReadNotificationIds,
  ] = useState<string[]>(
    () => {
      try {
        const stored =
          localStorage.getItem(
            NOTIFICATION_READ_KEY,
          );

        if (!stored) {
          return [];
        }

        const parsed =
          JSON.parse(stored);

        return Array.isArray(parsed)
          ? parsed.filter(
              (value): value is string =>
                typeof value ===
                "string",
            )
          : [];

      } catch {
        return [];
      }
    },
  );


  const profileRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  const notificationRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [timeString, setTimeString] = useState(() => {
    return new Date().toISOString().slice(11, 19) + " UTC";
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(new Date().toISOString().slice(11, 19) + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  /*
   * ==================================================
   * USER INFORMATION
   * ==================================================
   */

  const fullName =
    user?.full_name?.trim() ||
    "Pavankumar S";


  const email =
    user?.email ||
    "Authenticated account";


  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase(),
      )
      .join("") || "U";


  /*
   * ==================================================
   * PERSIST READ NOTIFICATION IDS
   * ==================================================
   */

  useEffect(() => {

    try {

      localStorage.setItem(
        NOTIFICATION_READ_KEY,
        JSON.stringify(
          readNotificationIds,
        ),
      );

    } catch {
      /*
       * Notification read state is a convenience
       * preference. Failure to persist it must never
       * affect the application.
       */
    }

  }, [readNotificationIds]);


  /*
   * ==================================================
   * LOAD REAL BACKEND NOTIFICATIONS
   * ==================================================
   */

  async function loadNotifications() {

    if (
      !user ||
      !settings.securityNotifications
    ) {

      setNotifications([]);
      setNotificationsLoaded(true);

      return;

    }


    if (notificationsLoading) {
      return;
    }


    try {

      setNotificationsLoading(
        true,
      );


      const dashboard =
        await getDashboard();


      const generated:
        SecurityNotification[] =
        [];


      /*
       * ------------------------------------------------
       * HIGHEST-RISK INVESTIGATION
       * ------------------------------------------------
       */

      if (
        dashboard.highest_risk_scan &&
        dashboard.highest_risk_scan
          .risk_level ===
          "HIGH"
      ) {

        const scan =
          dashboard.highest_risk_scan;


        generated.push({

          id:
            `high-${scan.scan_id}`,

          title:
            "High-risk investigation detected",

          description:
            `Scan #${scan.scan_id} has a high-risk classification with a risk score of ${
              scan.risk_score ??
              "—"
            }.`,

          type:
            "HIGH",

          actionPath:
            `/scan/${scan.scan_id}`,

        });

      }


      /*
       * ------------------------------------------------
       * FAILED INVESTIGATIONS
       * ------------------------------------------------
       */

      const failedCount =
        dashboard
          .status_distribution
          .failed;


      if (failedCount > 0) {

        generated.push({

          id:
            "failed-investigations",

          title:
            "Failed investigations require attention",

          description:
            `${failedCount} investigation${
              failedCount === 1
                ? ""
                : "s"
            } failed during analysis.`,

          type:
            "FAILED",

          actionPath:
            "/history",

        });

      }


      /*
       * ------------------------------------------------
       * PENDING INVESTIGATIONS
       * ------------------------------------------------
       */

      const pendingCount =
        dashboard
          .status_distribution
          .pending;


      if (pendingCount > 0) {

        generated.push({

          id:
            "pending-investigations",

          title:
            "Investigations are still pending",

          description:
            `${pendingCount} investigation${
              pendingCount === 1
                ? ""
                : "s"
            } are awaiting final analysis.`,

          type:
            "PENDING",

          actionPath:
            "/history",

        });

      }


      setNotifications(
        generated,
      );


      setNotificationsLoaded(
        true,
      );


      /*
       * Remove read IDs that no longer represent
       * current notifications.
       *
       * This prevents localStorage from growing
       * indefinitely.
       */

      const currentIds =
        new Set(
          generated.map(
            (notification) =>
              notification.id,
          ),
        );


      setReadNotificationIds(
        (current) =>
          current.filter(
            (id) =>
              currentIds.has(id),
          ),
      );

    } catch {

      /*
       * Never fabricate notifications if the
       * backend is unavailable.
       */

      setNotifications([]);


      setNotificationsLoaded(
        true,
      );

    } finally {

      setNotificationsLoading(
        false,
      );

    }

  }


  /*
   * ==================================================
   * BACKEND REFRESH
   * ==================================================
   *
   * Notification preference controls whether the
   * backend notification polling exists at all.
   * ==================================================
   */

  useEffect(() => {

    if (
      !user ||
      !settings.securityNotifications
    ) {

      setNotifications([]);
      setNotificationsLoaded(false);

      return;

    }


    void loadNotifications();


    const interval =
      window.setInterval(
        () => {
          void loadNotifications();
        },
        60_000,
      );


    return () => {

      window.clearInterval(
        interval,
      );

    };

  }, [
    user,
    settings.securityNotifications,
  ]);


  /*
   * ==================================================
   * UNREAD NOTIFICATIONS
   * ==================================================
   */

  const unreadNotifications =
    useMemo(
      () => {

        return notifications.filter(
          (notification) =>
            !readNotificationIds.includes(
              notification.id,
            ),
        );

      },
      [
        notifications,
        readNotificationIds,
      ],
    );


  const unreadCount =
    settings.securityNotifications
      ? unreadNotifications.length
      : 0;


  /*
   * ==================================================
   * CLOSE MENUS ON ROUTE CHANGE
   * ==================================================
   */

  useEffect(() => {

    setProfileOpen(false);
    setNotificationsOpen(false);

  }, [location.pathname]);


  /*
   * ==================================================
   * OUTSIDE CLICK + ESCAPE
   * ==================================================
   */

  useEffect(() => {

    function handlePointerDown(
      event: MouseEvent,
    ) {

      const target =
        event.target as Node;


      if (
        profileRef.current &&
        !profileRef.current.contains(
          target,
        )
      ) {

        setProfileOpen(false);

      }


      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          target,
        )
      ) {

        setNotificationsOpen(false);

      }

    }


    function handleKeyDown(
      event: KeyboardEvent,
    ) {

      if (
        event.key ===
        "Escape"
      ) {

        setProfileOpen(false);
        setNotificationsOpen(false);

      }

    }


    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );


    document.addEventListener(
      "keydown",
      handleKeyDown,
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );


      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

    };

  }, []);


  /*
   * ==================================================
   * LOGOUT
   * ==================================================
   */

  function handleLogout() {

    setProfileOpen(false);
    setNotificationsOpen(false);

    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );

  }


  /*
   * ==================================================
   * NOTIFICATION BUTTON
   * ==================================================
   */

  function handleNotificationsClick() {

    if (
      !settings.securityNotifications
    ) {

      return;

    }


    const nextState =
      !notificationsOpen;


    setNotificationsOpen(
      nextState,
    );


    setProfileOpen(false);


    if (nextState) {

      /*
       * Mark currently visible notifications as
       * read only when the user actually opens them.
       */

      const visibleIds =
        notifications.map(
          (notification) =>
            notification.id,
        );


      if (
        visibleIds.length > 0
      ) {

        setReadNotificationIds(
          (current) => {

            const merged =
              new Set([
                ...current,
                ...visibleIds,
              ]);


            return Array.from(
              merged,
            );

          },
        );

      }


      if (
        !notificationsLoaded
      ) {

        void loadNotifications();

      }

    }

  }


  /*
   * ==================================================
   * NOTIFICATION NAVIGATION
   * ==================================================
   */

  function handleNotificationNavigate(
    path: string,
  ) {

    setNotificationsOpen(
      false,
    );

    navigate(path);

  }


  /*
   * ==================================================
   * NOTIFICATION ICON
   * ==================================================
   */

  function renderNotificationIcon(
    type:
      SecurityNotification["type"],
  ) {

    if (type === "HIGH") {

      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">

          <AlertTriangle
            size={17}
          />

        </div>
      );

    }


    if (type === "FAILED") {

      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">

          <XCircle
            size={17}
          />

        </div>
      );

    }


    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">

        <Clock3
          size={17}
        />

      </div>
    );

  }


  /*
   * ==================================================
   * RENDER
   * ==================================================
   */

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-cyan-500/20 bg-[#040914]/95 px-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-5 relative">
      {/* Subtle Bottom Glow Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent pointer-events-none" />

      {/* ==================================================
          LEFT
      ================================================== */}

      <div className="flex min-w-0 items-center gap-3">

        {/* Desktop hamburger */}

        <button
          type="button"
          onClick={
            onMenuClick
          }
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.08] hover:text-white lg:flex"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >

          <Menu size={20} />

        </button>


        {/* Mobile hamburger */}

        <button
          type="button"
          onClick={
            onMobileMenuClick
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.08] hover:text-white lg:hidden"
          aria-label="Open navigation"
          title="Open navigation"
        >

          <Menu size={20} />

        </button>


        {/* CyberShield brand */}

        <Link
          to="/dashboard"
          className="group flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-1 transition hover:bg-cyan-500/[0.06]"
          aria-label="CyberShield dashboard"
        >

          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 transition group-hover:ring-cyan-400/60 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]">

            <Shield size={21} className="relative z-10 transition group-hover:scale-105" />
            <div className="cyber-radar-beam opacity-40 group-hover:opacity-80" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>

          </div>


          <div className="min-w-0">

            <div className="flex items-center gap-1.5">
              <span className="text-[17px] font-black tracking-wider text-white">
                CYBER<span className="text-cyan-400 cyber-text-glow">SHIELD</span>
              </span>
              <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[8px] font-mono font-bold tracking-widest text-cyan-300 ring-1 ring-cyan-500/30">
                PRO 2.0
              </span>
            </div>


            <div className="hidden font-mono text-[8px] uppercase tracking-[0.2em] text-slate-500 sm:block">
              DEFENSE GRID // SOC COMMAND
            </div>

          </div>

        </Link>

      </div>


      {/* ==================================================
          CENTER: SOC TELEMETRY HUD
      ================================================== */}
      <div className="hidden md:flex items-center gap-4 rounded-xl border border-cyan-500/20 bg-[#06101e]/80 px-4 py-1.5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 cyber-beacon-green" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            GRID ACTIVE
          </span>
        </div>

        <div className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-300">
          <Clock3 size={11} className="text-cyan-400" />
          <span>{timeString}</span>
        </div>

        <div className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
          <Activity size={11} className="text-cyan-400 animate-pulse" />
          <span>RADAR: 24/7 LIVE</span>
        </div>

        <div className="h-3 w-px bg-white/10" />

        {/* Tactical Reboot / Power-On Animation Trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("cybershield:reboot"))}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_10px_rgba(0,240,255,0.4)]"
          title="Reboot CyberShield SOC (Replay Powering-On Animation)"
        >
          <Power size={10} className="text-cyan-400" />
          <span>REBOOT SOC</span>
        </button>
      </div>


      {/* ==================================================
          RIGHT
      ================================================== */}

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">

        {/* Mobile Reboot Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("cybershield:reboot"))}
          className="flex md:hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_10px_rgba(0,240,255,0.4)]"
          title="Reboot CyberShield SOC (Replay Powering-On Animation)"
          aria-label="Reboot CyberShield SOC"
        >
          <Power size={18} />
        </button>


        {/* ==================================================
            NOTIFICATIONS
        ================================================== */}

        <div
          ref={
            notificationRef
          }
          className="relative"
        >

          <button
            type="button"
            onClick={
              handleNotificationsClick
            }
            disabled={
              !settings.securityNotifications
            }
            className={[
              "relative flex h-10 w-10 items-center justify-center rounded-xl border transition",
              !settings.securityNotifications
                ? "cursor-not-allowed border-white/[0.06] bg-white/[0.01] text-slate-700"
                : notificationsOpen
                  ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
                  : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-cyan-400/20 hover:bg-white/[0.05] hover:text-white",
            ].join(" ")}
            aria-label={
              settings.securityNotifications
                ? `Security notifications${
                    unreadCount > 0
                      ? `, ${unreadCount} unread`
                      : ""
                  }`
                : "Security notifications disabled"
            }
            aria-expanded={
              settings.securityNotifications
                ? notificationsOpen
                : false
            }
            title={
              settings.securityNotifications
                ? "Security notifications"
                : "Security notifications disabled in Settings"
            }
          >

            {settings.securityNotifications ? (
              <Bell size={20} />
            ) : (
              <BellOff size={19} />
            )}


            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#060d18] bg-cyan-400 px-1 text-[8px] font-black text-slate-950">

                {unreadCount > 9
                  ? "9+"
                  : unreadCount}

              </span>
            )}

          </button>


          {/* ==================================================
              NOTIFICATION PANEL
          ================================================== */}

          {notificationsOpen &&
            settings.securityNotifications && (

              <div className="absolute right-0 top-full z-50 mt-3 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220] shadow-2xl shadow-black/40">


                {/* Header */}

                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">

                  <div>

                    <p className="text-sm font-semibold text-white">
                      Security notifications
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-600">
                      Live intelligence from your analysis data
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(
                        false,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                    aria-label="Close notifications"
                  >

                    <X size={15} />

                  </button>

                </div>


                {/* Body */}

                {notificationsLoading ? (

                  <div className="px-5 py-8 text-center">

                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10">

                      <Clock3
                        size={17}
                        className="animate-pulse text-cyan-400"
                      />

                    </div>


                    <p className="mt-3 text-xs font-medium text-slate-300">
                      Checking security activity...
                    </p>

                  </div>

                ) : notifications.length ===
                  0 ? (

                  <div className="px-5 py-9 text-center">

                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">

                      <CheckCircle2
                        size={20}
                      />

                    </div>


                    <p className="mt-3 text-xs font-semibold text-white">
                      No active security alerts
                    </p>


                    <p className="mt-1 text-[10px] leading-5 text-slate-600">
                      Your latest backend analysis
                      data has no high-risk,
                      failed, or pending alert
                      requiring attention.
                    </p>

                  </div>

                ) : (

                  <div className="max-h-[360px] overflow-y-auto p-2">

                    {notifications.map(
                      (
                        notification,
                      ) => (

                        <button
                          key={
                            notification.id
                          }
                          type="button"
                          onClick={() =>
                            handleNotificationNavigate(
                              notification.actionPath,
                            )
                          }
                          className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-white/[0.04]"
                        >

                          {renderNotificationIcon(
                            notification.type,
                          )}


                          <div className="min-w-0 flex-1">

                            <p className="text-xs font-semibold text-slate-200">
                              {
                                notification.title
                              }
                            </p>


                            <p className="mt-1 text-[10px] leading-5 text-slate-500">
                              {
                                notification.description
                              }
                            </p>


                            <p className="mt-2 text-[9px] font-semibold text-cyan-400">
                              View investigation →
                            </p>

                          </div>

                        </button>

                      ),
                    )}

                  </div>

                )}


                {/* Footer */}

                <div className="border-t border-white/[0.06] px-4 py-2.5">

                  <Link
                    to="/history"
                    onClick={() =>
                      setNotificationsOpen(
                        false,
                      )
                    }
                    className="block text-center text-[10px] font-semibold text-cyan-400 transition hover:text-cyan-300"
                  >
                    Open scan history
                  </Link>

                </div>

              </div>

            )}

        </div>


        {/* ==================================================
            PROFILE
        ================================================== */}

        <div
          ref={profileRef}
          className="relative"
        >

          <button
            type="button"
            onClick={() => {

              setProfileOpen(
                (current) =>
                  !current,
              );

              setNotificationsOpen(
                false,
              );

            }}
            className={[
              "flex h-11 items-center gap-2 rounded-xl border px-2 transition sm:px-2.5",
              profileOpen
                ? "border-cyan-400/20 bg-cyan-400/[0.05]"
                : "border-white/10 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]",
            ].join(" ")}
            aria-label="Open account menu"
            aria-expanded={
              profileOpen
            }
          >

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-[10px] font-black text-slate-700 shadow-inner">

              {initials}

            </div>


            <div className="hidden max-w-[150px] text-left md:block">

              <p className="truncate text-xs font-semibold text-white">
                {fullName}
              </p>


              <p className="truncate text-[10px] text-slate-500">
                {user?.role ||
                  "Viewer"}
              </p>

            </div>


            <ChevronDown
              size={16}
              className={[
                "hidden text-slate-500 transition sm:block",
                profileOpen
                  ? "rotate-180 text-cyan-300"
                  : "",
              ].join(" ")}
            />

          </button>


          {/* ==================================================
              PROFILE DROPDOWN
          ================================================== */}

          {profileOpen && (

            <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220] p-1.5 shadow-2xl shadow-black/40">


              {/* Account */}

              <div className="border-b border-white/10 px-3 py-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-xs font-black text-slate-700">

                    {initials}

                  </div>


                  <div className="min-w-0">

                    <p className="truncate text-xs font-semibold text-white">
                      {fullName}
                    </p>


                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {email}
                    </p>

                  </div>

                </div>


                <div className="mt-3 flex items-center justify-between">

                  <span className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                    Access
                  </span>


                  <span className="rounded-md border border-cyan-400/10 bg-cyan-400/[0.05] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-cyan-300">
                    {user?.role ||
                      "Viewer"}
                  </span>

                </div>

              </div>


              {/* Profile */}

              <Link
                to="/profile"
                onClick={() =>
                  setProfileOpen(
                    false,
                  )
                }
                className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >

                <UserRound
                  size={15}
                />

                Profile

              </Link>


              {/* Settings */}

              <Link
                to="/settings"
                onClick={() =>
                  setProfileOpen(
                    false,
                  )
                }
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >

                <Settings
                  size={15}
                />

                Settings

              </Link>


              <div className="my-1 border-t border-white/[0.06]" />


              {/* Logout */}

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-red-300 transition hover:bg-red-400/[0.07]"
              >

                <LogOut
                  size={15}
                />

                Sign out

              </button>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}


export default Topbar;