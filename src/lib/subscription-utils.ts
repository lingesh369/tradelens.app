
import { supabase } from "@/integrations/supabase/client";

export const openUpgradePage = () => {
  // Navigate to internal subscription page instead of external link
  window.location.href = '/subscription';
};

export const checkFeatureAccess = async (userId: string, featureKey: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('get_user_access_matrix', {
      auth_user_id: userId
    });
    
    if (error) {
      console.error(`Error checking access to ${featureKey}:`, error);
      return false;
    }
    
    if (data && Array.isArray(data) && data.length > 0) {
      const accessData = data[0] as any;
      
      switch (featureKey) {
        case 'notes':
          return accessData.notesAccess || false;

        case 'profile':
          return accessData.profileAccess || false;
        default:
          return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking access to ${featureKey}:`, error);
    return false;
  }
};

export const changeUserPlan = async (userId: string, planId: string): Promise<{success: boolean, message: string}> => {
  try {
    // This function would need to be implemented based on your business logic
    // For now, returning success false as a placeholder
    console.log(`Changing user ${userId} to plan ${planId}`);
    return {
      success: false,
      message: "Plan change functionality not yet implemented"
    };
  } catch (error) {
    console.error('Error changing user plan:', error);
    return {
      success: false,
      message: "Failed to change user plan"
    };
  }
};
