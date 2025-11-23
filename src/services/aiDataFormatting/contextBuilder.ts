
import { formatTradesAsCSV, formatAccountsAsCSV, formatStrategiesAsCSV } from './csvFormatters';
import { formatJournalDataForTxt, formatTradesDataForTxt } from './txtFormatters';

export interface FormattedContext {
  csvData: string;
  txtData: string;
  summary: string;
  intent: string;
}

export const buildContextForIntent = (
  intent: string,
  data: any,
  summary: any
): FormattedContext => {
  let csvData = '';
  let txtData = '';
  let contextSummary = '';

  console.log('Building context for intent:', intent, 'with data keys:', Object.keys(data));

  switch (intent) {
    case 'strategy_analysis':
      // CSV: Trades data for strategy performance analysis
      if (data.trades && data.trades.length > 0) {
        csvData = formatTradesAsCSV(data.trades, data.accounts || [], data.strategies || []);
      }
      
      // TXT: Strategy rules and descriptions - using basic formatting for now
      if (data.strategy_rules && data.strategy_rules.length > 0) {
        txtData = data.strategy_rules.map((rule: any) => 
          `${rule.rule_title}: ${rule.rule_description || 'No description'}`
        ).join('\n\n');
      }
      
      // CSV: Strategy performance metrics
      if (data.strategies && data.strategies.length > 0) {
        csvData += '\n\n=== STRATEGY PERFORMANCE ===\n';
        csvData += formatStrategiesAsCSV(data.strategies, data.strategy_rules || []);
      }
      
      contextSummary = `Strategy analysis for ${summary.strategies_count || 0} strategies with ${summary.trades_count || 0} trades`;
      break;

    case 'performance_review':
      // CSV: Comprehensive trades data
      if (data.trades && data.trades.length > 0) {
        csvData = formatTradesAsCSV(data.trades, data.accounts || [], data.strategies || []);
      }
      
      // TXT: Journal entries and recent notes
      let txtParts = [];
      if (data.journal && data.journal.length > 0) {
        txtParts.push(formatJournalDataForTxt(data.journal));
      }
      if (data.trades && data.trades.length > 0) {
        txtParts.push(formatTradesDataForTxt(data.trades));
      }
      txtData = txtParts.join('\n\n');
      
      contextSummary = `Performance review: ${summary.trades_count || 0} trades, ${summary.win_rate || 0}% win rate, $${summary.total_pnl || 0} P&L`;
      break;

    case 'account_summary':
      // CSV: Account performance data
      if (data.accounts && data.accounts.length > 0) {
        csvData = formatAccountsAsCSV(data.accounts);
      }
      
      // TXT: Account summary with trade statistics
      txtData = `Account Summary: ${data.accounts?.length || 0} accounts with ${data.trades?.length || 0} trades`;
      
      contextSummary = `Account summary for ${summary.accounts_count || 0} accounts`;
      break;

    case 'journal_analysis':
      // TXT: Journal entries and related notes
      let journalParts = [];
      if (data.journal && data.journal.length > 0) {
        journalParts.push(formatJournalDataForTxt(data.journal));
      }
      txtData = journalParts.join('\n\n');
      
      // CSV: Related trades for context
      if (data.trades && data.trades.length > 0) {
        csvData = formatTradesAsCSV(data.trades, data.accounts || [], data.strategies || []);
      }
      
      contextSummary = `Journal analysis: ${summary.journal_entries || 0} entries, ${summary.notes_count || 0} notes`;
      break;

    case 'note_summary':
      // TXT: Notes and related journal entries
      txtData = `Notes Summary: ${data.notes?.length || 0} notes found`;
      
      contextSummary = `Note summary: ${summary.notes_count || 0} notes found`;
      break;

    case 'trade_analysis':
    default:
      // CSV: Trade data for general analysis
      if (data.trades && data.trades.length > 0) {
        csvData = formatTradesAsCSV(data.trades, data.accounts || [], data.strategies || []);
      }
      
      contextSummary = `Trade analysis: ${summary.trades_count || 0} trades analyzed`;
      break;
  }

  return {
    csvData: csvData || 'No CSV data available for this analysis.',
    txtData: txtData || 'No text data available for this analysis.',
    summary: contextSummary,
    intent
  };
};
