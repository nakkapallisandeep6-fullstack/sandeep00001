import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecommendationRequest {
  lat: number;
  lng: number;
  mood: string;
}

interface Place {
  id: string;
  name: string;
  type: string;
  description: string;
  distance: string;
  lat: number;
  lng: number;
  rating: number;
  mood: string;
}

// Generate mock recommendations based on mood and location
function generateRecommendations(lat: number, lng: number, mood: string): Place[] {
  const basePlaces: Record<string, Partial<Place>[]> = {
    adventurous: [
      { name: "Hidden Rooftop Bar", type: "bar", description: "Secret speakeasy with panoramic city views" },
      { name: "Street Food Market", type: "food", description: "Vibrant local market with authentic street eats" },
      { name: "Adventure Tours Hub", type: "activity", description: "Kayaking, hiking, and urban exploration" },
      { name: "Underground Jazz Club", type: "entertainment", description: "Live music in a historic basement venue" },
    ],
    relaxed: [
      { name: "Zen Garden Café", type: "cafe", description: "Quiet café with Japanese garden views" },
      { name: "Riverside Park", type: "park", description: "Peaceful walking paths along the water" },
      { name: "Cozy Bookshop & Tea", type: "cafe", description: "Second-hand books with artisan teas" },
      { name: "Botanical Gardens", type: "park", description: "Tranquil gardens with meditation spots" },
    ],
    lonely: [
      { name: "Traveler's Hostel Bar", type: "social", description: "Meet fellow travelers, game nights daily" },
      { name: "Language Exchange Café", type: "social", description: "Weekly meetups with locals and visitors" },
      { name: "Co-Working Social Space", type: "social", description: "Digital nomad community hub" },
      { name: "Community Kitchen", type: "food", description: "Cook and dine with locals" },
    ],
    hungry: [
      { name: "Local's Choice Bistro", type: "restaurant", description: "Award-winning regional cuisine" },
      { name: "24hr Noodle House", type: "restaurant", description: "Authentic noodles, late-night favorite" },
      { name: "Farm-to-Table Kitchen", type: "restaurant", description: "Seasonal menu with local ingredients" },
      { name: "Fusion Street Corner", type: "food", description: "Creative fusion dishes, great reviews" },
    ],
  };

  const moodPlaces = basePlaces[mood.toLowerCase()] || basePlaces.relaxed;
  
  return moodPlaces.map((place, index) => {
    // Generate random offset for each place (within ~2km)
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;
    const distance = (Math.random() * 1.5 + 0.2).toFixed(1);
    
    return {
      id: `${mood}-${index}`,
      name: place.name || "Unknown Place",
      type: place.type || "place",
      description: place.description || "",
      distance: `${distance} km`,
      lat: lat + latOffset,
      lng: lng + lngOffset,
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      mood: mood,
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, mood }: RecommendationRequest = await req.json();
    
    if (!lat || !lng || !mood) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: lat, lng, mood" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating recommendations for mood: ${mood} at ${lat}, ${lng}`);
    
    const recommendations = generateRecommendations(lat, lng, mood);

    return new Response(JSON.stringify({ places: recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate recommendations" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
