
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  feedback: string[];
}

const calculatePasswordStrength = (password: string): StrengthResult => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length === 0) {
    return {
      score: 0,
      label: '',
      color: '',
      feedback: []
    };
  }

  // Length check
  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push('At least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 25;
  } else {
    feedback.push('Include uppercase letters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 25;
  } else {
    feedback.push('Include lowercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 15;
  } else {
    feedback.push('Include numbers');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 10;
  } else {
    feedback.push('Include special characters');
  }

  let label = '';
  let color = '';

  if (score < 50) {
    label = 'Weak';
    color = 'text-red-500';
  } else if (score < 80) {
    label = 'Medium';
    color = 'text-yellow-500';
  } else {
    label = 'Strong';
    color = 'text-green-500';
  }

  return { score, label, color, feedback };
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={cn("text-sm font-medium", strength.color)}>
          {strength.label}
        </span>
      </div>
      
      <Progress 
        value={strength.score} 
        className="h-2"
      />
      
      {strength.feedback.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span>Suggestions: </span>
          {strength.feedback.join(', ')}
        </div>
      )}
    </div>
  );
};
