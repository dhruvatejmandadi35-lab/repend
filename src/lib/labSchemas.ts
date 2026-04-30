import { z } from "zod";

// Schemas mirror the tool input_schemas in
// supabase/functions/generate-lab-blueprint/index.ts. They are intentionally
// permissive on extra keys (.passthrough()) — Claude sometimes adds optional
// hints — but strict on the required shape that the lab components consume.

const goalSchema = z
  .object({
    description: z.string().min(1),
    condition: z.string().optional(),
  })
  .passthrough();

const variableSchema = z
  .object({
    name: z.string().min(1),
    icon: z.string(),
    unit: z.string(),
    min: z.number(),
    max: z.number(),
    default: z.number(),
    description: z.string(),
  })
  .passthrough();

const choiceSchema = z
  .object({
    text: z.string().min(1),
    feedback: z.string(),
    effects: z.record(z.unknown()),
    is_best: z.boolean().optional(),
  })
  .passthrough();

const blockSchema = z
  .object({
    type: z.enum([
      "text",
      "choice_set",
      "slider",
      "control_panel",
      "output_display",
      "table",
      "chart",
      "insight",
      "diagram",
      "step_task",
    ]),
  })
  .passthrough();

const ruleSchema = z
  .object({
    condition: z.string(),
    effects: z.record(z.unknown()),
    message: z.string(),
  })
  .passthrough();

export const simulationSchema = z
  .object({
    lab_type: z.literal("simulation").optional(),
    title: z.string().min(1),
    kind: z.string(),
    scenario: z.string(),
    variables: z.array(variableSchema).min(1),
    blocks: z.array(blockSchema).min(1),
    completion_rule: z.enum(["all_blocks", "all_choices", "all_tasks"]),
    rules: z.array(ruleSchema),
    formulas: z.record(z.unknown()),
    goal: goalSchema,
  })
  .passthrough();

// `dynamic` is the DB-stored alias of `simulation` (edge fn rewrites on save).
export const dynamicSchema = simulationSchema;

export const flowchartSchema = z
  .object({
    lab_type: z.literal("flowchart").optional(),
    title: z.string().min(1),
    goal: z.string(),
    drop_zones: z
      .array(
        z
          .object({
            id: z.string(),
            label: z.string(),
            correct_value: z.string(),
            options: z.array(z.string()).min(2),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

export const codeDebuggerSchema = z
  .object({
    lab_type: z.literal("code_debugger").optional(),
    title: z.string().min(1),
    goal: z.string(),
    language: z.string(),
    starter_code: z.string().min(1),
    expected_output: z.string(),
    initial_error: z.string(),
  })
  .passthrough();

export const graphSchema = z
  .object({
    lab_type: z.literal("graph").optional(),
    title: z.string().min(1),
    goal: z.string(),
    graph_type: z.enum(["linear", "quadratic", "exponential", "trig", "custom"]),
    equation: z.string().min(1),
    sliders: z
      .array(
        z
          .object({
            name: z.string(),
            label: z.string(),
            min: z.number(),
            max: z.number(),
            step: z.number(),
            default: z.number(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

export const matchingSchema = z
  .object({
    lab_type: z.literal("matching").optional(),
    title: z.string().min(1),
    instructions: z.string(),
    pairs: z
      .array(
        z
          .object({
            id: z.string(),
            left: z.string().min(1),
            right: z.string().min(1),
          })
          .passthrough(),
      )
      .min(2),
    key_insight: z.string(),
  })
  .passthrough();

export const orderingSchema = z
  .object({
    lab_type: z.literal("ordering").optional(),
    title: z.string().min(1),
    context: z.string(),
    items: z
      .array(
        z
          .object({
            id: z.string(),
            text: z.string().min(1),
            correct_position: z.number(),
          })
          .passthrough(),
      )
      .min(2),
    key_insight: z.string(),
  })
  .passthrough();

export const scenarioBuilderSchema = z
  .object({
    lab_type: z.literal("scenario_builder").optional(),
    title: z.string().min(1),
    narrative: z.string().min(1),
    blanks: z
      .array(
        z
          .object({
            id: z.string(),
            correct: z.string(),
            options: z.array(z.string()).min(2),
            explanation: z.string(),
          })
          .passthrough(),
      )
      .min(1),
    key_insight: z.string(),
  })
  .passthrough();

export const highlightSelectSchema = z
  .object({
    lab_type: z.literal("highlight_select").optional(),
    title: z.string().min(1),
    instruction: z.string(),
    items: z
      .array(
        z
          .object({
            id: z.string(),
            text: z.string().min(1),
            is_correct: z.boolean(),
            explanation: z.string(),
          })
          .passthrough(),
      )
      .min(1),
    key_insight: z.string(),
  })
  .passthrough();

export const debateBuilderSchema = z
  .object({
    lab_type: z.literal("debate_builder").optional(),
    title: z.string().min(1),
    topic: z.string(),
    statements: z
      .array(
        z
          .object({
            id: z.string(),
            text: z.string().min(1),
            side: z.enum(["for", "against"]),
            explanation: z.string(),
          })
          .passthrough(),
      )
      .min(1),
    key_insight: z.string(),
  })
  .passthrough();

export const budgetAllocatorSchema = z
  .object({
    lab_type: z.literal("budget_allocator").optional(),
    title: z.string().min(1),
    scenario: z.string(),
    categories: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string().min(1),
            icon: z.string(),
            description: z.string(),
            recommended_min: z.number(),
            recommended_max: z.number(),
            explanation: z.string(),
          })
          .passthrough(),
      )
      .min(1),
    key_insight: z.string(),
  })
  .passthrough();

const cohesiveActivitySchema = z
  .object({
    id: z.string(),
    type: z.enum(["classify_sort", "branch_chain", "build_order", "match_chain", "fill_lab"]),
    title: z.string().min(1),
    context: z.string(),
    metric_effects: z.record(z.unknown()),
  })
  .passthrough();

export const cohesiveSchema = z
  .object({
    lab_type: z.literal("cohesive").optional(),
    title: z.string().min(1),
    narrative: z.string().min(1),
    metrics: z
      .array(
        z
          .object({
            id: z.string(),
            label: z.string(),
            icon: z.string(),
            value: z.number(),
            max: z.number(),
          })
          .passthrough(),
      )
      .min(1),
    activities: z.array(cohesiveActivitySchema).min(1),
    verdict_tiers: z
      .array(
        z
          .object({
            grade: z.enum(["S", "A", "B", "C", "D"]),
            threshold: z.number(),
            title: z.string(),
            description: z.string(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

export const artifactSchema = z
  .object({
    lab_type: z.literal("artifact").optional(),
    title: z.string().min(1),
    description: z.string(),
    instructions: z.string(),
    html_content: z.string().min(1),
    key_insight: z.string(),
    reflection_question: z.string().optional(),
    reflection_options: z.array(z.string()).optional(),
    reflection_correct: z.string().optional(),
    reflection_explanation: z.string().optional(),
  })
  .passthrough()
  .superRefine((d, ctx) => {
    if (d.reflection_question) {
      if (!d.reflection_options || d.reflection_options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reflection_options"],
          message: "reflection_options must have at least 2 entries when reflection_question is set",
        });
      }
      if (!d.reflection_correct) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reflection_correct"],
          message: "reflection_correct is required when reflection_question is set",
        });
      } else if (d.reflection_options && !d.reflection_options.includes(d.reflection_correct)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reflection_correct"],
          message: "reflection_correct must match one of reflection_options",
        });
      }
    }
  });

export const LAB_SCHEMAS = {
  simulation: simulationSchema,
  dynamic: dynamicSchema,
  flowchart: flowchartSchema,
  code_debugger: codeDebuggerSchema,
  graph: graphSchema,
  matching: matchingSchema,
  ordering: orderingSchema,
  scenario_builder: scenarioBuilderSchema,
  highlight_select: highlightSelectSchema,
  debate_builder: debateBuilderSchema,
  budget_allocator: budgetAllocatorSchema,
  cohesive: cohesiveSchema,
  artifact: artifactSchema,
} as const;

export type LabType = keyof typeof LAB_SCHEMAS;

export interface LabValidationFailure {
  ok: false;
  labType: string;
  message: string;
  path: string;
  issues: { path: string; message: string }[];
}

export interface LabValidationSuccess<T = unknown> {
  ok: true;
  data: T;
}

export type LabValidationResult<T = unknown> = LabValidationSuccess<T> | LabValidationFailure;

export function validateLabData(labType: string | null | undefined, data: unknown): LabValidationResult {
  if (!labType || !(labType in LAB_SCHEMAS)) {
    return {
      ok: false,
      labType: labType ?? "(none)",
      message: `Unknown lab_type "${labType ?? ""}"`,
      path: "lab_type",
      issues: [{ path: "lab_type", message: "no schema registered" }],
    };
  }

  const schema = LAB_SCHEMAS[labType as LabType];
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  const issues = result.error.issues.map((i) => ({
    path: i.path.join(".") || "(root)",
    message: i.message,
  }));
  const first = issues[0];
  return {
    ok: false,
    labType,
    message: first ? `${first.path}: ${first.message}` : "validation failed",
    path: first?.path ?? "(root)",
    issues,
  };
}
