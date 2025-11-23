
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { AdminSecurityService } from '@/services/adminSecurityService';

export interface AccessControl {
  isAdmin: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canModifyRoles: boolean;
}

export const useAccessControl = () => {
  const { user, isAdmin } = useAuth();

  const fetchAccessControl = async (): Promise<AccessControl> => {
    if (!user) {
      return {
        isAdmin: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canModifyRoles: false,
      };
    }

    try {
      const isAdminUser = await AdminSecurityService.validateAdminAccess();
      
      return {
        isAdmin: isAdminUser,
        canManageUsers: isAdminUser,
        canViewAuditLogs: isAdminUser,
        canModifyRoles: isAdminUser,
      };
    } catch (error) {
      console.error('Error fetching access control:', error);
      return {
        isAdmin: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canModifyRoles: false,
      };
    }
  };

  const { data: access, isLoading, refetch } = useQuery({
    queryKey: ['access-control', user?.id],
    queryFn: fetchAccessControl,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return { 
    access: access || {
      isAdmin: false,
      canManageUsers: false,
      canViewAuditLogs: false,
      canModifyRoles: false,
    }, 
    isLoading, 
    refetch 
  };
};
