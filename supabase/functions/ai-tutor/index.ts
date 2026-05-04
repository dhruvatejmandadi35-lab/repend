import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth: require a valid signed-in user ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, moduleTitle, courseTitle, currentSlideContent, slideIndex, totalSlides, activeSection } = await req.json();

    // ── Input validation ──
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const msg of messages) {
      if (!msg || typeof msg.content !== "string" || msg.content.length > 2000) {
        return new Response(JSON.stringify({ error: "Message too long or malformed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!["user", "assistant", "system"].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    const safeModuleTitle = String(moduleTitle ?? "").slice(0, 200);
    const safeCourseTitle = String(courseTitle ?? "").slice(0, 200);
    const safeSlide = currentSlideContent ? String(currentSlideContent).slice(0, 1500) : "";
    const safeSection = activeSection ? String(activeSection).slice(0, 50) : "";

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Build context-aware system prompt
    let contextBlock = "";
    if (safeSlide) {
      contextBlock = `\n\n## Current Slide (${slideIndex + 1}/${totalSlides})
\`\`\`
${safeSlide}
\`\`\``;
    }
    if (safeSection) {
      contextBlock += `\nThe student is in the ${safeSection} section.`;
    }

    const systemPrompt = `You are an expert AI tutor on the Repend learning platform.
You are helping a student with "${safeModuleTitle}" in the course "${safeCourseTitle}".
${contextBlock}

## Response Rules

**Structure every response like this:**

### 📍 About This Slide
- Explain the current slide content first (2-3 bullet points max)
- Connect it to the bigger picture

### 💡 Your Question
- Answer the student's specific question
- Use bullet points and short sentences
- Include ONE clear example if helpful

## Formatting Rules
- Use **bold** for key terms
- Use bullet points, never long paragraphs
- Keep each section to 2-4 bullet points max
- Use emoji headers for visual separation
- If the question IS about the current slide, combine both sections into one
- Never give quiz/test answers directly — guide the student to think
- Stay on topic for this module`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
