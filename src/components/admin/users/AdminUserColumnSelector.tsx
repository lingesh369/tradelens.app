
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2 } from 'lucide-react';
import { adminUserColumns } from './AdminUserTableColumns';

interface AdminUserColumnSelectorProps {
  selectedColumns: string[];
  onColumnChange: (columns: string[]) => void;
}

export function AdminUserColumnSelector({ selectedColumns, onColumnChange }: AdminUserColumnSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    if (checked) {
      onColumnChange([...selectedColumns, columnId]);
    } else {
      onColumnChange(selectedColumns.filter(id => id !== columnId));
    }
  };

  const sortedColumns = [...adminUserColumns].sort((a, b) => a.priority - b.priority);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 max-h-96 overflow-y-auto bg-popover border shadow-lg z-50">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Toggle columns</h4>
          <div className="space-y-2">
            {sortedColumns.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  id={column.id}
                  checked={selectedColumns.includes(column.id)}
                  onCheckedChange={(checked) => handleColumnToggle(column.id, !!checked)}
                />
                <label 
                  htmlFor={column.id}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
