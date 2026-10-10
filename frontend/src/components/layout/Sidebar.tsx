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
  UserCheck,
  Network,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigation = [
  {
    label: "// 01 COMMAND",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "// 02 RAPID INCIDENT",
    items: [
      {
        name: "Fraud Emergency (1930)",
        path: "/emergency",
        icon: AlertOctagon,
      },
    ],
  },
  {
    label: "// 03 NEUTRALIZE & SCAN",
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
    label: "// 04 SECURITY TOOLS",
    items: [
      { name: "BrowserShield (Web Guard)", path: "/browser-shield", icon: Globe2 },
      { name: "IdentityShield (Breaches)", path: "/identity-shield", icon: UserCheck },
      { name: "AppShield (APK Forensics)", path: "/app-shield", icon: Smartphone },
      { name: "Email Header Analyzer", path: "/email-headers", icon: MailCheck },
      { name: "URL Guard", path: "/url-guard", icon: Globe2 },
      { name: "Vulnerability Scanner", path: "/vulnerability-scanner", icon: Radar },
      { name: "Security Awareness", path: "/security-awareness", icon: GraduationCap },
    ],
  },
  {
    label: "// 05 FORENSIC RADAR",
    items: [
      {
        name: "ThreatGraph (Topology)",
        path: "/threat-graph",
        icon: Network,
      },
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
    label: "// 06 SOC OPERATIONS",
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
        "relative flex h-screen w-full flex-col border-r border-cyan-500/20 bg-[#040914]/95 backdrop-blur-2xl shadow-[4px_0_30px_rgba(0,0,0,0.5)]",
        "transition-all duration-300",
      ].join(" ")}
    >

      {/* ==================================================
          BRAND / MENU
      ================================================== */}
      <div
        className={[
          "flex h-16 shrink-0 items-center border-b border-cyan-500/15 relative",
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
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
            <Shield size={20} className="relative z-10" />
            <div className="cyber-radar-beam opacity-40" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-black tracking-wider text-white">
                CYBER<span className="text-cyan-400 cyber-text-glow">SHIELD</span>
              </div>

              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-500">
                SOC DEFENSE v2.0
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
          className="absolute -right-3 top-[19px] z-10 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/30 bg-[#08101e] text-slate-400 shadow-lg transition hover:text-cyan-300 hover:border-cyan-400"
        >
          <ChevronRight size={15} />
        </button>
      )}

      {/* ==================================================
          NAVIGATION
      ================================================== */}
      <nav
        className={[
          "flex-1 overflow-y-auto py-5",
          collapsed
            ? "px-2"
            : "px-3",
        ].join(" ")}
      >
        {navigation.map((section) => (
          <div
            key={section.label}
            className="mb-6"
          >
            {!collapsed && (
              <p className="mb-2 px-3 font-mono text-[9px] font-bold tracking-[0.2em] text-cyan-400/60 uppercase">
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
                        "relative group flex items-center rounded-xl text-xs font-semibold transition-all duration-200",
                        collapsed
                          ? "justify-center px-2 py-3"
                          : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent text-cyan-300 ring-1 ring-cyan-400/30 shadow-[0_0_15px_rgba(0,240,255,0.1)] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-cyan-400 before:shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-white hover:translate-x-0.5",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={17}
                          className={
                            isActive
                              ? "shrink-0 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                              : "shrink-0 text-slate-500 transition-colors group-hover:text-cyan-300"
                          }
                        />

                        {!collapsed && (
                          <>
                            <span className="truncate">
                              {item.name}
                            </span>

                            {isActive && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,1)]" />
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
          SOC DEFENSE GRID STATUS WIDGET
      ================================================== */}
      <div
        className={[
          "border-t border-cyan-500/15 bg-black/40",
          collapsed
            ? "p-2"
            : "p-3",
        ].join(" ")}
      >
        <div
          title={
            collapsed
              ? "SOC Defense Grid: Armed"
              : undefined
          }
          className={[
            "cyber-corner-bracket rounded-xl border border-cyan-500/25 bg-[#071222]/80 p-3 shadow-lg",
            collapsed
              ? "flex items-center justify-center p-2.5"
              : "",
          ].join(" ")}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 cyber-beacon-green" />
              <div className="cyber-radar-beam opacity-30" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-300 tracking-wider">
                    GRID DEFENSE
                  </span>
                  <span className="font-mono text-[9px] font-bold text-cyan-400">
                    99.8%
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[9px] text-slate-500">
                  ZERO-DAY SHIELD ARMED
                </p>
              </div>
            )}
          </div>
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