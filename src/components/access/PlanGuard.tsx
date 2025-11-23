
import React, { useState } from 'react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { AccessBlockedModal } from './AccessBlockedModal';
import { Lock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface PlanGuardProps {
  children: React.ReactNode;
  feature: 'notes';
  fallback?: React.ReactNode;
}

export const PlanGuard: React.FC<PlanGuardProps> = ({
  children,
  feature,
  fallback
}) => {
  const { access, isLoading } = usePlanAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Checking access permissions...</span>
      </div>
    );
  }

  if (!access || !access[feature]) {
    const defaultFallback = (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-muted">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Feature Not Available</h3>
        <p className="text-muted-foreground mb-4">
          This feature is not included in your current plan ({access?.planName || 'Unknown'}).
        </p>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Upgrade Plan
        </button>
        
        <AccessBlockedModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={feature}
          currentPlan={access?.planName || 'Unknown'}
        />
      </div>
    );

    return fallback || defaultFallback;
  }

  return <>{children}</>;
};
