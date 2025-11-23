
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMemo } from 'react';

export function useAdminMediaQuery() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return useMemo(() => ({
    isMobile,
    isTablet,
    isDesktop,
    useCollapsibleBehavior: isMobile || isTablet
  }), [isMobile, isTablet, isDesktop]);
}
