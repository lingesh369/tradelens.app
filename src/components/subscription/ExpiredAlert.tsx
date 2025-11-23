
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExpiredAlertProps {
  onUpgrade?: () => void;
}

export function ExpiredAlert({ onUpgrade }: ExpiredAlertProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/subscription');
    }
  };

  return (
    <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <AlertTitle>Your Plan Has Expired</AlertTitle>
          <AlertDescription className="mt-1">
            <p className="mb-2">Your subscription has expired. Upgrade to a paid plan to continue using TradeLens features.</p>
            <Button 
              size="sm" 
              onClick={handleUpgrade}
              className="mt-1"
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
