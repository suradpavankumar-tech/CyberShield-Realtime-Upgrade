import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;