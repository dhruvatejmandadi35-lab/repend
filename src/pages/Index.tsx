import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ValueProp } from "@/components/landing/ValueProp";
import { CTA } from "@/components/landing/CTA";
import { Button } from "@/components/ui/button";
import { ClipboardList, Loader2 } from "lucide-react";
import { SurveyModal } from "@/components/survey/SurveyModal";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [surveyOpen, setSurveyOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/courses", { replace: true });
  }, [loading, navigate, user]);

  if (!loading && user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const handleSurveyClick = () => {
    setSurveyOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <ValueProp />

        {/* Survey CTA Section */}
        <section className="py-20 relative">
          <div className="container max-w-3xl text-center relative">
            <div className="relative bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-10 sm:p-12 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/[0.08] rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/[0.08] rounded-full blur-3xl" />
              <div className="relative">
                <p className="text-[13px] font-semibold text-accent uppercase tracking-wider mb-3">
                  Personalize Your Experience
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-foreground tracking-[-0.02em]">
                  Tell us what you want to learn
                </h2>
                <p className="text-muted-foreground text-base mb-8 max-w-lg mx-auto">
                  Take a quick survey so we can tailor your course recommendations and challenge suggestions.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleSurveyClick}
                >
                  <ClipboardList className="w-4 h-4" />
                  Take the Survey
                </Button>
              </div>
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />

      <SurveyModal open={surveyOpen} onOpenChange={setSurveyOpen} allowAnonymous={true} />
    </div>
  );
};

export default Index;
