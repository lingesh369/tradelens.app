
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Failed to analyze trades';
};

export const getToastDescription = (errorMessage: string): string => {
  if (errorMessage.includes('too large')) {
    return 'Please select a smaller date range or fewer trades for analysis.';
  } else if (errorMessage.includes('timeout') || errorMessage.includes('500')) {
    return 'Analysis timed out. Try reducing the number of trades or date range.';
  } else if (errorMessage.includes('413')) {
    return 'Dataset too large. Please select fewer trades or a shorter time period.';
  }
  return errorMessage;
};
