
import { supabase } from "@/integrations/supabase/client";

// Function to safely get the current user's profile data
export const getUserProfile = async (userId: string) => {
  try {
    // Query the app_users table - userId is the same as app_users.id
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Error fetching user profile:", error);
      return { error, data: null };
    }
    
    return { data, error: null };
  } catch (e) {
    console.error("Unexpected error fetching user profile:", e);
    return { error: e, data: null };
  }
};

// Function to safely update the current user's profile data
export const updateUserProfile = async (
  userId: string, 
  updates: { 
    first_name?: string; 
    last_name?: string; 
    username?: string;
  }
) => {
  try {
    console.log("Updating profile for user:", userId, "with data:", updates);
    
    // Map client-side field names to database column names
    const dbUpdates: any = {};
    if (updates.first_name !== undefined) dbUpdates.first_name = updates.first_name;
    if (updates.last_name !== undefined) dbUpdates.last_name = updates.last_name;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    
    const { data, error } = await supabase
      .from('app_users')
      .update(dbUpdates)
      .eq('id', userId)
      .select();
      
    if (error) {
      console.error("Error updating user profile:", error);
      return { error, success: false, data: null };
    }
    
    return { error: null, success: true, data };
  } catch (e) {
    console.error("Unexpected error updating user profile:", e);
    return { error: e, success: false, data: null };
  }
};
