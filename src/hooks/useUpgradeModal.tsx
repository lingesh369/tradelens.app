
import { useState, useCallback } from "react";
import { openUpgradePage } from "@/lib/subscription-utils";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";

export const useUpgradeModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [featureName, setFeatureName] = useState<string | undefined>(undefined);
  
  const showUpgradeModal = useCallback((feature?: string) => {
    setFeatureName(feature);
    setIsVisible(true);
  }, []);
  
  const hideUpgradeModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleUpgradeClick = useCallback(() => {
    openUpgradePage();
    hideUpgradeModal();
  }, [hideUpgradeModal]);
  
  const upgradeModalProps = {
    isOpen: isVisible,
    onClose: hideUpgradeModal,
    featureName,
    onUpgrade: handleUpgradeClick
  };
  
  // Return both the modal props and the actual component
  return {
    showUpgradeModal,
    hideUpgradeModal,
    upgradeModalProps,
    UpgradeModalComponent: () => (
      <UpgradeModal 
        isOpen={isVisible} 
        onClose={hideUpgradeModal} 
        featureName={featureName} 
        onUpgrade={handleUpgradeClick}
      />
    )
  };
};
