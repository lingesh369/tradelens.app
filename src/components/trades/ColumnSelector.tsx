
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ColumnOption {
  id: string;
  label: string;
  default: boolean;
  priority?: number; // Add priority property for responsive column management
}

interface ColumnSelectorProps {
  open: boolean;
  onClose: () => void;
  availableColumns: ColumnOption[];
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  strategyId?: string; // Add strategy ID for strategy-specific storage
}

export function ColumnSelector({
  open,
  onClose,
  availableColumns,
  selectedColumns,
  onColumnsChange,
  strategyId,
}: ColumnSelectorProps) {
  const [localSelectedColumns, setLocalSelectedColumns] = useState<string[]>(selectedColumns);

  useEffect(() => {
    setLocalSelectedColumns(selectedColumns);
  }, [selectedColumns, open]);

  const handleToggleColumn = (columnId: string) => {
    setLocalSelectedColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const handleSelectAll = () => {
    setLocalSelectedColumns(availableColumns.map((col) => col.id));
  };

  const handleSelectNone = () => {
    setLocalSelectedColumns([]);
  };

  const handleSelectDefault = () => {
    setLocalSelectedColumns(
      availableColumns.filter((col) => col.default).map((col) => col.id)
    );
  };

  const handleSave = () => {
    onColumnsChange(localSelectedColumns);
    
    // Also save to localStorage with strategy-specific key if needed
    const storageKey = strategyId ? `tradeColumns_${strategyId}` : 'tradeColumns';
    localStorage.setItem(storageKey, JSON.stringify(localSelectedColumns));
    
    onClose();
  };

  const handleCancel = () => {
    // Reset to original selection
    setLocalSelectedColumns(selectedColumns);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Select Columns</DialogTitle>
        </DialogHeader>
        
        <div className="py-2">
          <div className="text-sm text-muted-foreground mb-2">
            Choose the columns you want to display in the table
          </div>
          
          <div className="flex space-x-4 mb-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              None
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectDefault}>
              Default
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto">
            {availableColumns.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`column-${column.id}`}
                  checked={localSelectedColumns.includes(column.id)}
                  onCheckedChange={() => handleToggleColumn(column.id)}
                />
                <Label
                  htmlFor={`column-${column.id}`}
                  className="cursor-pointer"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
