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

  useEffect(() => {
    fetchCity();
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

  const downloadSvg = () => {
    window.open(`${API}/cities/${cityId}/svg`, "_blank");
  };

  const downloadPng = () => {
    window.open(`${API}/cities/${cityId}/png`, "_blank");
  };

  // Layer colors for visualization
  const layerColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
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
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left - Preview */}
          <div>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center" data-testid="city-preview">
              <img
                src={`${API}/cities/${cityId}/styled`}
                alt={city.city_name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = '<div class="text-gray-400"><svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="mt-2">Preview</p></div>';
                }}
              />
            </div>
            
            {/* Download Buttons */}
            <div className="flex gap-4">
              <Button className="flex-1" onClick={downloadSvg} data-testid="download-svg-btn">
                <Download className="w-4 h-4 mr-2" /> Download SVG (Laser Ready)
              </Button>
              <Button variant="outline" className="flex-1" onClick={downloadPng} data-testid="download-png-btn">
                <Download className="w-4 h-4 mr-2" /> Download PNG
              </Button>
            </div>
          </div>

          {/* Right - Info */}
          <div>
            <h1 className="text-4xl font-bold mb-2" data-testid="city-name">{city.city_name}</h1>
            <p className="text-gray-600 mb-8">Style: {city.style_name}</p>

            {/* Layer Visualization */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Layers className="w-5 h-5 mr-2" /> Layer Stack ({city.layer_count} layers)
              </h2>
              <div className="layer-stack" data-testid="layer-stack">
                {city.buildings?.map((building, index) => (
                  <div
                    key={index}
                    className={`layer-bar ${layerColors[index % layerColors.length]} text-white`}
                    data-testid={`layer-${index}`}
                  >
                    Layer {building.layer || index + 1}: {building.name}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Front layers (1) are closest to the viewer. Back layers are further away.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" /> How to Use
              </h2>
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="font-bold">1.</span>
                  <span>Download the SVG file using the button above</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">2.</span>
                  <span>Open in your laser cutter software (LightBurn, LaserGRBL, etc.)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">3.</span>
                  <span>Each building is on a separate layer - assign different cut depths</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">4.</span>
                  <span>Cut on layered material (wood, acrylic, cardboard)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">5.</span>
                  <span>Stack the layers with spacers for 3D relief effect</span>
                </li>
              </ol>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{city.building_count}</p>
                <p className="text-sm text-gray-500">Buildings</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{city.layer_count}</p>
                <p className="text-sm text-gray-500">Layers</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{city.processing_time_seconds?.toFixed(1)}s</p>
                <p className="text-sm text-gray-500">Process Time</p>
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
