import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, Sparkles, BookOpen, FlaskConical, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CourseGeneratingScreenProps {
  topic: string;
  isVisible: boolean;
  courseId?: string | null;
  courseTitle?: string;
  expectedModules?: { index: number; title: string }[];
  onComplete?: (courseId: string) => void;
}

interface ModuleStatus {
  id: string;
  title: string;
  hasLesson: boolean;
  hasQuiz: boolean;
  labStatus: string;
}

// Fast-start psychologically pleasant progress curve
function psychProgress(raw: number): number {
  const t = raw / 100;
  return Math.round((1 - Math.pow(1 - t, 2.5)) * 100);
}

const EXCITING_MESSAGES = [
  "Crafting your learning journey…",
  "Building real-world examples…",
  "Writing your personalized lessons…",
  "Designing hands-on activities…",
  "Creating quiz questions…",
  "Connecting concepts to real life…",
  "Building interactive labs…",
  "Polishing your course…",
];

export function CourseGeneratingScreen({
  topic,
  isVisible,
  courseId,
  courseTitle,
  expectedModules,
  onComplete,
}: CourseGeneratingScreenProps) {
  const [rawProgress, setRawProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [resolvedTitle, setResolvedTitle] = useState(courseTitle || "");
  const [complete, setComplete] = useState(false);

  // Rotate status messages for excitement
  useEffect(() => {
    if (!isVisible || complete) return;
    const t = setInterval(() => setStatusIdx((i) => (i + 1) % EXCITING_MESSAGES.length), 2800);
    return () => clearInterval(t);
  }, [isVisible, complete]);

  const computeProgress = useCallback((modules: ModuleStatus[]): number => {
    if (modules.length === 0) return 8;
    const total = modules.length;
    const lessonsReady = modules.filter((m) => m.hasLesson).length;
    const quizzesReady = modules.filter((m) => m.hasQuiz).length;
    const labsReady = modules.filter((m) => m.labStatus === "ready" || m.labStatus === "done").length;
    let pct = 12;
    pct += (lessonsReady / total) * 42;
    pct += (quizzesReady / total) * 16;
    pct += (labsReady / total) * 25;
    return Math.min(Math.round(pct), 97);
  }, []);

  // Progressive module reveal — one every 350ms
  useEffect(() => {
    if (revealedCount >= moduleStatuses.length) return;
    const t = setTimeout(() => setRevealedCount((c) => c + 1), 350);
    return () => clearTimeout(t);
  }, [revealedCount, moduleStatuses.length]);

  useEffect(() => {
    if (moduleStatuses.length > 0 && revealedCount === 0) setRevealedCount(1);
  }, [moduleStatuses.length]);

  // Poll DB for module statuses
  useEffect(() => {
    if (!isVisible || !courseId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const [courseRes, modulesRes] = await Promise.all([
          supabase.from("courses").select("title").eq("id", courseId).single(),
          supabase.from("course_modules")
            .select("id, title, lesson_content, quiz, lab_generation_status")
            .eq("course_id", courseId)
            .order("module_order"),
        ]);

        if (cancelled) return;

        if (courseRes.data?.title && !resolvedTitle) {
          setResolvedTitle(courseRes.data.title);
        }

        const modules = modulesRes.data || [];
        const statuses: ModuleStatus[] = modules.map((m: any) => ({
          id: m.id,
          title: m.title,
          hasLesson: !m.lesson_content?.startsWith("⏳"),
          hasQuiz: Array.isArray(m.quiz) && m.quiz.length > 0,
          labStatus: m.lab_generation_status || "pending",
        }));

        setModuleStatuses(statuses);
        setRawProgress(computeProgress(statuses));

        const allDone =
          statuses.length > 0 &&
          statuses.every((m) => m.hasLesson && m.hasQuiz) &&
          statuses.every((m) => ["ready", "done", "failed"].includes(m.labStatus));

        if (allDone) {
          setRawProgress(100);
          setComplete(true);
          setTimeout(() => { if (!cancelled && onComplete) onComplete(courseId); }, 1000);
          return;
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
      if (!cancelled) setTimeout(poll, 2500);
    };

    const initial = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(initial); };
  }, [isVisible, courseId, computeProgress, onComplete, resolvedTitle]);

  // Smooth animated progress bar
  useEffect(() => {
    const target = rawProgress === 100 ? 100 : psychProgress(rawProgress);
    if (displayProgress === target) return;
    const step = target > displayProgress ? 1 : -1;
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        const next = prev + step;
        if ((step > 0 && next >= target) || (step < 0 && next <= target)) { clearInterval(timer); return target; }
        return next;
      });
    }, 16);
    return () => clearInterval(timer);
  }, [rawProgress, displayProgress]);

  if (!isVisible) return null;

  const displayedTitle = resolvedTitle || courseTitle || topic;
  const totalModules = expectedModules?.length || moduleStatuses.length || 5;
  const completedLessons = moduleStatuses.filter((m) => m.hasLesson).length;
  const currentBuildIdx = moduleStatuses.findIndex((m) => !m.hasLesson);
  const buildingModule = currentBuildIdx >= 0
    ? moduleStatuses[currentBuildIdx]?.title || expectedModules?.[currentBuildIdx]?.title
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Ambient glow backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-accent/4 rounded-full blur-[80px]" />
      </div>

      <div className="relative w-full max-w-lg mx-auto px-6 flex flex-col gap-8">
        {/* Header */}
        <div className="text-center space-y-3">
          {complete ? (
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 to-accent/10 animate-ping" style={{ animationDuration: "2.5s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground/60 mb-1">
              {complete ? "Ready!" : "Building Your Course"}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-foreground">
              {displayedTitle || topic}
            </h1>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2.5">
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-none"
              style={{ width: `${displayProgress}%`, transition: "width 0.3s ease-out" }}
            />
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground font-medium min-h-[1.2em]">
              {complete
                ? "All modules ready!"
                : buildingModule
                ? `Building Module ${completedLessons + 1} of ${totalModules}: ${buildingModule}`
                : moduleStatuses.length === 0
                ? "Analyzing your topic…"
                : EXCITING_MESSAGES[statusIdx]}
            </span>
            <span className="tabular-nums font-bold text-foreground">{displayProgress}%</span>
          </div>
        </div>

        {/* Module cards — appear one by one */}
        <div className="space-y-2">
          {/* Placeholder cards if we have expectedModules before DB data */}
          {moduleStatuses.length === 0 && expectedModules && expectedModules.length > 0
            ? expectedModules.slice(0, revealedCount).map((m, i) => (
                <ModuleCard
                  key={i}
                  index={i}
                  title={m.title}
                  hasLesson={false}
                  hasQuiz={false}
                  labStatus="pending"
                  animationDelay={i * 60}
                />
              ))
            : moduleStatuses.slice(0, revealedCount).map((m, i) => (
                <ModuleCard
                  key={m.id}
                  index={i}
                  title={m.title}
                  hasLesson={m.hasLesson}
                  hasQuiz={m.hasQuiz}
                  labStatus={m.labStatus}
                  animationDelay={i * 60}
                />
              ))}

          {/* Ghost card for the in-progress module */}
          {!complete && moduleStatuses.length === 0 && (!expectedModules || expectedModules.length === 0) && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-border/30 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-secondary/60" />
              <div className="h-3.5 w-48 rounded bg-secondary/60" />
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground/40">
          {complete ? "Opening your course…" : "Usually takes 30–60 seconds"}
        </p>
      </div>
    </div>
  );
}

function ModuleCard({
  index, title, hasLesson, hasQuiz, labStatus, animationDelay,
}: {
  index: number;
  title: string;
  hasLesson: boolean;
  hasQuiz: boolean;
  labStatus: string;
  animationDelay: number;
}) {
  const labDone = labStatus === "done" || labStatus === "ready";
  const labFailed = labStatus === "failed";
  const allDone = hasLesson && hasQuiz && (labDone || labFailed);
  const isGenerating = !hasLesson;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500",
        "animate-in fade-in slide-in-from-bottom-2",
        allDone
          ? "bg-green-500/[0.06] border-green-500/20"
          : isGenerating
          ? "bg-primary/[0.06] border-primary/20"
          : "bg-secondary/30 border-border/40",
      )}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "both" }}
    >
      {/* Status icon */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
        allDone ? "bg-green-500/15" : isGenerating ? "bg-primary/15" : "bg-secondary/60",
      )}>
        {allDone ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        ) : isGenerating ? (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
        ) : (
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground/50 animate-spin" />
        )}
      </div>

      {/* Module title */}
      <span className={cn(
        "flex-1 text-[13px] font-medium truncate",
        allDone ? "text-foreground" : isGenerating ? "text-foreground" : "text-muted-foreground",
      )}>
        <span className="text-muted-foreground/40 mr-1.5 text-[11px]">{index + 1}.</span>
        {title}
      </span>

      {/* Badges */}
      <div className="flex items-center gap-1 shrink-0">
        {hasLesson && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <BookOpen className="w-2.5 h-2.5 text-blue-400" />
          </div>
        )}
        {hasQuiz && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
          </div>
        )}
        {labDone && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <FlaskConical className="w-2.5 h-2.5 text-purple-400" />
          </div>
        )}
      </div>
    </div>
  );
}
