import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Workspace } from "@/pages/Workspace";

// Create context for app state
export const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

function App() {
  const [settings, setSettings] = useState({
    geminiKeySet: false,
    visionKeySet: false,
  });
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/settings`);
      const data = await res.json();
      setSettings({
        geminiKeySet: data.gemini_api_key_set,
        visionKeySet: data.vision_api_key_set,
      });
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  const contextValue = {
    settings,
    setSettings,
    currentProject,
    setCurrentProject,
    isLoading,
    setIsLoading,
    fetchSettings,
    API,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#050505] bg-grid">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Workspace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="bottom-right" />
      </div>
    </AppContext.Provider>
  );
}

export default App;
