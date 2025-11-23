
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, SlidersHorizontal, Trash2, Download } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TradeTableControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  availableColumns: Array<{
    id: string;
    label: string;
    default?: boolean;
    priority?: number;
  }>;
  activeColumns: string[];
  onColumnChange: (columnId: string) => void;
  selectedTrades: Set<string>;
  onAddTradeClick?: () => void;
  onDeleteSelected: () => void;
  onExportCSV?: () => void;
  filteredTradesLength: number;
  totalTradesLength: number;
  filterByStrategy?: string;
  viewMode?: 'table' | 'grid';
}

export function TradeTableControls({
  searchQuery,
  onSearchChange,
  availableColumns,
  activeColumns,
  onColumnChange,
  selectedTrades,
  onAddTradeClick,
  onDeleteSelected,
  onExportCSV,
  filteredTradesLength,
  totalTradesLength,
  filterByStrategy,
  viewMode = 'table'
}: TradeTableControlsProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search trades..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`h-8 sm:h-9 text-sm ${
              isMobile ? 'flex-1 min-w-0' : 'w-[200px] md:w-[250px]'
            }`}
          />
          
          {/* Column selector - only show in table mode */}
          {viewMode === 'table' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1 text-xs sm:text-sm flex-shrink-0">
                  <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  {isMobile ? '' : 'Columns'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] sm:w-[200px]">
                <DropdownMenuLabel className="text-xs sm:text-sm">Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={activeColumns.includes(column.id)}
                    onCheckedChange={() => onColumnChange(column.id)}
                    className="text-xs sm:text-sm"
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export CSV Button */}
          {onExportCSV && (
            <Button 
              onClick={onExportCSV}
              variant="outline"
              size="sm" 
              className="h-8 sm:h-9 gap-1 text-xs sm:text-sm flex-shrink-0"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              {isMobile ? '' : 'Export CSV'}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile && onAddTradeClick && (
            <Button 
              onClick={onAddTradeClick}
              size="sm" 
              className="h-8 sm:h-9 gap-1 text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              Add Trade
            </Button>
          )}
          
          {selectedTrades.size > 0 && viewMode === 'table' && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-1 h-8 sm:h-9 text-xs sm:text-sm"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Delete ({selectedTrades.size})
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <span className="text-xs sm:text-sm text-muted-foreground">
          {filterByStrategy 
            ? `${filteredTradesLength} trades for this strategy` 
            : `${totalTradesLength} total trades`}
        </span>
      </div>
    </div>
  );
}
