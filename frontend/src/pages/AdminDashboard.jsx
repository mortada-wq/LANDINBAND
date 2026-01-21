import { useState, useEffect, useCallback } from "react";
import { useApp, API } from "@/App";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
  EyeOff,
  Download,
  Layers,
  MoveHorizontal,
  Play,
  ChevronRight
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
  const [showGeminiKey, setShowGeminiKey] = useState(false);
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
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  
  // Spacing state
  const [spacingValue, setSpacingValue] = useState(0);
  const [spacingPreview, setSpacingPreview] = useState(null);
  const [applyingSpacing, setApplyingSpacing] = useState(false);
  
  // City Bank state
  const [processedCities, setProcessedCities] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchStyles();
      fetchQueue();
      fetchProcessedCities();
      const interval = setInterval(fetchQueue, 10000);
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

  const fetchProcessedCities = async () => {
    try {
      const res = await fetch(`${API}/cities`);
      const data = await res.json();
      setProcessedCities(data);
    } catch (e) {
      console.error("Failed to fetch processed cities:", e);
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

  // Save Gemini key
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
        setShowSettings(false);
      } else {
        toast.error(data.detail || "Failed to save");
      }
    } catch (e) {
      toast.error("Failed to save Gemini key");
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
        setActiveTab("queue");
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

  // Process Stage 1
  const handleProcessStage1 = async (cityId) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API}/process/stage1/${cityId}`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        fetchQueue();
        // Auto-select this item for spacing adjustment
        setSelectedQueueItem(cityId);
        setSpacingValue(0);
      } else {
        toast.error(data.detail || "Stage 1 failed");
      }
    } catch (e) {
      toast.error("Stage 1 failed");
    }
    setProcessing(false);
  };

  // Apply spacing
  const handleApplySpacing = async (cityId) => {
    setApplyingSpacing(true);
    try {
      const res = await fetch(`${API}/process/spacing/${cityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expansion_percentage: spacingValue }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Spacing applied: ${spacingValue}% expansion`);
        setSpacingPreview(data);
        fetchQueue();
      } else {
        toast.error(data.detail || "Spacing failed");
      }
    } catch (e) {
      toast.error("Spacing failed");
    }
    setApplyingSpacing(false);
  };

  // Process Stage 2
  const handleProcessStage2 = async (cityId) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API}/process/stage2/${cityId}`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        fetchQueue();
        fetchProcessedCities();
        setSelectedQueueItem(null);
      } else {
        toast.error(data.detail || "Stage 2 failed");
      }
    } catch (e) {
      toast.error("Stage 2 failed");
    }
    setProcessing(false);
  };

  // Cancel queue item
  const handleCancelItem = async (itemId) => {
    try {
      await fetch(`${API}/queue/${itemId}`, { method: "DELETE" });
      toast.success("Cancelled");
      fetchQueue();
      if (selectedQueueItem === itemId) {
        setSelectedQueueItem(null);
      }
    } catch (e) {
      toast.error("Cancel failed");
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "waiting": return "bg-yellow-100 text-yellow-800";
      case "stage1_processing": return "bg-blue-100 text-blue-800";
      case "stage1_complete": return "bg-purple-100 text-purple-800";
      case "spacing_applied": return "bg-indigo-100 text-indigo-800";
      case "stage2_processing": return "bg-cyan-100 text-cyan-800";
      case "done": return "bg-green-100 text-green-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case "waiting": return "Waiting";
      case "stage1_processing": return "Stage 1: Stylizing...";
      case "stage1_complete": return "Stage 1 Done → Adjust Spacing";
      case "spacing_applied": return "Spacing Set → Ready for Stage 2";
      case "stage2_processing": return "Stage 2: Creating Layers...";
      case "done": return "Complete!";
      case "error": return "Error";
      default: return status;
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
            <Button type="submit" className="w-full" disabled={loginLoading} data-testid="login-submit">
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
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
          <h1 className="text-xl font-bold">Layered Relief Art - Admin</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${settings.geminiKeySet ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="text-gray-600">Gemini API</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} data-testid="settings-btn">
              <Settings className="w-4 h-4 mr-1" /> Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`${API}/docs/download`, '_blank')} data-testid="docs-btn">
              <Download className="w-4 h-4 mr-1" /> Docs
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-btn">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          <button className={`tab-button ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")} data-testid="tab-upload">
            <Upload className="w-4 h-4 inline mr-2" />Upload City
          </button>
          <button className={`tab-button ${activeTab === "styles" ? "active" : ""}`} onClick={() => setActiveTab("styles")} data-testid="tab-styles">
            <FileText className="w-4 h-4 inline mr-2" />Style Library
          </button>
          <button className={`tab-button ${activeTab === "queue" ? "active" : ""}`} onClick={() => setActiveTab("queue")} data-testid="tab-queue">
            <Clock className="w-4 h-4 inline mr-2" />Processing Queue
            {queue.filter(q => !["done", "error"].includes(q.status)).length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {queue.filter(q => !["done", "error"].includes(q.status)).length}
              </span>
            )}
          </button>
          <button className={`tab-button ${activeTab === "citybank" ? "active" : ""}`} onClick={() => setActiveTab("citybank")} data-testid="tab-citybank">
            <ImageIcon className="w-4 h-4 inline mr-2" />City Bank
            {processedCities.length > 0 && (
              <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">{processedCities.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4" onClick={e => e.stopPropagation()} data-testid="settings-modal">
            <h2 className="text-lg font-bold mb-4">API Settings</h2>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <Label className="font-semibold">Gemini API Key</Label>
                <p className="text-xs text-gray-500 mb-2">Used for both Stage 1 (style transfer) and Stage 2 (layer separation)</p>
                <div className="relative mb-3">
                  <Input
                    type={showGeminiKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={settings.geminiKeySet ? "••••••••" : "Enter Gemini key"}
                    data-testid="gemini-key-input"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowGeminiKey(!showGeminiKey)}>
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button className="w-full" onClick={handleSaveGemini} disabled={savingSettings || !geminiKey} data-testid="save-gemini-btn">
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Gemini Key
                </Button>
                {settings.geminiKeySet && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Gemini key is set</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
              </p>
              <Button variant="outline" className="w-full" onClick={() => setShowSettings(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload City Tab */}
        {activeTab === "upload" && (
          <div className="fade-in space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold mb-4">City Photo</h2>
                <div {...getCityRootProps()} className={`upload-zone ${isCityDragActive ? "active" : ""}`} data-testid="city-upload-zone">
                  <input {...getCityInputProps()} />
                  {cityImage ? (
                    <div className="space-y-4">
                      <img src={cityImage.preview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <p className="text-sm text-gray-600">{cityImage.file.name}</p>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setCityImage(null); }}>Remove</Button>
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
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="cityName">City Name</Label>
                  <Input id="cityName" value={cityName} onChange={(e) => setCityName(e.target.value)} placeholder="e.g., Seattle" data-testid="city-name-input" />
                </div>
                
                <div>
                  <Label>Select Style</Label>
                  {styles.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-2">No styles yet. Upload one in Style Library tab.</p>
                  ) : (
                    <div className="style-grid mt-2">
                      {styles.map((style) => (
                        <div key={style.id} className={`style-card ${selectedStyle === style.id ? "selected" : ""}`} onClick={() => setSelectedStyle(style.id)} data-testid={`style-card-${style.id}`}>
                          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="font-medium text-sm truncate">{style.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <button className="btn-process" onClick={handleUploadCity} disabled={!cityImage || !cityName || !selectedStyle || uploading} data-testid="process-city-btn">
                {uploading ? <><Loader2 className="w-5 h-5 inline animate-spin mr-2" /> Uploading...</> : "ADD TO QUEUE"}
              </button>
            </div>
          </div>
        )}

        {/* Style Library Tab */}
        {activeTab === "styles" && (
          <div className="fade-in space-y-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Upload New Style</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div {...getStyleRootProps()} className={`upload-zone ${isStyleDragActive ? "active" : ""}`} data-testid="style-upload-zone">
                  <input {...getStyleInputProps()} />
                  {stylePdf ? (
                    <div className="space-y-2">
                      <FileText className="w-10 h-10 mx-auto text-gray-600" />
                      <p className="text-sm font-medium truncate">{stylePdf.name}</p>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setStylePdf(null); }}>Remove</Button>
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
                    <Input value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)} placeholder="e.g., Art Deco" data-testid="style-name-input" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newStyleDesc} onChange={(e) => setNewStyleDesc(e.target.value)} placeholder="Optional description" rows={3} />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={handleUploadStyle} disabled={!stylePdf || !newStyleName || uploadingStyle} data-testid="upload-style-btn">
                    {uploadingStyle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Style
                  </Button>
                </div>
              </div>
            </div>

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
                      <Button variant="ghost" size="sm" className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteStyle(style.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Queue Monitor Tab - 2-Stage Workflow */}
        {activeTab === "queue" && (
          <div className="fade-in space-y-6">
            {/* Workflow Diagram */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">2-Stage Gemini Workflow</h3>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="px-3 py-1 bg-yellow-100 rounded">1. Upload</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-3 py-1 bg-blue-100 rounded">2. Stage 1: Style Transfer</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-3 py-1 bg-purple-100 rounded">3. Adjust Spacing</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-3 py-1 bg-cyan-100 rounded">4. Stage 2: Layer Separation</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-3 py-1 bg-green-100 rounded">5. Done (3 SVG Layers)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Processing Queue</h2>
              <Button variant="outline" size="sm" onClick={fetchQueue}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            </div>

            {queue.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Queue is empty. Upload a city to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((item) => (
                  <div key={item.id} className={`border rounded-lg p-4 ${selectedQueueItem === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} data-testid={`queue-item-${item.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{item.city_name}</h3>
                        <p className="text-sm text-gray-500">{item.style_name}</p>
                      </div>
                      <span className={`status-badge ${getStatusColor(item.status)}`}>{getStatusLabel(item.status)}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="progress-bar mb-3">
                      <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                    </div>

                    {/* Action buttons based on status */}
                    <div className="flex flex-wrap gap-2">
                      {item.status === "waiting" && (
                        <>
                          <Button size="sm" onClick={() => handleProcessStage1(item.id)} disabled={processing}>
                            {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                            Run Stage 1
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCancelItem(item.id)}><X className="w-4 h-4" /></Button>
                        </>
                      )}

                      {item.status === "stage1_complete" && (
                        <Button size="sm" variant="outline" onClick={() => setSelectedQueueItem(item.id)}>
                          <MoveHorizontal className="w-4 h-4 mr-1" /> Adjust Spacing
                        </Button>
                      )}

                      {(item.status === "spacing_applied" || item.status === "stage1_complete") && selectedQueueItem === item.id && (
                        <Button size="sm" onClick={() => handleProcessStage2(item.id)} disabled={processing}>
                          {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Layers className="w-4 h-4 mr-1" />}
                          Run Stage 2
                        </Button>
                      )}

                      {item.status === "done" && (
                        <a href={`/city/${item.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800 font-medium">
                          <Eye className="w-4 h-4" /> View Result
                        </a>
                      )}

                      {item.status === "error" && (
                        <span className="text-sm text-red-600">{item.error_message?.substring(0, 50)}...</span>
                      )}
                    </div>

                    {/* Spacing Control Panel - shows when item is selected and stage1 is complete */}
                    {selectedQueueItem === item.id && ["stage1_complete", "spacing_applied"].includes(item.status) && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MoveHorizontal className="w-5 h-5" /> Horizontal Spacing Adjustment
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">Expand horizontal distance between buildings (for watch strap production)</p>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Expansion: {spacingValue}%</Label>
                              <span className="text-sm text-gray-500">0% = original, 200% = triple width</span>
                            </div>
                            <Slider
                              value={[spacingValue]}
                              onValueChange={(val) => setSpacingValue(val[0])}
                              min={0}
                              max={200}
                              step={5}
                              className="w-full"
                            />
                          </div>

                          {item.expansion_percentage !== undefined && item.expansion_percentage !== null && (
                            <p className="text-sm text-green-600">Current applied: {item.expansion_percentage}%</p>
                          )}

                          <div className="flex gap-2">
                            <Button onClick={() => handleApplySpacing(item.id)} disabled={applyingSpacing}>
                              {applyingSpacing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                              Apply Spacing ({spacingValue}%)
                            </Button>
                            <Button variant="outline" onClick={() => { setSpacingValue(0); handleApplySpacing(item.id); }}>
                              Reset to 0%
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* City Bank Tab */}
        {activeTab === "citybank" && (
          <div className="fade-in space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">City Bank</h2>
                <p className="text-sm text-gray-500">All completed cities with 3 layers</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchProcessedCities}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            </div>

            {processedCities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No cities processed yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {processedCities.map((city) => (
                  <a key={city.id} href={`/city/${city.id}`} target="_blank" rel="noopener noreferrer" className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow" data-testid={`citybank-card-${city.id}`}>
                    <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                      <Layers className="w-12 h-12 text-gray-300" />
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">{city.layer_count} layers</div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{city.city_name}</h3>
                      <p className="text-sm text-gray-500">{city.style_name}</p>
                      {city.expansion_percentage > 0 && (
                        <p className="text-xs text-blue-600 mt-1">+{city.expansion_percentage}% spacing</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
