
import { useState, useMemo, useEffect } from "react";

interface UseTradeTableLogicProps {
  trades: any[];
  filterByStrategy?: string;
  selectedColumns?: string[];
  onColumnsChange?: (columns: string[]) => void;
  availableColumns: Array<{
    id: string;
    label: string;
    default?: boolean;
    priority?: number;
  }>;
}

export function useTradeTableLogic({
  trades,
  filterByStrategy,
  selectedColumns,
  onColumnsChange,
  availableColumns
}: UseTradeTableLogicProps) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState(() => {
    const saved = localStorage.getItem('tradeTableSearchQuery');
    return saved || '';
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'entry_time', 
    direction: 'desc' 
  });
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  
  // Use provided columns or get from localStorage with strategy-specific key
  const getStorageKey = () => {
    return filterByStrategy ? `tradeColumns_${filterByStrategy}` : 'tradeColumns';
  };

  const [activeColumns, setActiveColumns] = useState<string[]>(() => {
    if (selectedColumns) {
      return selectedColumns;
    }
    
    const storageKey = getStorageKey();
    const savedColumns = localStorage.getItem(storageKey);
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        return Array.isArray(parsed) ? parsed : availableColumns.filter(col => col.default).map(col => col.id);
      } catch {
        return availableColumns.filter(col => col.default).map(col => col.id);
      }
    }
    return availableColumns.filter(col => col.default).map(col => col.id);
  });

  // Filter trades by strategy if filterByStrategy is provided
  const filteredTrades = useMemo(() => {
    if (!filterByStrategy) return trades;
    return trades.filter(trade => trade.strategy_id === filterByStrategy || trade.strategy === filterByStrategy);
  }, [trades, filterByStrategy]);

  // Apply search filter
  const searchedTrades = useMemo(() => {
    if (!searchQuery.trim()) return filteredTrades;
    
    const query = searchQuery.toLowerCase();
    return filteredTrades.filter(trade => {
      const instrument = trade.instrument || trade.symbol || '';
      const tradeId = trade.trade_id || trade.id || '';
      const notes = trade.notes || '';
      
      return (
        instrument.toLowerCase().includes(query) ||
        tradeId.toLowerCase().includes(query) ||
        notes.toLowerCase().includes(query)
      );
    });
  }, [filteredTrades, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(searchedTrades.length / pageSize);
  const paginationRange = {
    start: (page - 1) * pageSize,
    end: page * pageSize
  };

  // Get sorted and paginated data
  const tableData = useMemo(() => {
    return searchedTrades
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        
        if (sortConfig.key === 'entry_time' || sortConfig.key === 'exit_time' || 
            sortConfig.key === 'entryDate' || sortConfig.key === 'exitDate') {
          const dateA = new Date(aValue).getTime();
          const dateB = new Date(bValue).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const stringA = String(aValue).toLowerCase();
        const stringB = String(bValue).toLowerCase();
        return sortConfig.direction === 'asc' 
          ? stringA.localeCompare(stringB)
          : stringB.localeCompare(stringA);
      })
      .slice(paginationRange.start, paginationRange.end);
  }, [searchedTrades, sortConfig, paginationRange]);

  // Handle search query change and persist it
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    localStorage.setItem('tradeTableSearchQuery', value);
    setPage(1);
  };

  // Handle column selection with proper persistence
  const handleColumnChange = (columnId: string) => {
    const newColumns = activeColumns.includes(columnId)
      ? activeColumns.filter(id => id !== columnId)
      : [...activeColumns, columnId];
    
    setActiveColumns(newColumns);
    
    // Save to localStorage with strategy-specific key
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(newColumns));
    
    if (onColumnsChange) {
      onColumnsChange(newColumns);
    }
  };

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle individual trade selection
  const handleTradeSelect = (tradeId: string, checked: boolean) => {
    const newSelected = new Set(selectedTrades);
    if (checked) {
      newSelected.add(tradeId);
    } else {
      newSelected.delete(tradeId);
    }
    setSelectedTrades(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTradeIds = tableData.map(trade => trade.trade_id || trade.id);
      setSelectedTrades(new Set(allTradeIds));
    } else {
      setSelectedTrades(new Set());
    }
  };

  // Pagination controls
  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  // Update active columns when selectedColumns prop changes
  useEffect(() => {
    if (selectedColumns) {
      setActiveColumns(selectedColumns);
    }
  }, [selectedColumns]);

  // Check if all visible trades are selected
  const allSelected = tableData.length > 0 && tableData.every(trade => 
    selectedTrades.has(trade.trade_id || trade.id)
  );
  
  // Check if some trades are selected
  const someSelected = tableData.some(trade => 
    selectedTrades.has(trade.trade_id || trade.id)
  );

  // Calculate checkbox state for "select all" - explicitly type it
  const selectAllState: boolean | "indeterminate" = allSelected ? true : someSelected ? "indeterminate" : false;

  return {
    // State
    page,
    pageSize,
    searchQuery,
    sortConfig,
    selectedTrades,
    activeColumns,
    
    // Computed data
    filteredTrades,
    searchedTrades,
    tableData,
    totalPages,
    selectAllState,
    
    // Handlers
    handleSearchChange,
    handleColumnChange,
    handleSort,
    handleTradeSelect,
    handleSelectAll,
    goToPage,
    setSelectedTrades
  };
}
