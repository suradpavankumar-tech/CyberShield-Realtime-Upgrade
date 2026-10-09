import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  ScanSearch,
  Settings,
  Shield,
  MailCheck,
  Smartphone,
  Globe2,
  Radar,
  GraduationCap,
  UserRound,
  AlertOctagon,
  QrCode,
  Activity,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigation = [
  {
    label: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "EMERGENCY RESPONSE",
    items: [
      {
        name: "Fraud Emergency (1930)",
        path: "/emergency",
        icon: AlertOctagon,
      },
    ],
  },
  {
    label: "ANALYZE",
    items: [
      {
        name: "Threat Scanner",
        path: "/scanner",
        icon: ScanSearch,
      },
      {
        name: "QRShield (QR Scanner)",
        path: "/qr-shield",
        icon: QrCode,
      },
    ],
  },
  {
    label: "SECURITY TOOLS",
    items: [
      { name: "Email Header Analyzer", path: "/email-headers", icon: MailCheck },
      { name: "AppShield (APK Forensics)", path: "/app-shield", icon: Smartphone },
      { name: "URL Guard", path: "/url-guard", icon: Globe2 },
      { name: "Vulnerability Scanner", path: "/vulnerability-scanner", icon: Radar },
      { name: "Security Awareness", path: "/security-awareness", icon: GraduationCap },
    ],
  },
  {
    label: "INVESTIGATE",
    items: [
      {
        name: "ThreatPulse (Live Radar)",
        path: "/threat-pulse",
        icon: Activity,
      },
      {
        name: "Scan History",
        path: "/history",
        icon: History,
      },
      {
        name: "Security Activity",
        path: "/security-history",
        icon: Shield,
      },
      {
        name: "Analytics",
        path: "/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        name: "Profile",
        path: "/profile",
        icon: UserRound,
      },
      {
        name: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];

function Sidebar({
  collapsed = false,
  onToggle,
}: SidebarProps) {
  const navigate = useNavigate();

  const { logout } = useAuth();

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <aside
      className={[
        "relative flex h-screen w-full flex-col border-r border-white/10 bg-[#080f1c]",
        "transition-all duration-300",
      ].join(" ")}
    >

      {/* ==================================================
          BRAND / MENU
      ================================================== */}
      <div
        className={[
          "flex h-16 shrink-0 items-center border-b border-white/10",
          collapsed
            ? "justify-center px-2"
            : "justify-between px-4",
        ].join(" ")}
      >

        <div
          className={[
            "flex min-w-0 items-center",
            collapsed
              ? "justify-center"
              : "gap-3",
          ].join(" ")}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
            <Shield size={20} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-wide text-white">
                CyberShield
              </div>

              <div className="text-[8px] font-medium uppercase tracking-[0.18em] text-slate-500">
                AI Threat Intelligence
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ChevronLeft size={17} />
          </button>
        )}
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="absolute -right-3 top-[19px] z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0a1220] text-slate-400 shadow-lg transition hover:text-cyan-300"
        >
          <ChevronRight size={15} />
        </button>
      )}

      {/* ==================================================
          NAVIGATION
      ================================================== */}
      <nav
        className={[
          "flex-1 overflow-y-auto py-6",
          collapsed
            ? "px-2"
            : "px-3",
        ].join(" ")}
      >
        {navigation.map((section) => (
          <div
            key={section.label}
            className="mb-7"
          >
            {!collapsed && (
              <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.2em] text-slate-600">
                {section.label}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={
                      collapsed
                        ? item.name
                        : undefined
                    }
                    className={({ isActive }) =>
                      [
                        "group flex items-center rounded-xl text-sm transition-all",
                        collapsed
                          ? "justify-center px-2 py-3"
                          : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/10"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          className={
                            isActive
                              ? "shrink-0 text-cyan-400"
                              : "shrink-0 text-slate-500 group-hover:text-slate-300"
                          }
                        />

                        {!collapsed && (
                          <>
                            <span>
                              {item.name}
                            </span>

                            {isActive && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            )}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ==================================================
          SECURITY ENGINE
      ================================================== */}
      <div
        className={[
          "border-t border-white/10",
          collapsed
            ? "p-2"
            : "p-4",
        ].join(" ")}
      >
        <div
          title={
            collapsed
              ? "Security Engine — Ready"
              : undefined
          }
          className={[
            "rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04]",
            collapsed
              ? "flex items-center justify-center p-3"
              : "p-3",
          ].join(" ")}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            {!collapsed && (
              <span className="text-xs font-medium text-emerald-300">
                Security Engine
              </span>
            )}
          </div>

          {!collapsed && (
            <p className="mt-1 pl-4 text-[10px] text-slate-500">
              Ready for analysis
            </p>
          )}
        </div>
      </div>

      {/* ==================================================
          LOGOUT
      ================================================== */}
      <div
        className={[
          "border-t border-white/10",
          collapsed
            ? "p-2"
            : "p-3",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={handleLogout}
          title={
            collapsed
              ? "Sign out"
              : undefined
          }
          className={[
            "group flex w-full items-center rounded-xl text-sm font-medium text-red-300 transition hover:bg-red-400/[0.07]",
            collapsed
              ? "justify-center px-2 py-3"
              : "gap-3 px-3 py-2.5",
          ].join(" ")}
        >
          <LogOut
            size={18}
            className="shrink-0"
          />

          {!collapsed && (
            <span>
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;