
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Tag, X, Loader2 } from 'lucide-react';

interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

interface CouponDiscount {
  amount: number;
  type: 'percentage' | 'fixed';
  value: number;
}

interface CouponInputProps {
  onApplyCoupon: (couponCode: string) => Promise<void>;
  onRemoveCoupon: () => void;
  appliedCoupon: AppliedCoupon | null;
  couponDiscount: CouponDiscount | null;
  isValidating: boolean;
  originalAmount: number;
  finalAmount: number | null;
  currency: string;
}

export const CouponInput = ({
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
  couponDiscount,
  isValidating,
  originalAmount,
  finalAmount,
  currency
}: CouponInputProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleApplyCoupon = async () => {
    if (couponCode.trim()) {
      await onApplyCoupon(couponCode.trim());
      setCouponCode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setCouponCode('');
  };

  return (
    <Card className="border-dashed border-primary/20">
      <CardContent className="p-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-normal text-left"
              type="button"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span className="text-foreground">Have a coupon code?</span>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  disabled={isValidating}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || isValidating}
                  size="default"
                  type="button"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-300">
                      {appliedCoupon.code}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {appliedCoupon.name}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-green-700 hover:text-green-800 dark:text-green-300"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
