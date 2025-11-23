
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentPlan: string;
}

export const AccessBlockedModal: React.FC<AccessBlockedModalProps> = ({
  isOpen,
  onClose,
  feature,
  currentPlan
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/subscription');
    onClose();
  };

  const getFeatureDescription = (feature: string) => {
    switch (feature) {
      case 'notes':
        return 'Create and manage trading notes to track your insights and observations.';
      default:
        return 'Access this premium feature.';
    }
  };

  const getRequiredPlan = (feature: string) => {
    switch (feature) {
      case 'notes':
        return 'Pro';
      default:
        return 'Pro';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Upgrade Required</DialogTitle>
          <DialogDescription className="text-center">
            {getFeatureDescription(feature)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">
              <span className="font-medium">Current Plan:</span> {currentPlan}
            </p>
            <p className="text-sm">
              <span className="font-medium">Required Plan:</span> {getRequiredPlan(feature)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade} className="flex items-center gap-2">
            Upgrade Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
