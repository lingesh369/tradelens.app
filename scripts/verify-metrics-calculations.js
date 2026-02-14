/**
 * Verify Metrics Calculations
 * Checks that all metrics are calculated correctly across the platform
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Manual calculation functions to verify database calculations
function calculateGrossPnL(trade) {
  const { action, entry_price, exit_price, quantity, contract_multiplier = 1 } = trade;
  
  if (!exit_price) return null;
  
  let pnl;
  if (action === 'long' || action === 'buy') {
    pnl = (exit_price - entry_price) * quantity;
  } else { // short/sell
    pnl = (entry_price - exit_price) * quantity;
  }
  
  return pnl * contract_multiplier;
}

function calculateNetPnL(trade) {
  const grossPnL = calculateGrossPnL(trade);
  if (grossPnL === null) return null;
  
  const commission = trade.commission || 0;
  const fees = trade.fees || 0;
  
  return grossPnL - commission - fees;
}

function calculatePercentGain(trade) {
  const netPnL = calculateNetPnL(trade);
  if (netPnL === null) return null;
  
  const { entry_price, quantity } = trade;
  const costBasis = entry_price * quantity;
  
  return (netPnL / costBasis) * 100;
}

function calculateRMultiple(trade) {
  const netPnL = calculateNetPnL(trade);
  if (netPnL === null || !trade.sl) return null;
  
  const { action, entry_price, sl, quantity } = trade;
  
  let riskAmount;
  if (action === 'long' || action === 'buy') {
    riskAmount = (entry_price - sl) * quantity;
  } else {
    riskAmount = (sl - entry_price) * quantity;
  }
  
  if (riskAmount <= 0) return null;
  
  return netPnL / riskAmount;
}

function calculateTradeDuration(trade) {
  if (!trade.entry_time || !trade.exit_time) return null;
  
  const entry = new Date(trade.entry_time);
  const exit = new Date(trade.exit_time);
  
  return Math.floor((exit - entry) / 1000 / 60); // minutes
}

function determineTradeResult(netPnL) {
  if (netPnL === null) return null;
  if (netPnL > 0) return 'win';
  if (netPnL < 0) return 'loss';
  return 'breakeven';
}

async function verifyMetrics() {
  console.log('\n🔍 Verifying Metrics Calculations Across Platform...\n');

  try {
    const testEmail = 'test@tradelens.com';

    // Get user
    const { data: users } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', testEmail)
      .limit(1);

    if (!users || users.length === 0) {
      throw new Error('Test user not found');
    }

    const userId = users[0].id;
    console.log('✅ User ID:', userId);

    // Fetch all trades with metrics
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select(`
        *,
        trade_metrics (
          net_pnl,
          gross_pnl,
          percent_gain,
          trade_result,
          r_multiple,
          trade_duration_minutes
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (tradesError) throw tradesError;

    console.log(`\n📊 Analyzing ${trades.length} trades...\n`);

    let totalIssues = 0;
    let closedTradesChecked = 0;

    // Check each closed trade
    for (const trade of trades) {
      if (trade.status !== 'closed' || !trade.exit_price) continue;

      closedTradesChecked++;
      const metrics = Array.isArray(trade.trade_metrics) ? trade.trade_metrics[0] : trade.trade_metrics;

      console.log(`\n${closedTradesChecked}. ${trade.instrument} (${trade.action})`);
      console.log('   ' + '='.repeat(50));

      // Calculate expected values
      const expectedGrossPnL = calculateGrossPnL(trade);
      const expectedNetPnL = calculateNetPnL(trade);
      const expectedPercentGain = calculatePercentGain(trade);
      const expectedRMultiple = calculateRMultiple(trade);
      const expectedDuration = calculateTradeDuration(trade);
      const expectedResult = determineTradeResult(expectedNetPnL);

      // Check if metrics exist
      if (!metrics) {
        console.log('   ❌ NO METRICS FOUND');
        totalIssues++;
        continue;
      }

      // Verify Gross P&L
      const grossDiff = Math.abs((metrics.gross_pnl || 0) - (expectedGrossPnL || 0));
      if (grossDiff > 0.01) {
        console.log(`   ❌ Gross P&L Mismatch:`);
        console.log(`      Database: ${metrics.gross_pnl}`);
        console.log(`      Expected: ${expectedGrossPnL}`);
        console.log(`      Difference: ${grossDiff}`);
        totalIssues++;
      } else {
        console.log(`   ✅ Gross P&L: $${metrics.gross_pnl?.toFixed(2)}`);
      }

      // Verify Net P&L
      const netDiff = Math.abs((metrics.net_pnl || 0) - (expectedNetPnL || 0));
      if (netDiff > 0.01) {
        console.log(`   ❌ Net P&L Mismatch:`);
        console.log(`      Database: ${metrics.net_pnl}`);
        console.log(`      Expected: ${expectedNetPnL}`);
        console.log(`      Difference: ${netDiff}`);
        totalIssues++;
      } else {
        console.log(`   ✅ Net P&L: $${metrics.net_pnl?.toFixed(2)}`);
      }

      // Verify Percent Gain
      const percentDiff = Math.abs((metrics.percent_gain || 0) - (expectedPercentGain || 0));
      if (percentDiff > 0.01) {
        console.log(`   ❌ Percent Gain Mismatch:`);
        console.log(`      Database: ${metrics.percent_gain}%`);
        console.log(`      Expected: ${expectedPercentGain}%`);
        console.log(`      Difference: ${percentDiff}%`);
        totalIssues++;
      } else {
        console.log(`   ✅ Percent Gain: ${metrics.percent_gain?.toFixed(2)}%`);
      }

      // Verify R-Multiple
      if (trade.sl) {
        const rDiff = Math.abs((metrics.r_multiple || 0) - (expectedRMultiple || 0));
        if (rDiff > 0.01) {
          console.log(`   ❌ R-Multiple Mismatch:`);
          console.log(`      Database: ${metrics.r_multiple}R`);
          console.log(`      Expected: ${expectedRMultiple}R`);
          console.log(`      Difference: ${rDiff}R`);
          totalIssues++;
        } else {
          console.log(`   ✅ R-Multiple: ${metrics.r_multiple?.toFixed(2)}R`);
        }
      }

      // Verify Trade Result
      if (metrics.trade_result !== expectedResult) {
        console.log(`   ❌ Trade Result Mismatch:`);
        console.log(`      Database: ${metrics.trade_result}`);
        console.log(`      Expected: ${expectedResult}`);
        totalIssues++;
      } else {
        console.log(`   ✅ Trade Result: ${metrics.trade_result}`);
      }

      // Verify Duration
      if (expectedDuration !== null) {
        const durationDiff = Math.abs((metrics.trade_duration_minutes || 0) - expectedDuration);
        if (durationDiff > 1) { // Allow 1 minute difference
          console.log(`   ⚠️  Duration Mismatch:`);
          console.log(`      Database: ${metrics.trade_duration_minutes} min`);
          console.log(`      Expected: ${expectedDuration} min`);
        } else {
          console.log(`   ✅ Duration: ${metrics.trade_duration_minutes} min`);
        }
      }

      // Show calculation details
      console.log(`\n   📝 Calculation Details:`);
      console.log(`      Entry: $${trade.entry_price} x ${trade.quantity}`);
      console.log(`      Exit: $${trade.exit_price} x ${trade.quantity}`);
      console.log(`      Commission: $${trade.commission || 0}`);
      console.log(`      Fees: $${trade.fees || 0}`);
      if (trade.sl) {
        console.log(`      Stop Loss: $${trade.sl}`);
      }
    }

    // Check Dashboard Stats
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 DASHBOARD STATISTICS VERIFICATION');
    console.log('='.repeat(60));

    const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price);
    const tradesWithMetrics = closedTrades.filter(t => {
      const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
      return metrics && metrics.net_pnl !== null;
    });

    const winningTrades = tradesWithMetrics.filter(t => {
      const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
      return metrics.net_pnl > 0;
    });

    const losingTrades = tradesWithMetrics.filter(t => {
      const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
      return metrics.net_pnl < 0;
    });

    const totalPnL = tradesWithMetrics.reduce((sum, t) => {
      const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
      return sum + (metrics.net_pnl || 0);
    }, 0);

    const totalWins = winningTrades.reduce((sum, t) => {
      const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
      return sum + (metrics.net_pnl || 0);
    }, 0);

    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => {
      const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
      return sum + (metrics.net_pnl || 0);
    }, 0));

    const winRate = tradesWithMetrics.length > 0 
      ? (winningTrades.length / tradesWithMetrics.length) * 100 
      : 0;

    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? 999 : 0);

    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

    console.log('\n✅ Dashboard Metrics:');
    console.log(`   Total Trades: ${trades.length}`);
    console.log(`   Closed Trades: ${closedTrades.length}`);
    console.log(`   Trades with Metrics: ${tradesWithMetrics.length}`);
    console.log(`   Winning Trades: ${winningTrades.length}`);
    console.log(`   Losing Trades: ${losingTrades.length}`);
    console.log(`   Win Rate: ${winRate.toFixed(2)}%`);
    console.log(`   Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`   Total Wins: $${totalWins.toFixed(2)}`);
    console.log(`   Total Losses: $${totalLosses.toFixed(2)}`);
    console.log(`   Profit Factor: ${profitFactor.toFixed(2)}`);
    console.log(`   Average Win: $${avgWin.toFixed(2)}`);
    console.log(`   Average Loss: $${avgLoss.toFixed(2)}`);

    // Check Strategy Stats
    console.log('\n\n' + '='.repeat(60));
    console.log('🎯 STRATEGY STATISTICS VERIFICATION');
    console.log('='.repeat(60));

    const { data: strategies } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId);

    for (const strategy of strategies) {
      console.log(`\n📋 ${strategy.name}:`);
      
      const strategyTrades = tradesWithMetrics.filter(t => t.strategy_id === strategy.id);
      const strategyWins = strategyTrades.filter(t => {
        const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
        return metrics.net_pnl > 0;
      });
      const strategyLosses = strategyTrades.filter(t => {
        const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
        return metrics.net_pnl < 0;
      });
      const strategyPnL = strategyTrades.reduce((sum, t) => {
        const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
        return sum + (metrics.net_pnl || 0);
      }, 0);
      const strategyWinRate = strategyTrades.length > 0 
        ? (strategyWins.length / strategyTrades.length) * 100 
        : 0;

      console.log(`   Database Values:`);
      console.log(`      Total Trades: ${strategy.total_trades}`);
      console.log(`      Winning Trades: ${strategy.winning_trades}`);
      console.log(`      Losing Trades: ${strategy.losing_trades}`);
      console.log(`      Win Rate: ${strategy.win_rate}%`);
      console.log(`      Total P&L: $${strategy.total_pnl}`);

      console.log(`\n   Calculated Values:`);
      console.log(`      Total Trades: ${strategyTrades.length}`);
      console.log(`      Winning Trades: ${strategyWins.length}`);
      console.log(`      Losing Trades: ${strategyLosses.length}`);
      console.log(`      Win Rate: ${strategyWinRate.toFixed(2)}%`);
      console.log(`      Total P&L: $${strategyPnL.toFixed(2)}`);

      // Check for mismatches
      if (strategy.total_trades !== strategyTrades.length) {
        console.log(`   ⚠️  Total trades mismatch`);
      }
      if (Math.abs(strategy.win_rate - strategyWinRate) > 0.1) {
        console.log(`   ⚠️  Win rate mismatch`);
      }
      if (Math.abs(strategy.total_pnl - strategyPnL) > 0.01) {
        console.log(`   ⚠️  P&L mismatch`);
      }
    }

    // Final Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Closed Trades Checked: ${closedTradesChecked}`);
    console.log(`   Issues Found: ${totalIssues}`);
    
    if (totalIssues === 0) {
      console.log('\n✅ ALL METRICS CALCULATIONS ARE CORRECT!');
    } else {
      console.log(`\n⚠️  Found ${totalIssues} metric calculation issue(s)`);
      console.log('\n💡 Recommendations:');
      console.log('   1. Check database trigger functions');
      console.log('   2. Recalculate metrics for affected trades');
      console.log('   3. Verify contract_multiplier is applied correctly');
    }

    console.log('\n📝 Metrics Calculation Formulas Used:');
    console.log('   Gross P&L = (Exit - Entry) × Quantity × Multiplier');
    console.log('   Net P&L = Gross P&L - Commission - Fees');
    console.log('   Percent Gain = (Net P&L / Cost Basis) × 100');
    console.log('   R-Multiple = Net P&L / Risk Amount');
    console.log('   Risk Amount = |Entry - Stop Loss| × Quantity');
    console.log('   Trade Result = win if Net P&L > 0, loss if < 0, breakeven if = 0');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyMetrics();
