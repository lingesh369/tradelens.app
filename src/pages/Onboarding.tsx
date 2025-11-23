import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { TrendingUp, Sparkles, BarChart3, Target, CheckCircle } from "lucide-react";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, daysLeftInTrial } = useAuth();
  
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Mark onboarding as completed
      const { error } = await supabase
        .from('app_users')
        .update({ 
          onboarding_completed: true,
          profile_completed: true 
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Welcome to TradeLens!",
        description: "You're all set up and ready to start tracking your trades.",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding completion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Still mark as completed even if skipped
      await supabase
        .from('app_users')
        .update({ onboarding_completed: true })
        .eq('id', user?.id);
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80 px-4">
      {/* Header */}
      <header className="py-4 container mx-auto">
        <div className="flex items-center gap-3 w-fit pl-0 md:pl-4">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">TradeLens</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-2xl shadow-lg border-border/50">
          <CardHeader>
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Step {step} of {totalSteps}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Welcome to TradeLens!</CardTitle>
                  <CardDescription className="text-base">
                    Your all-in-one platform for tracking, analyzing, and improving your trading performance.
                  </CardDescription>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-primary mb-2">
                    🎉 Your {daysLeftInTrial}-day free trial has started!
                  </p>
                  <p className="text-muted-foreground">
                    Full access to all features. No credit card required.
                  </p>
                </div>
                <Button onClick={() => setStep(2)} className="w-full" size="lg">
                  Get Started
                </Button>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="text-2xl">Track Every Trade</CardTitle>
                  <CardDescription className="text-base">
                    Log your trades with detailed entry and exit information, including stop loss, targets, and notes.
                  </CardDescription>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Multiple Accounts</p>
                      <p className="text-muted-foreground">Track trades across different brokers and account types</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Automatic Calculations</p>
                      <p className="text-muted-foreground">P&L, win rate, and performance metrics calculated automatically</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="text-2xl">Analyze & Improve</CardTitle>
                  <CardDescription className="text-base">
                    Get insights into your trading patterns and identify areas for improvement.
                  </CardDescription>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Performance Analytics</p>
                      <p className="text-muted-foreground">Detailed charts and statistics on your trading performance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Trading Journal</p>
                      <p className="text-muted-foreground">Document your thoughts, strategies, and lessons learned</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {step === 4 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">You're All Set!</CardTitle>
                  <CardDescription className="text-base">
                    Ready to start tracking your trades and improving your performance.
                  </CardDescription>
                </div>
                <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                  <p className="font-semibold">Next Steps:</p>
                  <ul className="text-sm text-left space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">1</span>
                      Create your first trading account
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">2</span>
                      Log your first trade
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">3</span>
                      Explore analytics and insights
                    </li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleComplete} disabled={loading} className="flex-1" size="lg">
                    {loading ? "Setting up..." : "Go to Dashboard"}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <Button onClick={handleSkip} variant="ghost" className="w-full text-muted-foreground">
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} TradeLens. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Onboarding;
