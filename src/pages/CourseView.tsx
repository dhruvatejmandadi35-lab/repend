import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  Loader2,
  FileText,
  Beaker,
  ClipboardList,
  Pencil,
  RefreshCw,
  Globe,
  ChevronRight,
  ListChecks,
  FlaskConical,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { useSubscription } from "@/hooks/useSubscription";
import InteractiveLab from "@/components/labs/InteractiveLab";
import LessonSlides from "@/components/courses/LessonSlides";
import QuizSlides from "@/components/courses/QuizSlides";
import AiTutor from "@/components/courses/AiTutor";
import CourseCompletionScreen from "@/components/courses/CourseCompletionScreen";
import rependLogo from "@/assets/repend-logo.png";
import { cn } from "@/lib/utils";
import ModuleSummaryVideo from "@/components/courses/ModuleSummaryVideo";

type Module = {
  id: string;
  module_order: number;
  title: string;
  lesson_content: string;
  youtube_url: string | null;
  youtube_title: string | null;
  lab_title: string | null;
  lab_description: string | null;
  lab_type: string | null;
  lab_data: any;
  lab_generation_status: string | null;
  lab_error: string | null;
  quiz: any[];
  completed: boolean;
  real_world_application?: string | null;
  key_takeaways?: string[] | null;
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  is_published?: boolean;
  published_by?: string | null;
  user_id?: string;
};

type ContentType = "lesson" | "lab" | "quiz";

const normalizeModule = (module: any): Module => ({
  ...module,
  quiz: Array.isArray(module.quiz) ? module.quiz : [],
  key_takeaways: Array.isArray(module.key_takeaways)
    ? module.key_takeaways.filter((item: unknown): item is string => typeof item === "string")
    : null,
});

const PASS_THRESHOLD = 0.7;

/* ─── Themed wrapper classes ─── */
const themeClasses = {
  page: "min-h-screen bg-background text-foreground font-editorial antialiased",
  nav: "fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl border-b border-border/60",
  sidebar: "w-[280px] flex-shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-sm flex flex-col",
  card: "bg-card text-card-foreground rounded-2xl shadow-[var(--shadow-card)] border border-border/60",
  cardInner: "bg-card text-card-foreground rounded-xl border border-border/50 shadow-[var(--shadow-soft)]",
  muted: "text-muted-foreground",
  mutedBg: "bg-secondary/40",
};

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { progress, completeSection, uncompleteSection, justCompleted, dismissCompletion } = useCourseProgress(id);
  const { isElite } = useSubscription();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModule, setActiveModule] = useState(0);
  const [activeContent, setActiveContent] = useState<ContentType>("lesson");
  const [loading, setLoading] = useState(true);
  const [generatingLabs, setGeneratingLabs] = useState<Set<string>>(new Set());
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSummaryVideo, setShowSummaryVideo] = useState(false);


  useEffect(() => {
    if (id) fetchCourse();
  }, [id]);

  useEffect(() => {
    const hasGenerating = modules.some(m => m.lesson_content.startsWith("⏳"));
    const hasPendingLabs = modules.some(m =>
      !m.lesson_content.startsWith("⏳") &&
      (m.lab_generation_status === "pending" || m.lab_generation_status === "generating" ||
        (m.lab_generation_status === "done" && !m.lab_data))
    );

    if (!hasGenerating && !hasPendingLabs || !id) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", id)
        .order("module_order");
      if (data) {
        const parsed = data.map(normalizeModule);
        setModules(parsed);
        const stillGenerating = parsed.some((m: any) => m.lesson_content.startsWith("⏳"));
        if (!stillGenerating) {
          await supabase.from("courses").update({ status: "ready" }).eq("id", id);
          for (const m of parsed) {
            if (m.lab_generation_status === "pending" || m.lab_generation_status === "generating" ||
              (m.lab_generation_status === "done" && !m.lab_data)) {
              triggerLabGeneration(m.id);
            }
          }
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [modules, id]);

  const fetchCourse = async () => {
    const [courseRes, modulesRes] = await Promise.all([
      supabase.from("courses").select("*").eq("id", id!).maybeSingle(),
      supabase.from("course_modules").select("*").eq("course_id", id!).order("module_order"),
    ]);
    if (courseRes.error || !courseRes.data) {
      toast({ title: "Course not found", variant: "destructive" });
      navigate("/courses");
      return;
    }
    setCourse(courseRes.data);
    const parsed = (modulesRes.data || []).map(normalizeModule);
    setModules(parsed);
    setLoading(false);

    for (const m of parsed) {
      if (!m.lesson_content.startsWith("⏳") && (
        m.lab_generation_status === "pending" ||
        m.lab_generation_status === "generating" ||
        (m.lab_generation_status === "done" && !m.lab_data)
      )) {
        triggerLabGeneration(m.id);
      }
    }
  };

  const triggerLabGeneration = async (moduleId: string, force = false) => {
    if (generatingLabs.has(moduleId)) return;
    setGeneratingLabs(prev => new Set(prev).add(moduleId));
    const prevModule = modules.find(m => m.id === moduleId);
    if (force) {
      await supabase.from("course_modules").update({ lab_generation_status: "pending" }).eq("id", moduleId);
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lab_generation_status: "pending" } : m));
    }
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lab-blueprint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ moduleId, force }),
      });
      if (resp.ok) {
        const { data } = await supabase
          .from("course_modules")
          .select("*")
          .eq("id", moduleId)
          .single();
        if (data) {
          setModules(prev => prev.map(m => m.id === moduleId ? normalizeModule(data) : m));
        }
      } else {
        // Edge function failed — reset to previous state so lab doesn't get stuck as "pending"
        const resetStatus = prevModule?.lab_generation_status === "done" ? "done" : "failed";
        await supabase.from("course_modules").update({ lab_generation_status: resetStatus }).eq("id", moduleId);
        setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lab_generation_status: resetStatus } : m));
        console.error("Lab generation failed for module", moduleId, await resp.text().catch(() => resp.status));
      }
    } catch (e) {
      // Network error — reset so lab doesn't get stuck as "pending"
      const resetStatus = prevModule?.lab_generation_status === "done" ? "done" : "failed";
      await supabase.from("course_modules").update({ lab_generation_status: resetStatus }).eq("id", moduleId);
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lab_generation_status: resetStatus } : m));
      console.error("Lab generation network error for module", moduleId, e);
    } finally {
      setGeneratingLabs(prev => {
        const next = new Set(prev);
        next.delete(moduleId);
        return next;
      });
    }
  };

  const regenerateAllLabs = async () => {
    setRegeneratingAll(true);
    toast({ title: "Regenerating all labs…", description: "This may take a minute." });
    try {
      for (const m of modules) {
        await triggerLabGeneration(m.id, true);
      }
      toast({ title: "Labs regenerated!", description: "All labs have been rebuilt with new activity types." });
    } finally {
      setRegeneratingAll(false);
    }
  };

  const mod = modules[activeModule];

  const totalSections = modules.length * 3;
  const completedSections = modules.reduce((sum, m) => {
    const s = progress.sectionStatus[m.id];
    if (!s) return sum;
    return sum + (s.lesson ? 1 : 0) + (s.lab ? 1 : 0) + (s.quiz ? 1 : 0);
  }, 0);
  const progressPct = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  const getSectionDone = (moduleId: string, section: "lesson" | "lab" | "quiz") => {
    return progress.sectionStatus[moduleId]?.[section] ?? false;
  };

  const handleLessonComplete = useCallback(() => {
    if (!mod) return;
    completeSection(mod.id, "lesson", modules.length);
  }, [mod, completeSection, modules.length]);

  const handleLabComplete = useCallback(() => {
    if (!mod) return;
    completeSection(mod.id, "lab", modules.length);
  }, [mod, completeSection, modules.length]);

  const handleLabReplay = useCallback(() => {
    if (!mod) return;
    uncompleteSection(mod.id, "lab");
  }, [mod, uncompleteSection]);

  const handleQuizSubmit = async (answers: Record<number, number>, score: number, total: number) => {
    if (!mod || !user) return;
    const pct = total > 0 ? score / total : 0;
    const passed = pct >= PASS_THRESHOLD;

    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      module_id: mod.id,
      answers,
      score,
      total,
    });

    if (passed) {
      completeSection(mod.id, "quiz", modules.length);
      toast({ title: `Quiz passed! ${Math.round(pct * 100)}%`, description: `${score}/${total} correct` });
    } else {
      toast({
        title: `Score: ${Math.round(pct * 100)}% — Need 70% to pass`,
        description: "Review the material and try again.",
        variant: "destructive",
      });
    }
  };

  const selectItem = (moduleIndex: number, content: ContentType) => {
    setActiveModule(moduleIndex);
    setActiveContent(content);
    if (moduleIndex !== activeModule) setShowSummaryVideo(false);
  };

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className={themeClasses.page}>
        <div className={themeClasses.nav}>
          <div className="h-5 w-24 rounded bg-[#e8e8e4] animate-pulse" />
          <div className="h-5 w-32 rounded bg-[#e8e8e4] animate-pulse" />
        </div>
        <div className="pt-14 flex h-screen">
          <div className="w-[280px] border-r border-[#e8e8e4] p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-[#f0f0ec] animate-pulse" />
            ))}
          </div>
          <div className="flex-1 p-12">
            <div className="h-8 w-96 rounded bg-[#e8e8e4] animate-pulse mb-8" />
            <div className="aspect-video rounded-2xl bg-[#f0f0ec] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      {justCompleted && course && (
        <CourseCompletionScreen
          courseName={course.title}
          totalModules={modules.length}
          pointsAwarded={150}
          onDismiss={dismissCompletion}
          onViewCertificate={() => {
            dismissCompletion();
            navigate("/profile");
          }}
        />
      )}

      <div className={themeClasses.page}>
        {/* ═══ Top Navigation ═══ */}
        <nav className={themeClasses.nav}>
          <div className="flex items-center gap-4">
            <Link to="/courses" className="flex items-center gap-2">
              <img src={rependLogo} alt="Repend" className="h-6 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {course?.user_id === user?.id && (
              <button
                onClick={regenerateAllLabs}
                disabled={regeneratingAll}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                title="Regenerate all labs with new activity types"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", regeneratingAll && "animate-spin")} />
                {regeneratingAll ? "Regenerating…" : "Regen Labs"}
              </button>
            )}
            {isElite && course?.user_id === user?.id && (
              <button
                onClick={() => navigate(`/courses/${id}/edit`)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="font-semibold tabular-nums">{progressPct}%</span>
            </div>
            <button
              onClick={() => navigate("/courses")}
              className="ml-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Courses
            </button>
          </div>
        </nav>

        <div className="pt-14 flex min-h-screen">
          <aside className={themeClasses.sidebar}>
            <div className="p-5 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                {course?.title}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2 scrollbar-hide">
              <p className="px-3 pt-3 pb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/70">
                Modules
              </p>
              {modules.map((m, i) => {
                const isActive = activeModule === i;
                const isModuleDone = progress.completedLessons.includes(m.id);
                const lessonDone = getSectionDone(m.id, "lesson");
                const labDone = getSectionDone(m.id, "lab");
                const quizDone = getSectionDone(m.id, "quiz");

                return (
                  <div key={m.id} className="mb-1">
                    <button
                      onClick={() => selectItem(i, "lesson")}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                        isActive
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      {isModuleDone ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : isActive ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className="text-[13px] line-clamp-1">{m.title}</span>
                    </button>

                    {isActive && (
                      <div className="ml-6 mt-0.5 space-y-0.5 animate-fade-in">
                        {[
                          { key: "lesson" as ContentType, icon: FileText, label: "Lesson", done: lessonDone },
                          { key: "lab" as ContentType, icon: Beaker, label: "Lab", done: labDone },
                          { key: "quiz" as ContentType, icon: ClipboardList, label: "Quiz", done: quizDone },
                        ].map(({ key, icon: Icon, label, done }) => (
                          <button
                            key={key}
                            onClick={() => selectItem(i, key)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] transition-all",
                              activeContent === key
                                ? "text-foreground font-semibold bg-secondary/60"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                              <Icon className="w-3 h-3" />
                            )}
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {mod && (
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-[780px] mx-auto px-8 py-10">
                <div className="mb-8">
                  <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground/70 mb-3">
                    Module {mod.module_order}
                  </p>
                  <h1 className="text-3xl md:text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-foreground">
                    {mod.title}
                  </h1>
                  {progress.completedLessons.includes(mod.id) && (
                    <Badge className="mt-3 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-[11px] font-semibold shadow-none">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                    </Badge>
                  )}
                </div>

                {mod.lesson_content.startsWith("⏳") ? (
                  <div className={cn(themeClasses.card, "flex flex-col items-center justify-center py-20 text-center")}>
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <h3 className="text-lg font-bold mb-2">Generating Module Content</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Creating your lesson, quiz, and lab for "{mod.title}". This usually takes about 30 seconds.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ── Watch Summary Video (shown above lesson card when toggled) ── */}
                    {activeContent === "lesson" && showSummaryVideo && (
                      <div className="mb-6">
                        <ModuleSummaryVideo
                          title={mod.title}
                          content={mod.lesson_content}
                          real_world_application={mod.real_world_application ?? ""}
                          key_takeaways={mod.key_takeaways ?? []}
                          topic={course?.title ?? ""}
                          onStartLab={() => selectItem(activeModule, "lab")}
                        />
                        <button
                          onClick={() => setShowSummaryVideo(false)}
                          className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          ↑ Hide video
                        </button>
                      </div>
                    )}

                    <div className={cn(themeClasses.card, "p-8")}>
                      {activeContent === "lesson" && (
                        <>
                          {/* ── Watch Summary button (above slides) ── */}
                          {!showSummaryVideo && (
                            <div className="flex justify-end mb-5">
                              <button
                                onClick={() => setShowSummaryVideo(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[13px] font-semibold hover:bg-primary/15 transition-colors"
                              >
                                <span>▶</span>
                                Watch Summary
                              </button>
                            </div>
                          )}
                          <LessonSlides
                            content={mod.lesson_content}
                            youtubeUrl={mod.youtube_url}
                            youtubeTitle={mod.youtube_title}
                            onComplete={handleLessonComplete}
                            isCompleted={getSectionDone(mod.id, "lesson")}
                            onSlideChange={(idx) => setCurrentSlideIndex(idx)}
                          />

                          {/* ── Real World Application ── */}
                          {mod.real_world_application && (
                            <div className="mt-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 p-6">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
                                  <Globe className="w-3.5 h-3.5 text-green-500" />
                                </div>
                                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-green-600 dark:text-green-400">
                                  Real World Application
                                </span>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {mod.real_world_application}
                              </p>
                            </div>
                          )}

                          {/* ── Key Takeaways ── */}
                          {mod.key_takeaways && mod.key_takeaways.length > 0 && (
                            <div className="mt-6 rounded-2xl bg-secondary/30 border border-border/50 p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                  <ListChecks className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
                                  Key Takeaways
                                </span>
                              </div>
                              <ul className="space-y-2">
                                {mod.key_takeaways.map((takeaway, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                                    <span>{takeaway}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* ── Start Lab / Take Quiz CTA ── */}
                          <div className="mt-8 flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() => selectItem(activeModule, "lab")}
                              className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-[14px] hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                            >
                              <FlaskConical className="w-4 h-4" />
                              Start Lab
                              {mod.lab_generation_status === "generating" && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />
                              )}
                            </button>
                            <button
                              onClick={() => selectItem(activeModule, "quiz")}
                              className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-secondary border border-border/60 text-foreground font-semibold text-[14px] hover:bg-secondary/80 transition-colors"
                            >
                              <ClipboardList className="w-4 h-4" />
                              Take Quiz
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </>
                      )}

                      {activeContent === "lab" && (
                        <InteractiveLab
                          labType={mod.lab_type}
                          labData={mod.lab_data}
                          labTitle={mod.lab_title}
                          labDescription={mod.lab_description}
                          labGenerationStatus={mod.lab_generation_status}
                          labError={mod.lab_error}
                          onComplete={handleLabComplete}
                          isCompleted={getSectionDone(mod.id, "lab")}
                          onRetryGeneration={() => triggerLabGeneration(mod.id, true)}
                          onReplay={handleLabReplay}
                          moduleTitle={mod.title}
                        />
                      )}

                      {activeContent === "quiz" && (
                        <QuizSlides
                          questions={mod.quiz as any[]}
                          onSubmit={handleQuizSubmit}
                          isCompleted={getSectionDone(mod.id, "quiz")}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </main>
          )}

        </div>

        {/* ═══ Floating Module Chat Button ═══ */}
        {course && mod && (
          <AiTutor
            moduleTitle={mod.title}
            courseTitle={course.title}
            currentSlideContent={activeContent === "lesson" ? (mod.lesson_content.split(/\n---\n/)[currentSlideIndex] || "") : undefined}
            slideIndex={currentSlideIndex}
            totalSlides={mod.lesson_content.split(/\n---\n/).length}
            activeSection={activeContent}
          />
        )}
      </div>
    </>
  );
}
