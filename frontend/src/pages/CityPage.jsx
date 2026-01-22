import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Layers, FileText, Loader2, Quote, Image as ImageIcon, Box } from "lucide-react";
import { getCityPalette } from "@/lib/cityPalettes";

export default function CityPage() {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        // Try to get full city data first
        let res = await fetch(`${API}/citybank/cities/${cityId}/full`);
        if (!res.ok) {
          // Fallback to regular endpoint
          res = await fetch(`${API}/cities/${cityId}`);
        }
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

  const downloadLayer = (layerNum) => {
    window.open(`${API}/cities/${cityId}/layer/${layerNum}`, "_blank");
  };

  const downloadStage1 = () => {
    window.open(`${API}/cities/${cityId}/stage1`, "_blank");
  };

  // Get color palette for city
  const getColorPalette = () => {
    if (city?.color_palette) return city.color_palette;
    return getCityPalette(city?.city_name);
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

  const palette = getColorPalette();
  const hasImmersiveContent = city?.poems?.length > 0 || city?.art_3d?.length > 0 || city?.related_art?.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: hasImmersiveContent ? palette.background : "#ffffff" }}>
      {/* Header */}
      <header 
        className="py-4 px-4" 
        style={{ 
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: hasImmersiveContent ? `${palette.primary}50` : "#E5E7EB"
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center hover:opacity-80 transition-opacity"
            style={{ color: hasImmersiveContent ? palette.text : "#4B5563" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
          <Link to="/" className="font-semibold" style={{ color: hasImmersiveContent ? palette.text : "#0a0a0a" }}>
            Layered City Art
          </Link>
        </div>
      </header>

      {/* Hero Section with City Theme */}
      {hasImmersiveContent && (
        <section 
          className="py-16 px-4 text-center"
          style={{
            background: `linear-gradient(135deg, ${palette.primary}20, ${palette.secondary}20)`,
          }}
          data-testid="city-hero"
        >
          <h1 
            className="text-5xl md:text-6xl font-bold mb-4" 
            style={{ color: palette.text }}
            data-testid="city-name"
          >
            {city.city_name}
          </h1>
          {city.tagline && (
            <p className="text-xl md:text-2xl italic opacity-90" style={{ color: palette.accent }}>
              "{city.tagline}"
            </p>
          )}
          {city.country && (
            <p className="mt-2 text-sm opacity-70" style={{ color: palette.text }}>
              {city.country} {city.region ? `• ${city.region}` : ""}
            </p>
          )}
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12" data-testid="city-page">
        {/* Title - Only show if no immersive hero */}
        {!hasImmersiveContent && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2" data-testid="city-name">{city.city_name}</h1>
            <p className="text-gray-600">Style: {city.style_name}</p>
            {city.expansion_percentage > 0 && (
              <p className="text-blue-600 mt-1">+{city.expansion_percentage}% horizontal spacing applied</p>
            )}
          </div>
        )}

        {/* Poetry Section */}
        {city?.poems?.length > 0 && (
          <section className="mb-12" data-testid="poetry-section">
            <h2 
              className="text-2xl font-semibold mb-6 flex items-center gap-2"
              style={{ color: hasImmersiveContent ? palette.text : "#0a0a0a" }}
            >
              <Quote className="w-6 h-6" /> City Verses
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {city.poems.map((poem, index) => (
                <div 
                  key={index}
                  className="rounded-xl p-6 backdrop-blur-sm"
                  style={{ 
                    backgroundColor: hasImmersiveContent ? `${palette.primary}30` : "#F9FAFB",
                    border: `1px solid ${hasImmersiveContent ? palette.primary : "#E5E7EB"}40`
                  }}
                >
                  <h3 
                    className="font-semibold mb-3"
                    style={{ color: hasImmersiveContent ? palette.accent : "#0a0a0a" }}
                  >
                    {poem.title}
                  </h3>
                  <div 
                    className="text-sm italic whitespace-pre-line"
                    style={{ color: hasImmersiveContent ? palette.text : "#4B5563" }}
                  >
                    {poem.content}
                  </div>
                  <p 
                    className="mt-4 text-xs"
                    style={{ color: hasImmersiveContent ? `${palette.text}80` : "#9CA3AF" }}
                  >
                    — {poem.author || "AI Generated"} ({poem.style || "Free Verse"})
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Art Gallery */}
        {city?.related_art?.length > 0 && (
          <section className="mb-12" data-testid="related-art-section">
            <h2 
              className="text-2xl font-semibold mb-6 flex items-center gap-2"
              style={{ color: hasImmersiveContent ? palette.text : "#0a0a0a" }}
            >
              <ImageIcon className="w-6 h-6" /> Artistic Interpretations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {city.related_art.map((art, index) => (
                <div 
                  key={index}
                  className="rounded-lg overflow-hidden group cursor-pointer"
                  style={{ 
                    backgroundColor: hasImmersiveContent ? `${palette.secondary}30` : "#F3F4F6",
                  }}
                >
                  <div className="aspect-square flex items-center justify-center">
                    {art.image_url ? (
                      <img src={art.image_url} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <ImageIcon className="w-12 h-12 opacity-30" style={{ color: hasImmersiveContent ? palette.text : "#9CA3AF" }} />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate" style={{ color: hasImmersiveContent ? palette.text : "#0a0a0a" }}>
                      {art.title || "Untitled"}
                    </p>
                    <p className="text-xs opacity-70" style={{ color: hasImmersiveContent ? palette.text : "#6B7280" }}>
                      {art.style}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3D Models Section */}
        {city?.art_3d?.length > 0 && (
          <section className="mb-12" data-testid="3d-models-section">
            <h2 
              className="text-2xl font-semibold mb-6 flex items-center gap-2"
              style={{ color: hasImmersiveContent ? palette.text : "#0a0a0a" }}
            >
              <Box className="w-6 h-6" /> Explore in 3D
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {city.art_3d.map((model, index) => (
                <div 
                  key={index}
                  className="rounded-xl p-6"
                  style={{ 
                    backgroundColor: hasImmersiveContent ? `${palette.primary}20` : "#F9FAFB",
                    border: `1px solid ${hasImmersiveContent ? palette.primary : "#E5E7EB"}40`
                  }}
                >
                  <div 
                    className="aspect-video rounded-lg mb-4 flex items-center justify-center"
                    style={{ backgroundColor: hasImmersiveContent ? `${palette.background}` : "#E5E7EB" }}
                  >
                    {model.thumbnail_url ? (
                      <img src={model.thumbnail_url} alt={model.description} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Box className="w-16 h-16 opacity-30" style={{ color: hasImmersiveContent ? palette.text : "#9CA3AF" }} />
                    )}
                  </div>
                  <h3 
                    className="font-semibold"
                    style={{ color: hasImmersiveContent ? palette.text : "#0a0a0a" }}
                  >
                    {model.description || model.type}
                  </h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: hasImmersiveContent ? `${palette.text}80` : "#6B7280" }}
                  >
                    {model.type}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Layer Downloads Section */}
        <section 
          className="rounded-xl p-8 mb-12"
          style={{ 
            backgroundColor: hasImmersiveContent ? `${palette.primary}15` : "#FFFFFF",
            border: hasImmersiveContent ? `1px solid ${palette.primary}30` : "1px solid #E5E7EB"
          }}
        >
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left - Layer Downloads */}
            <div>
              <h2 
                className="text-xl font-semibold mb-6 flex items-center gap-2"
                style={{ color: hasImmersiveContent ? palette.text : "#0a0a0a" }}
              >
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
                    <h3 className="font-semibold text-gray-700">Stage 1 Output (All Buildings)</h3>
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
              {/* Layer Visualization */}
              <div className="mb-8">
                <h2 
                  className="text-xl font-semibold mb-4 flex items-center gap-2"
                  style={{ color: hasImmersiveContent ? palette.text : "#0a0a0a" }}
                >
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
        </section>
      </main>

      {/* Footer */}
      <footer 
        className="py-8 px-4 mt-12"
        style={{ 
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: hasImmersiveContent ? `${palette.primary}50` : "#E5E7EB"
        }}
      >
        <div 
          className="max-w-6xl mx-auto text-center text-sm"
          style={{ color: hasImmersiveContent ? `${palette.text}80` : "#6B7280" }}
        >
          <p>© {new Date().getFullYear()} Layered City Art • Made with coffee and frustration</p>
        </div>
      </footer>
    </div>
  );
}
