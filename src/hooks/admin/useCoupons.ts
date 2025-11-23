
import { useQuery } from '@tanstack/react-query';
import { fetchCoupons } from '@/lib/admin-utils';

export const useCoupons = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['coupons'],
    queryFn: fetchCoupons,
  });

  return {
    coupons: data?.data || [],
    isLoading,
    error: error || data?.error,
    refetch,
  };
};
