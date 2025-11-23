
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CSVData } from "@/pages/CSVConverter";
import { getSmartMappingDefaults, TRADELEN_FIELDS } from "@/utils/csvProcessor";

interface CSVMappingStepProps {
  csvData: CSVData;
  onComplete: (data: Partial<CSVData>) => void;
  onBack: () => void;
}

export function CSVMappingStep({ csvData, onComplete, onBack }: CSVMappingStepProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const SKIP_VALUE = "__SKIP_FIELD__"; // Use a non-empty string for skip option

  useEffect(() => {
    // Set smart defaults when component mounts
    const defaults = getSmartMappingDefaults(csvData.headers);
    setMappings(defaults);
  }, [csvData.headers]);

  const handleMappingChange = (tradelensField: string, csvColumn: string) => {
    setMappings(prev => ({
      ...prev,
      [tradelensField]: csvColumn === SKIP_VALUE ? "" : csvColumn
    }));
    setError(null);
  };

  const validateMappings = () => {
    const requiredFields = TRADELEN_FIELDS.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !mappings[field.key]);
    
    if (missingFields.length > 0) {
      setError(`Please map the following required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return false;
    }

    return true;
  };

  const handleConfirm = () => {
    if (!validateMappings()) {
      return;
    }

    onComplete({ mappings });
    
    toast({
      title: "Column mapping confirmed",
      description: "Ready to process your data.",
    });
  };

  const getUsedColumns = () => {
    return Object.values(mappings).filter(Boolean);
  };

  const getAvailableColumns = (currentField: string) => {
    const usedColumns = getUsedColumns();
    const currentMapping = mappings[currentField];
    return csvData.headers.filter(header => 
      !usedColumns.includes(header) || header === currentMapping
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
          <h2 className="text-2xl font-bold">Map Your Columns</h2>
          <p className="text-muted-foreground">
            Map your CSV columns to TradeLens fields. Required fields are marked with *
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TRADELEN_FIELDS.map((field) => {
          const availableColumns = getAvailableColumns(field.key);
          const currentValue = mappings[field.key] || SKIP_VALUE;
          
          return (
            <Card key={field.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </CardTitle>
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <Select
                  value={currentValue}
                  onValueChange={(value) => handleMappingChange(field.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select column for ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SKIP_VALUE}>-- Skip this field --</SelectItem>
                    {availableColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onBack}>
          Back to Upload
        </Button>
        <Button onClick={handleConfirm} className="min-w-32">
          Confirm Mapping
        </Button>
      </div>
    </div>
  );
}
