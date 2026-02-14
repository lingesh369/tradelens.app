import Papa from 'papaparse';

export interface TradelensField {
  key: string;
  label: string;
  required: boolean;
  description?: string;
}

export const TRADELEN_FIELDS: TradelensField[] = [
  { key: 'entry_time', label: 'Entry Time', required: true, description: 'When the trade was opened' },
  { key: 'exit_time', label: 'Exit Time', required: false, description: 'When the trade was closed' },
  { key: 'action', label: 'Action', required: true, description: 'Buy or Sell' },
  { key: 'quantity', label: 'Quantity', required: true, description: 'Number of units traded' },
  { key: 'instrument', label: 'Instrument', required: true, description: 'Trading symbol/instrument' },
  { key: 'entry_price', label: 'Entry Price', required: true, description: 'Price at entry' },
  { key: 'exit_price', label: 'Exit Price', required: false, description: 'Price at exit' },
  { key: 'sl', label: 'Stop Loss', required: false, description: 'Stop loss price' },
  { key: 'target', label: 'Target', required: false, description: 'Target price' },
  { key: 'commission', label: 'Commission', required: false, description: 'Commission paid' },
  { key: 'fees', label: 'Fees', required: false, description: 'Additional fees' },
  { key: 'profit', label: 'Profit/Loss', required: false, description: 'Profit or loss amount (used for contract multiplier calculation)' },
  { key: 'market_type', label: 'Market Type', required: false, description: 'Type of market (Stock, Forex, etc.)' },
  { key: 'contract_multiplier', label: 'Contract Multiplier', required: false, description: 'Contract multiplier (will be calculated if profit is provided)' }
];

export const MARKET_TYPES = [
  'Stock', 'Forex', 'Crypto', 'Options', 'Futures', 'Commodities', 'Indices'
];

export interface CSVProcessResult {
  headers?: string[];
  data?: any[];
  error?: string;
}

export interface ProcessedDataResult {
  data: any[];
  warnings: string[];
}

// Read CSV headers and first few rows for mapping
export const readCSVHeaders = (file: File): Promise<CSVProcessResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 1000, // Increased from 100 to 1000 rows for preview
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          resolve({ error: `CSV parsing error: ${results.errors[0].message}` });
          return;
        }

        const data = results.data as any[];
        if (data.length === 0) {
          resolve({ error: 'CSV file is empty' });
          return;
        }

        const headers = Object.keys(data[0]);
        resolve({ headers, data });
      },
      error: (error) => {
        resolve({ error: `Failed to read CSV: ${error.message}` });
      }
    });
  });
};

// Generate smart mapping defaults based on CSV headers with advanced matching
export const getSmartMappingDefaults = (csvHeaders: string[]): Record<string, string> => {
  const mappings: Record<string, string> = {};
  
  // Comprehensive mapping terminologies with priority order
  const advancedMappings: Record<string, string[]> = {
    'entry_time': [
      // Exact matches first (highest priority)
      'entry_time', 'entry_date', 'open_time', 'open_date',
      // Common variations
      'order_time', 'trade_open_time', 'time_opened', 'start_time', 
      'executed_at', 'timestamp', 'datetime', 'date_time',
      // Partial matches
      'date', 'time'
    ],
    'exit_time': [
      'exit_time', 'exit_date', 'close_time', 'close_date',
      'trade_close_time', 'time_closed', 'end_time', 'closed_at', 
      'settled_at', 'settlement_time'
    ],
    'action': [
      'action', 'side', 'type', 'order_type', 'direction', 
      'buy_sell', 'position_type', 'trade_type', 'operation'
    ],
    'quantity': [
      'quantity', 'volume', 'size', 'lots', 'shares', 'amount', 
      'units', 'contracts', 'qty', 'vol', 'lot_size', 'position_size'
    ],
    'instrument': [
      'instrument', 'symbol', 'ticker', 'asset', 'product', 
      'market', 'security', 'pair', 'currency_pair', 'trading_pair'
    ],
    'entry_price': [
      'entry_price', 'open_price', 'fill_price', 'execution_price',
      'avg_entry_price', 'opening_price', 'entry', 'open', 'price_open'
    ],
    'exit_price': [
      'exit_price', 'close_price', 'closing_price', 'avg_exit_price',
      'settlement_price', 'exit', 'close', 'price_close'
    ],
    'sl': [
      'sl', 'stop_loss', 'stoploss', 'stop_price', 'stop', 'stop_level'
    ],
    'target': [
      'target', 'tp', 'take_profit', 'takeprofit', 'limit_price', 
      'target_price', 'profit_target'
    ],
    'commission': [
      'commission', 'commissions', 'brokerage', 'trading_fees', 
      'execution_fees', 'comm', 'broker_fee'
    ],
    'fees': [
      'fees', 'swap', 'swaps', 'overnight_fee', 'financing_cost', 
      'funding_fee', 'rollover', 'other_fees', 'financing', 'interest'
    ],
    'profit': [
      'profit', 'pnl', 'p&l', 'pl', 'net_pnl', 'realized_pnl', 
      'gain_loss', 'profit_loss', 'result', 'outcome', 'closed_pnl',
      'net_profit', 'total_pnl'
    ],
    'market_type': [
      'market_type', 'market', 'asset_type', 'instrument_type', 
      'product_type', 'category'
    ],
    'contract_multiplier': [
      'contract_multiplier', 'multiplier', 'lot_size', 'contract_size',
      'point_value', 'tick_value'
    ]
  };

  // Normalize function for better matching
  const normalize = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscores
      .replace(/_+/g, '_') // Multiple underscores to single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  };

  // Tokenize for keyword matching
  const tokenize = (str: string): string[] => {
    return normalize(str).split('_').filter(token => token.length > 0);
  };

  // Advanced matching function
  const findBestMatch = (tradelensField: string, csvHeaders: string[]): string | null => {
    const possibleTerms = advancedMappings[tradelensField] || [];
    
    // Priority 1: Exact match (case-insensitive, normalized)
    for (const term of possibleTerms) {
      const normalizedTerm = normalize(term);
      const exactMatch = csvHeaders.find(header => 
        normalize(header) === normalizedTerm
      );
      if (exactMatch) {
        console.log(`Exact match found for ${tradelensField}: ${exactMatch}`);
        return exactMatch;
      }
    }

    // Priority 2: Contains match (term is contained in header)
    for (const term of possibleTerms) {
      const normalizedTerm = normalize(term);
      const containsMatch = csvHeaders.find(header => 
        normalize(header).includes(normalizedTerm)
      );
      if (containsMatch) {
        console.log(`Contains match found for ${tradelensField}: ${containsMatch}`);
        return containsMatch;
      }
    }

    // Priority 3: Header contains term
    for (const term of possibleTerms) {
      const normalizedTerm = normalize(term);
      const headerContainsMatch = csvHeaders.find(header => 
        normalizedTerm.includes(normalize(header))
      );
      if (headerContainsMatch) {
        console.log(`Header contains match found for ${tradelensField}: ${headerContainsMatch}`);
        return headerContainsMatch;
      }
    }

    // Priority 4: Keyword/token matching
    for (const term of possibleTerms) {
      const termTokens = tokenize(term);
      const keywordMatch = csvHeaders.find(header => {
        const headerTokens = tokenize(header);
        // Check if any term token matches any header token
        return termTokens.some(termToken => 
          headerTokens.some(headerToken => 
            termToken === headerToken || 
            termToken.includes(headerToken) || 
            headerToken.includes(termToken)
          )
        );
      });
      if (keywordMatch) {
        console.log(`Keyword match found for ${tradelensField}: ${keywordMatch}`);
        return keywordMatch;
      }
    }

    return null;
  };

  // Special handling for price fields when only one price column exists
  const handlePriceFields = (csvHeaders: string[], mappings: Record<string, string>) => {
    const priceHeaders = csvHeaders.filter(header => 
      normalize(header).includes('price') && 
      !Object.values(mappings).includes(header)
    );

    // If we have unmapped price fields and missing entry/exit prices
    if (priceHeaders.length > 0) {
      if (!mappings.entry_price && !mappings.exit_price) {
        // If only one price field, likely entry price for open trades
        if (priceHeaders.length === 1) {
          mappings.entry_price = priceHeaders[0];
          console.log(`Single price field mapped to entry_price: ${priceHeaders[0]}`);
        }
      }
    }
  };

  // Apply advanced matching for each field
  console.log('Starting advanced CSV mapping...');
  console.log('Available headers:', csvHeaders);

  for (const [tradelensField] of Object.entries(advancedMappings)) {
    const match = findBestMatch(tradelensField, csvHeaders);
    if (match) {
      mappings[tradelensField] = match;
    }
  }

  // Handle special cases
  handlePriceFields(csvHeaders, mappings);

  // Remove duplicates - if multiple fields map to same header, keep the most important
  const usedHeaders = new Set<string>();
  const priorityOrder = [
    'entry_time', 'exit_time', 'action', 'quantity', 'instrument', 
    'entry_price', 'exit_price', 'profit', 'commission', 'fees',
    'sl', 'target', 'market_type', 'contract_multiplier'
  ];

  const finalMappings: Record<string, string> = {};
  for (const field of priorityOrder) {
    if (mappings[field] && !usedHeaders.has(mappings[field])) {
      finalMappings[field] = mappings[field];
      usedHeaders.add(mappings[field]);
    }
  }

  console.log('Final mappings:', finalMappings);
  return finalMappings;
};

// Parse number with maximum precision - no rounding
const parseHighPrecisionNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  
  // Convert to string and remove commas
  const stringValue = String(value).replace(/,/g, '');
  
  // Use parseFloat to maintain precision - don't round
  const numValue = parseFloat(stringValue);
  
  return isNaN(numValue) ? null : numValue;
};

// High precision contract multiplier calculation
export const calculateContractMultiplier = (
  profit: number,
  commission: number,
  fees: number,
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  action: string
): { multiplier: number; warning?: string } => {
  try {
    console.log('Contract Multiplier Calculation (High Precision):', {
      profit,
      commission,
      fees,
      entryPrice,
      exitPrice,
      quantity,
      action
    });

    // Validate inputs - use exact values without any rounding
    if (quantity === 0) {
      return { multiplier: 1, warning: 'Quantity is zero, cannot calculate multiplier' };
    }
    
    if (entryPrice === 0 || exitPrice === 0) {
      return { multiplier: 1, warning: 'Entry or exit price is zero, cannot calculate multiplier' };
    }

    // The profit from CSV already includes fees and commissions
    // So we subtract them to get the raw P&L
    const rawPnL = profit - (commission || 0) - (fees || 0);

    // Calculate price difference based on action - maintain full precision
    let priceDiff: number;
    if (action.toLowerCase() === 'buy') {
      priceDiff = exitPrice - entryPrice;
    } else {
      priceDiff = entryPrice - exitPrice;
    }

    console.log('Precise calculation details:', {
      rawPnL,
      priceDiff,
      quantity,
      commission: commission || 0,
      fees: fees || 0
    });

    if (priceDiff === 0) {
      return { multiplier: 1, warning: 'Price difference is zero, cannot calculate multiplier' };
    }

    // Calculate contract multiplier with full precision - no intermediate rounding
    const multiplier = rawPnL / (priceDiff * quantity);
    
    console.log('Calculated multiplier (before final rounding):', multiplier);

    // Check if multiplier is reasonable
    if (!isFinite(multiplier)) {
      return { multiplier: 1, warning: 'Calculated multiplier is infinite or NaN' };
    }

    if (multiplier <= 0) {
      return { multiplier: Math.abs(multiplier), warning: 'Calculated multiplier is negative or zero' };
    }
    
    if (Math.abs(multiplier) > 1000000) {
      return { multiplier: 1, warning: 'Calculated multiplier is unusually large' };
    }

    // Only round at the very end - maintain 10 decimal places precision
    const roundedMultiplier = Math.round(multiplier * 10000000000) / 10000000000;
    
    console.log('Final multiplier:', roundedMultiplier);

    return { multiplier: roundedMultiplier };
  } catch (error) {
    console.error('Contract multiplier calculation error:', error);
    return { multiplier: 1, warning: 'Failed to calculate contract multiplier' };
  }
};

// Detect market type based on instrument symbol
export const detectMarketType = (instrument: string): string => {
  if (!instrument) return '';
  
  const symbol = instrument.toUpperCase();
  
  // Forex patterns
  const forexPatterns = [
    /^[A-Z]{3}[A-Z]{3}$/, // EURUSD, GBPJPY, etc.
    /^[A-Z]{6}$/,
  ];
  
  // Crypto patterns
  const cryptoPatterns = [
    /BTC/, /ETH/, /SOL/, /XRP/, /ADA/, /DOT/, /LINK/, /UNI/,
    /USD$/, /USDT$/, /BUSD$/
  ];
  
  // Indices patterns
  const indicesPatterns = [
    /US100/, /SPX500/, /DAX40/, /FTSE100/, /NAS100/, /SPX/, /NDX/
  ];
  
  // Commodities patterns
  const commoditiesPatterns = [
    /XAU/, /XAG/, /GOLD/, /SILVER/, /OIL/, /CRUDE/, /NATGAS/, /WTI/, /BRENT/
  ];
  
  // Check patterns
  if (forexPatterns.some(pattern => pattern.test(symbol))) {
    return 'Forex';
  }
  
  if (cryptoPatterns.some(pattern => pattern.test(symbol))) {
    return 'Crypto';
  }
  
  if (indicesPatterns.some(pattern => pattern.test(symbol))) {
    return 'Indices';
  }
  
  if (commoditiesPatterns.some(pattern => pattern.test(symbol))) {
    return 'Commodities';
  }
  
  // Check for futures/options patterns
  if (symbol.includes('=F') || symbol.includes('ES') || symbol.includes('NQ')) {
    return 'Futures';
  }
  
  if (symbol.includes('CALL') || symbol.includes('PUT') || /\d{6}[CP]\d+/.test(symbol)) {
    return 'Options';
  }
  
  // Default to Stock for common stock symbols
  if (/^[A-Z]{1,5}$/.test(symbol)) {
    return 'Stock';
  }
  
  return ''; // Unknown, let user decide
};

// Format timestamp to YYYY-MM-DD HH:MM:SS without timezone conversion
export const formatTimestamp = (timestamp: any): string | null => {
  if (!timestamp) return null;
  
  try {
    const str = String(timestamp).trim();
    
    // If already in correct format, return as-is
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
      return str;
    }
    
    // If in ISO format (with T separator), convert to space
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
      return str.substring(0, 19).replace('T', ' ');
    }
    
    // Handle DD/MM/YYYY HH:MM:SS format
    const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year, hour, minute, second] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute}:${second}`;
    }
    
    // Handle MM-DD-YYYY HH:MM:SS format
    const mmddyyyyMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (mmddyyyyMatch) {
      const [, month, day, year, hour, minute, second] = mmddyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute}:${second}`;
    }
    
    // Handle DD-MM-YYYY HH:MM:SS format
    const ddmmyyyyDashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (ddmmyyyyDashMatch) {
      const [, day, month, year, hour, minute, second] = ddmmyyyyDashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute}:${second}`;
    }
    
    // Handle formats without seconds - add :00
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(str)) {
      return str + ':00';
    }
    
    // Handle 12-hour format conversion (AM/PM)
    const ampmMatch = str.match(/^(.+)\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
    if (ampmMatch) {
      const [, datePart, hour, minute, second, period] = ampmMatch;
      let hour24 = parseInt(hour);
      
      if (period.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      // Parse date part
      const dateFormatted = formatTimestamp(datePart + ' 00:00:00');
      if (dateFormatted) {
        const [datePortion] = dateFormatted.split(' ');
        return `${datePortion} ${hour24.toString().padStart(2, '0')}:${minute}:${second}`;
      }
    }
    
    // As last resort, try parsing as Date but extract components manually to avoid timezone issues
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      // Use getFullYear, getMonth, etc. to get local components
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return null;
  }
};

// Process CSV data with mappings - maintain full precision
export const processCSVData = async (
  data: any[],
  mappings: Record<string, string>
): Promise<ProcessedDataResult> => {
  const processedData: any[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const processedRow: any = { _warnings: [] };

    // Map basic fields
    for (const [tradelensField, csvColumn] of Object.entries(mappings)) {
      if (csvColumn && row[csvColumn] !== undefined) {
        let value = row[csvColumn];

        // Process different field types
        switch (tradelensField) {
          case 'entry_time':
          case 'exit_time':
            value = formatTimestamp(value);
            break;
          
          case 'action':
            value = String(value).toLowerCase();
            if (!['buy', 'sell'].includes(value)) {
              processedRow._warnings.push(tradelensField);
              warnings.push(`Row ${i + 1}: Invalid action "${value}", defaulting to "buy"`);
              value = 'buy';
            }
            break;
          
          case 'quantity':
          case 'entry_price':
          case 'exit_price':
          case 'sl':
          case 'target':
          case 'commission':
          case 'fees':
          case 'profit':
            // Use high precision parsing - NO ROUNDING
            const numValue = parseHighPrecisionNumber(value);
            if (numValue === null) {
              processedRow._warnings.push(tradelensField);
              value = null;
            } else {
              value = numValue; // Keep full precision
            }
            break;
          
          case 'instrument':
            if (!value || String(value).trim() === '') {
              processedRow._warnings.push(tradelensField);
              warnings.push(`Row ${i + 1}: Missing instrument`);
            }
            break;
        }

        processedRow[tradelensField] = value;
      }
    }

    // Auto-detect market type if not mapped
    if (!processedRow.market_type && processedRow.instrument) {
      processedRow.market_type = detectMarketType(processedRow.instrument);
    }

    // Calculate contract multiplier if profit is available - use precise values
    if (processedRow.profit !== null && processedRow.profit !== undefined && 
        processedRow.entry_price && processedRow.exit_price && 
        processedRow.quantity && processedRow.action) {
      
      const result = calculateContractMultiplier(
        processedRow.profit,
        processedRow.commission || 0,
        processedRow.fees || 0,
        processedRow.entry_price,
        processedRow.exit_price,
        processedRow.quantity,
        processedRow.action
      );

      processedRow.contract_multiplier = result.multiplier;
      
      if (result.warning) {
        processedRow._warnings.push('contract_multiplier');
        warnings.push(`Row ${i + 1}: ${result.warning}`);
      }
    } else if (!processedRow.contract_multiplier) {
      processedRow.contract_multiplier = 1; // Default value
    }

    // Ensure commission and fees are positive
    if (processedRow.commission && processedRow.commission < 0) {
      processedRow.commission = Math.abs(processedRow.commission);
    }
    if (processedRow.fees && processedRow.fees < 0) {
      processedRow.fees = Math.abs(processedRow.fees);
    }

    processedData.push(processedRow);
  }

  return { data: processedData, warnings };
};


// Export processed data as formatted CSV
export const exportFormattedCSV = (data: any[]) => {
  const columns = [
    'entry_price', 'exit_price', 'entry_time', 'exit_time', 'action', 'quantity',
    'contract_multiplier', 'instrument', 'sl', 'target', 'commission', 'fees', 'market_type'
  ];

  const csvData = data.map(row => {
    const csvRow: any = {};
    columns.forEach(col => {
      csvRow[col] = row[col] || '';
    });
    return csvRow;
  });

  const csv = Papa.unparse(csvData, {
    header: true,
    columns: columns
  });

  // Download the CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `tradelens_formatted_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// =====================================================
// CSV IMPORT VALIDATION HELPERS
// =====================================================

// Valid market types as per database schema
const VALID_MARKET_TYPES = ['stocks', 'forex', 'crypto', 'futures', 'options', 'commodities'] as const;
export type ValidMarketType = typeof VALID_MARKET_TYPES[number];

// Valid action types as per database schema
const VALID_ACTIONS = ['long', 'short', 'buy', 'sell'] as const;
export type ValidAction = typeof VALID_ACTIONS[number];

// Valid status types as per database schema
const VALID_STATUSES = ['open', 'partially_closed', 'closed', 'cancelled'] as const;
export type ValidStatus = typeof VALID_STATUSES[number];

/**
 * Normalize and validate market type
 * Converts common variations to database-compatible values
 */
export const normalizeMarketType = (marketType: string | null | undefined): ValidMarketType | null => {
  if (!marketType) return null;
  
  const normalized = marketType.toLowerCase().trim();
  
  // Direct match
  if (VALID_MARKET_TYPES.includes(normalized as ValidMarketType)) {
    return normalized as ValidMarketType;
  }
  
  // Handle common variations
  const mappings: Record<string, ValidMarketType> = {
    'stock': 'stocks',
    'equity': 'stocks',
    'equities': 'stocks',
    'fx': 'forex',
    'foreign exchange': 'forex',
    'cryptocurrency': 'crypto',
    'cryptocurrencies': 'crypto',
    'bitcoin': 'crypto',
    'future': 'futures',
    'option': 'options',
    'commodity': 'commodities',
    'indices': 'stocks', // Map indices to stocks as fallback
    'index': 'stocks'
  };
  
  return mappings[normalized] || null;
};

/**
 * Validate if market type is valid
 */
export const isValidMarketType = (marketType: string): boolean => {
  return normalizeMarketType(marketType) !== null;
};

/**
 * Normalize and validate action
 * Handles both buy/sell and long/short terminology
 */
export const normalizeAction = (action: string | null | undefined): ValidAction | null => {
  if (!action) return null;
  
  const normalized = action.toLowerCase().trim();
  
  // Direct match
  if (VALID_ACTIONS.includes(normalized as ValidAction)) {
    return normalized as ValidAction;
  }
  
  // Handle variations
  const mappings: Record<string, ValidAction> = {
    'b': 'buy',
    'bought': 'buy',
    'long': 'buy', // Map long to buy for compatibility
    's': 'sell',
    'sold': 'sell',
    'short': 'sell' // Map short to sell for compatibility
  };
  
  return mappings[normalized] || null;
};

/**
 * Validate if action is valid
 */
export const isValidAction = (action: string): boolean => {
  return normalizeAction(action) !== null;
};

/**
 * Calculate trade status based on exit data
 */
export const calculateTradeStatus = (
  exitPrice: number | null | undefined,
  exitTime: string | null | undefined,
  quantity: number,
  exitQuantity?: number
): 'open' | 'partially_closed' | 'closed' => {
  // If no exit price or exit time, trade is open
  if (!exitPrice || !exitTime) {
    return 'open';
  }
  
  // If exit quantity is provided and less than total quantity, partially closed
  if (exitQuantity !== undefined && exitQuantity > 0 && exitQuantity < quantity) {
    return 'partially_closed';
  }
  
  // If exit price and time exist, trade is closed
  return 'closed';
};

/**
 * Extract trade date from entry time
 * Returns YYYY-MM-DD format for database DATE field
 */
export const extractTradeDate = (entryTime: string | Date): string | null => {
  try {
    const date = typeof entryTime === 'string' ? new Date(entryTime) : entryTime;
    
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error extracting trade date:', error);
    return null;
  }
};

/**
 * Sanitize numeric value
 * Ensures valid number or null
 */
export const sanitizeNumeric = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  
  return isNaN(num) ? null : num;
};

/**
 * Validate required fields for CSV import
 */
export const validateTradeData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields
  if (!data.instrument || String(data.instrument).trim() === '') {
    errors.push('instrument is required');
  }
  
  if (!data.action) {
    errors.push('action is required');
  } else if (!isValidAction(data.action)) {
    errors.push(`action must be one of: ${VALID_ACTIONS.join(', ')}`);
  }
  
  if (!data.entry_time) {
    errors.push('entry_time is required');
  }
  
  if (!data.entry_price || sanitizeNumeric(data.entry_price) === null) {
    errors.push('entry_price is required and must be a valid number');
  }
  
  if (!data.quantity || sanitizeNumeric(data.quantity) === null) {
    errors.push('quantity is required and must be a valid number');
  }
  
  // Validate market type if provided
  if (data.market_type && !isValidMarketType(data.market_type)) {
    errors.push(`market_type must be one of: ${VALID_MARKET_TYPES.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

