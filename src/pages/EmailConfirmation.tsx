import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if this is a confirmation callback or redirect to OTP
  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    
    if (token && type === "signup") {
      // Old magic link - Supabase handles confirmation automatically
      toast({
        title: "Email confirmed!",
        description: "Your email has been verified. Redirecting to dashboard...",
      });
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } else {
      // Redirect to OTP verification page (new flow)
      const email = localStorage.getItem("pending_verification_email");
      if (email) {
        navigate("/auth/verify-otp");
      }
    }
  }, [searchParams, navigate, toast]);

  const handleResend = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem("pending_confirmation_email");
      if (!email) {
        toast({
          title: "Error",
          description: "No pending confirmation found. Please try signing up again.",
          variant: "destructive",
        });
        navigate("/auth/register");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      setResent(true);
      toast({
        title: "Email sent",
        description: "Check your inbox for the confirmation link.",
      });
    } catch (error: any) {
      console.error("Resend error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend confirmation email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80 px-4">
      {/* Header */}
      <header className="py-4 container mx-auto">
        <a 
          href="https://tradelens.app/" 
          className="flex items-center gap-3 w-fit pl-0 md:pl-4"
          target="_blank" 
          rel="noopener noreferrer"
        >
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">TradeLens</span>
        </a>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent you a confirmation link. Click the link in the email to activate your account and start your free trial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Didn't receive the email?</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes and check again</li>
              </ul>
            </div>
            
            <Button
              onClick={handleResend}
              disabled={loading || resent}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : resent ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Email sent!
                </>
              ) : (
                "Resend confirmation email"
              )}
            </Button>
            
            <Button
              onClick={() => navigate("/auth/sign-in")}
              variant="ghost"
              className="w-full"
            >
              Back to sign in
            </Button>
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

export default EmailConfirmation;
