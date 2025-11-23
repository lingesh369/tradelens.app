
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onUpgrade?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen,
  onClose,
  featureName,
  onUpgrade
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/subscription');
    }
    onClose();
  };

  const getFeatureDisplayName = (feature?: string) => {
    if (!feature) return "this feature";
    
    switch(feature) {
      case "notes_access": return "Notes feature";
      case "analytics_full": return "Advanced Analytics";
      case "trading_accounts": return "more than 1 trading account";
      case "strategies": return "more than 3 strategies";
      case "Trial Expired": return "full platform access";
      case "Access Full Features": return "all premium features";
      default: return feature;
    }
  };

  const featureDisplayName = getFeatureDisplayName(featureName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Upgrade Your Plan</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {featureName === "Trial Expired" ? (
              "Your free trial has expired. Upgrade to a paid plan to continue."
            ) : featureName === "Access Full Features" ? (
              "Unlock all premium features by upgrading your plan"
            ) : (
              <>
                Access to <span className="font-medium">{featureDisplayName}</span> requires a Pro plan
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-center text-sm">
              Upgrade to the Pro Plan to unlock all features including:
            </p>
            <ul className="text-sm space-y-1 mx-auto max-w-xs">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Unlimited Trading Accounts</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Unlimited Trading Strategies</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Full Analytics Dashboard</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Notes & Journal Features</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:gap-0">
          <Button 
            onClick={handleUpgrade} 
            className="w-full"
          >
            Upgrade Now
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
