
import { Button } from "@/components/ui/button";
import { Table, Grid3X3 } from "lucide-react";

interface TradesHeaderProps {
  filteredTradesCount: number;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
}

export function TradesHeader({ filteredTradesCount, viewMode, onViewModeChange }: TradesHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground md:text-2xl">
          Trade History ({filteredTradesCount})
        </h1>
        
        {/* View Toggle - moved to same row */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
            className="gap-2"
          >
            <Table className="h-4 w-4" />
            Table
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Grid
          </Button>
        </div>
      </div>
    </div>
  );
}
