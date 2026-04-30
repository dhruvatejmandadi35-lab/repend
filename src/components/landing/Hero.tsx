import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";

const avatarSeeds = ["Aria", "Kai", "Mira", "Noah", "Zane"];

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.035]" style={{
        backgroundImage: `linear-gradient(hsl(214 80% 56%) 1px, transparent 1px), linear-gradient(90deg, hsl(214 80% 56%) 1px, transparent 1px)`,
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 60% 70% at 50% 40%, black 40%, transparent 90%)'
      }} />

      {/* Ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[680px] h-[680px] bg-primary/[0.07] rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[420px] h-[420px] bg-accent/[0.05] rounded-full blur-[120px]" />

      <div className="container relative z-10 px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Announcement pill */}
          <Link
            to="/courses"
            className="group inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-card/60 border border-border/70 backdrop-blur-sm mb-9 animate-fade-in hover:border-primary/40 hover:bg-card/80 transition-all"
          >
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" />
              New
            </span>
            <span className="text-[13px] font-medium text-foreground/85">
              Interactive labs powered by Claude
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.05] mb-6 animate-fade-in-up text-foreground tracking-[-0.03em]">
            Master any skill with{" "}
            <span className="gradient-text">AI-generated</span>
            {" "}courses
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.15s' }}>
            Personalized courses with interactive simulations, daily challenges, and real-time progress tracking — all generated in seconds.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">
                Start Learning Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/courses">
                Browse Courses
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {avatarSeeds.map((seed, i) => (
                  <div
                    key={seed}
                    className="w-7 h-7 rounded-full border-2 border-background overflow-hidden bg-secondary"
                    style={{ zIndex: avatarSeeds.length - i }}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                      alt=""
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-muted-foreground">
                <span className="text-foreground font-semibold">5,000+</span> learners
              </span>
            </div>

            <div className="hidden sm:block w-px h-5 bg-border/60" />

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[13px] text-muted-foreground">
                <span className="text-foreground font-semibold">4.9</span> avg rating
              </span>
            </div>

            <div className="hidden sm:block w-px h-5 bg-border/60" />

            <span className="text-[13px] text-muted-foreground">
              No credit card · <span className="text-foreground font-medium">30s</span> to first course
            </span>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
