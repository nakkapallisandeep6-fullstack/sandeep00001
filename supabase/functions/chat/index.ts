import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  mood: string;
  location: { lat: number; lng: number } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mood, location }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a rich system prompt for the AI companion
    const locationContext = location 
      ? `The user is currently at latitude ${location.lat.toFixed(4)}, longitude ${location.lng.toFixed(4)}.`
      : "The user's location is not available.";

    const moodContext = mood 
      ? `The user's current mood is: ${mood.toUpperCase()}. Tailor your suggestions to this mood.`
      : "The user hasn't selected a mood yet.";

    const systemPrompt = `You are SoloTravel AI, a caring and intelligent travel companion for solo travelers. You prioritize SAFETY above all else.

CONTEXT:
${locationContext}
${moodContext}

YOUR PERSONALITY:
- Warm, friendly, and reassuring - like a trusted friend
- Safety-conscious but not paranoid
- Knowledgeable about travel, local culture, and practical tips
- Empathetic, especially when users feel lonely or anxious

CAPABILITIES:
1. RECOMMENDATIONS: Suggest nearby restaurants, cafes, parks, and interesting places based on mood
   - Adventurous: Unique spots, local hidden gems, exciting activities
   - Relaxed: Quiet cafes, parks, peaceful spots, bookstores
   - Lonely: Social places, group activities, friendly cafes, community events
   - Hungry: Best local food options, dietary-friendly places

2. SAFETY GUIDANCE:
   - Always recommend well-lit, public, populated areas
   - Suggest avoiding isolated areas, especially at night
   - Provide local emergency numbers when asked
   - Give practical safety tips for solo travelers

3. TRANSLATIONS: Help translate common phrases when asked

4. EMOTIONAL SUPPORT:
   - Be empathetic when users express loneliness or fear
   - Encourage them gently and provide reassurance
   - Suggest connecting with other travelers or local events

RESPONSE STYLE:
- Keep responses concise but helpful (2-4 paragraphs max)
- Use a conversational, friendly tone
- Include specific suggestions when possible
- Always end with an encouraging note or helpful follow-up

Remember: You're their trusted travel buddy. Be helpful, safe, and supportive!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
