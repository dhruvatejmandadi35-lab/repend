// v5 — Claude-powered course generation with rich module schema
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeTopic(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

// ─── CLAUDE API CALLER ───

async function callClaude(
  apiKey: string,
  system: string,
  userMsg: string,
  tools: any[],
  toolName: string,
  maxTokens = 8000,
  retries = 2,
): Promise<any> {
  let lastError = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 4000;
      console.log(`[Claude Retry] Attempt ${attempt + 1} after ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: maxTokens,
          system,
          tools,
          tool_choice: { type: "tool", name: toolName },
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      if (response.status === 429) { lastError = "Rate limit exceeded."; continue; }
      if (response.status === 402) throw new Error("API credits exhausted.");

      const text = await response.text();
      if (!response.ok) {
        lastError = `Claude error (${response.status}): ${text.slice(0, 300)}`;
        console.error(`[Claude ${response.status}]`, text.slice(0, 300));
        continue;
      }

      let parsed: any;
      try { parsed = JSON.parse(text); } catch {
        lastError = "Invalid JSON from Claude."; continue;
      }

      const toolUseBlock = parsed.content?.find((c: any) => c.type === "tool_use");
      if (!toolUseBlock) {
        lastError = "Claude did not return a tool_use block.";
        console.error("[Claude] No tool_use in response:", JSON.stringify(parsed).slice(0, 300));
        continue;
      }
      return toolUseBlock.input;
    } catch (e: any) {
      if (e.message?.includes("credits")) throw e;
      lastError = e.message || "Network error.";
    }
  }
  throw new Error(lastError || "Claude call failed after retries.");
}

// ─── TOOL SCHEMAS ───

const outlineTool = {
  name: "create_course_outline",
  description: "Generate the course outline with module list",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Course title, max 8 words" },
      description: { type: "string", description: "Course description, max 40 words" },
      difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
      estimated_time: { type: "string", description: "e.g. '45 minutes' or '2 hours'" },
      subject_category: {
        type: "string",
        enum: ["Science", "Math", "History", "Technology", "Life Skills", "Business", "Health", "Art & Music", "Language", "Philosophy", "Other"],
      },
      modules: {
        type: "array",
        minItems: 4,
        maxItems: 7,
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Module title, max 6 words" },
            lab_prompt: { type: "string", description: "Specific hands-on activity description for the lab, 1-2 sentences" },
          },
          required: ["title", "lab_prompt"],
        },
      },
    },
    required: ["title", "description", "difficulty", "estimated_time", "subject_category", "modules"],
  },
};

const moduleContentTool = {
  name: "create_module_content",
  description: "Generate full lesson content for one module",
  input_schema: {
    type: "object",
    properties: {
      lesson_content: {
        type: "string",
        description: "Lesson in slide format: exactly 6-7 slides separated by '\\n---\\n'. Each slide starts with '## emoji Title' and has 3-5 bullet points. Under 120 words per slide.",
      },
      real_world_application: {
        type: "string",
        description: "2-3 sentence real-world scenario the student would actually encounter. Make it vivid and specific.",
      },
      key_takeaways: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
        description: "3-5 concise takeaways from this module",
      },
      quiz: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
            correct: { type: "number", description: "0-indexed correct option" },
            explanation: { type: "string", description: "One sentence explanation" },
          },
          required: ["question", "options", "correct", "explanation"],
        },
      },
    },
    required: ["lesson_content", "real_world_application", "key_takeaways", "quiz"],
  },
};

// ─── LESSON CONTENT REPAIR (keep slides well-formed) ───

function repairLessonContent(content: string): string {
  if (!content) return "## Lesson\n\nContent is being prepared.";

  let repaired = content;

  if (!repaired.includes("\n---\n")) {
    const sections = repaired.split(/(?=^## )/m).filter(Boolean);
    if (sections.length > 1) {
      repaired = sections.join("\n\n---\n\n");
    } else {
      const paragraphs = repaired.split(/\n{2,}/).filter((s) => s.trim());
      if (paragraphs.length > 3) {
        const slides: string[] = [];
        let current: string[] = [];
        let wordCount = 0;
        for (const p of paragraphs) {
          const pWords = p.split(/\s+/).length;
          if (wordCount + pWords > 120 && current.length > 0) {
            slides.push(current.join("\n\n"));
            current = [p];
            wordCount = pWords;
          } else {
            current.push(p);
            wordCount += pWords;
          }
        }
        if (current.length) slides.push(current.join("\n\n"));
        if (slides.length > 1) repaired = slides.join("\n\n---\n\n");
      }
    }
  }

  const slides = repaired.split(/\n---\n/).map((s: string) => s.trim()).filter(Boolean);

  while (slides.length > 8) {
    let minLen = Infinity, minIdx = 0;
    for (let i = 0; i < slides.length - 1; i++) {
      const combined = slides[i].length + slides[i + 1].length;
      if (combined < minLen) { minLen = combined; minIdx = i; }
    }
    slides[minIdx] = slides[minIdx] + "\n\n" + slides[minIdx + 1];
    slides.splice(minIdx + 1, 1);
  }

  while (slides.length < 3 && slides.some((s) => s.split(/\s+/).length > 60)) {
    let maxLen = 0, maxIdx = 0;
    for (let i = 0; i < slides.length; i++) {
      const wc = slides[i].split(/\s+/).length;
      if (wc > maxLen) { maxLen = wc; maxIdx = i; }
    }
    const lines = slides[maxIdx].split("\n");
    const mid = Math.floor(lines.length / 2);
    slides.splice(maxIdx, 1, lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n"));
  }

  return slides.join("\n\n---\n\n");
}

// ─── FILE EXTRACTION ───

async function extractFileContent(
  filePath: string,
  supabaseAdmin: any,
): Promise<{ text?: string; imageBase64?: string; mimeType?: string }> {
  const { data, error } = await supabaseAdmin.storage.from("course-uploads").download(filePath);
  if (error || !data) return {};

  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["png", "jpg", "jpeg", "webp"];
  const textExts = ["txt", "md", "csv"];

  if (imageExts.includes(ext)) {
    const buffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const mimeMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
    return { imageBase64: base64, mimeType: mimeMap[ext] || "image/png" };
  }
  if (textExts.includes(ext)) return { text: (await data.text()).slice(0, 50000) };
  if (ext === "pdf") {
    try {
      const text = await data.text();
      const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
      if (cleaned.length > 100) return { text: cleaned.slice(0, 50000) };
    } catch { /* ignore */ }
  }
  return {};
}

// ─── PERSONALIZATION ───

function buildPersonalizationContext(prefs: any): string {
  if (!prefs) return "";
  const parts: string[] = [];
  if (prefs.level) {
    const map: Record<string, string> = {
      beginner: "Student is a BEGINNER — use simple language, define all terms, provide many examples.",
      intermediate: "Student has INTERMEDIATE knowledge — assume basic familiarity.",
      advanced: "Student is ADVANCED — skip basics, focus on nuance and edge cases.",
    };
    if (map[prefs.level]) parts.push(map[prefs.level]);
  }
  if (prefs.style) {
    const map: Record<string, string> = {
      visual: "LEARNING STYLE: Visual — use tables, diagrams, charts.",
      "hands-on": "LEARNING STYLE: Hands-on — include challenges and practice.",
      conceptual: "LEARNING STYLE: Conceptual — focus on WHY things work.",
      mixed: "LEARNING STYLE: Mixed — balance theory, visuals, and practice.",
    };
    if (map[prefs.style]) parts.push(map[prefs.style]);
  }
  if (prefs.goal) {
    const map: Record<string, string> = {
      basics: "GOAL: Understand basics.",
      "test-prep": "GOAL: Test preparation — include exam-style questions.",
      "real-world": "GOAL: Real-world application.",
      mastery: "GOAL: Deep mastery.",
    };
    if (map[prefs.goal]) parts.push(map[prefs.goal]);
  }
  if (prefs.pace) {
    const map: Record<string, string> = {
      fast: "PACE: Fast — key points only.",
      balanced: "PACE: Balanced.",
      detailed: "PACE: Detailed — thorough explanations.",
    };
    if (map[prefs.pace]) parts.push(map[prefs.pace]);
  }
  return parts.filter(Boolean).join("\n");
}

// ─── OUTLINE GENERATION ───

async function generateOutline(
  apiKey: string,
  topic: string,
  hasFile: boolean,
  preferences: any,
): Promise<any> {
  console.log("[Step 1] Generating course outline with Claude…");
  const personalization = buildPersonalizationContext(preferences);

  const difficulty = preferences?.level === "beginner" ? "Beginner" : preferences?.level === "advanced" ? "Advanced" : "Intermediate";

  const system = `You are an expert educator building an interactive course for Repend, a platform where learning happens through doing, not memorizing.

For every module you create:
- Make the title clear and specific
- Write the lab_prompt as a specific activity description that would make someone genuinely understand the concept through hands-on practice — think "build", "simulate", "debug", "analyze", not "read about"
- Think like a teacher who wants students to actually get it, not just pass a test

${personalization ? `PERSONALIZATION:\n${personalization}\n` : ""}${hasFile ? "Base the outline on the uploaded source material.\n" : ""}
Keep all strings concise. Return exactly what the tool schema asks for. No extra text.`;

  const userMsg = `Create a course outline for: "${topic}"
Difficulty preference: ${difficulty}
Create 5-6 focused modules that build on each other logically.`;

  return await callClaude(apiKey, system, userMsg, [outlineTool], "create_course_outline", 4096);
}

// ─── MODULE CONTENT GENERATION ───

async function generateModuleContent(
  apiKey: string,
  topic: string,
  moduleTitle: string,
  moduleIndex: number,
  totalModules: number,
  hasFile: boolean,
  fileContext: string,
  preferences: any,
): Promise<{ lesson_content: string; real_world_application: string; key_takeaways: string[]; quiz: any[] }> {
  console.log(`[Step 2] Generating content for module ${moduleIndex + 1}/${totalModules}: "${moduleTitle}"`);
  const personalization = buildPersonalizationContext(preferences);

  const system = `You are an expert educator building an interactive course for Repend, a platform where learning happens through doing, not memorizing.

For this module:
- Explain the concept clearly and conversationally — write like a great teacher talking to a curious student
- Always connect concepts to real-world scenarios the student would actually encounter
- Make key_takeaways genuinely memorable and actionable

LESSON FORMAT (STRICT):
- Create exactly 6-7 slides separated by "\\n---\\n"
- Each slide starts with "## [emoji] [Title]"
- Each slide has 3-5 bullet points
- Keep each slide under 120 words
- Example:
## 🎯 Why This Matters
- Real-world reason 1
- Real-world reason 2
- How this shows up in daily life
---
## 🧠 Core Concept
- Key idea explained simply
- The mechanism behind it

REAL WORLD APPLICATION:
- Write 2-3 sentences about a specific, vivid real-world scenario — make it feel like something the student would actually experience

QUIZ:
- 5 questions with practical application focus
- Explanations should be 1 clear sentence

${personalization ? `PERSONALIZATION:\n${personalization}\n` : ""}${hasFile ? "Base content on the source material provided.\n" : ""}`;

  const userMsg = fileContext
    ? `Module ${moduleIndex + 1}/${totalModules} of the course "${topic}": "${moduleTitle}"\n\nSource material:\n${fileContext.slice(0, 6000)}`
    : `Module ${moduleIndex + 1}/${totalModules} of the course "${topic}": "${moduleTitle}"`;

  try {
    const result = await callClaude(apiKey, system, userMsg, [moduleContentTool], "create_module_content", 6000);
    return {
      lesson_content: repairLessonContent(result.lesson_content || ""),
      real_world_application: result.real_world_application || "",
      key_takeaways: Array.isArray(result.key_takeaways) ? result.key_takeaways : [],
      quiz: Array.isArray(result.quiz) && result.quiz.length > 0
        ? result.quiz
        : [{ question: `What is a key concept from "${moduleTitle}"?`, options: ["A", "B", "C", "D"], correct: 0, explanation: "Review the lesson." }],
    };
  } catch (e: any) {
    console.error(`[Module ${moduleIndex + 1}] Generation failed: ${e.message}`);
    return {
      lesson_content: `## ${moduleTitle}\n\nContent generation failed. Please regenerate this module.`,
      real_world_application: "",
      key_takeaways: [],
      quiz: [],
    };
  }
}

// ─── MAIN HANDLER ───

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const {
      topic, filePath, filePaths, preferences,
      phase, courseId: existingCourseId, moduleIndex, moduleTitle,
    } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing in Supabase secrets");

    // ─── PHASE 2: Generate content for a single module ───
    if (phase === 2 && existingCourseId && typeof moduleIndex === "number" && moduleTitle) {
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const topicNormalized = normalizeTopic(topic || moduleTitle);
      const moduleNormalized = normalizeTopic(moduleTitle);

      const allFilePaths: string[] = [];
      if (Array.isArray(filePaths)) allFilePaths.push(...filePaths);
      else if (filePath) allFilePaths.push(filePath);

      let fileTextContext = "";
      if (allFilePaths.length > 0) {
        for (const fp of allFilePaths) {
          const extracted = await extractFileContent(fp, supabaseAdmin);
          if (extracted.text) fileTextContext += extracted.text.slice(0, 10000) + "\n\n";
        }
      }

      const hasFile = fileTextContext.length > 0;

      // Get total module count
      const { data: allModules } = await supabase
        .from("course_modules")
        .select("id, lesson_content, lab_generation_status, lab_data")
        .eq("course_id", existingCourseId);

      const totalModules = allModules?.length || 4;

      // ── Module content cache check ──
      let content: { lesson_content: string; real_world_application: string; key_takeaways: string[]; quiz: any[] };
      let fromCache = false;

      const { data: cachedCourse } = await supabaseAdmin
        .from("course_cache")
        .select("modules")
        .eq("topic_normalized", topicNormalized)
        .maybeSingle();

      const cachedModule = cachedCourse?.modules?.[moduleNormalized];
      if (cachedModule?.lesson_content) {
        console.log(`[Module Cache HIT] "${moduleNormalized}" in "${topicNormalized}"`);
        content = cachedModule;
        fromCache = true;
      } else {
        content = await generateModuleContent(
          ANTHROPIC_API_KEY, topic || moduleTitle, moduleTitle,
          moduleIndex, totalModules, hasFile, fileTextContext, preferences,
        );
      }

      await supabase.from("course_modules").update({
        lesson_content: content.lesson_content,
        real_world_application: content.real_world_application || null,
        key_takeaways: content.key_takeaways?.length ? content.key_takeaways : null,
        quiz: content.quiz,
      }).eq("course_id", existingCourseId).eq("module_order", moduleIndex + 1);

      // ── Write module content to cache (skip if file-based or already from cache) ──
      if (!fromCache && !hasFile) {
        const updatedModules = { ...(cachedCourse?.modules ?? {}), [moduleNormalized]: content };
        await supabaseAdmin
          .from("course_cache")
          .upsert({ topic_normalized: topicNormalized, modules: updatedModules }, { onConflict: "topic_normalized" })
          .then(() => console.log(`[Module Cache WRITE] "${moduleNormalized}"`))
          .catch((e: any) => console.warn("[Course Cache] Module write failed (non-fatal):", e.message));
      }

      console.log(`[Phase 2] Module ${moduleIndex + 1} "${moduleTitle}" done`);

      // Check if all modules are complete — if so, mark course ready and trigger labs
      const { data: updatedModules } = await supabase
        .from("course_modules")
        .select("id, lesson_content, lab_generation_status, lab_data")
        .eq("course_id", existingCourseId);

      const allLessonsDone = updatedModules?.every((m: any) => !m.lesson_content?.startsWith("⏳")) ?? false;

      if (allLessonsDone) {
        console.log("[Phase 2] All lessons done — triggering lab generation");
        await supabase.from("courses").update({ status: "ready" }).eq("id", existingCourseId);

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const pendingModules = (updatedModules || []).filter(
          (m: any) => m.lab_generation_status === "pending" || (m.lab_generation_status === "done" && !m.lab_data),
        );

        await Promise.all(
          pendingModules.map((m: any) =>
            fetch(`${supabaseUrl}/functions/v1/generate-lab-blueprint`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
              body: JSON.stringify({ moduleId: m.id }),
            }).catch((e: any) => console.error(`Lab trigger failed for ${m.id}:`, e.message))
          ),
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── PHASE 1: Generate outline + insert placeholder modules ───
    if (!topic?.trim()) throw new Error("Topic is required");

    const allFilePaths: string[] = [];
    if (Array.isArray(filePaths)) allFilePaths.push(...filePaths);
    else if (filePath) allFilePaths.push(filePath);

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let fileTextContext = "";
    if (allFilePaths.length > 0) {
      for (const fp of allFilePaths) {
        const content = await extractFileContent(fp, supabaseAdmin);
        if (content.text) fileTextContext += content.text.slice(0, 10000) + "\n\n";
      }
    }

    const hasFile = fileTextContext.length > 0;
    const topicNormalized = normalizeTopic(topic);

    // Create course with placeholder
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .insert({ user_id: user.id, title: topic.trim(), topic: topic.trim(), status: "generating" })
      .select()
      .single();

    if (courseErr || !course) throw new Error("Failed to create course record");

    // ── Outline cache check ──
    let outline: any;
    let outlineFromCache = false;

    if (!hasFile) {
      const { data: cachedCourse } = await supabaseAdmin
        .from("course_cache")
        .select("outline")
        .eq("topic_normalized", topicNormalized)
        .maybeSingle();

      if (cachedCourse?.outline?.modules?.length > 0) {
        console.log(`[Outline Cache HIT] "${topicNormalized}"`);
        outline = cachedCourse.outline;
        outlineFromCache = true;
      }
    }

    if (!outline) {
      outline = await generateOutline(ANTHROPIC_API_KEY, topic, hasFile, preferences);
    }

    const modules = Array.isArray(outline.modules) ? outline.modules.slice(0, 7) : [];

    if (modules.length === 0) throw new Error("Outline generation returned no modules.");

    console.log(`[Phase 1] Outline: "${outline.title}" — ${modules.length} modules`);

    // ── Write outline to cache (skip if file-based or already from cache) ──
    if (!outlineFromCache && !hasFile) {
      await supabaseAdmin
        .from("course_cache")
        .upsert({ topic_normalized: topicNormalized, outline }, { onConflict: "topic_normalized" })
        .then(() => console.log(`[Outline Cache WRITE] "${topicNormalized}"`))
        .catch((e: any) => console.warn("[Course Cache] Outline write failed (non-fatal):", e.message));
    }

    // Update course with full metadata from outline
    await supabase.from("courses").update({
      title: outline.title || topic.trim(),
      description: outline.description || null,
      difficulty: outline.difficulty || "Intermediate",
      estimated_time: outline.estimated_time || null,
      subject_category: outline.subject_category || null,
      status: "generating",
    }).eq("id", course.id);

    // Insert placeholder modules
    const moduleRows = modules.map((mod: any, i: number) => ({
      course_id: course.id,
      module_order: i + 1,
      title: mod.title,
      lesson_content: `⏳ Generating "${mod.title}"…`,
      lab_prompt: mod.lab_prompt || null,
      lab_description: mod.lab_prompt || null,
      lab_type: "dynamic",
      lab_title: mod.title,
      lab_data: null,
      lab_generation_status: "pending",
      lab_blueprint: null,
      lab_error: null,
      quiz: [],
    }));

    await supabase.from("course_modules").insert(moduleRows);

    // Track usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: existing } = await supabaseAdmin
      .from("usage_tracking")
      .select("id, courses_generated, file_courses_generated")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single();

    const isFileBased = allFilePaths.length > 0;
    if (existing) {
      const updates: any = { courses_generated: (existing.courses_generated || 0) + 1 };
      if (isFileBased) updates.file_courses_generated = (existing.file_courses_generated || 0) + 1;
      await supabaseAdmin.from("usage_tracking").update(updates).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("usage_tracking").insert({
        user_id: user.id, month: currentMonth, courses_generated: 1,
        file_courses_generated: isFileBased ? 1 : 0,
      });
    }

    return new Response(JSON.stringify({
      courseId: course.id,
      courseTitle: outline.title || topic.trim(),
      modules: modules.map((m: any, i: number) => ({ index: i, title: m.title })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("COURSE GENERATION ERROR:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
