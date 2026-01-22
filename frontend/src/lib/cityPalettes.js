/**
 * City Color Palettes for Immersive Experience
 * These palettes define the visual theme when viewing a city page
 */

export const cityPalettes = {
  seattle: { 
    primary: "#2D5F3F", 
    secondary: "#7A8B99", 
    accent: "#F4A261", 
    background: "#1A2B2D", 
    text: "#E9ECEF" 
  },
  "new york": { 
    primary: "#F4D03F", 
    secondary: "#5D6D7E", 
    accent: "#E74C3C", 
    background: "#1C2833", 
    text: "#FFFFFF" 
  },
  tokyo: { 
    primary: "#FF1493", 
    secondary: "#00CED1", 
    accent: "#FFD700", 
    background: "#0A0E27", 
    text: "#FFFFFF" 
  },
  paris: { 
    primary: "#C19A6B", 
    secondary: "#8B7D6B", 
    accent: "#E63946", 
    background: "#2C2416", 
    text: "#F5E6D3" 
  },
  chicago: { 
    primary: "#1E3A5F", 
    secondary: "#C0C0C0", 
    accent: "#FF6B35", 
    background: "#0D1B2A", 
    text: "#E0E1DD" 
  },
  london: { 
    primary: "#8B0000", 
    secondary: "#2F4F4F", 
    accent: "#FFD700", 
    background: "#1A1A2E", 
    text: "#EAEAEA" 
  },
  "los angeles": { 
    primary: "#FF6B00", 
    secondary: "#87CEEB", 
    accent: "#FFD700", 
    background: "#1A1A2E", 
    text: "#FFFFFF" 
  },
  "san francisco": { 
    primary: "#FF4500", 
    secondary: "#708090", 
    accent: "#FFD700", 
    background: "#1C2526", 
    text: "#F5F5F5" 
  },
  miami: { 
    primary: "#00CED1", 
    secondary: "#FF69B4", 
    accent: "#FFD700", 
    background: "#1A1A2E", 
    text: "#FFFFFF" 
  },
  dubai: { 
    primary: "#C9A227", 
    secondary: "#1C1C1C", 
    accent: "#FFFFFF", 
    background: "#0D0D0D", 
    text: "#F5F5F5" 
  },
  default: { 
    primary: "#4A6B8A", 
    secondary: "#6B9AC4", 
    accent: "#F4A261", 
    background: "#1A2B3D", 
    text: "#E9ECEF" 
  },
};

/**
 * Get color palette for a city by name
 * @param {string} cityName - The name of the city
 * @returns {Object} Color palette object
 */
export const getCityPalette = (cityName) => {
  if (!cityName) return cityPalettes.default;
  
  const cityNameLower = cityName.toLowerCase();
  for (const [key, palette] of Object.entries(cityPalettes)) {
    if (cityNameLower.includes(key)) return palette;
  }
  return cityPalettes.default;
};

export default cityPalettes;
