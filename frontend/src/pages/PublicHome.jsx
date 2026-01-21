import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Layers, Download, ArrowRight, Loader2, ChevronDown, MapPin } from "lucide-react";

// US Cities Database
const US_CITIES = {
  "Major Metropolitan Skylines": [
    { name: "New York City, NY", desc: "Empire State, Freedom Tower, Chrysler Building" },
    { name: "Chicago, IL", desc: "Willis Tower, John Hancock Center" },
    { name: "Los Angeles, CA", desc: "US Bank Tower, Capitol Records, Hollywood sign" },
    { name: "San Francisco, CA", desc: "Golden Gate Bridge, Transamerica Pyramid" },
    { name: "Seattle, WA", desc: "Space Needle, Columbia Center" },
    { name: "Miami, FL", desc: "Art Deco buildings along Biscayne Bay" },
    { name: "Boston, MA", desc: "Hancock Tower, Prudential Center" },
    { name: "Philadelphia, PA", desc: "City Hall, Comcast Center" },
    { name: "Washington, DC", desc: "Capitol, Washington Monument" },
    { name: "Houston, TX", desc: "Texas-sized downtown" },
  ],
  "Distinctive Regional Skylines": [
    { name: "Denver, CO", desc: "Rocky Mountains backdrop" },
    { name: "Atlanta, GA", desc: "Peachtree Center, Bank of America Plaza" },
    { name: "Dallas, TX", desc: "Reunion Tower, Bank of America Plaza" },
    { name: "Las Vegas, NV", desc: "Strip skyline" },
    { name: "Phoenix, AZ", desc: "Desert modern skyline" },
    { name: "San Diego, CA", desc: "Coronado Bridge, waterfront" },
    { name: "Portland, OR", desc: "Big Pink, Mt. Hood backdrop" },
    { name: "Austin, TX", desc: "Capitol, Colorado River" },
    { name: "Nashville, TN", desc: "Batman Building, Music City" },
    { name: "Charlotte, NC", desc: "Bank of America Corporate Center" },
  ],
  "Waterfront & Scenic Skylines": [
    { name: "Pittsburgh, PA", desc: "Golden Triangle, rivers meet" },
    { name: "Baltimore, MD", desc: "Inner Harbor" },
    { name: "Cleveland, OH", desc: "Lake Erie, Terminal Tower" },
    { name: "Detroit, MI", desc: "Renaissance Center, Detroit River" },
    { name: "St. Louis, MO", desc: "Gateway Arch" },
    { name: "Minneapolis, MN", desc: "IDS Center, Mississippi River" },
    { name: "New Orleans, LA", desc: "French Quarter, Superdome" },
    { name: "San Antonio, TX", desc: "River Walk, Tower of the Americas" },
    { name: "Tampa, FL", desc: "Bayfront" },
    { name: "Honolulu, HI", desc: "Diamond Head backdrop" },
  ],
  "Growing & Distinctive Skylines": [
    { name: "Salt Lake City, UT", desc: "Wasatch Mountains, LDS Temple" },
    { name: "Kansas City, MO", desc: "Country Club Plaza" },
    { name: "Indianapolis, IN", desc: "Soldiers and Sailors Monument" },
    { name: "Columbus, OH", desc: "LeVeque Tower, State Capitol" },
    { name: "Milwaukee, WI", desc: "Art Museum, Lake Michigan" },
    { name: "Oklahoma City, OK", desc: "Devon Tower, Bricktown" },
    { name: "Memphis, TN", desc: "Pyramid, Mississippi River" },
    { name: "Louisville, KY", desc: "Waterfront, Muhammad Ali Center" },
    { name: "Jacksonville, FL", desc: "Hart Bridge, St. Johns River" },
    { name: "Sacramento, CA", desc: "Tower Bridge, State Capitol" },
  ],
};

export default function PublicHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch featured cities
  useEffect(() => {
    fetchFeatured();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchResult(null);
    setShowDropdown(false);
    
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

  const handleCitySelect = (cityName) => {
    // Extract just the city name before the comma
    const simpleName = cityName.split(",")[0].trim();
    setSearchQuery(simpleName);
    setShowDropdown(false);
    // Auto search
    setTimeout(() => {
      handleSearchCity(simpleName);
    }, 100);
  };

  const handleSearchCity = async (query) => {
    setSearching(true);
    setSearchResult(null);
    
    try {
      const res = await fetch(`${API}/cities/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResult(data);
      
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

  // Check if a city is available (in our processed list)
  const isCityAvailable = (cityName) => {
    const simpleName = cityName.split(",")[0].trim().toLowerCase();
    return featured.some(f => f.city_name.toLowerCase().includes(simpleName));
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
          
          {/* Search with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <form onSubmit={handleSearch} className="hero-search" data-testid="search-form">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search for a city..."
                  className="w-full pl-12 pr-32 py-4 text-lg border-2 rounded-xl"
                  data-testid="search-input"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="text-gray-500"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </Button>
                  <Button
                    type="submit"
                    disabled={searching}
                    data-testid="search-btn"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
              </div>
            </form>

            {/* City Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[60vh] overflow-y-auto" data-testid="city-dropdown">
                {Object.entries(US_CITIES).map(([category, cities]) => (
                  <div key={category} className="border-b border-gray-100 last:border-0">
                    <div className="px-4 py-3 bg-gray-50 sticky top-0">
                      <h3 className="font-semibold text-sm text-gray-700">{category}</h3>
                    </div>
                    <div className="py-1">
                      {cities.map((city) => {
                        const available = isCityAvailable(city.name);
                        return (
                          <button
                            key={city.name}
                            onClick={() => handleCitySelect(city.name)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 ${
                              available ? 'bg-green-50' : ''
                            }`}
                          >
                            <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${available ? 'text-green-600' : 'text-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{city.name}</span>
                                {available && (
                                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Available</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">{city.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
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

      {/* Featured Cities (City Bank) */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-center">City Bank</h2>
            <p className="text-gray-500 text-center mb-8">Available cities ready for download</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6" data-testid="featured-grid">
              {featured.map((city) => (
                <div
                  key={city.id}
                  className="city-card bg-white cursor-pointer"
                  onClick={() => goToCity(city.id)}
                  data-testid={`featured-city-${city.id}`}
                >
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    <img
                      src={`${API}/cities/${city.id}/styled`}
                      alt={city.city_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {city.layer_count} layers
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{city.city_name}</h3>
                    <p className="text-sm text-gray-500">{city.style_name}</p>
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
