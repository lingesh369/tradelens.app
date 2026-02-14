import { supabase } from '@/integrations/supabase/client';
import { fetchTrades } from '@/api/trades/tradeQueries';

export interface UserDataContext {
  userId: string;
  trades: any[];
  strategies: any[];
  accounts: any[];
  journal: any[];
  tags: any[];
  settings: any;
  summary: {
    totalTrades: number;
    winRate: number;
    netPnL: number;
    activeStrategies: number;
    accountCount: number;
    journalEntries: number;
  };
}

export interface QueryContext {
  queryType: 'performance' | 'strategy' | 'account' | 'journal' | 'general';
  timeRange?: { from: string; to: string };
  specificStrategy?: string;
  specificAccount?: string;
  keywords: string[];
}

export const classifyUserQuery = (message: string, userStrategies: any[], userAccounts: any[]): QueryContext => {
  const lowerMessage = message.toLowerCase();
  const keywords = lowerMessage.split(/\s+/);
  
  // Determine query type
  let queryType: QueryContext['queryType'] = 'general';
  
  if (lowerMessage.match(/\b(perform|performance|result|profit|loss|pnl|trading|week|month|day)\b/)) {
    queryType = 'performance';
  } else if (lowerMessage.match(/\b(strategy|strategies|breakout|scalp|swing|approach|method)\b/)) {
    queryType = 'strategy';
  } else if (lowerMessage.match(/\b(account|balance|portfolio|equity)\b/)) {
    queryType = 'account';
  } else if (lowerMessage.match(/\b(journal|note|insight|reflection|lesson|mistake)\b/)) {
    queryType = 'journal';
  }
  
  // Extract time range
  let timeRange: { from: string; to: string } | undefined;
  const now = new Date();
  
  if (lowerMessage.includes('today')) {
    const today = now.toISOString().split('T')[0];
    timeRange = { from: today, to: today };
  } else if (lowerMessage.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    timeRange = { from: yesterdayStr, to: yesterdayStr };
  } else if (lowerMessage.includes('this week') || lowerMessage.includes('week')) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    timeRange = {
      from: startOfWeek.toISOString().split('T')[0],
      to: endOfWeek.toISOString().split('T')[0]
    };
  } else if (lowerMessage.includes('last week')) {
    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    timeRange = {
      from: startOfLastWeek.toISOString().split('T')[0],
      to: endOfLastWeek.toISOString().split('T')[0]
    };
  } else if (lowerMessage.includes('this month') || lowerMessage.includes('month')) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    timeRange = {
      from: startOfMonth.toISOString().split('T')[0],
      to: endOfMonth.toISOString().split('T')[0]
    };
  } else if (lowerMessage.includes('last month')) {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    timeRange = {
      from: startOfLastMonth.toISOString().split('T')[0],
      to: endOfLastMonth.toISOString().split('T')[0]
    };
  } else if (lowerMessage.includes('recent') || lowerMessage.includes('lately')) {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    timeRange = {
      from: weekAgo.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0]
    };
  }
  
  // Find specific strategy mention
  const specificStrategy = userStrategies.find(s => 
    lowerMessage.includes(s.strategy_name.toLowerCase())
  )?.strategy_name;
  
  // Find specific account mention
  const specificAccount = userAccounts.find(a => 
    lowerMessage.includes(a.account_name.toLowerCase())
  )?.account_name;
  
  return {
    queryType,
    timeRange,
    specificStrategy,
    specificAccount,
    keywords
  };
};

export const fetchComprehensiveUserData = async (userId: string, context: QueryContext): Promise<UserDataContext> => {
  console.log('Fetching comprehensive user data for:', { userId, context });
  
  try {
    // Use the proven fetchTrades function from tradeQueries for trade data
    const tradesPromise = fetchTrades(userId);
    
    // Fetch other data in parallel with better error handling
    const [
      tradesResponse,
      strategiesResponse,
      accountsResponse,
      journalResponse,
      tagsResponse,
      settingsResponse
    ] = await Promise.allSettled([
      tradesPromise,
      fetchUserStrategies(userId, context),
      fetchUserAccounts(userId, context),
      fetchUserJournal(userId, context),
      fetchUserTags(userId, context),
      fetchUserSettings(userId)
    ]);
    
    const trades = tradesResponse.status === 'fulfilled' ? tradesResponse.value || [] : [];
    const strategies = strategiesResponse.status === 'fulfilled' ? strategiesResponse.value || [] : [];
    const accounts = accountsResponse.status === 'fulfilled' ? accountsResponse.value || [] : [];
    const journal = journalResponse.status === 'fulfilled' ? journalResponse.value || [] : [];
    const tags = tagsResponse.status === 'fulfilled' ? tagsResponse.value || [] : [];
    const settings = settingsResponse.status === 'fulfilled' ? settingsResponse.value || {} : {};
    
    // Log any failures
    if (tradesResponse.status === 'rejected') {
      console.error('Failed to fetch trades:', tradesResponse.reason);
    }
    if (strategiesResponse.status === 'rejected') {
      console.error('Failed to fetch strategies:', strategiesResponse.reason);
    }
    if (accountsResponse.status === 'rejected') {
      console.error('Failed to fetch accounts:', accountsResponse.reason);
    }
    if (journalResponse.status === 'rejected') {
      console.error('Failed to fetch journal:', journalResponse.reason);
    }
    if (tagsResponse.status === 'rejected') {
      console.error('Failed to fetch tags:', tagsResponse.reason);
    }
    if (settingsResponse.status === 'rejected') {
      console.error('Failed to fetch settings:', settingsResponse.reason);
    }
    
    // Calculate summary statistics
    const summary = calculateUserSummary(trades, strategies, accounts, journal);
    
    console.log('Final data summary:', {
      tradesCount: trades.length,
      strategiesCount: strategies.length,
      accountsCount: accounts.length,
      journalCount: journal.length,
      tagsCount: tags.length,
      summary
    });
    
    return {
      userId,
      trades,
      strategies,
      accounts,
      journal,
      tags,
      settings,
      summary
    };
  } catch (error) {
    console.error('Error fetching comprehensive user data:', error);
    return {
      userId,
      trades: [],
      strategies: [],
      accounts: [],
      journal: [],
      tags: [],
      settings: {},
      summary: {
        totalTrades: 0,
        winRate: 0,
        netPnL: 0,
        activeStrategies: 0,
        accountCount: 0,
        journalEntries: 0
      }
    };
  }
};

const fetchUserStrategies = async (userId: string, context: QueryContext) => {
  console.log('Fetching strategies for user:', userId);
  
  try {
    let query = supabase
      .from('strategies')
      .select(`
        *,
        strategy_rules(
          rule_title,
          rule_description,
          rule_type
        )
      `)
      .eq('user_id', userId);
    
    if (context.specificStrategy) {
      query = query.eq('strategy_name', context.specificStrategy);
    }
    
    const { data: strategies, error } = await query;
    
    if (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }

    console.log(`Fetched ${strategies?.length || 0} strategies for user ${userId}`);

    // Get trade performance for each strategy
    const enrichedStrategies = await Promise.all((strategies || []).map(async (strategy: any) => {
      // Get recent trades for this strategy
      const { data: recentTrades } = await supabase
        .from('trades')
        .select(`
          trade_id,
          instrument,
          action,
          entry_price,
          exit_price,
          trade_date,
          notes,
          trade_metrics!trade_metrics_trade_id_fkey(net_p_and_l, trade_outcome, percent_gain)
        `)
        .eq('user_id', userId)
        .eq('strategy_id', strategy.strategy_id)
        .order('trade_date', { ascending: false })
        .limit(10);

      strategy.recentTrades = recentTrades || [];
      
      // Calculate performance metrics
      if (recentTrades && recentTrades.length > 0) {
        const metrics = recentTrades.map(t => t.trade_metrics?.[0]).filter(Boolean);
        const totalPnL = metrics.reduce((sum, m) => sum + (m?.net_p_and_l || 0), 0);
        const winningTrades = metrics.filter(m => (m?.net_p_and_l || 0) > 0).length;
        const winRate = metrics.length > 0 ? (winningTrades / metrics.length) * 100 : 0;
        
        strategy.calculatedMetrics = {
          totalPnL: Math.round(totalPnL * 100) / 100,
          winRate: Math.round(winRate * 100) / 100,
          totalTrades: recentTrades.length,
          avgGain: metrics.length > 0 ? Math.round((totalPnL / metrics.length) * 100) / 100 : 0
        };
      }
      
      return strategy;
    }));
    
    return enrichedStrategies;
  } catch (error) {
    console.error('Error in fetchUserStrategies:', error);
    throw error;
  }
};

const fetchUserAccounts = async (userId: string, context: QueryContext) => {
  console.log('Fetching accounts for user:', userId);
  
  try {
    let query = supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    
    if (context.specificAccount) {
      query = query.eq('account_name', context.specificAccount);
    }
    
    const { data: accounts, error } = await query;
    
    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }

    console.log(`Fetched ${accounts?.length || 0} accounts for user ${userId}`);

    // Enrich accounts with trading performance
    const enrichedAccounts = await Promise.all((accounts || []).map(async (account: any) => {
      // Get trades count and performance for this account
      const { data: accountTrades } = await supabase
        .from('trades')
        .select(`
          trade_id,
          instrument,
          action,
          entry_price,
          exit_price,
          trade_date,
          trade_metrics!trade_metrics_trade_id_fkey(net_p_and_l, trade_outcome)
        `)
        .eq('user_id', userId)
        .eq('account_id', account.account_id)
        .order('trade_date', { ascending: false })
        .limit(50);

      if (accountTrades && accountTrades.length > 0) {
        const metrics = accountTrades.map(t => t.trade_metrics?.[0]).filter(Boolean);
        const totalPnL = metrics.reduce((sum, m) => sum + (m?.net_p_and_l || 0), 0);
        const winningTrades = metrics.filter(m => (m?.net_p_and_l || 0) > 0).length;
        const winRate = metrics.length > 0 ? (winningTrades / metrics.length) * 100 : 0;
        
        account.performanceMetrics = {
          totalTrades: accountTrades.length,
          totalPnL: Math.round(totalPnL * 100) / 100,
          winRate: Math.round(winRate * 100) / 100,
          profitFactor: calculateProfitFactor(metrics),
          recentActivity: accountTrades.slice(0, 5).map(t => ({
            instrument: t.instrument,
            action: t.action,
            date: t.trade_date,
            pnl: t.trade_metrics?.[0]?.net_p_and_l || 0
          }))
        };
      }
      
      return account;
    }));
    
    return enrichedAccounts;
  } catch (error) {
    console.error('Error in fetchUserAccounts:', error);
    throw error;
  }
};

const fetchUserJournal = async (userId: string, context: QueryContext) => {
  console.log('Fetching journal for user:', userId);
  
  try {
    let query = supabase
      .from('journal')
      .select(`
        *,
        journal_images(
          image_name,
          image_url,
          notes,
          linked_trade_id
        )
      `)
      .eq('user_id', userId)
      .order('journal_date', { ascending: false });
    
    if (context.timeRange) {
      query = query
        .gte('journal_date', context.timeRange.from)
        .lte('journal_date', context.timeRange.to);
    }
    
    const { data: journalEntries, error } = await query.limit(50);
    
    if (error) {
      console.error('Error fetching journal:', error);
      throw error;
    }

    console.log(`Fetched ${journalEntries?.length || 0} journal entries for user ${userId}`);

    // Enrich journal entries with linked trade information
    const enrichedJournal = await Promise.all((journalEntries || []).map(async (entry: any) => {
      if (entry.trades_executed) {
        try {
          const tradeIds = JSON.parse(entry.trades_executed);
          if (Array.isArray(tradeIds) && tradeIds.length > 0) {
            const { data: linkedTrades } = await supabase
              .from('trades')
              .select(`
                trade_id,
                instrument,
                action,
                entry_price,
                exit_price,
                notes,
                trade_metrics!trade_metrics_trade_id_fkey(net_p_and_l, trade_outcome)
              `)
              .in('trade_id', tradeIds)
              .eq('user_id', userId);
            
            entry.linkedTradesDetails = linkedTrades || [];
          }
        } catch (e) {
          console.warn('Error parsing trades_executed for journal entry:', entry.journal_id);
        }
      }
      
      return entry;
    }));
    
    return enrichedJournal;
  } catch (error) {
    console.error('Error in fetchUserJournal:', error);
    throw error;
  }
};

const fetchUserTags = async (userId: string, context: QueryContext) => {
  console.log('Fetching tags for user:', userId);
  
  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }

    console.log(`Fetched ${tags?.length || 0} tags for user ${userId}`);

    // Enrich tags with usage statistics
    const enrichedTags = await Promise.all((tags || []).map(async (tag: any) => {
      // Count how many trades use this tag
      const { count: tradeCount } = await supabase
        .from('trades')
        .select('trade_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .contains('tags', [tag.tag_id]);

      // Get recent trades with this tag for context
      const { data: recentTaggedTrades } = await supabase
        .from('trades')
        .select(`
          trade_id,
          instrument,
          action,
          trade_date,
          trade_metrics!trade_metrics_trade_id_fkey(net_p_and_l, trade_outcome)
        `)
        .eq('user_id', userId)
        .contains('tags', [tag.tag_id])
        .order('trade_date', { ascending: false })
        .limit(5);

      tag.usageStats = {
        tradeCount: tradeCount || 0,
        recentTrades: recentTaggedTrades || []
      };

      return tag;
    }));
    
    return enrichedTags;
  } catch (error) {
    console.error('Error in fetchUserTags:', error);
    throw error;
  }
};

// Helper function to calculate profit factor
const calculateProfitFactor = (metrics: any[]) => {
  const profits = metrics.filter(m => (m?.net_p_and_l || 0) > 0).reduce((sum, m) => sum + (m?.net_p_and_l || 0), 0);
  const losses = Math.abs(metrics.filter(m => (m?.net_p_and_l || 0) < 0).reduce((sum, m) => sum + (m?.net_p_and_l || 0), 0));
  return losses > 0 ? Math.round((profits / losses) * 100) / 100 : profits > 0 ? 999 : 0;
};

const fetchUserSettings = async (userId: string) => {
  console.log('Fetching settings for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching settings:', error);
      // Don't throw error for settings, just return empty object
      return {};
    }
    
    return data || {};
  } catch (error) {
    console.error('Error in fetchUserSettings:', error);
    return {};
  }
};

const calculateUserSummary = (trades: any[], strategies: any[], accounts: any[], journal: any[]) => {
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => 
    t.net_pl > 0 || 
    t.trade_result === 'WIN'
  ).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const netPnL = trades.reduce((sum, t) => 
    sum + (t.net_pl || 0), 0
  );
  
  return {
    totalTrades,
    winRate: Math.round(winRate * 100) / 100,
    netPnL: Math.round(netPnL * 100) / 100,
    activeStrategies: strategies.length,
    accountCount: accounts.length,
    journalEntries: journal.length
  };
};

export const formatUserDataForAI = (userDataContext: UserDataContext, queryContext: QueryContext): string => {
  const { userId, trades, strategies, accounts, journal, tags, settings, summary } = userDataContext;
  
  let formattedData = `User Trading Data Context:\n\n`;
  
  // Summary
  formattedData += `SUMMARY:\n`;
  formattedData += `- Total Trades: ${summary.totalTrades}\n`;
  formattedData += `- Win Rate: ${summary.winRate}%\n`;
  formattedData += `- Net P&L: $${summary.netPnL}\n`;
  formattedData += `- Active Strategies: ${summary.activeStrategies}\n`;
  formattedData += `- Trading Accounts: ${summary.accountCount}\n`;
  formattedData += `- Journal Entries: ${summary.journalEntries}\n\n`;
  
  // Enhanced Trades data with comprehensive details
  if (trades.length > 0) {
    formattedData += `DETAILED TRADES ANALYSIS (${trades.length} trades):\n`;
    trades.slice(0, 15).forEach((trade, index) => {
      formattedData += `${index + 1}. ${trade.instrument} ${trade.action.toUpperCase()}\n`;
      formattedData += `   Entry: $${trade.entry_price}, Exit: $${trade.exit_price || 'Open'}\n`;
      formattedData += `   P&L: $${trade.net_pl || 'N/A'} (${trade.percent_gain || 0}%)\n`;
      formattedData += `   Outcome: ${trade.trade_result || 'Open'}, Duration: ${trade.trade_duration || 'N/A'}\n`;
      
      if (trade.notes) {
        formattedData += `   Notes: ${trade.notes.substring(0, 150)}${trade.notes.length > 150 ? '...' : ''}\n`;
      }
      
      formattedData += `   Date: ${trade.trade_date?.split('T')[0] || 'Unknown'}\n\n`;
    });
  }
  
  // Enhanced Strategies data with rules and performance
  if (strategies.length > 0) {
    formattedData += `TRADING STRATEGIES ANALYSIS (${strategies.length} strategies):\n`;
    strategies.forEach((strategy, index) => {
      formattedData += `${index + 1}. ${strategy.strategy_name}\n`;
      formattedData += `   Description: ${strategy.description || 'No description'}\n`;
      
      if ((strategy as any).calculatedMetrics) {
        const calc = (strategy as any).calculatedMetrics;
        formattedData += `   Performance: ${calc.totalTrades} trades, ${calc.winRate}% win rate, $${calc.totalPnL} P&L\n`;
        formattedData += `   Average per trade: $${calc.avgGain}\n`;
      }
      
      if ((strategy as any).strategy_rules && (strategy as any).strategy_rules.length > 0) {
        formattedData += `   Rules:\n`;
        (strategy as any).strategy_rules.slice(0, 3).forEach((rule: any) => {
          formattedData += `     - ${rule.rule_type}: ${rule.rule_title}\n`;
          if (rule.rule_description) {
            formattedData += `       ${rule.rule_description.substring(0, 100)}${rule.rule_description.length > 100 ? '...' : ''}\n`;
          }
        });
      }
      
      if ((strategy as any).recentTrades && (strategy as any).recentTrades.length > 0) {
        formattedData += `   Recent Activity: ${(strategy as any).recentTrades.length} recent trades\n`;
        const recentPnL = (strategy as any).recentTrades.reduce((sum: number, t: any) => 
          sum + (t.trade_metrics?.[0]?.net_p_and_l || 0), 0);
        formattedData += `   Recent P&L: $${Math.round(recentPnL * 100) / 100}\n`;
      }
      
      formattedData += `\n`;
    });
  }
  
  // Enhanced Accounts data with performance metrics
  if (accounts.length > 0) {
    formattedData += `TRADING ACCOUNTS ANALYSIS (${accounts.length} accounts):\n`;
    accounts.forEach((account, index) => {
      formattedData += `${index + 1}. ${account.account_name} (${account.type})\n`;
      formattedData += `   Broker: ${account.broker || 'Unknown'}\n`;
      formattedData += `   Balance: $${account.current_balance || 0} (Started: $${account.starting_balance || 0})\n`;
      formattedData += `   Total P&L: $${account.profit_loss || 0}\n`;
      
      if ((account as any).performanceMetrics) {
        const perf = (account as any).performanceMetrics;
        formattedData += `   Trading Performance: ${perf.totalTrades} trades, ${perf.winRate}% win rate\n`;
        formattedData += `   Account P&L: $${perf.totalPnL}, Profit Factor: ${perf.profitFactor}\n`;
        
        if (perf.recentActivity && perf.recentActivity.length > 0) {
          formattedData += `   Recent Activity:\n`;
          perf.recentActivity.forEach((activity: any) => {
            formattedData += `     ${activity.instrument} ${activity.action}: $${activity.pnl} (${activity.date?.split('T')[0]})\n`;
          });
        }
      }
      
      formattedData += `\n`;
    });
  }
  
  // Enhanced Journal entries with insights
  if (journal.length > 0) {
    formattedData += `TRADING JOURNAL INSIGHTS (${journal.length} entries):\n`;
    journal.slice(0, 8).forEach((entry, index) => {
      formattedData += `${index + 1}. ${entry.journal_date?.split('T')[0] || 'Unknown Date'}\n`;
      formattedData += `   Session: ${entry.num_trades || 0} trades, P&L: $${entry.net_pl || 0}\n`;
      formattedData += `   Win Rate: ${entry.win_rate || 0}%, Profit Factor: ${entry.profit_factor || 'N/A'}\n`;
      
      if (entry.notes) {
        formattedData += `   Key Insights: ${entry.notes.substring(0, 200)}${entry.notes.length > 200 ? '...' : ''}\n`;
      }
      
      if ((entry as any).linkedTradesDetails && (entry as any).linkedTradesDetails.length > 0) {
        formattedData += `   Linked Trades: ${(entry as any).linkedTradesDetails.length} trades analyzed\n`;
        const totalPnL = (entry as any).linkedTradesDetails.reduce((sum: number, t: any) => 
          sum + (t.trade_metrics?.[0]?.net_p_and_l || 0), 0);
        formattedData += `   Linked Trades P&L: $${Math.round(totalPnL * 100) / 100}\n`;
      }
      
      if ((entry as any).journal_images && (entry as any).journal_images.length > 0) {
        formattedData += `   Has ${(entry as any).journal_images.length} chart images/screenshots\n`;
      }
      
      formattedData += `\n`;
    });
  }
  
  // Enhanced Tags analysis with usage patterns
  if (tags.length > 0) {
    formattedData += `TRADING TAGS & PATTERNS (${tags.length} tags):\n`;
    tags.forEach((tag, index) => {
      formattedData += `${index + 1}. ${tag.tag_name} (${tag.tag_type || 'General'})\n`;
      formattedData += `   Description: ${tag.description || 'No description'}\n`;
      
      if ((tag as any).usageStats) {
        const stats = (tag as any).usageStats;
        formattedData += `   Usage: ${stats.tradeCount} trades\n`;
        
        if (stats.recentTrades && stats.recentTrades.length > 0) {
          const recentPnL = stats.recentTrades.reduce((sum: number, t: any) => 
            sum + (t.trade_metrics?.[0]?.net_p_and_l || 0), 0);
          const winRate = stats.recentTrades.filter((t: any) => 
            (t.trade_metrics?.[0]?.net_p_and_l || 0) > 0).length / stats.recentTrades.length * 100;
          formattedData += `   Recent Performance: $${Math.round(recentPnL * 100) / 100} P&L, ${Math.round(winRate)}% win rate\n`;
        }
      }
    });
    formattedData += `\n`;
  }
  
  // Settings context
  if (settings.base_currency || settings.time_zone) {
    formattedData += `USER PREFERENCES:\n`;
    formattedData += `- Base Currency: ${settings.base_currency || 'USD'}\n`;
    formattedData += `- Timezone: ${settings.time_zone || 'UTC'}\n`;
    if (settings.mistakes_tags) {
      formattedData += `- Common Mistakes Tags: ${settings.mistakes_tags}\n`;
    }
    if (settings.custom_tags) {
      formattedData += `- Custom Tags: ${settings.custom_tags}\n`;
    }
    formattedData += `\n`;
  }
  
  // Query context
  formattedData += `CURRENT QUERY CONTEXT:\n`;
  formattedData += `- Query Type: ${queryContext.queryType}\n`;
  if (queryContext.timeRange) {
    formattedData += `- Time Range: ${queryContext.timeRange.from} to ${queryContext.timeRange.to}\n`;
  }
  if (queryContext.specificStrategy) {
    formattedData += `- Specific Strategy: ${queryContext.specificStrategy}\n`;
  }
  if (queryContext.specificAccount) {
    formattedData += `- Specific Account: ${queryContext.specificAccount}\n`;
  }
  formattedData += `- Keywords: ${queryContext.keywords.join(', ')}\n`;
  
  return formattedData;
};
