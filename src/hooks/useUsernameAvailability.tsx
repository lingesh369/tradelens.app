import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UsernameCheckResult {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
  isValid: boolean;
}

export const useUsernameAvailability = (username: string, currentUsername?: string) => {
  const [result, setResult] = useState<UsernameCheckResult>({
    isChecking: false,
    isAvailable: null,
    message: '',
    isValid: false,
  });

  useEffect(() => {
    // Reset state if username is empty
    if (!username || username.length < 3) {
      setResult({
        isChecking: false,
        isAvailable: null,
        message: '',
        isValid: false,
      });
      return;
    }

    // Validate username format
    const isValidFormat = /^[a-zA-Z0-9_]+$/.test(username);
    if (!isValidFormat) {
      setResult({
        isChecking: false,
        isAvailable: false,
        message: 'Username can only contain letters, numbers, and underscores',
        isValid: false,
      });
      return;
    }

    if (username.length > 20) {
      setResult({
        isChecking: false,
        isAvailable: false,
        message: 'Username must be at most 20 characters',
        isValid: false,
      });
      return;
    }

    // If this is the current username, don't check availability
    if (currentUsername && username === currentUsername) {
      setResult({
        isChecking: false,
        isAvailable: true,
        message: 'Current username',
        isValid: true,
      });
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      setResult(prev => ({ ...prev, isChecking: true }));
      
      try {
        // Check if username already exists
        const { data, error } = await supabase
          .from('app_users')
          .select('username')
          .ilike('username', username)
          .limit(1);

        if (error) {
          console.error('Error checking username availability:', error);
          setResult({
            isChecking: false,
            isAvailable: null,
            message: 'Error checking availability',
            isValid: false,
          });
          return;
        }

        const isAvailable = !data || data.length === 0;
        setResult({
          isChecking: false,
          isAvailable,
          message: isAvailable ? 'Username available' : 'Username already taken',
          isValid: isAvailable,
        });
      } catch (error) {
        console.error('Unexpected error checking username:', error);
        setResult({
          isChecking: false,
          isAvailable: null,
          message: 'Error checking availability',
          isValid: false,
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [username, currentUsername]);

  return result;
};