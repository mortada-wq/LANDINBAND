import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Layers, Download, ArrowRight, Loader2 } from "lucide-react";

export default function PublicHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [featured, setFeatured] = useState([]);

  // Fetch featured cities
  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const res = await fetch(`${API}/featured`);
      const data = await res.json();
      setFeatured(data);
    } catch (e) {
      console.error("Failed to fetch featured:", e);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchResult(null);
    
    try {
      const res = await fetch(`${API}/cities/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResult(data);
      
      // If only one result, go directly to city page
      if (data.found && data.cities?.length === 1) {
        navigate(`/city/${data.cities[0].id}`);
      }
    } catch (e) {
      console.error("Search failed:", e);
    }
    setSearching(false);
  };

  const goToCity = (cityId) => {
    navigate(`/city/${cityId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4" data-testid="hero-title">
            Layered City Art
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Download laser-ready city skyline art with separate building layers
          </p>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="hero-search" data-testid="search-form">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a city..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 rounded-xl"
                data-testid="search-input"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                disabled={searching}
                data-testid="search-btn"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </form>
          
          {/* Search Results */}
          {searchResult && (
            <div className="mt-8 fade-in" data-testid="search-results">
              {searchResult.found ? (
                <div className="space-y-4">
                  <p className="text-gray-600">Found {searchResult.cities.length} result(s)</p>
                  <div className="grid gap-4">
                    {searchResult.cities.map((city) => (
                      <div
                        key={city.id}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors text-left"
                        onClick={() => goToCity(city.id)}
                        data-testid={`search-result-${city.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{city.city_name}</h3>
                            <p className="text-sm text-gray-500">{city.style_name} • {city.layer_count} layers</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-4">{searchResult.message}</p>
                  {searchResult.suggestions?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Try these instead:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {searchResult.suggestions.map((s) => (
                          <button
                            key={s.id}
                            className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm hover:border-gray-400"
                            onClick={() => goToCity(s.id)}
                          >
                            {s.city_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured Cities */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Featured Cities</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6" data-testid="featured-grid">
              {featured.map((city) => (
                <div
                  key={city.id}
                  className="city-card bg-white cursor-pointer"
                  onClick={() => goToCity(city.id)}
                  data-testid={`featured-city-${city.id}`}
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <Layers className="w-12 h-12 text-gray-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{city.city_name}</h3>
                    <p className="text-sm text-gray-500">{city.style_name} • {city.layer_count} layers</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">1. Search</h3>
              <p className="text-gray-600 text-sm">Find your city in our collection</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">2. Preview</h3>
              <p className="text-gray-600 text-sm">See the layers and building breakdown</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">3. Download</h3>
              <p className="text-gray-600 text-sm">Get the laser-ready SVG file</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Layered City Art</p>
          <p>Contact for custom requests</p>
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
