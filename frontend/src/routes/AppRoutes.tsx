import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "../layouts/AppLayout";

import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

import Dashboard from "../pages/Dashboard";
import Scanner from "../pages/Scanner";
import History from "../pages/History";
import Analytics from "../pages/Analytics";
import ScanDetail from "../pages/ScanDetail";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import EmailHeaderAnalyzer from "../pages/EmailHeaderAnalyzer";
import MobileScanner from "../pages/MobileScanner";
import UrlGuard from "../pages/UrlGuard";
import VulnerabilityScanner from "../pages/VulnerabilityScanner";
import SecurityAwareness from "../pages/SecurityAwareness";
import SecurityHistory from "../pages/SecurityHistory";
import FraudEmergencyAssistant from "../pages/FraudEmergencyAssistant";
import QRShield from "../pages/QRShield";

import Login from "../pages/Login";
import Register from "../pages/Register";


function AppRoutes() {
  return (
    <Routes>

      {/* ==================================================
          PUBLIC ROUTES
      ================================================== */}

      <Route element={<PublicOnlyRoute />}>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

      </Route>


      {/* ==================================================
          PROTECTED APPLICATION
      ================================================== */}

      <Route element={<ProtectedRoute />}>

        <Route element={<AppLayout />}>

          {/* Root */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />


          {/* Dashboard */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* Scanner */}

          <Route
            path="/scanner"
            element={<Scanner />}
          />


          <Route path="/email-headers" element={<EmailHeaderAnalyzer />} />
          <Route path="/mobile-scanner" element={<MobileScanner />} />
          <Route path="/url-guard" element={<UrlGuard />} />
          <Route path="/vulnerability-scanner" element={<VulnerabilityScanner />} />
          <Route path="/security-awareness" element={<SecurityAwareness />} />
          <Route path="/emergency" element={<FraudEmergencyAssistant />} />
          <Route path="/qr-shield" element={<QRShield />} />

          {/* History */}

          <Route
            path="/history"
            element={<History />}
          />

          <Route
            path="/security-history"
            element={<SecurityHistory />}
          />


          {/* Analytics */}

          <Route
            path="/analytics"
            element={<Analytics />}
          />


          {/* Individual investigation */}

          <Route
            path="/scan/:scanId"
            element={<ScanDetail />}
          />


          {/* Profile */}

          <Route
            path="/profile"
            element={<Profile />}
          />


          {/* Settings */}

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>

      </Route>


      {/* ==================================================
          FALLBACK
      ================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}


export default AppRoutes;