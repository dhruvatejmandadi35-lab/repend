import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="py-24">
      <div className="container px-4 sm:px-6">
        <div className="relative max-w-4xl mx-auto">
          {/* Outer glow */}
          <div className="absolute -inset-4 gradient-primary opacity-[0.08] blur-3xl rounded-[2rem]" />

          <div className="relative gradient-primary rounded-2xl p-10 sm:p-16 overflow-hidden shadow-[0_24px_64px_-12px_hsl(var(--primary)/0.4),inset_0_1px_0_rgba(255,255,255,0.18)]">
            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%)'
            }} />
            <div className="absolute top-0 left-0 w-48 h-48 bg-white/[0.08] rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.06] rounded-full blur-3xl" />

            <div className="relative z-10 text-center max-w-xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold mb-4 text-primary-foreground tracking-[-0.02em] leading-[1.1]">
                Ready to start learning?
              </h2>
              <p className="text-primary-foreground/75 text-base sm:text-[17px] mb-9">
                Create your free account and generate your first AI-powered course in seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white font-semibold shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]"
                  asChild
                >
                  <Link to="/signup">
                    Sign Up Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/10 hover:border-white/50 backdrop-blur-sm"
                  asChild
                >
                  <Link to="/login">
                    Sign In
                  </Link>
                </Button>
              </div>

              <p className="text-primary-foreground/55 text-[12px] mt-7">
                Free forever · No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
