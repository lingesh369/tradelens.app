import { handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createChatCompletion } from '../_shared/ai/openai.ts';
import { checkRateLimit, AI_RATE_LIMITS, logRateLimitExceeded } from '../_shared/rate-limit.ts';
import { PerformanceMonitor } from '../_shared/monitoring.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const monitor = new PerformanceMonitor('analyze-trades-with-gpt');

  try {
    const { user } = await verifyAuth(req);
    
    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, AI_RATE_LIMITS.analysis);
    if (!rateLimit.allowed) {
      await logRateLimitExceeded(user.id, 'analyze-trades-with-gpt', req.headers.get('x-forwarded-for') || undefined);
      await monitor.end(false, 'Rate limit exceeded');
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    const { trades, analysisType = 'general' } = await req.json();

    if (!trades || !Array.isArray(trades)) {
      return errorResponse('Missing or invalid trades data');
    }

    const systemPrompt = `You are an expert trading analyst. Analyze the provided trades and give actionable insights.
    Focus on: win rate, risk/reward ratios, common mistakes, patterns, and improvement suggestions.
    Be specific and data-driven.`;

    const userPrompt = `Analyze these ${trades.length} trades:\n\n${JSON.stringify(trades, null, 2)}\n\nAnalysis type: ${analysisType}`;

    const aiResponse = await createChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 'gpt-4-turbo-preview', 0.7, 2000);

    const analysis = aiResponse.choices[0]?.message?.content || 'No analysis generated';

    await monitor.end(true);

    return successResponse({
      analysis,
      trades_analyzed: trades.length,
      usage: aiResponse.usage,
    });
  } catch (error) {
    console.error('Trade analysis error:', error);
    await monitor.end(false, error.message);
    return errorResponse(error.message, 500);
  }
});
