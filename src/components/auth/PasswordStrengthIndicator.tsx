import { validatePassword, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/password-validation';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ password, showRequirements = true }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = validatePassword(password);
  const strengthLabel = getPasswordStrengthLabel(strength.score);
  const strengthColor = getPasswordStrengthColor(strength.score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password Strength:</span>
        <span className={`text-sm font-medium ${strengthColor}`}>{strengthLabel}</span>
      </div>
      
      <Progress value={(strength.score / 4) * 100} className="h-2" />

      {showRequirements && strength.feedback.length > 0 && (
        <div className="space-y-1 mt-3">
          {strength.feedback.map((message, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-500" />
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {strength.isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <span>Password meets all requirements</span>
        </div>
      )}
    </div>
  );
}
