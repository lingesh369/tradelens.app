// User-friendly error messages for authentication and validation

export interface UserFriendlyError {
  title: string;
  description: string;
}

/**
 * Converts technical error messages to user-friendly ones
 */
export function getUserFriendlyError(error: any): UserFriendlyError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || '';

  // Authentication errors
  if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
    return {
      title: 'Account Already Exists',
      description: 'An account with this email already exists. Please sign in instead or use a different email.',
    };
  }

  if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid email or password')) {
    return {
      title: 'Incorrect Email or Password',
      description: 'Please check your email and password and try again.',
    };
  }

  if (errorMessage.includes('Email not confirmed')) {
    return {
      title: 'Email Not Verified',
      description: 'Please verify your email address before signing in. Check your inbox for the verification code.',
    };
  }

  if (errorMessage.includes('Password should be at least')) {
    return {
      title: 'Password Too Short',
      description: 'Your password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters.',
    };
  }

  if (errorMessage.includes('User not found')) {
    return {
      title: 'Account Not Found',
      description: 'No account exists with this email. Please sign up first.',
    };
  }

  if (errorMessage.includes('Invalid email')) {
    return {
      title: 'Invalid Email Address',
      description: 'Please enter a valid email address.',
    };
  }

  // Database/validation errors
  if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
    if (errorMessage.includes('username')) {
      return {
        title: 'Username Already Taken',
        description: 'This username is already in use. Please choose a different username.',
      };
    }
    if (errorMessage.includes('email')) {
      return {
        title: 'Email Already Registered',
        description: 'This email is already registered. Please sign in or use a different email.',
      };
    }
    return {
      title: 'Duplicate Entry',
      description: 'This information is already in use. Please try different values.',
    };
  }

  if (errorMessage.includes('violates check constraint') || errorMessage.includes('invalid input')) {
    return {
      title: 'Invalid Information',
      description: 'Please check your information and make sure all fields are filled correctly.',
    };
  }

  if (errorMessage.includes('violates foreign key constraint')) {
    return {
      title: 'Invalid Selection',
      description: 'Please select a valid option from the dropdown.',
    };
  }

  if (errorMessage.includes('violates not-null constraint')) {
    return {
      title: 'Missing Required Field',
      description: 'Please fill in all required fields.',
    };
  }

  // Network errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
    return {
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
    };
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      title: 'Request Timeout',
      description: 'The request took too long. Please try again.',
    };
  }

  // Rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      title: 'Too Many Attempts',
      description: 'You\'ve made too many requests. Please wait a few minutes and try again.',
    };
  }

  // Account lockout
  if (errorMessage.includes('account locked') || errorMessage.includes('Account locked')) {
    return {
      title: 'Account Temporarily Locked',
      description: 'Your account has been locked due to multiple failed login attempts. Please try again in 30 minutes.',
    };
  }

  // Session/token errors
  if (errorMessage.includes('JWT') || errorMessage.includes('token') || errorMessage.includes('session')) {
    return {
      title: 'Session Expired',
      description: 'Your session has expired. Please sign in again.',
    };
  }

  // Permission errors
  if (errorMessage.includes('permission denied') || errorMessage.includes('not authorized')) {
    return {
      title: 'Access Denied',
      description: 'You don\'t have permission to perform this action.',
    };
  }

  // Validation errors (Zod)
  if (errorMessage.includes('Validation failed') || errorMessage.includes('validation error')) {
    return {
      title: 'Invalid Input',
      description: 'Please check your information and make sure all fields are filled correctly.',
    };
  }

  // Password strength errors
  if (errorMessage.includes('uppercase') || errorMessage.includes('lowercase') || 
      errorMessage.includes('special character') || errorMessage.includes('number')) {
    return {
      title: 'Weak Password',
      description: 'Your password must include uppercase letters, lowercase letters, numbers, and special characters.',
    };
  }

  // Username errors
  if (errorMessage.includes('Username')) {
    if (errorMessage.includes('too short') || errorMessage.includes('at least')) {
      return {
        title: 'Username Too Short',
        description: 'Your username must be at least 3 characters long.',
      };
    }
    if (errorMessage.includes('too long') || errorMessage.includes('at most')) {
      return {
        title: 'Username Too Long',
        description: 'Your username must be no more than 20 characters long.',
      };
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('only contain')) {
      return {
        title: 'Invalid Username',
        description: 'Username can only contain letters, numbers, and underscores.',
      };
    }
  }

  // Email verification errors
  if (errorMessage.includes('No email found for verification')) {
    return {
      title: 'Verification Error',
      description: 'We couldn\'t find your verification request. Please try signing up again.',
    };
  }

  if (errorMessage.includes('verification code') || errorMessage.includes('OTP')) {
    if (errorMessage.includes('expired')) {
      return {
        title: 'Code Expired',
        description: 'Your verification code has expired. Please request a new one.',
      };
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('incorrect')) {
      return {
        title: 'Invalid Code',
        description: 'The verification code you entered is incorrect. Please try again.',
      };
    }
  }

  // Generic database error
  if (errorMessage.includes('database') || errorMessage.includes('PostgreSQL') || errorMessage.includes('relation')) {
    return {
      title: 'Something Went Wrong',
      description: 'We encountered an issue while processing your request. Please try again or contact support if the problem persists.',
    };
  }

  // Default fallback
  return {
    title: 'Oops! Something Went Wrong',
    description: 'We encountered an unexpected error. Please try again or contact support if the problem continues.',
  };
}

/**
 * Validates form fields and returns user-friendly error messages
 */
export function getValidationError(field: string, value: any): string | null {
  switch (field) {
    case 'email':
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;

    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 12) {
        return 'Password must be at least 12 characters';
      }
      if (!/[A-Z]/.test(value)) {
        return 'Password must include at least one uppercase letter';
      }
      if (!/[a-z]/.test(value)) {
        return 'Password must include at least one lowercase letter';
      }
      if (!/[0-9]/.test(value)) {
        return 'Password must include at least one number';
      }
      if (!/[^A-Za-z0-9]/.test(value)) {
        return 'Password must include at least one special character';
      }
      return null;

    case 'username':
      if (!value) return 'Username is required';
      if (value.length < 3) {
        return 'Username must be at least 3 characters';
      }
      if (value.length > 20) {
        return 'Username must be no more than 20 characters';
      }
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username can only contain letters, numbers, and underscores';
      }
      return null;

    default:
      return null;
  }
}
