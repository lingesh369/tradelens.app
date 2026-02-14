import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useNavigation } from '@/context/NavigationContext';
import { format } from 'date-fns';

export interface NavigationContext {
  source?: 'journal' | 'strategy' | 'trades';
  contextId?: string;
  date?: string;
  strategyName?: string;
}

export function useEnhancedNavigation() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const { setBreadcrumbs } = useNavigation();

  // Parse current navigation context from URL
  const getCurrentContext = (): NavigationContext => {
    const { source, contextId } = params;
    
    if (source && contextId) {
      return {
        source: source as 'journal' | 'strategy' | 'trades',
        contextId,
        ...(source === 'journal' && { date: contextId }),
        ...(source === 'strategy' && { strategyName: contextId })
      };
    }
    
    return {};
  };

  // Navigate to trade with source context
  const navigateToTrade = (tradeId: string, source?: 'journal' | 'strategy' | 'trades', contextId?: string, additionalData?: any) => {
    if (source && contextId) {
      // Set appropriate breadcrumbs based on source
      if (source === 'journal') {
        const dateObj = new Date(contextId);
        const formattedDate = format(dateObj, "MMM d, yyyy");
        setBreadcrumbs([
          { label: 'Journal', href: '/journal' },
          { label: formattedDate, href: `/journal/${contextId}` }
        ], 'journal', { date: contextId });
      } else if (source === 'strategy') {
        setBreadcrumbs([
          { label: 'Strategies', href: '/strategies' },
          { label: additionalData?.strategyName || 'Strategy', href: `/strategies/${contextId}` }
        ], 'strategy', { strategyName: additionalData?.strategyName || contextId });
      }
      
      navigate(`/trades/${tradeId}/from/${source}/${contextId}`);
    } else {
      // Default navigation without context
      setBreadcrumbs([
        { label: 'Trades', href: '/trades' }
      ], 'trades');
      navigate(`/trades/${tradeId}`);
    }
  };

  // Navigate to journal with optional date
  const navigateToJournal = (date?: string) => {
    if (date) {
      navigate(`/journal/${date}`);
    } else {
      navigate('/journal');
    }
  };

  // Navigate to strategy detail
  const navigateToStrategy = (strategyName: string) => {
    navigate(`/strategies/${strategyName}`);
  };

  // Get the appropriate back navigation URL based on context
  const getBackNavigationUrl = (): string => {
    const context = getCurrentContext();
    
    if (context.source === 'journal' && context.date) {
      return `/journal/${context.date}`;
    } else if (context.source === 'strategy' && context.strategyName) {
      return `/strategies/${context.strategyName}`;
    } else if (context.source === 'trades') {
      return '/trades';
    }
    
    // Default fallback
    return '/trades';
  };

  // Navigate back based on context
  const navigateBack = () => {
    const backUrl = getBackNavigationUrl();
    navigate(backUrl);
  };

  // Check if we're in a contextual navigation
  const hasContext = (): boolean => {
    const context = getCurrentContext();
    return !!(context.source && context.contextId);
  };

  // Set breadcrumbs based on source and context
  const setBreadcrumbsFromContext = (source: string, contextId: string, strategyName?: string) => {
    if (source === 'journal') {
      const dateObj = new Date(contextId);
      const formattedDate = format(dateObj, "MMM d, yyyy");
      setBreadcrumbs([
        { label: 'Journal', href: '/journal' },
        { label: formattedDate, href: `/journal/${contextId}` }
      ], 'journal', { date: contextId });
    } else if (source === 'strategy') {
      setBreadcrumbs([
        { label: 'Strategies', href: '/strategies' },
        { label: strategyName || 'Strategy', href: `/strategies/${contextId}` }
      ], 'strategy', { strategyName: strategyName || contextId });
    } else if (source === 'trades') {
      setBreadcrumbs([
        { label: 'Trades', href: '/trades' }
      ], 'trades');
    }
  };

  return {
    navigateToTrade,
    navigateToJournal,
    navigateToStrategy,
    getBackNavigationUrl,
    navigateBack,
    getCurrentContext,
    hasContext,
    setBreadcrumbsFromContext
  };
}
