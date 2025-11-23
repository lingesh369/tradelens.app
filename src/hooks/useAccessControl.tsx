
import { usePlanAccess } from './usePlanAccess';

export interface AccessMatrix {
  notes: boolean;
  accountsLimit: number;
  strategiesLimit: number;
  gennie: boolean;
  profile: boolean;
  accessBlocked: boolean;
  isAdmin: boolean;
  planName: string;
}

export const useAccessControl = () => {
  const { access, isLoading, refetch } = usePlanAccess();

  // Transform the plan access to match the old AccessMatrix interface
  const transformedAccess: AccessMatrix | null = access ? {
    notes: access.notes,
    accountsLimit: access.accountsLimit,
    strategiesLimit: access.strategiesLimit,
    gennie: access.gennie,
    profile: access.profile,
    accessBlocked: access.accessBlocked,
    isAdmin: false, // No admin access in plan-based system
    planName: access.planName
  } : null;

  return { 
    access: transformedAccess, 
    isLoading, 
    refetch 
  };
};
