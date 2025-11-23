
import React from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeTableHeaderProps {
  availableColumns: Array<{
    id: string;
    label: string;
    default?: boolean;
    priority?: number;
  }>;
  activeColumns: string[];
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  selectAllState: boolean | "indeterminate";
  onSelectAll: (checked: boolean) => void;
}

export function TradeTableHeader({
  availableColumns,
  activeColumns,
  sortConfig,
  onSort,
  selectAllState,
  onSelectAll
}: TradeTableHeaderProps) {
  // Convert selectAllState to the format expected by Checkbox
  const checkboxChecked = selectAllState === "indeterminate" ? "indeterminate" : selectAllState;

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-8 sm:w-12 px-2 sm:px-4">
          <Checkbox
            checked={checkboxChecked}
            onCheckedChange={(checked) => onSelectAll(checked === true)}
            className="h-3 w-3 sm:h-4 sm:w-4"
          />
        </TableHead>
        {availableColumns
          .filter(column => activeColumns.includes(column.id))
          .map(column => (
            <TableHead 
              key={column.id}
              className="cursor-pointer hover:bg-muted/50 px-2 sm:px-4 text-xs sm:text-sm font-medium"
              onClick={() => onSort(column.id)}
            >
              <div className="flex items-center gap-1 min-w-0">
                <span className="truncate">{column.label}</span>
                {sortConfig.key === column.id && (
                  <ChevronDown 
                    className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4 transition-transform flex-shrink-0", 
                      sortConfig.direction === 'asc' ? 'rotate-180' : ''
                    )} 
                  />
                )}
              </div>
            </TableHead>
          ))}
      </TableRow>
    </TableHeader>
  );
}
