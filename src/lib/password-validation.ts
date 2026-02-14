// Password validation utilities

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    feedback.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  } else {
    score++;
    if (password.length >= 16) score++; // Bonus for longer passwords
  }

  // Check uppercase
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  // Check lowercase
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score++;
  }

  // Check numbers
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score++;
  }

  // Check special characters
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Password must contain at least one special character (!@#$%^&*)');
  } else {
    score++;
  }

  // Check for common patterns
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /welcome/i,
    /admin/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    feedback.push('Password contains common patterns. Please choose a more unique password');
    score = Math.max(0, score - 2);
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score = Math.max(0, score - 1);
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    feedback.push('Avoid sequential characters');
    score = Math.max(0, score - 1);
  }

  const isValid = feedback.length === 0 && score >= 4;

  return {
    score: Math.min(4, score),
    feedback,
    isValid,
  };
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-500';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}
