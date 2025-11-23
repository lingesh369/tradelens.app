
import { Database } from "@/integrations/supabase/types";

export type Coupon = Database['public']['Tables']['coupons']['Row'];

export interface CouponMetrics {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  usedCoupons: number;
}
