import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function ProtectedRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location =
    useLocation();


  /*
   * ==================================================
   * AUTHENTICATION RESTORATION
   *
   * AuthContext verifies an existing session against
   * the backend before protected content is rendered.
   *
   * Never redirect while that verification is still
   * running.
   * ==================================================
   */

  if (loading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060b14]">

        <div className="w-full max-w-sm px-6 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06]">

            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

          </div>


          <p className="mt-4 text-sm font-semibold text-white">
            Securing your session
          </p>


          <p className="mt-1 text-xs leading-5 text-slate-600">
            Verifying your CyberShield
            authentication with the backend...
          </p>

        </div>

      </div>
    );

  }


  /*
   * ==================================================
   * UNAUTHENTICATED USER
   *
   * Preserve the exact requested location so the
   * login flow can optionally return here.
   * ==================================================
   */

  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname:
              location.pathname,

            search:
              location.search,

            hash:
              location.hash,
          },
        }}
      />
    );

  }


  /*
   * ==================================================
   * AUTHENTICATED USER
   * ==================================================
   */

  return <Outlet />;
}


export default ProtectedRoute;