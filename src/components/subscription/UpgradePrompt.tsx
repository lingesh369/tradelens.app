
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  fullPage?: boolean;
  title?: string;
  reason?: string;
  actionText?: string;
  onUpgrade?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  fullPage = false,
  title = 'Upgrade Your Plan',
  reason = 'Access to this feature requires a premium subscription.',
  actionText = 'Upgrade Now',
  onUpgrade
}) => {
  const navigate = useNavigate();
  
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/subscription');
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  if (fullPage) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              {reason}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={handleUpgrade}>
              {actionText}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoBack}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {reason}
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleUpgrade}>
          {actionText}
        </Button>
      </CardFooter>
    </Card>
  );
};
