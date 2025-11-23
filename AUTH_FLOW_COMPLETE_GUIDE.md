# TradeLens Authentication Flow - Complete Implementation Guide

## 🎯 Overview

This guide provides a complete, production-ready authentication system for TradeLens following industry-standard practices.

## ✅ Database Layer - COMPLETE

### Updated Trigger Function

The `handle_new_signup()` trigger now properly handles:
- ✅ `signup_source` tracking (web, mobile, google, referral)
- ✅ `email_verified` status from Supabase Auth
- ✅ `profile_completed` flag (false initially)
- ✅ `referred_by` for affiliate tracking
- ✅ Retry logic with exponential backoff (1s, 2s, 4s)
- ✅ Comprehensive error logging
- ✅ Automatic trial subscription creation
- ✅ Default settings creation

### What the Trigger Creates Automatically

When a user signs up via Supabase Auth, the trigger creates:

1. **app_users** record with:
   - email, username, first_name, last_name
   - affiliate_code (unique 8-char code)
   - referred_by (if provided)
   - subscription_status = 'trialing'
   - trial_end_date = NOW() + 7 days
   - signup_source (web/mobile/google/referral)
   - email_verified (from Supabase Auth)
   - profile_completed = false

2. **trader_profiles** record with defaults

3. **user_settings** records:
   - theme: "light"
   - currency: "USD"
   - timezone: "UTC"
   - notifications: {"email": true, "push": true}

4. **user_subscriptions** record:
   - status = 'trialing'
   - 7-day trial period
   - Links to default 'free' plan

## 📋 Frontend Implementation Tasks

### Task 1: Fix AuthContext.tsx ⏳

**Current Issues:**
- References non-existent `auth_id` field
- Tries to manually create profiles
- Inconsistent error handling

**Required Changes:**

```typescript
// REMOVE these lines (manual profile creation):
const { error: profileError } = await supabase.rpc('create_app_user_profile', ...)
const { error: additionalProfileError } = await supabase.rpc('create_additional_user_profiles', ...)

// CHANGE this:
.eq('auth_id', authUser.id)

// TO this:
.eq('id', authUser.id)

// ADD signup_source tracking:
const signUp = async (email: string, password: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...metadata,
        signup_source: metadata?.signup_source || 'web'
      }
    }
  });
  // ... rest of code
}
```

**Polling for Profile Creation:**

```typescript
const waitForProfile = async (userId: string, maxAttempts = 5) => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 1s, 2s, 3s, 4s, 5s
    
    const { data, error } = await supabase
      .from('app_users')
      .select('id, profile_completed')
      .eq('id', userId)
      .single();
    
    if (data) return data;
  }
  throw new Error('Profile creation timeout');
};
```

### Task 2: Fix Auth.tsx ⏳

**Current Issues:**
- Manual RPC calls for profile creation
- Complex signup logic
- Missing signup_source

**Required Changes:**

```typescript
const handleRegister = async (values: RegisterFormValues) => {
  setLoading(true);
  setAuthError(null);
  
  try {
    // Simple signup - let trigger handle everything
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          first_name: values.firstName || '',
          last_name: values.lastName || '',
          username: values.username || '',
          signup_source: 'web' // or 'mobile' based on platform
        }
      }
    });
    
    if (error) throw error;

    if (data.user) {
      // Check if email confirmation is required
      if (data.user.email_confirmed_at) {
        // Auto-confirmed (OAuth or disabled confirmation)
        toast({
          title: "Welcome to TradeLens!",
          description: "Your account has been created successfully.",
        });
        navigate("/dashboard");
      } else {
        // Email confirmation required
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link. Please check your email.",
        });
        navigate("/auth/confirm-email");
      }
    }
  } catch (error: any) {
    console.error("Signup error:", error);
    setAuthError(error.message);
    toast({
      title: "Registration Error",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

### Task 3: Create Email Confirmation Page ⏳

**New File:** `src/pages/EmailConfirmation.tsx`

```typescript
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if this is a confirmation callback
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  
  if (token && type === "signup") {
    // Supabase handles this automatically, just redirect
    navigate("/dashboard");
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem("pending_confirmation_email");
      if (!email) {
        toast({
          title: "Error",
          description: "No pending confirmation found",
          variant: "destructive",
        });
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
        description: "Check your inbox for the confirmation link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent you a confirmation link. Click the link in the email to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Didn't receive the email?
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
  );
};

export default EmailConfirmation;
```

### Task 4: Create Onboarding Flow ⏳

**New File:** `src/pages/Onboarding.tsx`

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const totalSteps = 3;
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
        description: "You're all set up and ready to start trading.",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <CardTitle>Welcome to TradeLens</CardTitle>
            <CardDescription>
              Let's get you set up in just a few steps
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 1: Welcome</h3>
              <p>TradeLens helps you track, analyze, and improve your trading performance.</p>
              <Button onClick={() => setStep(2)} className="w-full">
                Continue
              </Button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 2: Your Trial</h3>
              <p>You have 7 days of free access to all features. No credit card required.</p>
              <Button onClick={() => setStep(3)} className="w-full">
                Continue
              </Button>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 3: Ready to Start</h3>
              <p>You're all set! Start by adding your first trading account.</p>
              <Button onClick={handleComplete} disabled={loading} className="w-full">
                {loading ? "Setting up..." : "Go to Dashboard"}
              </Button>
            </div>
          )}
          
          <Button onClick={handleSkip} variant="ghost" className="w-full mt-4">
            Skip for now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
```

### Task 5: Create Trial Banner Component ⏳

**New File:** `src/components/TrialBanner.tsx`

```typescript
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const TrialBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const navigate = useNavigate();
  const { user, subscriptionPlan } = useAuth();

  useEffect(() => {
    const calculateDaysLeft = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('app_users')
        .select('trial_end_date, subscription_status')
        .eq('id', user.id)
        .single();
      
      if (data && data.subscription_status === 'trialing') {
        const trialEnd = new Date(data.trial_end_date);
        const now = new Date();
        const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysLeft(Math.max(0, diff));
      }
    };

    calculateDaysLeft();
  }, [user]);

  if (dismissed || subscriptionPlan !== 'Free Trial' || daysLeft === 0) {
    return null;
  }

  return (
    <Alert className="relative border-primary/50 bg-primary/5">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your free trial.
          <Button
            variant="link"
            className="px-2 text-primary"
            onClick={() => navigate("/settings/subscription")}
          >
            Upgrade now
          </Button>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
```

## 🔄 Complete Authentication Flows

### 1. Email/Password Signup

```
User fills form → 
Frontend calls supabase.auth.signUp() with metadata →
Supabase creates auth.users record →
Database trigger fires →
  Creates app_users →
  Creates trader_profiles →
  Creates user_settings →
  Creates trial subscription →
Supabase sends confirmation email →
User clicks link →
Email confirmed →
Redirect to onboarding →
Complete onboarding →
Redirect to dashboard
```

### 2. Google OAuth Signup

```
User clicks "Sign in with Google" →
Redirect to Google →
User authorizes →
Google redirects back →
Supabase creates auth.users (email already confirmed) →
Database trigger fires (same as above) →
Redirect to onboarding →
Complete onboarding →
Redirect to dashboard
```

### 3. Sign In

```
User enters credentials →
Frontend calls supabase.auth.signInWithPassword() →
Supabase validates →
Session created →
Frontend fetches user profile from app_users →
Redirect to dashboard (or onboarding if not completed)
```

### 4. Password Reset

```
User clicks "Forgot password" →
Enters email →
Frontend calls supabase.auth.resetPasswordForEmail() →
Supabase sends reset email →
User clicks link →
Redirect to reset password page →
User enters new password →
Frontend calls supabase.auth.updateUser() →
Password updated →
Redirect to login
```

## 🧪 Testing Checklist

### Manual Testing
- [ ] Sign up with email/password
- [ ] Receive confirmation email
- [ ] Click confirmation link
- [ ] Complete onboarding
- [ ] Sign out and sign in
- [ ] Sign up with Google
- [ ] Request password reset
- [ ] Reset password
- [ ] Check trial banner shows
- [ ] Check profile created automatically
- [ ] Check subscription created
- [ ] Check settings created

### Automated Testing
- [ ] Unit tests for username generation
- [ ] Unit tests for affiliate code generation
- [ ] Integration test for signup flow
- [ ] Integration test for trigger
- [ ] E2E test for complete flow

## 📊 Success Metrics

- ✅ Signup completes in < 3 seconds
- ✅ Profile creation success rate > 99%
- ✅ Email confirmation rate > 80%
- ✅ Onboarding completion rate > 60%
- ✅ Trial activation rate = 100%
- ✅ Error rate < 1%

## 🚀 Deployment Steps

1. ✅ Update database trigger (DONE)
2. ⏳ Update AuthContext.tsx
3. ⏳ Update Auth.tsx
4. ⏳ Create EmailConfirmation.tsx
5. ⏳ Create Onboarding.tsx
6. ⏳ Create TrialBanner.tsx
7. ⏳ Add routes to App.tsx
8. ⏳ Test locally
9. ⏳ Deploy migrations
10. ⏳ Deploy frontend
11. ⏳ Monitor errors
12. ⏳ Create edge functions for trial reminders

---

**Status**: Database Complete, Frontend Ready for Implementation
**Last Updated**: November 23, 2024
**Estimated Time Remaining**: 3-4 hours
