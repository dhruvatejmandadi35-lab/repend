export type PrebuiltLabId = "economics_sim" | "biology_cell" | "physics_projectile";

interface TopicRule {
  id: PrebuiltLabId;
  /* High-signal single-word triggers (1 match is enough) */
  strongKeywords: string[];
  /* Lower-signal words — need 2+ to trigger */
  weakKeywords: string[];
}

const RULES: TopicRule[] = [
  {
    id: "economics_sim",
    strongKeywords: [
      "supply", "demand", "equilibrium", "elasticity", "microeconomics",
      "macroeconomics", "market equilibrium", "price mechanism",
      "consumer surplus", "producer surplus", "market forces",
      "supply chain economics", "market clearing",
    ],
    weakKeywords: [
      "market", "price", "quantity", "economics", "economy",
      "gdp", "inflation", "trade", "competition", "monopoly",
    ],
  },
  {
    id: "biology_cell",
    strongKeywords: [
      "organelle", "mitochondria", "chloroplast", "nucleus", "ribosome",
      "photosynthesis", "eukaryote", "prokaryote", "cell membrane",
      "cell wall", "endoplasmic reticulum", "golgi apparatus",
      "cell biology", "cellular respiration", "cell structure",
    ],
    weakKeywords: [
      "cell", "biology", "organism", "membrane", "cytoplasm",
      "dna", "protein", "enzyme", "bacteria", "tissue",
    ],
  },
  {
    id: "physics_projectile",
    strongKeywords: [
      "projectile", "trajectory", "kinematics", "newton", "newton's laws",
      "force and motion", "acceleration", "momentum", "launch angle",
      "ballistics", "parabolic motion", "free fall",
    ],
    weakKeywords: [
      "physics", "velocity", "force", "gravity", "friction",
      "motion", "mechanics", "mass", "speed", "energy",
    ],
  },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Returns a pre-built lab ID if the module title (or supporting content)
 * strongly matches one of the pre-built topic categories, or null otherwise.
 */
export function matchPrebuiltLab(
  moduleTitle: string,
  supplemental?: string,
): PrebuiltLabId | null {
  const haystack = normalize(`${moduleTitle} ${supplemental ?? ""}`);

  let best: { id: PrebuiltLabId; score: number } | null = null;

  for (const rule of RULES) {
    const strongHits = rule.strongKeywords.filter(kw => haystack.includes(normalize(kw)));
    const weakHits = rule.weakKeywords.filter(kw => haystack.includes(normalize(kw)));

    // Strong keyword: 1 hit is sufficient; weak keywords need 2+
    const score = strongHits.length * 3 + weakHits.length;
    const qualifies = strongHits.length >= 1 || weakHits.length >= 2;

    if (qualifies && score > (best?.score ?? 0)) {
      best = { id: rule.id, score };
    }
  }

  return best?.id ?? null;
}

/**
 * Checks whether a Claude-generated HTML string passes minimum quality gates.
 * Returns null if it passes, or an error string if it fails.
 */
export function checkHtmlQuality(html: string, topicHint?: string): string | null {
  if (!html || html.trim().length < 500) {
    return "Generated lab is too short (< 500 chars) — likely incomplete.";
  }

  const lower = html.toLowerCase();

  const hasInteractive =
    lower.includes("<input") ||
    lower.includes("<button") ||
    lower.includes("<select") ||
    lower.includes("type=\"range\"") ||
    lower.includes("ondragstart") ||
    lower.includes("addeventlistener") ||
    lower.includes("onclick");

  if (!hasInteractive) {
    return "Generated lab has no interactive elements (no buttons, inputs, or event listeners).";
  }

  if (topicHint) {
    const topicWords = normalize(topicHint).split(" ").filter(w => w.length > 4);
    const mentionsTopic = topicWords.some(w => lower.includes(w));
    if (topicWords.length > 0 && !mentionsTopic) {
      return `Generated lab does not appear to reference the topic "${topicHint}".`;
    }
  }

  return null;
}
