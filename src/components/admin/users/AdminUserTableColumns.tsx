
export const adminUserColumns = [
  // Basic user info columns
  { id: 'username', label: 'Username', default: true, priority: 1 },
  { id: 'email', label: 'Email', default: true, priority: 2 },
  { id: 'subscription_plan', label: 'Plan', default: true, priority: 3 },
  { id: 'signup_date', label: 'Signup Date', default: true, priority: 4 },
  { id: 'last_login', label: 'Last Login', default: true, priority: 5 },
  { id: 'user_role', label: 'Role', default: true, priority: 6 },
  { id: 'user_status', label: 'Status', default: true, priority: 7 },
  
  // Subscription related columns
  { id: 'next_billing_date', label: 'Next Billing Date', default: false, priority: 8 },
  { id: 'subscription_end_date', label: 'Subscription End', default: false, priority: 9 },
  
  // Trading metrics columns
  { id: 'net_pl', label: 'Net P&L', default: false, priority: 11 },
  { id: 'win_rate', label: 'Win Rate', default: false, priority: 12 },
  { id: 'trades_count', label: 'Trades Logged', default: false, priority: 13 },
  { id: 'last_trade_date', label: 'Last Trade', default: false, priority: 14 },
  { id: 'accounts_count', label: 'Active Accounts', default: false, priority: 15 },
  { id: 'strategies_count', label: 'Strategy Count', default: false, priority: 16 },
  
  // User preferences columns
  { id: 'base_currency', label: 'Currency', default: false, priority: 17 },
  { id: 'time_zone', label: 'Timezone', default: false, priority: 18 },
  { id: 'dark_mode', label: 'Dark Mode', default: false, priority: 19 },
];

export const getColumnValue = (user: any, columnId: string) => {
  switch (columnId) {
    case 'username':
      return user.username || 'N/A';
    case 'email':
      return user.email || 'N/A';
    case 'subscription_plan':
      return user.subscription_plan || 'Free Trial';
    case 'signup_date':
      return user.signup_date ? new Date(user.signup_date).toLocaleDateString() : 'N/A';
    case 'last_login':
      return user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
    case 'user_role':
      return user.user_role || 'User';
    case 'user_status':
      return user.user_status || 'Active';

    case 'next_billing_date':
      return user.next_billing_date ? new Date(user.next_billing_date).toLocaleDateString() : 'N/A';
    case 'subscription_end_date':
      return user.end_date ? new Date(user.end_date).toLocaleDateString() : 'N/A';
    case 'net_pl':
      return user.net_pl !== null && user.net_pl !== undefined ? `$${user.net_pl.toFixed(2)}` : '$0.00';
    case 'win_rate':
      return user.win_rate !== null && user.win_rate !== undefined ? `${user.win_rate.toFixed(1)}%` : '0%';
    case 'trades_count':
      return user.trades_count || 0;
    case 'last_trade_date':
      return user.last_trade_date ? new Date(user.last_trade_date).toLocaleDateString() : 'Never';
    case 'accounts_count':
      return user.accounts_count || 0;
    case 'strategies_count':
      return user.strategies_count || 0;
    case 'base_currency':
      return user.base_currency || 'USD';
    case 'time_zone':
      return user.time_zone || 'UTC';
    case 'dark_mode':
      return user.dark_mode ? 'Yes' : 'No';
    default:
      return user[columnId] || 'N/A';
  }
};
