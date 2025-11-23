
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExpiredAccessModalProps {
  isOpen: boolean;
  planName: string;
}

export const ExpiredAccessModal: React.FC<ExpiredAccessModalProps> = ({
  isOpen,
  planName
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Plan Expired</DialogTitle>
          <DialogDescription className="text-center">
            Your {planName} plan has expired. Please upgrade to continue using TradeLens.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <Button onClick={handleUpgrade} className="flex items-center gap-2">
            Upgrade Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
