import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import DynamicLab from "./DynamicLab";
import FlowchartLab from "./FlowchartLab";
import CodeDebuggerLab from "./CodeDebuggerLab";
import GraphLab from "./GraphLab";
import MatchingLab from "./MatchingLab";
import OrderingLab from "./OrderingLab";
import ScenarioBuilderLab from "./ScenarioBuilderLab";
import HighlightSelectLab from "./HighlightSelectLab";
import DebateBuilderLab from "./DebateBuilderLab";
import BudgetAllocatorLab from "./BudgetAllocatorLab";
import CohesiveLab from "./CohesiveLab";
import ArtifactLab from "./ArtifactLab";
import DynamicLabRenderer from "./DynamicLabRenderer";
import { matchPrebuiltLab } from "@/lib/labTopicMatcher";
import { ECONOMICS_SIM_HTML } from "./prebuilt/economicsSimHTML";
import { BIOLOGY_CELL_HTML } from "./prebuilt/biologyCellHTML";
import { PHYSICS_PROJECTILE_HTML } from "./prebuilt/physicsProjectileHTML";

type Props = {
  labType?: string | null;
  labData?: any;
  labTitle?: string | null;
  labDescription?: string | null;
  labGenerationStatus?: string | null;
  labError?: string | null;
  onComplete?: () => void;
  isCompleted?: boolean;
  onRetryGeneration?: () => void;
  onReplay?: () => void;
  /** Module title — used for pre-built lab topic matching */
  moduleTitle?: string | null;
};

function LabEmptyState({ labType, detail, onRetry }: { labType?: string | null; detail?: string; onRetry?: () => void }) {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="p-8 text-center space-y-3">
        <div className="text-4xl">🔬</div>
        <h3 className="font-bold text-lg">Lab Data Unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {detail || "The interactive lab couldn't be built for this module. The AI returned incomplete data."}
        </p>
        {import.meta.env.DEV && detail && (
          <pre className="text-xs text-left bg-muted p-2 rounded max-w-md mx-auto overflow-auto">
            {detail}
          </pre>
        )}
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-1" /> Regenerate Lab
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LabPendingState() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-8 text-center space-y-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <h3 className="font-bold text-lg">Generating Lab...</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The AI is designing a unique interactive lab for this module. This may take a moment.
        </p>
      </CardContent>
    </Card>
  );
}

function LabFailedState({ error, onRetry }: { error?: string | null; onRetry?: () => void }) {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="p-8 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
        <h3 className="font-bold text-lg">Lab Generation Failed</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {error || "The AI couldn't generate a lab for this module. You can try regenerating it."}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-1" /> Retry Generation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

const PREBUILT_HTML: Record<string, string> = {
  economics_sim: ECONOMICS_SIM_HTML,
  biology_cell: BIOLOGY_CELL_HTML,
  physics_projectile: PHYSICS_PROJECTILE_HTML,
};

const PREBUILT_TITLES: Record<string, string> = {
  economics_sim: "Market Equilibrium Explorer",
  biology_cell: "Build the Cell",
  physics_projectile: "Projectile Motion Lab",
};

export default function InteractiveLab({ labType, labData, labTitle, labDescription, labGenerationStatus, labError, onComplete, isCompleted, onRetryGeneration, onReplay, moduleTitle }: Props) {
  // ── Pre-built lab check (before any API-generated content) ──
  // Runs immediately — no loading state needed
  if (moduleTitle && labGenerationStatus !== "pending" && labGenerationStatus !== "generating") {
    const prebuiltId = matchPrebuiltLab(moduleTitle);
    if (prebuiltId && PREBUILT_HTML[prebuiltId]) {
      if (isCompleted) {
        return (
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-8 text-center space-y-3">
              <div className="text-4xl">🏆</div>
              <h3 className="font-bold text-lg">Lab Complete!</h3>
              <p className="text-sm text-muted-foreground">{PREBUILT_TITLES[prebuiltId]}</p>
              <Button variant="outline" onClick={onReplay}>
                <RefreshCw className="w-4 h-4 mr-1" /> Replay
              </Button>
            </CardContent>
          </Card>
        );
      }
      return (
        <DynamicLabRenderer
          html={PREBUILT_HTML[prebuiltId]}
          title={PREBUILT_TITLES[prebuiltId]}
          height={520}
          prebuilt
          onComplete={onComplete}
        />
      );
    }
  }

  // Handle generation status states
  if (labGenerationStatus === "pending" || labGenerationStatus === "generating") {
    return <LabPendingState />;
  }
  if (labGenerationStatus === "failed") {
    return <LabFailedState error={labError} onRetry={onRetryGeneration} />;
  }

  // No data at all
  if (!labData || (typeof labData === "object" && Object.keys(labData).length === 0)) {
    console.warn("[InteractiveLab] labData is null/empty", { labType, labGenerationStatus, labError });
    return <LabEmptyState labType={labType} detail="lab_data is null or empty — the edge function may have failed silently." onRetry={onRetryGeneration} />;
  }

  // Check for empty marker from old system
  if (labData.empty === true) {
    return <LabEmptyState labType={labType} onRetry={onRetryGeneration} />;
  }

  // lab_type may live inside lab_data (course labs) or only in the DB column (challenge labs)
  const effectiveLabType = labData.lab_type || labType;

  console.log("[InteractiveLab] rendering", { effectiveLabType, labGenerationStatus, labError, lab_data_keys: labData ? Object.keys(labData) : null });

  // Per-type required-field validation
  const missingFields = (() => {
    switch (effectiveLabType) {
      case "simulation": case "dynamic": {
        const missing = [];
        if (!Array.isArray(labData.variables) || labData.variables.length === 0) missing.push("variables[]");
        if (!Array.isArray(labData.blocks) || labData.blocks.length === 0) missing.push("blocks[]");
        if (!labData.formulas || Object.keys(labData.formulas).length === 0) missing.push("formulas{}");
        return missing;
      }
      case "flowchart":
        return (!Array.isArray(labData.drop_zones) || labData.drop_zones.length === 0) ? ["drop_zones[]"] : [];
      case "graph":
        return (!Array.isArray(labData.sliders) || labData.sliders.length === 0) ? ["sliders[]"] : [];
      case "code_debugger":
        return (!labData.starter_code) ? ["starter_code"] : [];
      case "matching":
        return (!Array.isArray(labData.pairs) || labData.pairs.length < 2) ? ["pairs[]"] : [];
      case "ordering":
        return (!Array.isArray(labData.items) || labData.items.length < 2) ? ["items[]"] : [];
      case "scenario_builder":
        return (!labData.narrative || !Array.isArray(labData.blanks)) ? ["narrative", "blanks[]"] : [];
      case "highlight_select":
        return (!Array.isArray(labData.items) || labData.items.length === 0) ? ["items[]"] : [];
      case "debate_builder":
        return (!Array.isArray(labData.statements) || labData.statements.length === 0) ? ["statements[]"] : [];
      case "budget_allocator":
        return (!Array.isArray(labData.categories) || labData.categories.length === 0) ? ["categories[]"] : [];
      case "cohesive":
        return (!Array.isArray(labData.activities) || labData.activities.length === 0) ? ["activities[]"] : [];
      case "artifact":
        return (!labData.html_content) ? ["html_content"] : [];
      default:
        return [];
    }
  })();

  if (missingFields.length > 0) {
    const detail = `lab_type "${effectiveLabType}" is missing required fields: ${missingFields.join(", ")}`;
    console.error("[InteractiveLab] validation failed —", detail, labData);
    return <LabEmptyState labType={effectiveLabType} detail={detail} onRetry={onRetryGeneration} />;
  }

  // Route to specialized lab renderers
  if (effectiveLabType === "flowchart") {
    return <FlowchartLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "code_debugger") {
    return <CodeDebuggerLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "graph") {
    return <GraphLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "matching") {
    return <MatchingLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "ordering") {
    return <OrderingLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "scenario_builder") {
    return <ScenarioBuilderLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "highlight_select") {
    return <HighlightSelectLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "debate_builder") {
    return <DebateBuilderLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "budget_allocator") {
    return <BudgetAllocatorLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "cohesive") {
    return <CohesiveLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }
  if (effectiveLabType === "artifact") {
    return <ArtifactLab data={labData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }

  // Simulation / dynamic labs
  const hasBlocks = Array.isArray(labData.blocks) && labData.blocks.length > 0;
  const hasLegacyContent = labData.parameters?.length > 0 || labData.decisions?.length > 0 || labData.tasks?.length > 0
    || labData.categories?.length > 0 || labData.dimensions?.length > 0 || labData.decision_challenge;

  if (hasBlocks || hasLegacyContent) {
    const normalizedData = hasBlocks ? labData : convertLegacyToBlocks(labData);
    return <DynamicLab data={normalizedData} onComplete={onComplete} isCompleted={isCompleted} onReplay={onReplay} />;
  }

  return <LabEmptyState labType={effectiveLabType} onRetry={onRetryGeneration} />;
}

/** Convert old-style lab data into the new blocks format for DynamicLab */
function convertLegacyToBlocks(data: any): any {
  const blocks: any[] = [];
  const variables: any[] = [];

  if (Array.isArray(data.parameters)) {
    for (const p of data.parameters) {
      variables.push({
        name: p.name || "Variable",
        icon: p.icon || "📊",
        unit: p.unit || "%",
        min: p.min ?? 0,
        max: p.max ?? 100,
        default: p.default ?? 50,
        description: p.description || "",
      });
    }
  }

  if (Array.isArray(data.dimensions)) {
    for (const d of data.dimensions) {
      variables.push({
        name: d.name || "Dimension",
        icon: d.icon || "⚖️",
        unit: "%",
        min: 0,
        max: 100,
        default: d.default ?? 50,
        description: d.description || "",
      });
    }
  }

  if (Array.isArray(data.decisions)) {
    for (const d of data.decisions) {
      blocks.push({
        type: "choice_set",
        question: d.question || d.prompt || "What do you decide?",
        emoji: d.emoji || "🔬",
        choices: (d.choices || []).map((c: any) => ({
          text: c.text || c.label || "Choice",
          feedback: c.explanation || c.consequence || c.feedback || "",
          effects: c.set_state || c.effects || c.impacts || {},
          is_best: c.is_best || false,
        })),
      });
    }
  }

  if (data.decision_challenge) {
    blocks.push({
      type: "choice_set",
      question: data.decision_challenge.question || data.scenario || "What would you do?",
      emoji: "🎯",
      choices: (data.decision_challenge.options || []).map((o: any) => ({
        text: o.text || o.label || "Option",
        feedback: o.consequence || o.result || "",
        effects: {},
        is_best: o.is_best || false,
      })),
    });
  }

  if (Array.isArray(data.categories) && Array.isArray(data.items)) {
    blocks.push({
      type: "step_task",
      tasks: data.items.map((item: any, i: number) => ({
        id: `classify_${i}`,
        prompt: `Classify: ${item.content || item.name || "Item"}`,
        type: "choice",
        options: data.categories.map((c: any) => typeof c === "string" ? c : c.name),
        correct_answer: item.correctCategory || item.correct_category || "",
        explanation: item.explanation || "",
      })),
    });
  }

  if (Array.isArray(data.tasks) && !data.categories) {
    blocks.push({
      type: "step_task",
      tasks: data.tasks.map((t: any, i: number) => ({
        id: t.id || `t${i + 1}`,
        prompt: t.description || t.question || t.prompt || "Task",
        type: t.type || "input",
        correct_answer: t.correct_answer || t.answer || "",
        options: t.options || undefined,
        hint: t.hint || undefined,
        explanation: t.explanation || undefined,
      })),
    });
  }

  if (data.key_insight) {
    blocks.push({ type: "insight", content: data.key_insight });
  }

  return {
    ...data,
    variables,
    blocks,
    kind: data.lab_type || "legacy",
    completion_rule: "all_choices",
  };
}
