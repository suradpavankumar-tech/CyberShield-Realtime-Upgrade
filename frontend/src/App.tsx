import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import AppRoutes from "./routes/AppRoutes";
import CyberBootSequence from "./components/common/CyberBootSequence";

function App() {
  const [showBoot, setShowBoot] = useState<boolean>(() => {
    return !sessionStorage.getItem("cybershield_boot_completed");
  });

  useEffect(() => {
    function handleReboot() {
      setShowBoot(true);
    }

    window.addEventListener("cybershield:reboot", handleReboot);
    return () => {
      window.removeEventListener("cybershield:reboot", handleReboot);
    };
  }, []);

  function handleBootComplete() {
    sessionStorage.setItem("cybershield_boot_completed", "true");
    setShowBoot(false);
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          {showBoot && <CyberBootSequence onComplete={handleBootComplete} />}
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;