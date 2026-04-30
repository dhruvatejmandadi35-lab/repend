import { Bot, BookOpen, Trophy } from "lucide-react";

const steps = [
  {
    icon: BookOpen,
    title: "Generate a Course",
    description: "Tell the AI what you want to learn. It scaffolds a full course with lessons, quizzes, and interactive labs — instantly.",
    step: "01",
  },
  {
    icon: Bot,
    title: "Learn Interactively",
    description: "Work through modules at your own pace with AI-powered simulations, decision labs, and real-time feedback.",
    step: "02",
  },
  {
    icon: Trophy,
    title: "Track & Challenge",
    description: "Complete daily challenges, earn certificates, and measure your growth with detailed progress analytics.",
    step: "03",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-secondary/20" />
      <div className="container px-4 sm:px-6 relative">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-3">
            How it works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-foreground tracking-[-0.02em]">
            Three steps to mastery
          </h2>
          <p className="text-muted-foreground text-base">
            A streamlined workflow designed for efficient, effective learning — from cold start to fluent in days.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-[68px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-border/60 to-transparent z-0" />

          {steps.map((step) => (
            <div key={step.title} className="relative group">
              <div className="relative bg-card/70 backdrop-blur-sm border border-border/60 rounded-xl p-7 transition-all duration-300 hover:border-primary/25 hover:bg-card hover:-translate-y-1 hover:shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.25)] h-full">
                {/* Step number */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    Step {step.step}
                  </span>
                  <span className="font-display text-3xl font-bold text-foreground/[0.06] tracking-[-0.04em] leading-none">
                    {step.step}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center mb-5 shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4),inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <step.icon className="w-5 h-5 text-primary-foreground" />
                </div>

                <h3 className="font-display text-lg font-semibold mb-2 text-foreground tracking-[-0.01em]">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
