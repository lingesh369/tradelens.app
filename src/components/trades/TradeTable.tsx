
import React, { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrades } from "@/hooks/useTrades";
import { Skeleton } from "@/components/ui/skeleton";
import { TradeDialog } from "./TradeDialog";
import { DeleteTradesDialog } from "./DeleteTradesDialog";
import { TradeCardGrid } from "./TradeCardGrid";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TradeTableControls } from "./table/TradeTableControls";
import { TradeTableHeader } from "./table/TradeTableHeader";
import { TradeTableRow } from "./table/TradeTableRow";
import { TradeTablePagination } from "./table/TradeTablePagination";
import { useTradeTableLogic } from "./table/useTradeTableLogic";
import { exportToCSV } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";

interface TradeTableProps extends React.HTMLAttributes<HTMLDivElement> {
  filterByStrategy?: string;
  availableColumns: {
    id: string;
    label: string;
    default?: boolean;
    priority?: number;
    render?: (trade: any) => React.ReactNode;
  }[];
  selectedColumns?: string[];
  onColumnsChange?: (columns: string[]) => void;
  tradeData?: any[];
  isLoading?: boolean;
  onViewTrade?: (tradeId: string) => void;
  strategies?: any[];
  validMarketTypes?: string[];
  onAddTradeClick?: () => void;
  viewMode?: 'table' | 'grid';
}

export function TradeTable({ 
  className,
  filterByStrategy, 
  availableColumns, 
  selectedColumns,
  onColumnsChange,
  tradeData,
  isLoading: externalLoading,
  onViewTrade,
  strategies,
  validMarketTypes,
  onAddTradeClick,
  viewMode = 'table',
  ...props 
}: TradeTableProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const { toast } = useToast();

  const isMobile = useMediaQuery("(max-width: 640px)");

  const { trades: hookTrades, isLoading: hookLoading, formatDateTime, formatCurrency, deleteTrade } = useTrades();
  
  // Use provided trade data if available, otherwise use data from the hook
  const trades = tradeData || hookTrades;
  const isLoading = externalLoading !== undefined ? externalLoading : hookLoading;
  
  const {
    searchQuery,
    sortConfig,
    selectedTrades,
    activeColumns,
    filteredTrades,
    tableData,
    totalPages,
    selectAllState,
    page,
    pageSize,
    handleSearchChange,
    handleColumnChange,
    handleSort,
    handleTradeSelect,
    handleSelectAll,
    goToPage,
    setSelectedTrades
  } = useTradeTableLogic({
    trades,
    filterByStrategy,
    selectedColumns,
    onColumnsChange,
    availableColumns
  });

  // Handle CSV export
  const handleExportCSV = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `trades-export-${timestamp}.csv`;
      
      exportToCSV(filteredTrades, filename, activeColumns, availableColumns);
      
      toast({
        title: "Export successful",
        description: `${filteredTrades.length} trades exported to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your trades",
        variant: "destructive",
      });
    }
  };

  // Handle row click for trade details
  const handleRowClick = (trade: any, event: React.MouseEvent) => {
    // Don't navigate if checkbox was clicked
    if ((event.target as HTMLElement).closest('td')?.getAttribute('data-checkbox') === 'true') {
      return;
    }
    
    if (onViewTrade) {
      onViewTrade(trade.id);
    }
  };

  // Handle delete selected trades
  const handleDeleteSelected = async () => {
    const tradesToDelete = Array.from(selectedTrades);
    
    try {
      for (const tradeId of tradesToDelete) {
        await deleteTrade(tradeId);
      }
      
      setSelectedTrades(new Set());
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting trades:', error);
    }
  };

  // Empty state
  if (filteredTrades.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-lg md:text-xl font-medium text-muted-foreground mb-2">
          {filterByStrategy ? "No trades found for this strategy" : "No trades found"}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-[400px] mb-4">
          {filterByStrategy 
            ? "Add trades to this strategy to see them appear here" 
            : "Add your first trade to start tracking your performance"}
        </p>
        <Button onClick={() => setIsAddTradeOpen(true)} className="gap-2" size={isMobile ? "sm" : "default"}>
          <Plus className="h-4 w-4" />
          Add Trade
        </Button>
        
        <TradeDialog 
          open={isAddTradeOpen} 
          onOpenChange={setIsAddTradeOpen}
          defaultStrategy={filterByStrategy}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 md:space-y-4", className)} {...props}>
      {/* Controls */}
      <TradeTableControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        availableColumns={availableColumns}
        activeColumns={activeColumns}
        onColumnChange={handleColumnChange}
        selectedTrades={selectedTrades}
        onAddTradeClick={onAddTradeClick}
        onDeleteSelected={() => setIsDeleteDialogOpen(true)}
        onExportCSV={handleExportCSV}
        filteredTradesLength={filteredTrades.length}
        totalTradesLength={trades.length}
        filterByStrategy={filterByStrategy}
        viewMode={viewMode}
      />

      {/* Conditional rendering based on view mode */}
      {viewMode === 'grid' ? (
        <TradeCardGrid
          trades={tableData}
          isLoading={isLoading}
          onViewTrade={(tradeId) => onViewTrade && onViewTrade(tradeId)}
          formatCurrency={formatCurrency}
          formatDateTime={formatDateTime}
          onAddTradeClick={onAddTradeClick}
        />
      ) : (
        /* Table Container */
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TradeTableHeader
                availableColumns={availableColumns}
                activeColumns={activeColumns}
                sortConfig={sortConfig}
                onSort={handleSort}
                selectAllState={selectAllState}
                onSelectAll={handleSelectAll}
              />
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-2 sm:px-4">
                        <Skeleton className="h-3 w-3 sm:h-4 sm:w-4" />
                      </td>
                      {availableColumns
                        .filter(column => activeColumns.includes(column.id))
                        .map(column => (
                          <td key={column.id} className="px-2 sm:px-4">
                            <Skeleton className="h-4 w-full max-w-[100px]" />
                          </td>
                        ))}
                    </tr>
                  ))
                ) : (
                  tableData.map(trade => (
                    <TradeTableRow
                      key={trade.id}
                      trade={trade}
                      availableColumns={availableColumns}
                      activeColumns={activeColumns}
                      isSelected={selectedTrades.has(trade.id)}
                      onSelect={(checked) => handleTradeSelect(trade.id, checked)}
                      onClick={(e) => handleRowClick(trade, e)}
                      formatDateTime={formatDateTime}
                      formatCurrency={formatCurrency}
                      strategies={strategies}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredTrades.length > 0 && (
        <TradeTablePagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredTrades.length}
          onPageChange={goToPage}
        />
      )}

      {/* Add Trade Dialog */}
      <TradeDialog 
        open={isAddTradeOpen} 
        onOpenChange={setIsAddTradeOpen}
        defaultStrategy={filterByStrategy}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTradesDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteSelected}
        selectedCount={selectedTrades.size}
      />
    </div>
  );
}
