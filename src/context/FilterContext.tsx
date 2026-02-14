
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DateRange } from '@/components/filters/DateRangeTypes';
import { SelectedAccounts } from '@/components/filters/AccountSelector';
import { getPresetDateRange } from '@/components/filters/DateRangeUtils';

export interface GlobalFilters {
  dateRange: DateRange;
  selectedAccounts: SelectedAccounts;
}

interface FilterContextType {
  filters: GlobalFilters;
  updateDateRange: (dateRange: DateRange) => void;
  updateSelectedAccounts: (accounts: SelectedAccounts) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Default values - Changed to All Time
const getDefaultDateRange = (): DateRange => getPresetDateRange("allTime");

const getDefaultSelectedAccounts = (): SelectedAccounts => ({
  allAccounts: true,
  accountIds: []
});

// Storage keys
const STORAGE_KEYS = {
  DATE_RANGE: 'tradelens_global_date_range',
  SELECTED_ACCOUNTS: 'tradelens_global_selected_accounts',
  VERSION: 'tradelens_filter_version'
};

// Version for filter storage - increment when defaults change
const FILTER_VERSION = '2'; // Changed to force reset to "All Time"

// Load from sessionStorage with fallback to defaults
const loadFromStorage = (): GlobalFilters => {
  try {
    const savedVersion = sessionStorage.getItem(STORAGE_KEYS.VERSION);
    
    // If version doesn't match, clear old storage and use defaults
    if (savedVersion !== FILTER_VERSION) {
      console.log('Filter version mismatch, resetting to defaults');
      sessionStorage.removeItem(STORAGE_KEYS.DATE_RANGE);
      sessionStorage.removeItem(STORAGE_KEYS.SELECTED_ACCOUNTS);
      sessionStorage.setItem(STORAGE_KEYS.VERSION, FILTER_VERSION);
      return {
        dateRange: getDefaultDateRange(),
        selectedAccounts: getDefaultSelectedAccounts()
      };
    }
    
    const savedDateRange = sessionStorage.getItem(STORAGE_KEYS.DATE_RANGE);
    const savedAccounts = sessionStorage.getItem(STORAGE_KEYS.SELECTED_ACCOUNTS);
    
    let dateRange = getDefaultDateRange();
    if (savedDateRange) {
      const parsed = JSON.parse(savedDateRange);
      dateRange = {
        from: new Date(parsed.from),
        to: new Date(parsed.to),
        preset: parsed.preset
      };
    }
    
    return {
      dateRange,
      selectedAccounts: savedAccounts ? JSON.parse(savedAccounts) : getDefaultSelectedAccounts()
    };
  } catch (error) {
    console.error('Error loading filters from storage:', error);
    return {
      dateRange: getDefaultDateRange(),
      selectedAccounts: getDefaultSelectedAccounts()
    };
  }
};

// Save to sessionStorage
const saveToStorage = (filters: GlobalFilters) => {
  try {
    sessionStorage.setItem(STORAGE_KEYS.DATE_RANGE, JSON.stringify(filters.dateRange));
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_ACCOUNTS, JSON.stringify(filters.selectedAccounts));
    sessionStorage.setItem(STORAGE_KEYS.VERSION, FILTER_VERSION);
  } catch (error) {
    console.error('Error saving filters to storage:', error);
  }
};

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<GlobalFilters>(loadFromStorage);

  // Save to storage whenever filters change
  useEffect(() => {
    saveToStorage(filters);
  }, [filters]);

  const updateDateRange = (dateRange: DateRange) => {
    console.log('Global filter: updating date range to:', dateRange);
    setFilters(prev => ({ ...prev, dateRange }));
  };

  const updateSelectedAccounts = (selectedAccounts: SelectedAccounts) => {
    console.log('Global filter: updating selected accounts to:', selectedAccounts);
    setFilters(prev => ({ ...prev, selectedAccounts }));
  };

  const value: FilterContextType = {
    filters,
    updateDateRange,
    updateSelectedAccounts
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useGlobalFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useGlobalFilters must be used within a FilterProvider');
  }
  return context;
};
