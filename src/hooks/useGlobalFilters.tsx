
import { useGlobalFilters as useGlobalFiltersContext } from '@/context/FilterContext';

export const useGlobalFilters = () => {
  return useGlobalFiltersContext();
};
