
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { openUpgradePage } from '@/lib/subscription-utils';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ isOpen, onClose }) => {
  const plans = [
    {
      name: 'Starter',
      monthlyPrice: '$9',
      yearlyPrice: '$90',
      features: {
        notes: false,
        analytics: 'overview', // Only overview tab
        accounts: 1,
        strategies: 3,
        gennie: false
      }
    },
    {
      name: 'Pro',
      monthlyPrice: '$19',
      yearlyPrice: '$190',
      features: {
        notes: true,
        analytics: 'full', // All analytics tabs
        accounts: 5,
        strategies: 10,
        gennie: true
      },
      popular: true
    }
  ];

  const handleSelectPlan = () => {
    openUpgradePage();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.monthlyPrice}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  or {plan.yearlyPrice}/year (save 17%)
                </p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    {plan.features.notes ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={plan.features.notes ? '' : 'text-muted-foreground line-through'}>
                      Notes & Journal
                    </span>
                  </li>
                  
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.features.analytics === 'full' ? 'Full Analytics Dashboard' : 'Analytics Overview'}
                    </span>
                  </li>
                  
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.features.accounts} Trading Account{plan.features.accounts > 1 ? 's' : ''}</span>
                  </li>
                  
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.features.strategies} Strategies</span>
                  </li>
                  
                  <li className="flex items-center gap-2">
                    {plan.features.gennie ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={plan.features.gennie ? '' : 'text-muted-foreground line-through'}>
                      Gennie AI Assistant
                    </span>
                  </li>
                </ul>
                
                <Button 
                  onClick={handleSelectPlan}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Select {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
