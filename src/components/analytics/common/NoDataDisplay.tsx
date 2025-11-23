
import React from 'react';
import { AlertCircle } from "lucide-react";

interface NoDataDisplayProps {
  message?: string;
}

export function NoDataDisplay({ message = "No data available" }: NoDataDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium mb-1">No data available</p>
      <p className="text-sm max-w-md text-center">
        {message}
      </p>
    </div>
  );
}
