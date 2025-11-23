
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { readCSVHeaders } from "@/utils/csvProcessor";
import { CSVData } from "@/pages/CSVConverter";

interface CSVUploadStepProps {
  onComplete: (data: Partial<CSVData>) => void;
}

export function CSVUploadStep({ onComplete }: CSVUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    
    // Validate file type
    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setError('Please select a CSV file.');
      return;
    }

    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    toast({
      title: "File uploaded",
      description: `${selectedFile.name} is ready to process.`,
    });
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await readCSVHeaders(file);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      onComplete({
        headers: result.headers || [],
        data: result.data || []
      });

      toast({
        title: "CSV processed",
        description: `Found ${result.headers?.length} columns and ${result.data?.length} rows.`,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to process CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Your CSV File</h2>
        <p className="text-muted-foreground">
          Drag and drop your CSV file here, or click to browse
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          
          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
              <p className="text-xs text-muted-foreground">
                Size: {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Drop your CSV file here</p>
              <p className="text-xs text-muted-foreground">
                Supports files up to 10MB
              </p>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={handleChooseFile}
            disabled={isProcessing}
          >
            Choose File
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center">
        <Button
          onClick={handleProcess}
          disabled={!file || isProcessing}
          className="min-w-32"
        >
          {isProcessing ? 'Processing...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
