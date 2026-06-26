import { useEffect, useState } from "react";
import { CourseGeneratingScreen } from "@/components/courses/CourseGeneratingScreen";
import { CheckCircle2, Loader2, Sparkles, BookOpen, FlaskConical, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const MODULES = [
  { title: "Why Rational Choice Fails", lesson: true, quiz: true, lab: "done" },
  { title: "Anchoring & Framing Effects", lesson: true, quiz: true, lab: "done" },
  { title: "Loss Aversion in Action", lesson: true, quiz: true, lab: "ready" },
  { title: "Nudges & Choice Architecture", lesson: true, quiz: false, lab: "pending" },
  { title: "Designing Better Decisions", lesson: false, quiz: false, lab: "pending" },
];

function MockPopulated() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-accent/6 rounded-full blur-[80px]" />
      </div>
      <div className="relative w-full max-w-lg mx-auto px-6 flex flex-col gap-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
            </div>
          </div>
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground/60 mb-1">Building Your Course</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-foreground">
            Behavioral Economics: How People Really Decide
          </h1>
        </div>
        <div className="space-y-2.5">
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: "68%" }} />
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground font-medium">Building Module 4 of 5: Nudges & Choice Architecture</span>
            <span className="tabular-nums font-bold text-foreground">68%</span>
          </div>
        </div>
        <div className="space-y-2">
          {MODULES.map((m, i) => {
            const labDone = m.lab === "done" || m.lab === "ready";
            const allDone = m.lesson && m.quiz && labDone;
            const generating = !m.lesson;
            return (
              <div key={i} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border",
                allDone ? "bg-green-500/[0.06] border-green-500/20" :
                generating ? "bg-primary/[0.06] border-primary/20" :
                "bg-secondary/30 border-border/40",
              )}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                  allDone ? "bg-green-500/15" : generating ? "bg-primary/15" : "bg-secondary/60",
                )}>
                  {allDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> :
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                </div>
                <span className={cn("flex-1 text-[13px] font-medium truncate",
                  allDone || generating ? "text-foreground" : "text-muted-foreground")}>
                  <span className="text-muted-foreground/40 mr-1.5 text-[11px]">{i + 1}.</span>
                  {m.title}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {m.lesson && <div className="px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20"><BookOpen className="w-2.5 h-2.5 text-blue-400" /></div>}
                  {m.quiz && <div className="px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20"><Zap className="w-2.5 h-2.5 text-amber-400" /></div>}
                  {labDone && <div className="px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20"><FlaskConical className="w-2.5 h-2.5 text-purple-400" /></div>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-[11px] text-muted-foreground/40">Usually takes 30–60 seconds</p>
      </div>
    </div>
  );
}

export default function GeneratingPreview() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("state") === "populated") return <MockPopulated />;
  return (
    <CourseGeneratingScreen
      topic="Behavioral Economics"
      isVisible={true}
      courseTitle="Behavioral Economics: How People Really Decide"
      expectedModules={[
        { index: 0, title: "Why Rational Choice Fails" },
        { index: 1, title: "Anchoring & Framing Effects" },
        { index: 2, title: "Loss Aversion in Action" },
        { index: 3, title: "Nudges & Choice Architecture" },
        { index: 4, title: "Designing Better Decisions" },
      ]}
    />
  );
}