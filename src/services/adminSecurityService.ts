
import { supabase } from "@/integrations/supabase/client";

export interface RoleChangeRequest {
  targetUserId: string;
  newRole: 'User' | 'Admin' | 'Manager';
  reason?: string;
}

export interface RoleAuditLog {
  id: string;
  user_id: string;
  old_role: string | null;
  new_role: string;
  changed_by: string;
  changed_at: string;
  reason: string | null;
  ip_address: string | null;
}

/**
 * Secure service for admin role management operations
 */
export class AdminSecurityService {
  /**
   * Securely update a user's role using the database function
   */
  static async updateUserRole(request: RoleChangeRequest) {
    console.log('Attempting to update user role:', request);
    
    const { data, error } = await supabase.rpc('update_user_role', {
      target_user_id: request.targetUserId,
      new_role: request.newRole,
      reason: request.reason || null
    });

    if (error) {
      console.error('Error updating user role:', error);
      throw new Error(error.message || 'Failed to update user role');
    }

    if (!data?.success) {
      throw new Error(data?.message || 'Role update failed');
    }

    return data;
  }

  /**
   * Get role change audit logs (admin only)
   */
  static async getRoleAuditLogs(): Promise<RoleAuditLog[]> {
    const { data, error } = await supabase
      .from('user_role_audit')
      .select(`
        id,
        user_id,
        old_role,
        new_role,
        changed_by,
        changed_at,
        reason,
        ip_address
      `)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching role audit logs:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Validate if current user can perform admin operations
   */
  static async validateAdminAccess(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('app_users')
        .select('user_role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error validating admin access:', error);
        return false;
      }

      return data?.user_role === 'Admin';
    } catch (error) {
      console.error('Error in admin access validation:', error);
      return false;
    }
  }
}
