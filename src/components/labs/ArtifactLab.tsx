import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, RefreshCw, RotateCcw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import DynamicLabRenderer from "./DynamicLabRenderer";
import { validateLabData } from "@/lib/labSchemas";

type Props = {
  data: {
    title: string;
    description?: string;
    instructions?: string;
    html_content: string;
    reflection_question?: string;
    reflection_options?: string[];
    reflection_correct?: string;
    reflection_explanation?: string;
    key_insight?: string;
  };
  onComplete?: () => void;
  isCompleted?: boolean;
  onReplay?: () => void;
  onRetryGeneration?: () => void;
};

export default function ArtifactLab({ data, onComplete, isCompleted, onReplay, onRetryGeneration }: Props) {
  const validation = useMemo(() => validateLabData("artifact", data), [data]);

  const [phase, setPhase] = useState<"explore" | "reflect" | "done">("explore");
  const [selected, setSelected] = useState<string | null>(null);
  const [completionFired, setCompletionFired] = useState(false);

  if (!validation.ok) {
    console.error(
      `[ArtifactLab] schema validation failed at "${validation.path}": ${validation.message}`,
      { issues: validation.issues, data },
    );
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
        <h3 className="font-bold text-lg">Lab Data Invalid</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This lab failed validation at <code className="text-xs">{validation.path}</code>: {validation.message}
        </p>
        {onRetryGeneration && (
          <Button variant="outline" onClick={onRetryGeneration}>
            <RefreshCw className="w-4 h-4 mr-1" /> Regenerate Lab
          </Button>
        )}
      </div>
    );
  }

  const hasReflection =
    !!data.reflection_question &&
    Array.isArray(data.reflection_options) &&
    data.reflection_options.length > 0;

  const finish = useCallback(() => {
    if (completionFired) return;
    setPhase("done");
    setCompletionFired(true);
    onComplete?.();
  }, [completionFired, onComplete]);

  // postMessage completion from the sandboxed iframe
  const handleIframeComplete = useCallback((_score?: number) => {
    if (hasReflection) setPhase("reflect");
    else finish();
  }, [hasReflection, finish]);

  const handleExplored = () => {
    if (hasReflection) setPhase("reflect");
    else finish();
  };

  const handleAnswer = (option: string) => {
    if (selected) return;
    setSelected(option);
    setTimeout(finish, 1500);
  };

  const reset = () => {
    setPhase("explore");
    setSelected(null);
    setCompletionFired(false);
    onReplay?.();
  };

  if (isCompleted && phase === "explore") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-950 p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
        <p className="font-bold text-white text-lg">Lab Complete</p>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="gap-1.5 border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Replay
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-violet-500/20 bg-slate-950">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <h3 className="font-black text-white text-base leading-tight">{data.title}</h3>
        {data.description && (
          <p className="text-xs text-white/50 mt-0.5">{data.description}</p>
        )}
      </div>

      {/* Instructions */}
      {data.instructions && (
        <div className="px-5 py-2.5 bg-violet-500/10 border-b border-violet-500/20 flex items-start gap-2">
          <Eye className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-xs text-violet-300">{data.instructions}</p>
        </div>
      )}

      {/* Sandboxed artifact iframe */}
      <div style={{ position: "relative" }}>
        <DynamicLabRenderer
          html={data.html_content}
          title={data.title}
          height={420}
          onComplete={handleIframeComplete}
        />
      </div>

      {/* Bottom panel */}
      <div className="px-5 py-4 border-t border-white/10 min-h-[80px] space-y-3">
        {phase === "done" ? (
          <div className="text-center space-y-3">
            <p className="text-2xl">🏆</p>
            <p className="font-bold text-white">Lab Complete!</p>
            {data.key_insight && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                <span className="text-amber-400 text-sm mt-0.5">💡</span>
                <p className="text-xs text-amber-200 leading-relaxed">{data.key_insight}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="gap-1.5 border-white/20 text-white hover:bg-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay
            </Button>
          </div>
        ) : phase === "reflect" && data.reflection_question ? (
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-white">{data.reflection_question}</p>
            <div className="grid gap-2">
              {data.reflection_options?.map((opt) => {
                const isCorrect = opt === data.reflection_correct;
                const isSelected = opt === selected;
                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!selected}
                    className={cn(
                      "text-left text-sm px-4 py-2.5 rounded-xl border transition-all",
                      !selected
                        ? "border-white/15 text-white/80 hover:border-violet-500/50 hover:bg-violet-500/10 cursor-pointer"
                        : isSelected && isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : isSelected
                        ? "border-red-500/50 bg-red-500/15 text-red-300"
                        : isCorrect
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 text-white/30 cursor-not-allowed",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected && data.reflection_explanation && (
              <p className="text-xs text-white/60 leading-relaxed mt-1">
                {data.reflection_explanation}
              </p>
            )}
          </div>
        ) : (
          <Button
            onClick={handleExplored}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold gap-2"
            size="sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> I've Explored This
          </Button>
        )}
      </div>
    </div>
  );
}
