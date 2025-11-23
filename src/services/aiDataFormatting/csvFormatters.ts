
export interface TradeCSVRow {
  date: string;
  instrument: string;
  action: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  net_pnl: number | null;
  percent_gain: number | null;
  r_multiple: number | null;
  outcome: string | null;
  strategy: string;
  account: string;
  timeframe: string | null;
  stop_loss: number | null;
  target: number | null;
  duration: string | null;
  fees: number;
  notes: string | null;
  rating: number | null;
}

// New interface for Journal CSV
export interface JournalCSVRow {
  journal_date: string;
  notes: string | null;
  net_pl: number | null;
  win_rate: number | null;
  num_trades: number | null;
  winning_trades: number | null;
  losing_trades: number | null;
  total_profitable_pl: number | null;
  total_losing_pl: number | null;
  total_fees: number | null;
  profit_factor: number | null;
}

// New interface for Journal-specific trades CSV
export interface JournalTradeCSVRow {
  trade_date: string;
  instrument: string;
  action: string;
  entry_price: number | null;
  exit_price: number | null;
  net_pnl: number | null;
  notes: string | null;
  rating: number | null;
  tags: string | null;
  strategy: string;
}

export const formatTradesAsCSV = (trades: any[], accounts: any[], strategies: any[]): string => {
  // Create lookup maps
  const accountMap = new Map(accounts.map(acc => [acc.account_id, acc.account_name]));
  const strategyMap = new Map(strategies.map(str => [str.strategy_id, str.strategy_name]));

  // CSV Header
  const headers = [
    'date', 'instrument', 'action', 'entry_price', 'exit_price', 'quantity',
    'net_pnl', 'percent_gain', 'r_multiple', 'outcome', 'strategy', 'account',
    'timeframe', 'stop_loss', 'target', 'duration', 'fees', 'notes', 'rating'
  ];

  const csvRows = [headers.join(',')];

  trades.forEach(trade => {
    const metrics = trade.trade_metrics?.[0];
    const strategy = strategyMap.get(trade.strategy_id) || 'No Strategy';
    const account = accountMap.get(trade.account_id) || 'Unknown Account';
    
    const row: (string | number | null)[] = [
      trade.trade_date?.split('T')[0] || trade.entry_time?.split('T')[0] || '',
      trade.instrument || '',
      trade.action || '',
      trade.entry_price || 0,
      trade.exit_price || null,
      trade.quantity || 0,
      metrics?.net_p_and_l || null,
      metrics?.percent_gain || null,
      metrics?.r2r || null,
      metrics?.trade_outcome || (trade.exit_price ? 'CLOSED' : 'OPEN'),
      strategy,
      account,
      trade.trade_time_frame || null,
      trade.sl || null,
      trade.target || null,
      metrics?.trade_duration ? `${metrics.trade_duration}` : null,
      (trade.commission || 0) + (trade.fees || 0),
      trade.notes ? `"${trade.notes.replace(/"/g, '""')}"` : null,
      trade.rating || null
    ];

    csvRows.push(row.map(val => val === null ? '' : val).join(','));
  });

  return csvRows.join('\n');
};

// New function for Journal-only CSV export
export const formatJournalAsCSV = (journals: any[]): string => {
  const headers = [
    'journal_date', 'notes', 'net_pl', 'win_rate', 'num_trades', 
    'winning_trades', 'losing_trades', 'total_profitable_pl', 
    'total_losing_pl', 'total_fees', 'profit_factor'
  ];

  const csvRows = [headers.join(',')];

  journals.forEach(journal => {
    const row = [
      journal.journal_date?.split('T')[0] || '',
      journal.notes ? `"${journal.notes.replace(/"/g, '""')}"` : '',
      journal.net_pl || 0,
      journal.win_rate || 0,
      journal.num_trades || 0,
      journal.winning_trades || 0,
      journal.losing_trades || 0,
      journal.total_profitable_pl || 0,
      journal.total_losing_pl || 0,
      journal.total_fees || 0,
      journal.profit_factor || 0
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

// New function for Journal-specific trades CSV export (optimized fields only)
export const formatJournalTradesAsCSV = (trades: any[], strategies: any[]): string => {
  const strategyMap = new Map(strategies.map(str => [str.strategy_id, str.strategy_name]));

  const headers = [
    'trade_date', 'instrument', 'action', 'entry_price', 'exit_price', 
    'net_pnl', 'notes', 'rating', 'tags', 'strategy'
  ];

  const csvRows = [headers.join(',')];

  trades.forEach(trade => {
    const metrics = trade.trade_metrics?.[0];
    const strategy = strategyMap.get(trade.strategy_id) || 'No Strategy';
    
    const row = [
      trade.entry_time?.split('T')[0] || trade.trade_date?.split('T')[0] || '',
      trade.instrument || '',
      trade.action || '',
      trade.entry_price || 0,
      trade.exit_price || '',
      metrics?.net_p_and_l || trade.net_pl || 0,
      trade.notes ? `"${trade.notes.replace(/"/g, '""')}"` : '',
      trade.trade_rating || trade.rating || '',
      Array.isArray(trade.tags) ? trade.tags.join('; ') : '',
      strategy
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

export const formatAccountsAsCSV = (accounts: any[]): string => {
  const headers = ['account_name', 'broker', 'account_type', 'current_balance', 'starting_balance', 'status'];
  const csvRows = [headers.join(',')];

  accounts.forEach(account => {
    const row = [
      account.account_name || '',
      account.broker || '',
      account.type || '',
      account.current_balance || 0,
      account.starting_balance || 0,
      account.status || 'Active'
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

export const formatStrategiesAsCSV = (strategies: any[], strategyRules: any[]): string => {
  const headers = ['strategy_name', 'description', 'total_trades', 'wins', 'losses', 'win_rate', 'net_pnl'];
  const csvRows = [headers.join(',')];

  strategies.forEach(strategy => {
    const row = [
      strategy.strategy_name || '',
      strategy.description ? `"${strategy.description.replace(/"/g, '""')}"` : '',
      strategy.total_trades || 0,
      strategy.wins || 0,
      strategy.losses || 0,
      strategy.win_rate || 0,
      strategy.net_pl || 0
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};
