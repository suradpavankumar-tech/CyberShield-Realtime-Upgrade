import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060b14]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;