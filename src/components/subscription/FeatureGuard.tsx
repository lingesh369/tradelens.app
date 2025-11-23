
import React, { useState } from 'react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { AccessBlockedModal } from '@/components/access/AccessBlockedModal';
import { Lock } from 'lucide-react';

interface FeatureGuardProps {
  children: React.ReactNode;
  feature: 'notes';
  fallback?: React.ReactNode;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({
  children,
  feature,
  fallback
}) => {
  const { access } = usePlanAccess();
  const [showModal, setShowModal] = useState(false);
  
  const hasAccess = access?.[feature] || false;
  
  const handleRestricted = () => {
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div 
        className="flex flex-col items-center justify-center p-6 text-center cursor-pointer"
        onClick={handleRestricted}
      >
        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-muted">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">Access Restricted</h3>
        <p className="text-sm text-muted-foreground">
          This feature requires a higher plan
        </p>
      </div>
      
      <AccessBlockedModal
        isOpen={showModal}
        onClose={handleCloseModal}
        feature={feature}
        currentPlan={access?.planName || 'Unknown'}
      />
    </>
  );
};

export default FeatureGuard;
