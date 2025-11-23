
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface CouponData {
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

interface CouponValidationResult {
  valid: boolean;
  coupon?: CouponData;
  discount?: CouponDiscount;
  finalAmount?: number;
  error?: string;
}

export const useCoupon = () => {
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<CouponDiscount | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const { toast } = useToast();

  const validateCoupon = async (
    couponCode: string,
    planId: string,
    userId: string,
    amount: number,
    currency: string
  ): Promise<CouponValidationResult> => {
    if (!couponCode.trim()) {
      return { valid: false, error: 'Please enter a coupon code' };
    }

    setIsValidating(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          couponCode: couponCode.toUpperCase(),
          planId,
          userId,
          amount,
          currency
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discount);
        setFinalAmount(result.finalAmount);
        
        toast({
          title: '✅ Coupon Applied!',
          description: `${result.coupon.name} - ${result.discount.type === 'percentage' ? `${result.discount.value}%` : `$${result.discount.value}`} discount applied`,
        });
      } else {
        toast({
          title: '❌ Invalid Coupon',
          description: result.error,
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      console.error('Error validating coupon:', error);
      const errorResult = { valid: false, error: 'Failed to validate coupon. Please try again.' };
      
      toast({
        title: '❌ Validation Error',
        description: errorResult.error,
        variant: 'destructive',
      });
      
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(null);
    setFinalAmount(null);
    
    toast({
      title: 'Coupon Removed',
      description: 'Coupon has been removed from your order',
    });
  };

  const resetCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(null);
    setFinalAmount(null);
    setIsValidating(false);
  };

  return {
    appliedCoupon,
    couponDiscount,
    isValidating,
    finalAmount,
    validateCoupon,
    removeCoupon,
    resetCoupon
  };
};
