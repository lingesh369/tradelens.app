
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

export interface SummaryTableColumn {
  key: string;
  header: string;
  className?: string;
  format?: (value: any) => React.ReactNode;
  isCurrency?: boolean;
  hideOnMobile?: boolean;
}

interface SummaryTableProps {
  columns: SummaryTableColumn[];
  data: any[];
  className?: string;
  emptyMessage?: string;
}

export function SummaryTable({ 
  columns, 
  data, 
  className,
  emptyMessage = "No data available" 
}: SummaryTableProps) {
  const hasData = data.length > 0;
  const { settings } = useGlobalSettings();

  // Filter columns for mobile view - hide columns marked as hideOnMobile
  const visibleColumns = columns.filter(column => 
    window.innerWidth >= 640 || !column.hideOnMobile
  );

  return (
    <div className={cn("glass-card rounded-xl border shadow-sm w-full", className)}>
      <ScrollArea className="w-full">
        <div className="min-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead 
                    key={column.key} 
                    className={cn(
                      "font-semibold text-muted-foreground", 
                      column.className
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasData ? (
                data.map((row, index) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    {visibleColumns.map((column) => (
                      <TableCell 
                        key={column.key} 
                        className={cn(column.className)}
                      >
                        {column.format 
                          ? column.format(row[column.key]) 
                          : column.isCurrency 
                            ? formatCurrencyValue(row[column.key], settings?.base_currency || "USD") 
                            : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                      <AlertCircle className="h-8 w-8 opacity-60" />
                      <p className="text-base">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
