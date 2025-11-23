interface UseTradeTimelineDataProps {
  exitDate?: string;
  editValues: {
    exitDate: string | null;
    exitTime: string | null;
  };
  partialExits: Array<{
    action: string;
    datetime: string;
    quantity: number;
    price: number;
    fee: number;
  }>;
}

export function useTradeTimelineData({ exitDate, editValues, partialExits }: UseTradeTimelineDataProps) {
  // Calculate proper exit datetime for timeline
  const getTimelineExitDate = () => {
    // If we have an exitDate prop, use it
    if (exitDate) {
      return exitDate;
    }
    
    // Otherwise, try to construct from editValues
    if (editValues.exitDate && editValues.exitTime) {
      return `${editValues.exitDate}T${editValues.exitTime}:00`;
    }
    
    // If we have partial exits, use the last one
    if (partialExits && partialExits.length > 0) {
      return partialExits[partialExits.length - 1].datetime;
    }
    
    return undefined;
  };

  return {
    timelineExitDate: getTimelineExitDate()
  };
}
