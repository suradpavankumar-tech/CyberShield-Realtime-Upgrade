import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import MobileSidebar from "../components/layout/MobileSidebar";

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const location = useLocation();

  /*
   * ==================================================
   * CLOSE MOBILE SIDEBAR AFTER NAVIGATION
   * ==================================================
   */

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /*
   * ==================================================
   * LOCK BODY SCROLL WHILE MOBILE DRAWER IS OPEN
   * ==================================================
   */

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  /*
   * ==================================================
   * DESKTOP SIDEBAR TOGGLE
   * ==================================================
   */

  function handleDesktopMenuClick() {
    setSidebarCollapsed(
      (current) => !current,
    );
  }

  /*
   * ==================================================
   * MOBILE SIDEBAR TOGGLE
   * ==================================================
   */

  function handleMobileMenuClick() {
    setMobileMenuOpen(true);
  }

  return (
    <div className="relative min-h-screen cyber-canvas-bg text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none fixed -top-40 -right-40 h-[550px] w-[550px] rounded-full bg-cyan-500/10 blur-[130px] -z-10" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 h-[550px] w-[550px] rounded-full bg-emerald-500/5 blur-[130px] -z-10" />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-sky-500/[0.03] blur-[150px] -z-10" />

      {/* Subtle Laser Scanline Effect */}
      <div className="cyber-scanline-strip" />

      {/* ==================================================
          TOP APPLICATION BAR
          Full width — matches reference design
      ================================================== */}

      <Topbar
        onMenuClick={
          handleDesktopMenuClick
        }
        onMobileMenuClick={
          handleMobileMenuClick
        }
      />

      {/* ==================================================
          APPLICATION BODY
      ================================================== */}

      <div className="flex min-h-[calc(100vh-4rem)]">

        {/* ==================================================
            DESKTOP SIDEBAR
        ================================================== */}

        <aside
          className={[
            "hidden shrink-0 overflow-hidden transition-[width] duration-300 lg:block",
            sidebarCollapsed
              ? "w-[72px]"
              : "w-64",
          ].join(" ")}
        >

          <Sidebar
            collapsed={
              sidebarCollapsed
            }
            onToggle={() =>
              setSidebarCollapsed(
                (current) =>
                  !current,
              )
            }
          />

        </aside>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <main
          className="min-w-0 flex-1"
          aria-live="polite"
        >
          <Outlet />
        </main>

      </div>

      {/* ==================================================
          MOBILE SIDEBAR
      ================================================== */}

      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() =>
          setMobileMenuOpen(false)
        }
      />

    </div>
  );
}

export default AppLayout;