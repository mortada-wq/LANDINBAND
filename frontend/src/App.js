import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AdminDashboard from "@/pages/AdminDashboard";
import PublicHome from "@/pages/PublicHome";
import CityPage from "@/pages/CityPage";

// App context
export const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({ geminiKeySet: false });

  // Check for admin session
  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (adminSession) {
      setIsAdmin(true);
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/settings`);
      const data = await res.json();
      setSettings({
        geminiKeySet: data.gemini_api_key_set,
      });
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        localStorage.setItem("admin_session", "true");
        setIsAdmin(true);
        return { success: true };
      }
      return { success: false, error: "Wrong credentials" };
    } catch (e) {
      return { success: false, error: "Connection error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_session");
    setIsAdmin(false);
  };

  const contextValue = {
    isAdmin,
    settings,
    setSettings,
    fetchSettings,
    login,
    logout,
    API,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/city/:cityId" element={<CityPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </AppContext.Provider>
  );
}

export default App;
