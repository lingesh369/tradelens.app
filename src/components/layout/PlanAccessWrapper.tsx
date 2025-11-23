
import React, { useEffect } from 'react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { ExpiredAccessModal } from '@/components/access/ExpiredAccessModal';
import { Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface PlanAccessWrapperProps {
  children: React.ReactNode;
}

export const PlanAccessWrapper: React.FC<PlanAccessWrapperProps> = ({ children }) => {
  const { access, isLoading } = usePlanAccess();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading access permissions...</span>
      </div>
    );
  }

  // Check if current route is allowed for expired users
  const allowedRoutesForExpiredUsers = ['/profile', '/subscription', '/checkout', '/payment', '/community', '/shared', '/traders'];
  const isAllowedRoute = allowedRoutesForExpiredUsers.some(route => 
    location.pathname.startsWith(route)
  );

  // Show expired modal if access is blocked (non-dismissible) and not on allowed routes
  // Check if access is blocked based on accessBlocked flag directly
  const showExpiredModal = access?.accessBlocked && 
    access?.planName !== 'Not Logged In' && 
    !isAllowedRoute;
    
  // We no longer redirect expired users automatically
  // Instead, we show the expired modal and let them navigate manually
  // This preserves the previous behavior where users saw the restriction modal

  return (
    <>
      {children}
      {showExpiredModal && (
        <ExpiredAccessModal
          isOpen={true}
          planName={access.planName}
        />
      )}
    </>
  );
};
