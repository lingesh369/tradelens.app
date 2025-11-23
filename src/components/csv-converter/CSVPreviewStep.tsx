
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CSVData } from "@/pages/CSVConverter";
import { processCSVData, exportFormattedCSV, MARKET_TYPES } from "@/utils/csvProcessor";

interface CSVPreviewStepProps {
  csvData: CSVData;
  onBack: () => void;
  onReset: () => void;
}

// Convert YYYY-MM-DD HH:MM:SS to YYYY-MM-DDTHH:MM for datetime-local input
const convertToDateTimeLocal = (timestamp: string): string => {
  if (!timestamp) return '';
  
  // If already in the correct format, just replace space with T
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)) {
    return timestamp.slice(0, 16).replace(' ', 'T');
  }
  
  return '';
};

// Convert YYYY-MM-DDTHH:MM from datetime-local input back to YYYY-MM-DD HH:MM:SS
const convertFromDateTimeLocal = (datetimeLocal: string): string => {
  if (!datetimeLocal) return '';
  
  // Replace T with space and add seconds
  return datetimeLocal.replace('T', ' ') + ':00';
};

export function CSVPreviewStep({ csvData, onBack, onReset }: CSVPreviewStepProps) {
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const { toast } = useToast();

  const itemsPerPage = 50;
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = processedData.slice(startIndex, endIndex);

  useEffect(() => {
    processData();
  }, [csvData]);

  const processData = async () => {
    setIsProcessing(true);
    setWarnings([]);

    try {
      const result = await processCSVData(csvData.data, csvData.mappings);
      setProcessedData(result.data);
      setWarnings(result.warnings || []);
      
      toast({
        title: "Data processed successfully",
        description: `${result.data.length} rows processed with ${result.warnings?.length || 0} warnings.`,
      });
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCellValueChange = (index: number, field: string, value: any) => {
    const actualIndex = startIndex + index;
    const updatedData = [...processedData];
    
    // Parse numeric fields while maintaining precision
    if (['quantity', 'entry_price', 'exit_price', 'commission', 'fees', 'profit', 'contract_multiplier', 'sl', 'target'].includes(field)) {
      const numValue = value === '' ? null : parseFloat(String(value).replace(/,/g, ''));
      updatedData[actualIndex] = {
        ...updatedData[actualIndex],
        [field]: isNaN(numValue) ? null : numValue
      };
    } else if (['entry_time', 'exit_time'].includes(field)) {
      // Handle datetime fields - convert from datetime-local format back to our standard format
      const formattedValue = convertFromDateTimeLocal(value);
      updatedData[actualIndex] = {
        ...updatedData[actualIndex],
        [field]: formattedValue
      };
    } else {
      updatedData[actualIndex] = {
        ...updatedData[actualIndex],
        [field]: value
      };
    }
    
    setProcessedData(updatedData);
  };

  const handleDownload = () => {
    try {
      exportFormattedCSV(processedData);
      toast({
        title: "CSV downloaded",
        description: "Your formatted CSV file has been downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '';
    
    if (type === 'price' || type === 'number') {
      return typeof value === 'number' ? String(value) : String(value);
    }
    
    if (type === 'datetime') {
      return value ? new Date(value).toLocaleString() : '';
    }
    
    return String(value);
  };

  const displayColumns = [
    { key: 'instrument', label: 'Instrument', type: 'text' },
    { key: 'action', label: 'Action', type: 'select', options: ['buy', 'sell'] },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'entry_price', label: 'Entry Price', type: 'price' },
    { key: 'exit_price', label: 'Exit Price', type: 'price' },
    { key: 'entry_time', label: 'Entry Time', type: 'datetime' },
    { key: 'exit_time', label: 'Exit Time', type: 'datetime' },
    { key: 'contract_multiplier', label: 'Contract Multiplier', type: 'number' },
    { key: 'market_type', label: 'Market Type', type: 'market_select' },
    { key: 'commission', label: 'Commission', type: 'price' },
    { key: 'fees', label: 'Fees', type: 'price' }
  ];

  const renderEditableCell = (row: any, column: any, index: number) => {
    const value = row[column.key];
    const hasWarning = row._warnings?.includes(column.key);
    const cellClasses = hasWarning ? 'bg-yellow-50 dark:bg-yellow-900/20' : '';

    if (column.type === 'market_select') {
      return (
        <Select
          value={value || '__NONE__'}
          onValueChange={(newValue) => handleCellValueChange(index, column.key, newValue === '__NONE__' ? '' : newValue)}
        >
          <SelectTrigger className={`w-32 ${cellClasses}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__NONE__">-- None --</SelectItem>
            {MARKET_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (column.type === 'select' && column.options) {
      return (
        <Select
          value={value || '__NONE__'}
          onValueChange={(newValue) => handleCellValueChange(index, column.key, newValue === '__NONE__' ? '' : newValue)}
        >
          <SelectTrigger className={`w-20 ${cellClasses}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__NONE__">-- None --</SelectItem>
            {column.options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (column.type === 'datetime') {
      return (
        <Input
          type="datetime-local"
          value={convertToDateTimeLocal(value)}
          onChange={(e) => handleCellValueChange(index, column.key, e.target.value)}
          className={`w-40 text-xs ${cellClasses} ${hasWarning ? 'text-yellow-600 dark:text-yellow-400' : ''}`}
        />
      );
    }

    return (
      <Input
        type={column.type === 'number' || column.type === 'price' ? 'number' : 'text'}
        step={column.type === 'number' || column.type === 'price' ? 'any' : undefined}
        value={formatValue(value, column.type)}
        onChange={(e) => handleCellValueChange(index, column.key, e.target.value)}
        className={`w-full min-w-20 text-xs ${cellClasses} ${hasWarning ? 'text-yellow-600 dark:text-yellow-400' : ''}`}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Preview & Process</h2>
          <p className="text-muted-foreground">
            Review your processed data and download the formatted CSV. All cells are editable.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{processedData.length}</div>
            <div className="text-sm text-muted-foreground">Total Rows</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{warnings.length}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{Object.keys(csvData.mappings).length}</div>
            <div className="text-sm text-muted-foreground">Mapped Fields</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalPages}</div>
            <div className="text-sm text-muted-foreground">Pages</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Processed Data (Editable)</span>
            <div className="text-sm font-normal text-muted-foreground">
              Page {currentPage} of {totalPages} ({startIndex + 1}-{Math.min(endIndex, processedData.length)} of {processedData.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {displayColumns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((row, index) => {
                  const hasWarnings = row._warnings && row._warnings.length > 0;
                  return (
                    <TableRow 
                      key={index} 
                      className={hasWarnings ? "border-l-4 border-l-yellow-500" : ""}
                    >
                      {displayColumns.map((column) => (
                        <TableCell key={column.key} className="p-1 sm:p-2">
                          {renderEditableCell(row, column, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button variant="outline" onClick={onBack}>
          Back to Mapping
        </Button>
        <Button onClick={handleDownload} disabled={isProcessing}>
          <Download className="h-4 w-4 mr-2" />
          Download Formatted CSV
        </Button>
        <Button variant="outline" onClick={onReset}>
          <Upload className="h-4 w-4 mr-2" />
          Upload New File
        </Button>
      </div>
    </div>
  );
}
