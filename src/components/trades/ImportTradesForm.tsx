import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileUp, AlertCircle, CheckCircle2, Plus, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useTrades } from "@/hooks/useTrades";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { format } from "date-fns";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { searchTimezones, getTimezoneByValue } from "@/lib/timezone-data";
import { fromZonedTime } from "date-fns-tz";
import AccountDialog from "@/components/accounts/AccountDialog";
import { useNavigate } from "react-router-dom";

interface ImportTradesFormProps {
  onSuccess: () => void;
}

export function ImportTradesForm({ onSuccess }: ImportTradesFormProps) {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountId, setAccountId] = useState<string>("");
  const [csvTimezone, setCsvTimezone] = useState<string>("");
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { accounts } = useAccounts();
  const { createTrade } = useTrades();
  const { toast } = useToast();
  const { settings } = useGlobalSettings();

  // Get user's current timezone from settings
  const userTimezone = settings?.time_zone || "UTC";
  const userTimezoneOption = getTimezoneByValue(userTimezone);

  // Filter timezones based on search
  const filteredTimezones = searchTimezones(timezoneSearch);

  const handleAddAccount = () => {
    setShowAccountDialog(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowAccountDialog(open);
    // The accounts will be refetched automatically due to real-time updates
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Please upload a CSV file.");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setFile(selectedFile);
        setError(null);
        setSuccess(false);
      }
    }
  };

  const convertTimezoneToUserTimezone = (timestamp: string, fromTimezone: string, toTimezone: string): string => {
    try {
      // Parse the timestamp as a date in the CSV timezone
      const date = new Date(timestamp);
      
      // Convert from CSV timezone to UTC first, then to user timezone
      // Since we're dealing with CSV data, we assume the timestamp is in the CSV timezone
      // We use fromZonedTime to convert from the CSV timezone to UTC
      const utcDate = fromZonedTime(date, fromTimezone);
      
      // Return as ISO string which will be stored in UTC in the database
      return utcDate.toISOString();
    } catch (error) {
      console.error("Error converting timezone:", error);
      // Fallback to original timestamp
      return new Date(timestamp).toISOString();
    }
  };
  
  const validateCsvData = (data: any[]) => {
    if (data.length === 0) {
      throw new Error("The CSV file is empty.");
    }
    
    // Update required headers based on the error message
    const requiredHeaders = [
      "entry_time", "exit_time", "action", "quantity", "instrument", 
      "entry_price", "exit_price", "sl", "target", "commission", "fees"
    ];
    
    const headers = Object.keys(data[0]);
    
    // Check required headers
    for (const requiredHeader of requiredHeaders) {
      if (!headers.includes(requiredHeader)) {
        throw new Error(`Required header '${requiredHeader}' is missing from the CSV file.`);
      }
    }
    
    return true;
  };
  
  const processFile = async () => {
    if (!file || !accountId || !csvTimezone) {
      let errorMsg = "Please select ";
      const missing = [];
      if (!file) missing.push("a file");
      if (!accountId) missing.push("an account");
      if (!csvTimezone) missing.push("a CSV timezone");
      errorMsg += missing.join(", ") + ".";
      setError(errorMsg);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setProcessedRows(0);
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (results.errors && results.errors.length > 0) {
              throw new Error(`CSV parsing error: ${results.errors[0].message}`);
            }
            
            const data = results.data as any[];
            validateCsvData(data);
            
            setTotalRows(data.length);
            let processed = 0;
            
            for (const row of data) {
              try {
                // Parse entry date and convert timezone
                let entryDate = new Date();
                if (row.entry_time) {
                  try {
                    const convertedEntryTime = convertTimezoneToUserTimezone(row.entry_time, csvTimezone, userTimezone);
                    entryDate = new Date(convertedEntryTime);
                  } catch (e) {
                    console.error("Error parsing entry date:", e);
                  }
                }
                
                // Parse exit date if exists and convert timezone
                let exitDate = undefined;
                if (row.exit_time) {
                  try {
                    const convertedExitTime = convertTimezoneToUserTimezone(row.exit_time, csvTimezone, userTimezone);
                    exitDate = new Date(convertedExitTime);
                  } catch (e) {
                    console.error("Error parsing exit date:", e);
                  }
                }
                
                // Handle action (buy/sell)
                const action = (row.action || "buy").toLowerCase();
                
                // Map market type
                const marketType = row.market_type || "Stocks";
                
                // Create trade object with preserved decimal precision
                const tradeData = {
                  market_type: marketType,
                  account_id: accountId,
                  instrument: row.instrument,
                  contract: row.contract || null,
                  action: action,
                  quantity: parseFloat(row.quantity),
                  entry_price: parseFloat(row.entry_price),
                  entry_time: entryDate.toISOString(),
                  exit_price: row.exit_price ? parseFloat(row.exit_price) : null,
                  exit_time: exitDate ? exitDate.toISOString() : null,
                  // Ensure commission and fees are always positive
                  commission: row.commission ? Math.abs(parseFloat(row.commission)) : 0,
                  fees: row.fees ? Math.abs(parseFloat(row.fees)) : 0,
                  notes: row.notes || null,
                  strategy_id: row.strategy_id || null,
                  sl: row.sl ? parseFloat(row.sl) : null,
                  target: row.target ? parseFloat(row.target) : null,
                  chart_link: row.chart_link || null,
                  rating: row.rating ? Number(row.rating) : null,
                  contract_multiplier: row.contract_multiplier ? parseFloat(row.contract_multiplier) : 1,
                };
                
                await createTrade(tradeData);
                processed++;
                setProcessedRows(processed);
                
              } catch (rowError) {
                console.error("Error processing row:", rowError);
              }
            }
            
            setSuccess(true);
            toast({
              title: "Import Successful",
              description: `Successfully imported ${processed} trades with timezone conversion.`,
            });
            
            if (processed > 0) {
              setTimeout(() => {
                onSuccess();
              }, 2000);
            }
            
          } catch (validateError: any) {
            setError(validateError.message);
          }
        },
        error: (err) => {
          setError(`Error reading the file: ${err.message}`);
        }
      });
    } catch (error: any) {
      setError(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setCsvTimezone("");
    setTimezoneSearch("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const downloadSampleCsv = () => {
    window.open("https://docs.google.com/spreadsheets/d/1S5tGMn_Qbn44pG9rAproHlUwZzTniMIbGPKuJe9619s/edit?usp=sharing", "_blank");
  };

  const handleConvertCSV = () => {
    navigate("/csv");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Import Trades from CSV</h3>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with your trade data.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadSampleCsv}
            className="w-full sm:w-auto"
          >
            <FileUp className="h-4 w-4 mr-2" />
            <span>Download Sample CSV</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleConvertCSV}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>Convert Your CSV</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="account">Account</Label>
          <div className="flex gap-2">
            <Select
              value={accountId}
              onValueChange={(value) => setAccountId(value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem 
                    key={account.account_id} 
                    value={account.account_id}
                  >
                    {account.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAccount}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="csv-timezone">CSV Time Zone *</Label>
          <Select
            value={csvTimezone}
            onValueChange={(value) => setCsvTimezone(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select CSV Time Zone" />
            </SelectTrigger>
            <SelectContent 
              className="max-h-60"
              searchable={true}
              searchPlaceholder="Search timezones..."
              onSearch={setTimezoneSearch}
            >
              {/* Show user's current timezone first */}
              <SelectItem value={userTimezone}>
                {userTimezoneOption?.label} (Your Current Time Zone Setting)
              </SelectItem>
              
              {/* Show filtered timezones */}
              {filteredTimezones
                .filter(tz => tz.value !== userTimezone)
                .map((timezone) => (
                  <SelectItem key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Timestamps in your CSV will be converted to your saved account time zone: {userTimezoneOption?.label}
          </p>
        </div>
        
        <div>
          <Label htmlFor="csv-file">CSV File</Label>
          <Input
            ref={fileInputRef}
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground mt-1">
            File must be in CSV format with headers. Required headers: entry_time, exit_time, action, quantity, instrument, entry_price, exit_price, sl, target, commission, fees. Optional: contract_multiplier (defaults to 1). Commission and fees will automatically be converted to positive values. <span className="text-blue-500 cursor-pointer hover:underline" onClick={downloadSampleCsv}>Click here</span> to download a sample template.
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              All trades have been imported successfully with timezone conversion.
            </AlertDescription>
          </Alert>
        )}
        
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                Processing {processedRows} of {totalRows} trades...
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${totalRows > 0 ? (processedRows / totalRows) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button
            onClick={processFile}
            disabled={!file || !accountId || !csvTimezone || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Import Trades"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={isProcessing}
          >
            Reset
          </Button>
        </div>
      </div>

      <AccountDialog
        open={showAccountDialog}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  );
}
