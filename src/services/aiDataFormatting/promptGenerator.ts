
import { FormattedContext } from './contextBuilder';

export const generatePromptForIntent = (
  intent: string,
  userMessage: string,
  context: FormattedContext
): string => {
  const basePrompt = `You are an expert trading mentor and journal analyst for TradeLens. You help traders by analyzing their data and providing personalized insights.

User's Question: "${userMessage}"

Context: ${context.summary}

Based on the provided data, give a helpful, actionable response that directly answers the user's question.`;

  let specificInstructions = '';

  switch (intent) {
    case 'strategy_analysis':
      specificInstructions = `
Focus on:
- Strategy performance comparison and ranking
- Win rates and profitability by strategy
- Specific recommendations for improving each strategy
- Risk management effectiveness
- Best performing setups vs worst performing ones

Provide specific, data-driven insights with concrete numbers where possible.`;
      break;

    case 'performance_review':
      specificInstructions = `
Focus on:
- Overall trading performance trends
- Consistency patterns and streaks
- Risk management effectiveness
- Emotional/psychological patterns from journal entries
- Specific areas for improvement
- Progress over time

Be encouraging but honest about areas needing work.`;
      break;

    case 'account_summary':
      specificInstructions = `
Focus on:
- Account performance comparison
- Capital allocation effectiveness
- Growth trends and drawdowns
- Risk distribution across accounts
- Broker-specific insights if relevant

Present clear metrics and actionable recommendations.`;
      break;

    case 'journal_analysis':
      specificInstructions = `
Focus on:
- Emotional and psychological patterns
- Learning progression and insights
- Recurring themes and mistakes
- Mindset improvements over time
- Connection between psychology and performance

Provide supportive but constructive feedback on mental game.`;
      break;

    case 'note_summary':
      specificInstructions = `
Focus on:
- Key insights and learnings from notes
- Common themes and patterns
- Important reminders and rules
- Progress in understanding
- Action items and follow-ups

Summarize the most valuable insights clearly.`;
      break;

    case 'trade_analysis':
    default:
      specificInstructions = `
Focus on:
- Trade execution quality
- Setup identification and timing
- Risk/reward ratios
- Entry and exit effectiveness
- Pattern recognition
- Consistent mistakes or strengths

Provide specific, actionable trading advice.`;
      break;
  }

  let dataSection = '';
  
  if (context.csvData && context.csvData !== 'No CSV data available for this analysis.') {
    dataSection += `\n\n---START CSV DATA---\n${context.csvData}\n---END CSV DATA---`;
  }
  
  if (context.txtData && context.txtData !== 'No text data available for this analysis.') {
    dataSection += `\n\n---START TEXT DATA---\n${context.txtData}\n---END TEXT DATA---`;
  }

  if (!dataSection) {
    dataSection = '\n\nNo relevant data found for this analysis. Please inform the user that there is insufficient data for the requested analysis and suggest they check their date range or add more data to their journal.';
  }

  return basePrompt + specificInstructions + dataSection;
};
