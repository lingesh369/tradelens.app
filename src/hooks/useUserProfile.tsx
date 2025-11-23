
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface UserProfile {
  user_id: string; // Primary key from app_users table
  auth_id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  user_role: string;
  user_status: string;
  created_at?: string;
  updated_at?: string;
}

export function useUserProfile() {
  const { user } = useAuth();

  const fetchProfile = async (): Promise<UserProfile | null> => {
    if (!user) {
      console.log('No authenticated user found for profile');
      return null;
    }

    console.log('Fetching profile for user:', user.id);

    try {
      // Direct query to app_users table using auth_id
      const { data: profileData, error: profileError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profileData) {
        // No profile found - the database trigger should have created it
        // Wait a moment and try again as the trigger might still be processing
        console.log('No profile found, waiting for database trigger to complete...');
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        // Try fetching again
        const { data: retryProfileData, error: retryError } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (retryError) {
          console.error('Error on retry fetch:', retryError);
          throw retryError;
        }

        if (retryProfileData) {
          console.log('Profile found on retry:', retryProfileData);
          return retryProfileData;
        }

        // If still no profile, the trigger might have failed
        console.error('Profile still not found after retry - database trigger may have failed');
        throw new Error('User profile not created by database trigger');
      }

      console.log('Profile fetched successfully:', profileData);
      // Return profile with consistent user_id field
      return profileData;
    } catch (error) {
      console.error('Failed to fetch or create profile:', error);
      throw error;
    }
  };

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: fetchProfile,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on infinite recursion errors
      if (error?.code === '42P17') {
        return false;
      }
      // Don't retry on authentication errors
      if (error?.message?.includes('refresh_token_not_found') || 
          error?.message?.includes('Invalid Refresh Token') ||
          error?.message?.includes('JWT expired')) {
        console.log('Authentication error detected, not retrying profile fetch');
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    profile: profileQuery.data || null,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
  };
}
