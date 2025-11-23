
export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const currencyOptions: CurrencyOption[] = [
  { code: "USD", name: "United States Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound Sterling", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" }
];

export function getCurrencyByCode(code: string): CurrencyOption | undefined {
  return currencyOptions.find(currency => currency.code === code);
}

export function formatCurrencyDisplay(currency: CurrencyOption | undefined): string {
  if (!currency) return "USD ($)";
  return `${currency.code} (${currency.symbol})`;
}

export function formatCurrencyValue(value: number, currencyCode: string = "USD"): string {
  const currency = getCurrencyByCode(currencyCode);
  return `${currency?.symbol || "$"}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
