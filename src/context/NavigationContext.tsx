import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface NavigationState {
  breadcrumbs: BreadcrumbItem[];
  source: 'trades' | 'journal' | 'strategy' | null;
  sourceData?: {
    date?: string; // For journal
    strategyId?: string; // For strategy
    strategyName?: string; // For strategy
  };
}

interface NavigationContextType {
  navigationState: NavigationState;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[], source: NavigationState['source'], sourceData?: NavigationState['sourceData']) => void;
  clearNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    breadcrumbs: [],
    source: null,
    sourceData: undefined,
  });

  const setBreadcrumbs = (
    breadcrumbs: BreadcrumbItem[],
    source: NavigationState['source'],
    sourceData?: NavigationState['sourceData']
  ) => {
    setNavigationState({
      breadcrumbs,
      source,
      sourceData,
    });
  };

  const clearNavigation = () => {
    setNavigationState({
      breadcrumbs: [],
      source: null,
      sourceData: undefined,
    });
  };

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        setBreadcrumbs,
        clearNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
