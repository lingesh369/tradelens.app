
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { checkFeatureAccess, openUpgradePage } from '@/lib/subscription-utils';
import { Button } from '@/components/ui/button';

interface RestrictedPageGuardProps {
  title?: string;
  description?: string;
  featureName: string;
  featureKey: string;
  onUpgrade?: () => void;
}

export const RestrictedPageGuard: React.FC<RestrictedPageGuardProps> = ({
  title,
  description,
  featureName,
  featureKey,
  onUpgrade
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  
  useEffect(() => {
    async function checkAccess() {
      if (user) {
        setIsChecking(true);
        const access = await checkFeatureAccess(user.id, featureKey);
        setHasAccess(access);
        setIsChecking(false);
      } else {
        setHasAccess(false);
        setIsChecking(false);
      }
    }
    
    checkAccess();
  }, [user, featureKey]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      openUpgradePage();
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  if (isChecking) {
    return (
      <div className="container max-w-md py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Checking access...</h2>
        </div>
      </div>
    );
  }
  
  if (hasAccess) {
    // If user has access, they shouldn't be here
    navigate(-1);
    return null;
  }

  return (
    <div className="container max-w-md py-12">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{title || `${featureName} Restricted`}</h2>
        <p className="text-muted-foreground mb-6">
          {description || `Access to ${featureName} is not available on your current plan.`}
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={handleUpgrade}>Upgrade Plan</Button>
          <Button variant="outline" onClick={handleGoBack}>Go Back</Button>
        </div>
      </div>
    </div>
  );
};
