import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, Loader2, TrendingUp, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/error-messages";

const VerifyOTP = () => {
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"signup" | "recovery" | "email_change">("signup");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get email and type from localStorage or URL params
    const storedEmail = localStorage.getItem("pending_verification_email");
    const verificationType = localStorage.getItem("verification_type") as "signup" | "recovery" | "email_change" || "signup";
    const urlEmail = searchParams.get("email");
    const urlType = searchParams.get("type") as "signup" | "recovery" | "email_change";

    if (urlEmail) setEmail(urlEmail);
    else if (storedEmail) setEmail(storedEmail);
    else {
      // Don't show error immediately - user might be navigating here directly
      // Only show error if they try to verify without email
      return;
    }

    if (urlType) setType(urlType);
    else setType(verificationType);

    // Focus first input
    inputRefs.current[0]?.focus();
  }, [searchParams, navigate, toast]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    // Only process if it's 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    // Check if email is available
    if (!email) {
      toast({
        title: "Verification Error",
        description: "We couldn't find your verification request. Please try signing up again.",
        variant: "destructive",
      });
      navigate("/auth/register");
      return;
    }

    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter all 6 digits of the verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type,
      });

      if (error) throw error;

      // Clear stored data immediately
      localStorage.removeItem("pending_verification_email");
      localStorage.removeItem("verification_type");

      // Show success message
      toast({
        title: "Verification Successful!",
        description: type === "signup" 
          ? "Your account has been verified. Welcome to TradeLens!" 
          : type === "recovery"
          ? "Email verified. You can now reset your password."
          : "Email change verified successfully.",
      });

      // Redirect based on type
      if (type === "signup") {
        // For signup, navigate immediately - auth state will handle the rest
        navigate("/dashboard", { replace: true });
      } else if (type === "recovery") {
        // For password recovery, redirect to reset password page
        navigate("/auth/reset-password", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: "destructive",
      });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "We couldn't find your email. Please try signing up again.",
        variant: "destructive",
      });
      navigate("/auth/register");
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type,
        email,
      });

      if (error) throw error;

      toast({
        title: "Code Sent",
        description: "A new verification code has been sent to your email.",
      });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: "destructive",
      });
    } finally {
      setResending(false);
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
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription className="text-base">
              We've sent a 6-digit code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={loading || otp.some(d => !d)}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Code
                </>
              )}
            </Button>

            {/* Help Text */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Didn't receive the code?</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email</li>
                <li>Wait a minute and check again</li>
              </ul>
            </div>

            {/* Resend Button */}
            <Button
              onClick={handleResend}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend code"
              )}
            </Button>

            {/* Back Button */}
            <Button
              onClick={() => navigate("/auth/sign-in")}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
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

export default VerifyOTP;
