import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { getUpgradeMessage } from '@/lib/access-control';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: string;
  variant?: 'card' | 'inline' | 'banner';
}

export function UpgradePrompt({ feature, requiredPlan, variant = 'card' }: UpgradePromptProps) {
  const navigate = useNavigate();
  const message = getUpgradeMessage(feature, requiredPlan);

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>{message}</span>
        <Button size="sm" variant="link" onClick={() => navigate('/pricing')} className="h-auto p-0">
          Upgrade
        </Button>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium">{message}</p>
              <p className="text-sm text-muted-foreground">Unlock more features and grow your trading</p>
            </div>
          </div>
          <Button onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-purple-500 to-blue-500">
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Premium Feature</CardTitle>
        </div>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => navigate('/pricing')} className="w-full">
          Upgrade to {requiredPlan}
        </Button>
      </CardContent>
    </Card>
  );
}
