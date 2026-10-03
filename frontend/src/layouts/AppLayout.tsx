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
    <div className="min-h-screen bg-[#060b14] text-slate-100">

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