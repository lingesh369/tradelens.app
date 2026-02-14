import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus, TrendingUp, Loader2, ArrowLeft, KeyRound, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { UsernameInput } from "@/components/ui/username-input";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { validatePassword } from "@/lib/password-validation";
import { getUserFriendlyError } from "@/lib/error-messages";

// Form schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(12, { message: "Password must be at least 12 characters" })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be at most 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const resetPasswordSchema = z.object({
  password: z.string()
    .min(12, { message: "Password must be at least 12 characters" })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character" }),
  confirmPassword: z.string().min(12, { message: "Password must be at least 12 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [view, setView] = useState<"login" | "register" | "forgot-password" | "reset-password">("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signInWithGoogle, resetPassword, updatePassword, user } = useAuth();

  // Initialize forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      username: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Determine view based on route
  useEffect(() => {
    if (location.pathname === "/auth/sign-in") {
      setView("login");
    } else if (location.pathname === "/auth/register") {
      setView("register");
    }
  }, [location.pathname]);

  // Check for URL parameters
  useEffect(() => {
    // Check for password reset mode
    const reset = searchParams.get("reset");
    const type = searchParams.get("type");
    
    if (reset === "true") {
      setView("reset-password");
    } else if (type === "recovery") {
      setView("reset-password");
    }
    
    // Check for error message
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    if (error && errorDescription) {
      const errorMsg = decodeURIComponent(errorDescription);
      setAuthError(errorMsg);
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  // Handle tab changes with navigation
  const handleTabChange = (value: string) => {
    if (value === "login") {
      navigate("/auth/sign-in");
    } else if (value === "register") {
      navigate("/auth/register");
    }
    setView(value as "login" | "register");
  };

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await signIn(values.email, values.password);
      
      if (error) throw error;
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      setAuthError(friendlyError.description);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Simple signup - let database trigger handle profile creation
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName || '',
            last_name: values.lastName || '',
            username: values.username || '',
            signup_source: 'web' // Track that this came from web app
          },
          emailRedirectTo: undefined // Disable magic link, use OTP instead
        }
      });
      
      if (error) {
        const friendlyError = getUserFriendlyError(error);
        setAuthError(friendlyError.description);
        toast({
          title: friendlyError.title,
          description: friendlyError.description,
          variant: "destructive",
        });
        
        // If account exists, switch to login view
        if (error.message.includes('already registered')) {
          setView("login");
        }
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // User is immediately confirmed (OAuth or confirmations disabled)
          toast({
            title: "Welcome to TradeLens!",
            description: "Your account has been created successfully. Setting up your profile...",
          });
          
          // Wait a moment for trigger to complete, then redirect
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 2000);
        } else {
          // Email confirmation is required via OTP
          toast({
            title: "Check Your Email",
            description: "We've sent a 6-digit verification code to your email address.",
          });
          
          // Store email and type for OTP verification
          localStorage.setItem("pending_verification_email", values.email);
          localStorage.setItem("verification_type", "signup");
          
          // Clear the form
          registerForm.reset();
          
          // Use replace to prevent going back to the registration form
          navigate("/auth/verify-otp", { replace: true });
        }
      }
      
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      setAuthError(friendlyError.description);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Use OTP for password reset instead of magic link
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: undefined // Disable magic link
      });
      
      if (error) throw error;
      
      toast({
        title: "Verification code sent",
        description: "Check your email for a 6-digit code to reset your password.",
      });
      
      // Store email and type for OTP verification
      localStorage.setItem("pending_verification_email", values.email);
      localStorage.setItem("verification_type", "recovery");
      
      forgotPasswordForm.reset();
      navigate("/auth/verify-otp", { replace: true });
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      setAuthError(friendlyError.description);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await updatePassword(values.password);
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. Please sign in with your new password.",
      });
      resetPasswordForm.reset();
      setView("login");
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      setAuthError(friendlyError.description);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Use direct Supabase client to handle redirects more reliably
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (error) throw error;
      
      // The redirect will happen automatically
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      setAuthError(friendlyError.description);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80 px-4">
      {/* Header/Navigation */}
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

      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          {authError && (
            <Alert variant="destructive" className="rounded-b-none">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          {view === "forgot-password" ? (
            <>
              <CardHeader className="space-y-1">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mr-2 px-0" 
                    onClick={() => navigate("/auth/sign-in")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Reset your password
                  </CardTitle>
                </div>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="Email"
                                className="pl-10"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          ) : view === "reset-password" ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">
                  Set new password
                </CardTitle>
                <CardDescription>
                  Create a new password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                    <FormField
                      control={resetPasswordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="New password"
                                className="pl-10 pr-10"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-muted-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={resetPasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                className="pl-10 pr-10"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-muted-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating password...
                        </span>
                      ) : (
                        "Update password"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-center">
                  Welcome to TradeLens
                </CardTitle>
                <CardDescription className="text-center">
                  {view === "login" ? "Sign in to your account" : "Create your account"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="login" value={view} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input
                                    placeholder="Email"
                                    className="pl-10"
                                    {...field}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    className="pl-10 pr-10"
                                    {...field}
                                  />
                                </FormControl>
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-muted-foreground"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="text-right">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-xs text-primary"
                            onClick={() => setView("forgot-password")}
                            type="button"
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Signing in...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <LogIn className="h-4 w-4" />
                              Sign in
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="First Name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Last Name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                         </div>
                         <FormField
                           control={registerForm.control}
                           name="username"
                           render={({ field }) => (
                             <FormItem>
                               <FormControl>
                                 <UsernameInput
                                   placeholder="Username"
                                   {...field}
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={registerForm.control}
                           name="email"
                          render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input
                                    placeholder="Email"
                                    className="pl-10"
                                    {...field}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    className="pl-10 pr-10"
                                    {...field}
                                  />
                                </FormControl>
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-muted-foreground"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating account...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Sign up
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <FcGoogle className="h-5 w-5 mr-2" />
                  Google
                </Button>
              </CardContent>
            </>
          )}
          <CardFooter className="flex justify-center border-t pt-5 text-xs text-muted-foreground">
            <p>
              {view === "login" 
                ? "Don't have an account? " 
                : view === "register" 
                  ? "Already have an account? " 
                  : "Remember your password? "}
              <Link 
                to={view === "register" ? "/auth/sign-in" : "/auth/register"}
                className="text-primary hover:underline"
              >
                {view === "login" 
                  ? "Sign up" 
                  : view === "register" 
                    ? "Sign in" 
                    : "Sign in"}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Simple Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} TradeLens. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Auth;
