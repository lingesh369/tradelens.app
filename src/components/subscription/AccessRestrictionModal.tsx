
import React from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, Lock } from "lucide-react";
import { useSubscriptionContext } from "@/context/SubscriptionContext";

interface AccessRestrictionModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  planRequired: string;
  onUpgrade?: () => void;
}

export const AccessRestrictionModal: React.FC<AccessRestrictionModalProps> = ({
  open,
  onClose,
  featureName,
  planRequired,
  onUpgrade
}) => {
  const { showUpgradeModal } = useSubscriptionContext();
  
  const handleUpgrade = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      showUpgradeModal(featureName);
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">Access Restricted</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This feature is available only on the <span className="font-medium">{planRequired} Plan</span>.
            <p className="mt-2">Upgrade now to unlock full analytics insights.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpgrade}>Upgrade Plan</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
