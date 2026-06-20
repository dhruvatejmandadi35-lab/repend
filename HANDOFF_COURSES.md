# Repend Course Generation — Claude Code Handoff

> **Scope:** How courses are created, structured, and rendered in the Repend EdTech platform.  
> **Last updated:** June 2026

---

## 1. The 3-Part Loop (One Module = One Cycle)

Every **Module** inside a Course is exactly this:

```
Lesson → Lab → Quiz
```

A 5-module course = **15 trackable sections** (3 × 5).

| Section | Purpose | Rule |
|---------|---------|------|
| **Lesson** | Teach new concepts & vocabulary | The ONLY place new ideas appear |
| **Lab** | Practice via interactive simulation | Must only reference concepts taught in the lesson |
| **Quiz** | Assess retention | Questions must derive from lesson `key_concepts` |

> **Consistency Rule:** Labs and Quizzes are **forbidden** from referencing anything not explicitly taught in the preceding Lesson. If a variable, formula, or term wasn't introduced in the lesson, it cannot appear in the lab or quiz.

---

## 2. Two-Phase Generation Pipeline

### Phase 1 — Blocking (GPT-4o)
Generates the **course skeleton** + **full lesson content**.

**Outputs:**
- Course metadata (title, description, difficulty)
- Module outline with titles
- Per module:
  - `key_concepts` (array of strings)
  - `key_variables` (array of `{name, unit, description}`)
  - Full `lesson_markdown` (split into slides by `\n---\n`)

**Why blocking:** The rest of the system (labs, quizzes) depends on `key_concepts` + `key_variables`. Cannot proceed without them.

### Phase 2 — Async (Claude Opus for Labs, GPT-4o-mini for Quizzes)
Generates **labs** and **quizzes** constrained to the lesson's `key_concepts` + `key_variables`.

**Lab Generation:**
- Picks from 7 lab types based on topic: `simulation`, `graph`, `flowchart`, `code_debugger`, `matching`, `ordering`, `scenario_builder`
- Produces a `lab_blueprint` (JSON config for the lab engine)
- Falls back to pre-built HTML labs for common topics (biology cell, economics supply-demand, physics projectile)

**Quiz Generation:**
- 3–5 questions per module
- Each question targets one `key_concept`
- 4 multiple-choice options
- One correct answer
- `explanation` field (shown after submission)

---

## 3. Lesson Structure (The Slide Taxonomy)

Lessons are **Markdown** split by `\n---\n` into slides. One idea per slide. Never a wall of text.

### Slide-Type Metadata

Every slide has an HTML comment declaring its type:

```markdown
<!-- type: concept -->
## What is Opportunity Cost?

The value of the next-best alternative you give up when making a decision...
```

### Slide Types

| Type | Badge Color | Purpose |
|------|-------------|---------|
| `concept` | 🔵 Blue | Define a core idea |
| `example` | 🟢 Green | Walk through a worked example |
| `case_study` | 🟣 Purple | Real-world application |
| `comparison` | 🟠 Orange | Side-by-side contrast |
| `myth_vs_reality` | 🔴 Red | Debunk common misconceptions |
| `process` | 🩵 Teal | Step-by-step breakdown |
| `interactive_predict` | 🔵 Indigo | Ask user to predict before revealing |
| `quick_think` | 🟡 Yellow | Short reflection prompt |
| `real_world` | 🟢 Green | Connect to everyday life |
| `key_takeaways` | 🟢 Emerald | Summary / wrap-up |
| `challenge` | 🟠 Amber | In-slide exercise (with answer box) |
| `objective` | 🔵 Blue | Learning objective |

### Why Slide Types Matter

Without forcing `myth_vs_reality` or `interactive_predict`, GPT defaults to **Wikipedia-style prose**. The taxonomy is the guardrail that makes the AI produce *teaching* instead of *summarizing*.

### Slide Content Rules

1. **One concept per slide.** No exceptions.
2. **Headings** use `## Title`. This becomes the slide title.
3. **Images** via `![description](url)`. Lazy-loaded, max-height 320px.
4. **Math** via KaTeX (`$...$` or `$$...$$`).
5. **Tables** wrapped in overflow-x containers.
6. **No fake stats.** Every number, percentage, or claim must be real and verifiable.
7. **Tone: tactile, concrete, operator-voice.** Not textbook. Not LinkedIn thought-leader.

### Challenge Slides

Slides tagged `challenge`, `quick_think`, or `interactive_predict` render an answer input box:

- User types an answer, hits Submit
- System records the answer (no auto-grading for open-ended)
- Shows "Answer submitted!" confirmation
- Optional hint visible before submission

---

## 4. Quiz Structure

### Format

- **One question at a time** (no scrolling through all questions)
- **4 multiple-choice options** per question
- **No instant feedback** during the quiz
- **70% pass threshold** to complete the module
- **Delayed feedback** shown after final submission

### Question Data Shape

```typescript
interface QuizQuestion {
  question: string;        // The question text
  options: string[];       // 4 choices
  correct_answer: number;  // Index of correct option (0-3)
  explanation: string;       // Why the correct answer is right
}
```

### Quiz Rules

1. Every question must map to a `key_concept` from the lesson.
2. Distractors (wrong answers) must be **plausible** — common misconceptions, not nonsense.
3. Explanations must **teach**, not just say "correct" or "incorrect".
4. If user fails (< 70%), they can retake with **different questions** (same concepts, new phrasing).

---

## 5. Lab Structure

Labs are the **practice** phase. They take concepts from the lesson and make them interactive.

### Lab Types

| Type | Best For | Engine |
|------|----------|--------|
| `simulation` | Slider-driven systems (physics, economics, cyber) | XState + mathjs runtime |
| `graph` | Math equation plotting with slider params | Recharts |
| `flowchart` | Fill-in-the-blank process flows | Custom SVG/Canvas |
| `code_debugger` | Find-and-fix bugs | Monaco-like editor |
| `matching` | Connect terms ↔ definitions, causes ↔ effects | Drag-and-drop |
| `ordering` | Arrange steps/events in correct sequence | Drag-and-drop |
| `scenario_builder` | Fill blanks in a real-world narrative | Form inputs |

### Lab Rules

1. **Only use concepts from the lesson.** No new vocabulary.
2. **Feedback < 2 seconds.** Every action must show consequence immediately.
3. **Always explain why.** Never just "correct" or "incorrect." Describe the **real-world consequences** of the user's decision.
4. **Start simple → unlock complexity.** Gate advanced controls behind completing basics.
5. **Must include real-world application.** A slider with no context is a bad lab.

### Randomization Rule

Randomize **experience**, not concepts:
- Jitter initial values ±20%
- Alternate scenarios (e.g., "You're a startup founder" vs. "You're a supply chain manager")
- Vary goals ("maximize profit" vs. "minimize risk")
- Never swap the underlying concept being tested

---

## 6. Data Shape

### Course

```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: Module[];
  created_at: string;
}
```

### Module

```typescript
interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  key_concepts: string[];
  key_variables: Array<{
    name: string;
    unit: string;
    description: string;
  }>;
  lesson_markdown: string;      // Split by \n---\n into slides
  lesson_slides?: Slide[];      // Parsed at runtime
  lab_type: LabType;
  lab_blueprint: LabBlueprint;  // JSON config for the lab engine
  quiz: QuizQuestion[];
}
```

### Progress

```typescript
interface Progress {
  user_id: string;
  course_id: string;
  module_id: string;
  section: 'lesson' | 'lab' | 'quiz';
  completed_at: string | null;
  quiz_score?: number;         // 0-100
  lab_results?: object;          // Engine-specific output
}
```

---

## 7. Pedagogical Non-Negotiables

1. **Lessons teach; Labs practice; Quizzes assess.** Never mix these roles.
2. **Labs and Quizzes are strictly constrained** to `key_concepts` and `key_variables` from the lesson.
3. **No fake social proof.** Never show dummy ratings, "4.9 avg," or "Powered by Claude" badges.
4. **No fake stats in content.** All numbers must be real and verifiable.
5. **Feedback describes consequences.** In labs, explain the real-world impact of the user's choice.
6. **Randomize values, not concepts.** Keep the learning target stable; vary the scenario.
7. **One idea per slide.** No walls of text.
8. **Operator voice.** Tactile, concrete, direct. Not academic, not corporate.

---

## 8. File References

| File | Purpose |
|------|---------|
| `src/components/courses/LessonSlides.tsx` | Renders lesson markdown as slides |
| `src/components/courses/QuizSlides.tsx` | Quiz player (one question at a time) |
| `src/components/labs/DynamicLab.tsx` | Simulation lab engine |
| `src/components/labs/GraphLab.tsx` | Graph/equation lab |
| `src/components/labs/InteractiveLab.tsx` | Lab type router |
| `src/lib/labSimulationEngine.ts` | XState + mathjs runtime for simulations |
| `src/lib/labSchemas.ts` | Zod schemas for lab blueprints |
| `supabase/functions/generate-course/index.ts` | Phase 1 generator (GPT-4o) |
| `supabase/functions/generate-lab-blueprint/index.ts` | Phase 2 lab generator (Claude Opus) |
| `supabase/functions/lab-feedback/index.ts` | Lab consequence feedback |

---

## 9. Quick Checklist for Claude Code

When building or modifying course-related code:

- [ ] Does the lesson introduce ALL concepts the lab/quiz uses?
- [ ] Are slides split by `\n---\n` with one idea each?
- [ ] Does every slide have a `<!-- type: ... -->` metadata comment?
- [ ] Does quiz feedback explain *why*, not just right/wrong?
- [ ] Does lab feedback describe real-world consequences?
- [ ] Are lab initial values jittered ±20% for variety?
- [ ] Is the quiz pass threshold 70%?
- [ ] Are there 3–5 quiz questions per module?
- [ ] Is the tone tactile and concrete, not academic?

---

> **For the full lab generation spec, see `HANDOFF_LABS.md`** (or ask for it).
