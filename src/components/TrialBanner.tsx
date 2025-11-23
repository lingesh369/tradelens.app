import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const TrialBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    // Check if banner was dismissed in this session
    return sessionStorage.getItem("trial_banner_dismissed") === "true";
  });
  const navigate = useNavigate();
  const { trialActive, daysLeftInTrial } = useAuth();

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("trial_banner_dismissed", "true");
  };

  // Don't show if dismissed, not on trial, or no days left
  if (dismissed || !trialActive || daysLeftInTrial === 0) {
    return null;
  }

  // Determine urgency level
  const isUrgent = daysLeftInTrial <= 2;
  const isWarning = daysLeftInTrial <= 5;

  return (
    <Alert 
      className={`relative border ${
        isUrgent 
          ? 'border-destructive/50 bg-destructive/5' 
          : isWarning 
            ? 'border-yellow-500/50 bg-yellow-500/5'
            : 'border-primary/50 bg-primary/5'
      }`}
    >
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <Clock className="h-4 w-4 text-destructive" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary" />
        )}
        <AlertDescription className="flex items-center justify-between flex-1">
          <span className="text-sm">
            {isUrgent ? (
              <>
                <strong className="font-semibold">Trial ending soon!</strong> Only {daysLeftInTrial} {daysLeftInTrial === 1 ? 'day' : 'days'} left.
              </>
            ) : (
              <>
                <strong className="font-semibold">{daysLeftInTrial} {daysLeftInTrial === 1 ? 'day' : 'days'}</strong> left in your free trial.
              </>
            )}
            <Button
              variant="link"
              className="px-2 h-auto text-primary font-semibold"
              onClick={() => navigate("/settings/subscription")}
            >
              Upgrade now →
            </Button>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </AlertDescription>
      </div>
    </Alert>
  );
};
