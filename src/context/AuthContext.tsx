import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthError {
  message: string;
  code?: string;
  details?: any;
}

interface AuthResult {
  error: AuthError | null;
  data?: any;
  success: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  userRole: string | null;
  isRoleLoading: boolean;
  subscriptionPlan: string | null;
  trialActive: boolean;
  daysLeftInTrial: number;
  lastError: AuthError | null;
  retryCount: number;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, metadata?: any) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'email_change') => Promise<AuthResult>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  retryLastOperation: () => Promise<AuthResult | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [trialActive, setTrialActive] = useState(false);
  const [daysLeftInTrial, setDaysLeftInTrial] = useState(0);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastOperation, setLastOperation] = useState<(() => Promise<AuthResult>) | null>(null);
  const { toast } = useToast();

  // Constants for retry logic
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // Progressive delays in ms

  const clearUserState = () => {
    setUser(null);
    setIsAdmin(false);
    setIsManager(false);
    setUserRole(null);
    setSubscriptionPlan(null);
    setTrialActive(false);
    setDaysLeftInTrial(0);
    setIsRoleLoading(false);
    setLastError(null);
    setRetryCount(0);
    setLastOperation(null);
  };

  // Enhanced error handling utility
  const handleAuthError = useCallback((error: any, context: string): AuthError => {
    console.error(`Auth error in ${context}:`, error);
    
    let authError: AuthError = {
      message: 'An unexpected error occurred',
      code: error?.code || 'unknown_error',
      details: error
    };

    // Map common Supabase errors to user-friendly messages
    if (error?.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('invalid login credentials')) {
        authError.message = 'Invalid email or password. Please check your credentials and try again.';
        authError.code = 'invalid_credentials';
      } else if (message.includes('email not confirmed')) {
        authError.message = 'Please check your email and click the confirmation link before signing in.';
        authError.code = 'email_not_confirmed';
      } else if (message.includes('user already registered')) {
        authError.message = 'An account with this email already exists. Please sign in instead.';
        authError.code = 'user_exists';
      } else if (message.includes('signup is disabled')) {
        authError.message = 'Account registration is currently disabled. Please contact support.';
        authError.code = 'signup_disabled';
      } else if (message.includes('database error') || message.includes('internal server error')) {
        authError.message = 'We\'re experiencing technical difficulties. Please try again in a moment.';
        authError.code = 'server_error';
      } else if (message.includes('network') || message.includes('fetch')) {
        authError.message = 'Network connection issue. Please check your internet connection and try again.';
        authError.code = 'network_error';
      } else {
        authError.message = error.message;
      }
    }

    setLastError(authError);
    return authError;
  }, []);

  // Retry utility with exponential backoff
  const withRetry = useCallback(async (
    operation: () => Promise<any>,
    context: string,
    maxRetries: number = MAX_RETRIES
  ) => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        const result = await operation();
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        lastError = error;
        console.log(`${context} attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          console.log(`Retrying ${context} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }, [MAX_RETRIES, RETRY_DELAYS]);

  // Clear error function
  const clearError = useCallback(() => {
    setLastError(null);
    setRetryCount(0);
  }, []);

  // Retry last operation
  const retryLastOperation = useCallback(async (): Promise<AuthResult | null> => {
    if (!lastOperation) {
      return { error: { message: 'No operation to retry' }, success: false };
    }
    
    try {
      return await lastOperation();
    } catch (error) {
      return { error: handleAuthError(error, 'retry operation'), success: false };
    }
  }, [lastOperation, handleAuthError]);

  const waitForProfileCreation = async (authUser: User): Promise<void> => {
    console.log("Waiting for profile creation for:", authUser.email);
    
    try {
      // Wait for database trigger to complete (with progressive delays)
      const delays = [500, 1000, 1500, 2000, 3000]; // More attempts with shorter initial delays
      
      for (let attempt = 0; attempt < delays.length; attempt++) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        
        // Check if user record was created by trigger
        // Use maybeSingle() to avoid throwing on no rows
        const { data: existingUser, error: checkError } = await supabase
          .from('app_users')
          .select('id, email, profile_completed')
          .eq('id', authUser.id)
          .maybeSingle();
          
        // Ignore PGRST116 (no rows) errors - that's expected while waiting
        if (checkError && checkError.code !== 'PGRST116') {
          console.warn(`Unexpected error checking profile (attempt ${attempt + 1}):`, checkError);
          // Continue trying despite errors
        }
          
        if (existingUser) {
          const totalWait = delays.slice(0, attempt + 1).reduce((a, b) => a + b, 0);
          console.log(`✓ User profile found after ${totalWait}ms for:`, authUser.email);
          return; // User record exists, trigger worked
        }
        
        console.log(`Attempt ${attempt + 1}/${delays.length}: Profile not ready yet, waiting...`);
      }
      
      // If we get here, the trigger didn't create the user record in time
      console.error("Database trigger failed to create user profile within timeout");
      
      // Don't throw - let the app continue with safe defaults
      console.warn("Continuing with safe defaults - profile may load after refresh");
      
    } catch (error) {
      console.error("Error in waitForProfileCreation:", error);
      // Don't throw - let the app continue
      console.warn("Continuing despite profile creation error");
    }
  };

  const fetchUserInfo = async (authUser: User): Promise<void> => {
    try {
      setIsRoleLoading(true);
      
      // Use retry logic for fetching user data
      const userData = await withRetry(async () => {
        const { data, error } = await supabase
          .from('app_users')
          .select('user_role, profile_completed, subscription_status, trial_end_date')
          .eq('id', authUser.id)
          .maybeSingle(); // Use maybeSingle to avoid throwing on no rows
          
        if (error && error.code !== 'PGRST116') {
          // Only throw on real errors, not "no rows"
          throw error;
        }
        
        if (!data) {
          // If user not found, wait for trigger completion
          console.log("User profile not found, waiting for database trigger...");
          await waitForProfileCreation(authUser);
          
          // Retry after trigger completion
          const { data: retryData, error: retryError } = await supabase
            .from('app_users')
            .select('user_role, profile_completed, subscription_status, trial_end_date')
            .eq('id', authUser.id)
            .maybeSingle();
            
          if (retryError && retryError.code !== 'PGRST116') {
            throw retryError;
          }
          
          return retryData;
        }
        
        return data;
      }, 'fetch user info');

      if (userData) {
        const role = userData.user_role?.toLowerCase();
        
        setIsAdmin(role === 'admin');
        setIsManager(role === 'manager');
        setUserRole(userData.user_role || 'User');
        
        // Get subscription info from user data
        const subStatus = userData.subscription_status || 'trialing';
        const isTrialing = subStatus === 'trialing';
        
        // Calculate days left in trial
        let daysLeft = 0;
        if (isTrialing && userData.trial_end_date) {
          const trialEnd = new Date(userData.trial_end_date);
          const now = new Date();
          daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          daysLeft = Math.max(0, daysLeft);
        }
        
        // Get plan name from subscription using new schema
        try {
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select(`
              status,
              current_period_end,
              subscription_plans!inner(
                name,
                display_name,
                features
              )
            `)
            .eq('user_id', authUser.id)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (subData?.subscription_plans) {
            const plan = subData.subscription_plans as any;
            setSubscriptionPlan(plan.display_name || plan.name || 'Free Trial');
          } else {
            setSubscriptionPlan(isTrialing ? 'Free Trial' : 'No Active Plan');
          }
        } catch (error) {
          console.error("Error fetching subscription plan:", error);
          setSubscriptionPlan(isTrialing ? 'Free Trial' : 'No Active Plan');
        }
        
        setTrialActive(isTrialing);
        setDaysLeftInTrial(daysLeft);
      } else {
        // Profile still not found after waiting - use safe defaults
        console.warn("Profile not found after waiting, using safe defaults");
        setUserRole('User');
        setSubscriptionPlan('Free Trial');
        setTrialActive(true);
        setIsAdmin(false);
        setIsManager(false);
        setDaysLeftInTrial(7);
      }
      
      setIsRoleLoading(false);
    } catch (error) {
      console.error("Error in fetchUserInfo:", error);
      handleAuthError(error, 'fetch user info');
      
      // Set safe defaults
      setUserRole('User');
      setSubscriptionPlan('Free Trial');
      setTrialActive(true);
      setIsAdmin(false);
      setIsManager(false);
      setDaysLeftInTrial(7);
      setIsRoleLoading(false);
      
      // Show user-friendly error only if it's a real problem
      if (error && !(error as any)?.code?.includes('PGRST116')) {
        toast({
          title: "Profile Loading Issue",
          description: "We're setting up your account. Please refresh if this persists.",
          variant: "default",
        });
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          // Handle refresh token errors by clearing local storage
          if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
            console.log('Clearing invalid session data...');
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');
          }
          if (isMounted) {
            clearUserState();
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchUserInfo(session.user);
        } else if (isMounted) {
          clearUserState();
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        // Handle any other authentication errors
        if (error instanceof Error && (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token'))) {
          console.log('Clearing invalid session data due to error...');
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
        }
        if (isMounted) {
          clearUserState();
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state change:', event, session?.user?.id);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('User signed out or deleted, clearing state');
        clearUserState();
        setIsLoading(false);
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        setTimeout(() => {
          if (isMounted) {
            fetchUserInfo(session.user);
          }
        }, 100);
      } else {
        clearUserState();
      }
      
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const operation = async () => {
      setIsLoading(true);
      clearError();
      
      const result = await withRetry(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        return data;
      }, 'sign in');

      if (result.user) {
        await fetchUserInfo(result.user);
        
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }

      return { data: result, error: null, success: true };
    };

    setLastOperation(operation);

    try {
      return await operation();
    } catch (error: any) {
      console.error('Sign in error:', error);
      const authError = handleAuthError(error, 'sign in');
      
      toast({
        title: "Sign In Failed",
        description: authError.message,
        variant: "destructive",
      });
      
      return { data: null, error: authError, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<AuthResult> => {
    const operation = async () => {
      setIsLoading(true);
      clearError();
      
      const result = await withRetry(async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        });

        if (error) {
          throw error;
        }

        return data;
      }, 'sign up');

      // If user is immediately confirmed (e.g., in development)
      if (result.user && !result.user.email_confirmed_at) {
        toast({
          title: "Account Created!",
          description: "Please check your email to confirm your account.",
        });
        
        return {
          data: result,
          error: null,
          success: true
        };
      }

      if (result.user) {
        // Wait for database trigger to complete and fetch user info
        await fetchUserInfo(result.user);
        
        toast({
          title: "Welcome to TradeLens!",
          description: "Your account has been created successfully.",
        });
      }

      return { data: result, error: null, success: true };
    };

    setLastOperation(operation);

    try {
      return await operation();
    } catch (error: any) {
      console.error('Sign up error:', error);
      const authError = handleAuthError(error, 'sign up');
      
      toast({
        title: "Sign Up Failed",
        description: authError.message,
        variant: "destructive",
      });
      
      return { data: null, error: authError, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    const operation = async () => {
      setIsLoading(true);
      clearError();
      
      const result = await withRetry(async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/dashboard'
          }
        });

        if (error) {
          throw error;
        }

        return data;
      }, 'Google sign in');

      return { data: result, error: null, success: true };
    };

    setLastOperation(operation);

    try {
      return await operation();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      const authError = handleAuthError(error, 'Google sign in');
      
      toast({
        title: "Google Sign In Failed",
        description: authError.message,
        variant: "destructive",
      });
      
      return { data: null, error: authError, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    const operation = async () => {
      clearError();
      
      const result = await withRetry(async () => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: undefined // Use OTP instead of magic link
        });

        if (error) {
          throw error;
        }

        return data;
      }, 'password reset');

      toast({
        title: "Verification Code Sent",
        description: "Please check your email for a 6-digit verification code.",
      });

      return { data: result, error: null, success: true };
    };

    setLastOperation(operation);

    try {
      return await operation();
    } catch (error: any) {
      console.error('Password reset error:', error);
      const authError = handleAuthError(error, 'password reset');
      
      toast({
        title: "Password Reset Failed",
        description: authError.message,
        variant: "destructive",
      });
      
      return { data: null, error: authError, success: false };
    }
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    const operation = async () => {
      clearError();
      
      const result = await withRetry(async () => {
        const { data, error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) {
          throw error;
        }

        return data;
      }, 'password update');

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });

      return { data: result, error: null, success: true };
    };

    setLastOperation(operation);

    try {
      return await operation();
    } catch (error: any) {
      console.error('Password update error:', error);
      const authError = handleAuthError(error, 'password update');
      
      toast({
        title: "Password Update Failed",
        description: authError.message,
        variant: "destructive",
      });
      
      return { data: null, error: authError, success: false };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
        toast({
          title: "Error",
          description: "Failed to log out",
          variant: "destructive",
        });
      } else {
        clearUserState();
        toast({
          title: "Success",
          description: "You have been logged out",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'email_change'): Promise<AuthResult> => {
    const operation = async () => {
      setIsLoading(true);
      clearError();
      
      const result = await withRetry(async () => {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type,
        });

        if (error) {
          throw error;
        }

        return data;
      }, 'OTP verification');

      if (result.user) {
        await fetchUserInfo(result.user);
        
        toast({
          title: "Verification Successful!",
          description: type === 'signup' 
            ? "Welcome to TradeLens!" 
            : "Email verified successfully.",
        });
      }

      return { data: result, error: null, success: true };
    };

    setLastOperation(operation);

    try {
      return await operation();
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const authError = handleAuthError(error, 'OTP verification');
      
      toast({
        title: "Verification Failed",
        description: authError.message,
        variant: "destructive",
      });
      
      return { data: null, error: authError, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = signOut;

  const value: AuthContextType = {
    user,
    isLoading,
    isRoleLoading,
    isAdmin,
    isManager,
    userRole,
    subscriptionPlan,
    trialActive,
    daysLeftInTrial,
    lastError,
    retryCount,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    verifyOtp,
    signOut,
    logout,
    clearError,
    retryLastOperation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
