import { useState, useEffect, useCallback } from "react";
import { useApp, API } from "@/App";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Clock, 
  Check, 
  X, 
  Trash2, 
  RefreshCw,
  Settings,
  LogOut,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

export default function AdminDashboard() {
  const { isAdmin, login, logout, settings, fetchSettings } = useApp();
  const [activeTab, setActiveTab] = useState("upload");
  
  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [visionKey, setVisionKey] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showVisionKey, setShowVisionKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Upload state
  const [cityImage, setCityImage] = useState(null);
  const [cityName, setCityName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Styles state
  const [styles, setStyles] = useState([]);
  const [newStyleName, setNewStyleName] = useState("");
  const [newStyleDesc, setNewStyleDesc] = useState("");
  const [stylePdf, setStylePdf] = useState(null);
  const [uploadingStyle, setUploadingStyle] = useState(false);
  
  // Queue state
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchStyles();
      fetchQueue();
      const interval = setInterval(fetchQueue, 30000); // Auto-refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchStyles = async () => {
    try {
      const res = await fetch(`${API}/styles`);
      const data = await res.json();
      setStyles(data);
    } catch (e) {
      console.error("Failed to fetch styles:", e);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API}/queue`);
      const data = await res.json();
      setQueue(data);
    } catch (e) {
      console.error("Failed to fetch queue:", e);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    const result = await login(email, password);
    setLoginLoading(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Welcome back, Mortada!");
    }
  };

  // Save settings - individual keys
  const handleSaveGemini = async () => {
    if (!geminiKey) {
      toast.error("Enter your Gemini API key");
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemini_api_key: geminiKey }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchSettings();
        setGeminiKey("");
      } else {
        toast.error(data.detail || "Failed to save");
      }
    } catch (e) {
      toast.error("Failed to save Gemini key");
    }
    setSavingSettings(false);
  };

  const handleSaveVision = async () => {
    if (!visionKey) {
      toast.error("Enter your Vision API key");
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vision_api_key: visionKey }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchSettings();
        setVisionKey("");
      } else {
        toast.error(data.detail || "Failed to save");
      }
    } catch (e) {
      toast.error("Failed to save Vision key");
    }
    setSavingSettings(false);
  };

  // City image dropzone
  const onDropCity = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setCityImage({
        file: acceptedFiles[0],
        preview: URL.createObjectURL(acceptedFiles[0]),
      });
    }
  }, []);

  const { getRootProps: getCityRootProps, getInputProps: getCityInputProps, isDragActive: isCityDragActive } = useDropzone({
    onDrop: onDropCity,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  // Style PDF dropzone
  const onDropStyle = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setStylePdf(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps: getStyleRootProps, getInputProps: getStyleInputProps, isDragActive: isStyleDragActive } = useDropzone({
    onDrop: onDropStyle,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  // Upload city
  const handleUploadCity = async () => {
    if (!cityImage || !cityName || !selectedStyle) {
      toast.error("Fill in all fields!");
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", cityImage.file);
    formData.append("city_name", cityName);
    formData.append("style_id", selectedStyle);
    
    try {
      const res = await fetch(`${API}/cities/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        toast.success(`${cityName} added to queue!`);
        setCityImage(null);
        setCityName("");
        setSelectedStyle(null);
        fetchQueue();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Upload failed");
      }
    } catch (e) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  // Upload style
  const handleUploadStyle = async () => {
    if (!stylePdf || !newStyleName) {
      toast.error("Need a PDF and a name!");
      return;
    }
    
    setUploadingStyle(true);
    const formData = new FormData();
    formData.append("file", stylePdf);
    formData.append("name", newStyleName);
    formData.append("description", newStyleDesc);
    
    try {
      const res = await fetch(`${API}/styles`, {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        toast.success("Style uploaded!");
        setStylePdf(null);
        setNewStyleName("");
        setNewStyleDesc("");
        fetchStyles();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Upload failed");
      }
    } catch (e) {
      toast.error("Upload failed");
    }
    setUploadingStyle(false);
  };

  // Delete style
  const handleDeleteStyle = async (styleId) => {
    if (!window.confirm("Delete this style?")) return;
    try {
      await fetch(`${API}/styles/${styleId}`, { method: "DELETE" });
      toast.success("Style deleted");
      fetchStyles();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  // Process next
  const handleProcessNext = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${API}/queue/process-next`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        if (data.processed) {
          toast.success(data.message);
        } else {
          toast.info(data.message);
        }
        fetchQueue();
      } else {
        toast.error(data.detail || "Processing failed");
      }
    } catch (e) {
      toast.error("Processing failed");
    }
    setProcessing(false);
  };

  // Cancel queue item
  const handleCancelItem = async (itemId) => {
    try {
      await fetch(`${API}/queue/${itemId}`, { method: "DELETE" });
      toast.success("Cancelled");
      fetchQueue();
    } catch (e) {
      toast.error("Cancel failed");
    }
  };

  // Login page
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-8">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                data-testid="login-email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="login-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginLoading}
              data-testid="login-submit"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Login
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            <a href="/" className="hover:underline">← Back to public site</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="admin-container flex items-center justify-between py-4">
          <h1 className="text-xl font-bold">Layered Relief Art - Admin</h1>
          <div className="flex items-center gap-4">
            {/* API Status */}
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${settings.geminiKeySet ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="text-gray-600">Gemini</span>
              <span className={`w-2 h-2 rounded-full ml-2 ${settings.visionKeySet ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="text-gray-600">Vision</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} data-testid="settings-btn">
              <Settings className="w-4 h-4 mr-1" /> Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-btn">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="admin-container flex gap-1 pb-0">
          <button
            className={`tab-button ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
            data-testid="tab-upload"
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload City
          </button>
          <button
            className={`tab-button ${activeTab === "styles" ? "active" : ""}`}
            onClick={() => setActiveTab("styles")}
            data-testid="tab-styles"
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Style Library
          </button>
          <button
            className={`tab-button ${activeTab === "queue" ? "active" : ""}`}
            onClick={() => setActiveTab("queue")}
            data-testid="tab-queue"
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Queue Monitor
            {queue.filter(q => q.status === "waiting").length > 0 && (
              <span className="ml-2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
                {queue.filter(q => q.status === "waiting").length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4" onClick={e => e.stopPropagation()} data-testid="settings-modal">
            <h2 className="text-lg font-bold mb-4">API Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Save each key separately</p>
            <div className="space-y-6">
              {/* Gemini Key */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <Label className="font-semibold">Gemini API Key</Label>
                <p className="text-xs text-gray-500 mb-2">For style transfer (vector line art)</p>
                <div className="relative mb-3">
                  <Input
                    type={showGeminiKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={settings.geminiKeySet ? "••••••••" : "Enter Gemini key"}
                    data-testid="gemini-key-input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSaveGemini} 
                  disabled={savingSettings || !geminiKey}
                  data-testid="save-gemini-btn"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Gemini Key
                </Button>
                {settings.geminiKeySet && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Gemini key is set
                  </p>
                )}
              </div>

              {/* Vision Key */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <Label className="font-semibold">Vision API Key</Label>
                <p className="text-xs text-gray-500 mb-2">For building detection</p>
                <div className="relative mb-3">
                  <Input
                    type={showVisionKey ? "text" : "password"}
                    value={visionKey}
                    onChange={(e) => setVisionKey(e.target.value)}
                    placeholder={settings.visionKeySet ? "••••••••" : "Enter Vision key"}
                    data-testid="vision-key-input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowVisionKey(!showVisionKey)}
                  >
                    {showVisionKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSaveVision} 
                  disabled={savingSettings || !visionKey}
                  data-testid="save-vision-btn"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Vision Key
                </Button>
                {settings.visionKeySet && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Vision key is set
                  </p>
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={() => setShowSettings(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="admin-container py-8">
        {/* Upload City Tab */}
        {activeTab === "upload" && (
          <div className="fade-in space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image Upload */}
              <div>
                <h2 className="text-lg font-semibold mb-4">City Photo</h2>
                <div
                  {...getCityRootProps()}
                  className={`upload-zone ${isCityDragActive ? "active" : ""}`}
                  data-testid="city-upload-zone"
                >
                  <input {...getCityInputProps()} />
                  {cityImage ? (
                    <div className="space-y-4">
                      <img src={cityImage.preview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <p className="text-sm text-gray-600">{cityImage.file.name}</p>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setCityImage(null); }}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="font-medium">Drop city photo here</p>
                      <p className="text-sm text-gray-500">HQ front view, no perspective</p>
                    </>
                  )}
                </div>
              </div>
              
              {/* City Name & Style */}
              <div className="space-y-6">
                <div>
                  <Label htmlFor="cityName">City Name</Label>
                  <Input
                    id="cityName"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g., Seattle"
                    data-testid="city-name-input"
                  />
                </div>
                
                <div>
                  <Label>Select Style</Label>
                  {styles.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-2">No styles yet. Upload one in Style Library tab.</p>
                  ) : (
                    <div className="style-grid mt-2">
                      {styles.map((style) => (
                        <div
                          key={style.id}
                          className={`style-card ${selectedStyle === style.id ? "selected" : ""}`}
                          onClick={() => setSelectedStyle(style.id)}
                          data-testid={`style-card-${style.id}`}
                        >
                          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="font-medium text-sm truncate">{style.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Process Button */}
            <div className="text-center pt-4">
              <button
                className="btn-process"
                onClick={handleUploadCity}
                disabled={!cityImage || !cityName || !selectedStyle || uploading}
                data-testid="process-city-btn"
              >
                {uploading ? (
                  <><Loader2 className="w-5 h-5 inline animate-spin mr-2" /> Uploading...</>
                ) : (
                  "PROCESS THIS SHIT"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Style Library Tab */}
        {activeTab === "styles" && (
          <div className="fade-in space-y-8">
            {/* Upload New Style */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Upload New Style</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div
                  {...getStyleRootProps()}
                  className={`upload-zone ${isStyleDragActive ? "active" : ""}`}
                  data-testid="style-upload-zone"
                >
                  <input {...getStyleInputProps()} />
                  {stylePdf ? (
                    <div className="space-y-2">
                      <FileText className="w-10 h-10 mx-auto text-gray-600" />
                      <p className="text-sm font-medium truncate">{stylePdf.name}</p>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setStylePdf(null); }}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm">Drop PDF here</p>
                      <p className="text-xs text-gray-400">Max 50MB</p>
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Style Name</Label>
                    <Input
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                      placeholder="e.g., Art Deco"
                      data-testid="style-name-input"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newStyleDesc}
                      onChange={(e) => setNewStyleDesc(e.target.value)}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full"
                    onClick={handleUploadStyle}
                    disabled={!stylePdf || !newStyleName || uploadingStyle}
                    data-testid="upload-style-btn"
                  >
                    {uploadingStyle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Style
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Styles */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Your Styles ({styles.length})</h2>
              {styles.length === 0 ? (
                <p className="text-gray-500">No styles uploaded yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {styles.map((style) => (
                    <div key={style.id} className="border border-gray-200 rounded-lg p-4" data-testid={`style-item-${style.id}`}>
                      <FileText className="w-10 h-10 text-gray-400 mb-3" />
                      <h3 className="font-medium">{style.name}</h3>
                      {style.description && <p className="text-sm text-gray-500 mt-1">{style.description}</p>}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteStyle(style.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Queue Monitor Tab */}
        {activeTab === "queue" && (
          <div className="fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Processing Queue</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchQueue}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
                <Button
                  onClick={handleProcessNext}
                  disabled={processing || queue.filter(q => q.status === "waiting").length === 0}
                  data-testid="process-next-btn"
                >
                  {processing ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    "Process Next"
                  )}
                </Button>
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Queue is empty. Upload a city to get started!</p>
              </div>
            ) : (
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Style</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id} data-testid={`queue-item-${item.id}`}>
                      <td className="font-medium">{item.city_name}</td>
                      <td className="text-gray-600">{item.style_name}</td>
                      <td>
                        <span className={`status-badge status-${item.status}`}>
                          {item.status === "waiting" && "Waiting"}
                          {item.status === "stylizing" && "Stylizing..."}
                          {item.status === "detecting" && "Detecting Buildings..."}
                          {item.status === "creating_svg" && "Creating SVG..."}
                          {item.status === "done" && "Done!"}
                          {item.status === "error" && "Error"}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{item.progress}%</span>
                      </td>
                      <td className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </td>
                      <td>
                        {item.status === "waiting" && (
                          <Button variant="ghost" size="sm" onClick={() => handleCancelItem(item.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {item.status === "done" && <Check className="w-5 h-5 text-green-600" />}
                        {item.status === "error" && (
                          <span className="text-xs text-red-600" title={item.error_message}>
                            {item.error_message?.substring(0, 30)}...
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
