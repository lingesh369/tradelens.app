
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { openUpgradePage } from '@/lib/subscription-utils';

export function ExpiredTrialAlert() {
  return (
    <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <AlertTitle>Your Trial Has Expired</AlertTitle>
          <AlertDescription className="mt-1">
            <p className="mb-2">Your free trial period has ended. Upgrade to a paid plan to continue using all TradeLens features.</p>
            <Button 
              size="sm" 
              onClick={openUpgradePage}
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
