import { Beaker, Zap, Trophy, BarChart3, Sparkles, GitBranch, Code2, Shuffle } from "lucide-react";

const labTypes = [
  { name: "Simulation", icon: Beaker },
  { name: "Graph", icon: BarChart3 },
  { name: "Flowchart", icon: GitBranch },
  { name: "Debugger", icon: Code2 },
  { name: "Matching", icon: Shuffle },
  { name: "Ordering", icon: Sparkles },
  { name: "Scenario", icon: Beaker },
];

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4 sm:px-6 relative">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-3">
            Everything you need
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-foreground tracking-[-0.02em]">
            Built for retention, not just consumption
          </h2>
          <p className="text-muted-foreground text-base">
            Repend isn't another video library. It's an active learning environment with hands-on labs, AI feedback, and progress that compounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto auto-rows-[minmax(0,1fr)]">
          {/* 7 Lab types — large card */}
          <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-7 sm:p-9 hover:border-primary/30 transition-all">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/[0.08] rounded-full blur-3xl group-hover:bg-primary/[0.12] transition-colors" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
                <Beaker className="w-3 h-3" />
                Interactive Labs
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold mb-3 text-foreground tracking-[-0.02em]">
                Seven lab types, auto-matched to your topic.
              </h3>
              <p className="text-muted-foreground text-[15px] mb-7 max-w-md leading-relaxed">
                From physics simulations to code debuggers, ordering tasks to scenario builders — the AI picks the right format for each module.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md">
                {labTypes.map((lab, i) => (
                  <div
                    key={lab.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border/40 text-[13px] font-medium text-foreground/85 hover:border-primary/30 hover:bg-secondary/60 transition-all"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <lab.icon className="w-3.5 h-3.5 text-primary" />
                    {lab.name}
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/60 text-[13px] font-medium text-muted-foreground">
                  + more
                </div>
              </div>
            </div>
          </div>

          {/* Speed */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-7 hover:border-accent/30 transition-all">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/[0.08] rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center mb-4 shadow-[0_4px_12px_-2px_hsl(var(--accent)/0.4)]">
                <Zap className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground tracking-[-0.02em] mb-1">
                <span className="gradient-text">~30s</span>
              </div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1.5">
                Generated in seconds
              </h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                Type a topic. Get a full course outline, lessons, quizzes, and labs.
              </p>
            </div>
          </div>

          {/* Daily challenge */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-7 hover:border-primary/30 transition-all">
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary/[0.08] rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-4 shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)]">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1.5">
                Daily challenges
              </h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                Keep your streak alive with fresh, AI-curated problems every 24 hours.
              </p>
            </div>
          </div>

          {/* Progress tracking — wide */}
          <div className="md:col-span-3 group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-7 hover:border-primary/30 transition-all">
            <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[11px] font-semibold uppercase tracking-wider mb-3">
                  <BarChart3 className="w-3 h-3" />
                  Progress
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-1.5 tracking-[-0.02em]">
                  Track every module, quiz score, and streak.
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                  Detailed analytics show where you're strong, where you're stuck, and what to work on next — backed by your full learning history.
                </p>
              </div>

              {/* Mini progress bars */}
              <div className="hidden sm:flex flex-col gap-2 min-w-[200px]">
                {[
                  { label: "React Hooks", value: 92, color: "from-primary to-accent" },
                  { label: "Linear Algebra", value: 67, color: "from-accent to-primary" },
                  { label: "TypeScript", value: 45, color: "from-primary/80 to-accent/80" },
                ].map((row) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-foreground font-medium">{row.value}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all`}
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
