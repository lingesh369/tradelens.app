
import { formatCurrencyValue } from "@/lib/currency-data";
import { format, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Trade } from "@/types/trade";

/**
 * Formats a datetime string using the user's timezone
 */
export const formatDateTime = (timestamp: string | null, timezone: string = "UTC"): string => {
  if (!timestamp) return "";
  
  try {
    const date = parseISO(timestamp);
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, "yyyy-MM-dd HH:mm:ss");
  } catch (error) {
    console.error("Error formatting date:", error);
    return timestamp;
  }
};

/**
 * Formats a currency value according to the user's settings
 */
export const formatCurrency = (value: number | null, currency: string = "USD"): string => {
  if (value === null) return "-";
  return formatCurrencyValue(value, currency);
};

/**
 * Converts a local datetime string to UTC
 */
export const toUTCDateTime = (localDateTimeStr: string, timezone: string = "UTC"): string => {
  try {
    const localDate = parseISO(localDateTimeStr);
    const utcDate = fromZonedTime(localDate, timezone);
    return utcDate.toISOString();
  } catch (error) {
    console.error("Error converting to UTC:", error);
    return localDateTimeStr;
  }
};

/**
 * Calculates fees based on trade and commissions
 */
export const calculateFees = (
  trade: Partial<Trade>,
  commissions: { account_id: string | null; market_type: string; total_fees: number }[]
): number => {
  if (trade.account_id) {
    const accountSpecificCommission = commissions.find(
      c => c.account_id === trade.account_id && c.market_type === trade.market_type
    );
    
    if (accountSpecificCommission) {
      return accountSpecificCommission.total_fees;
    }
  }
  
  const marketTypeCommission = commissions.find(
    c => !c.account_id && c.market_type === trade.market_type
  );
  
  if (marketTypeCommission) {
    return marketTypeCommission.total_fees;
  }
  
  return 0;
};
