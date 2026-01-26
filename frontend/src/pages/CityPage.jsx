import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Layers, FileText, Loader2 } from "lucide-react";

export default function CityPage() {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [layerOffsets, setLayerOffsets] = useState({
    layer1: { x: 0, y: 0 },
    layer2: { x: 0, y: 0 },
    layer3: { x: 0, y: 0 }
  });
  const [isDragging, setIsDragging] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        const res = await fetch(`${API}/cities/${cityId}`);
        if (!res.ok) {
          throw new Error("City not found");
        }
        const data = await res.json();
        setCity(data);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    
    fetchCityData();
  }, [cityId]);

  const fetchCity = async () => {
    try {
      const res = await fetch(`${API}/cities/${cityId}`);
      if (!res.ok) {
        throw new Error("City not found");
      }
      const data = await res.json();
      setCity(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const downloadLayer = (layerNum) => {
    window.open(`${API}/cities/${cityId}/layer/${layerNum}`, "_blank");
  };

  const downloadStage1 = () => {
    window.open(`${API}/cities/${cityId}/stage1`, "_blank");
  };

  const handleMouseDown = (layer, e) => {
    setIsDragging(layer);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setLayerOffsets(prev => ({
      ...prev,
      [isDragging]: {
        x: prev[isDragging].x + deltaX,
        y: prev[isDragging].y + deltaY
      }
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const resetLayers = () => {
    setLayerOffsets({
      layer1: { x: 0, y: 0 },
      layer2: { x: 0, y: 0 },
      layer3: { x: 0, y: 0 }
    });
  };

  // Layer colors
  const layerColors = [
    { bg: "bg-red-100", border: "border-red-500", text: "text-red-700", label: "Layer 1 - Foreground (Nearest)" },
    { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700", label: "Layer 2 - Middle Ground" },
    { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700", label: "Layer 3 - Background (Farthest)" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">City Not Found</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
          <Link to="/" className="font-semibold">Layered City Art</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12" data-testid="city-page">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2" data-testid="city-name">{city.city_name}</h1>
          <p className="text-gray-600">Style: {city.style_name}</p>
          {city.expansion_percentage > 0 && (
            <p className="text-blue-600 mt-1">+{city.expansion_percentage}% horizontal spacing applied</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left - Layer Downloads */}
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Download className="w-5 h-5" /> Download Layers
            </h2>
            
            {/* 3 Layer Cards */}
            <div className="space-y-4">
              {[1, 2, 3].map((layerNum) => (
                <div
                  key={layerNum}
                  className={`p-4 rounded-lg border-2 ${layerColors[layerNum - 1].border} ${layerColors[layerNum - 1].bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold ${layerColors[layerNum - 1].text}`}>
                        {layerColors[layerNum - 1].label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {layerNum === 1 && "Shortest buildings (height 0-3)"}
                        {layerNum === 2 && "Medium buildings (height 3-6)"}
                        {layerNum === 3 && "Tallest buildings (height 6-10)"}
                      </p>
                    </div>
                    <Button
                      onClick={() => downloadLayer(layerNum)}
                      className="bg-black text-white hover:bg-gray-800"
                      data-testid={`download-layer-${layerNum}-btn`}
                    >
                      <Download className="w-4 h-4 mr-2" /> SVG
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Stage 1 Download */}
            <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-700">Master SVG (All Buildings)</h3>
                  <p className="text-sm text-gray-500">Single SVG with all buildings combined</p>
                </div>
                <Button variant="outline" onClick={downloadStage1} data-testid="download-stage1-btn">
                  <Download className="w-4 h-4 mr-2" /> SVG
                </Button>
              </div>
            </div>

            {/* Download All */}
            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-white"
                onClick={() => {
                  downloadLayer(1);
                  setTimeout(() => downloadLayer(2), 500);
                  setTimeout(() => downloadLayer(3), 1000);
                }}
                data-testid="download-all-btn"
              >
                <Download className="w-4 h-4 mr-2" /> Download All 3 Layers
              </Button>
            </div>
          </div>

          {/* Right - Info & Instructions */}
          <div>
            {/* Interactive Layer Preview */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" /> Interactive Preview
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                👆 Click and drag layers to see the 3D depth effect!
              </p>
              
              <div 
                className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden cursor-move select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Layer 3 - Background (Blue) */}
                <img
                  src={`${API}/cities/${cityId}/layer/3`}
                  alt="Layer 3 - Background"
                  className="absolute inset-0 w-full h-full object-contain opacity-70"
                  style={{
                    transform: `translate(${layerOffsets.layer3.x}px, ${layerOffsets.layer3.y}px)`,
                    filter: 'hue-rotate(200deg)',
                    zIndex: 1
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMouseDown('layer3', e);
                  }}
                  draggable={false}
                />
                
                {/* Layer 2 - Middle (Yellow) */}
                <img
                  src={`${API}/cities/${cityId}/layer/2`}
                  alt="Layer 2 - Middle"
                  className="absolute inset-0 w-full h-full object-contain opacity-70"
                  style={{
                    transform: `translate(${layerOffsets.layer2.x}px, ${layerOffsets.layer2.y}px)`,
                    filter: 'hue-rotate(60deg)',
                    zIndex: 2
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMouseDown('layer2', e);
                  }}
                  draggable={false}
                />
                
                {/* Layer 1 - Foreground (Red) */}
                <img
                  src={`${API}/cities/${cityId}/layer/1`}
                  alt="Layer 1 - Foreground"
                  className="absolute inset-0 w-full h-full object-contain opacity-70"
                  style={{
                    transform: `translate(${layerOffsets.layer1.x}px, ${layerOffsets.layer1.y}px)`,
                    filter: 'hue-rotate(0deg)',
                    zIndex: 3
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMouseDown('layer1', e);
                  }}
                  draggable={false}
                />
                
                {/* Reset Button */}
                <Button
                  className="absolute bottom-4 right-4 z-10"
                  onClick={resetLayers}
                  variant="outline"
                  size="sm"
                >
                  Reset Layers
                </Button>
                
                {/* Instructions overlay */}
                {layerOffsets.layer1.x === 0 && layerOffsets.layer2.x === 0 && layerOffsets.layer3.x === 0 && (
                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded text-sm text-gray-700 pointer-events-none z-10">
                    Click and drag to separate layers
                  </div>
                )}
              </div>
            </div>

            {/* Layer Visualization */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" /> Layer Stack Preview
              </h2>
              <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                {/* Stacked layer visualization */}
                <div className="absolute inset-x-4 top-4 h-12 bg-blue-200 border-2 border-blue-500 rounded flex items-center justify-center text-sm font-medium text-blue-700">
                  Layer 3 - Background (Farthest)
                </div>
                <div className="absolute inset-x-8 top-16 h-12 bg-yellow-200 border-2 border-yellow-500 rounded flex items-center justify-center text-sm font-medium text-yellow-700">
                  Layer 2 - Middle
                </div>
                <div className="absolute inset-x-12 top-28 h-12 bg-red-200 border-2 border-red-500 rounded flex items-center justify-center text-sm font-medium text-red-700">
                  Layer 1 - Foreground (Nearest)
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Stack layers with spacers for 3D relief effect
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> How to Use These Files
              </h2>
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="font-bold">1.</span>
                  <span>Download all 3 layer SVG files</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">2.</span>
                  <span>Import each SVG into your laser cutter software</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">3.</span>
                  <span>Cut each layer from material of your choice:</span>
                </li>
                <li className="pl-8 text-sm text-gray-600">
                  • Layer 3 (back): Thickest material (e.g., 6mm plywood)<br />
                  • Layer 2 (mid): Medium thickness (e.g., 4mm)<br />
                  • Layer 1 (front): Thinnest (e.g., 3mm)
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">4.</span>
                  <span>Stack layers with 3-5mm spacers between each</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">5.</span>
                  <span>Glue or pin together for final 3D relief art!</span>
                </li>
              </ol>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{city.layer_count}</p>
                <p className="text-sm text-gray-500">Layers</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{city.expansion_percentage || 0}%</p>
                <p className="text-sm text-gray-500">Spacing</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">SVG</p>
                <p className="text-sm text-gray-500">Format</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Layered City Art • Made with coffee and frustration</p>
        </div>
      </footer>
    </div>
  );
}
