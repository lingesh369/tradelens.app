
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { openUpgradePage } from '@/lib/subscription-utils';

interface ExpiredPlanDialogProps {
  isOpen: boolean;
  planName: string;
}

export const ExpiredPlanDialog: React.FC<ExpiredPlanDialogProps> = ({ isOpen, planName }) => {
  const handleUpgrade = () => {
    openUpgradePage();
  };

  return (
    <Dialog open={isOpen} modal>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative z-10">
          <DialogHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              🚫 Your plan has expired
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-6">
              Your {planName} plan has expired. To continue using the platform, please upgrade to one of our plans.
            </p>
            
            <Button 
              onClick={handleUpgrade}
              className="w-full"
              size="lg"
            >
              See Plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
