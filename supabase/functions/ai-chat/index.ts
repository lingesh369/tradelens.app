import { handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createChatCompletion, analyzeImage } from '../_shared/ai/openai.ts';
import { checkRateLimit, AI_RATE_LIMITS, logRateLimitExceeded } from '../_shared/rate-limit.ts';
import { PerformanceMonitor } from '../_shared/monitoring.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const monitor = new PerformanceMonitor('ai-chat');

  try {
    const { user } = await verifyAuth(req);
    
    // Check rate limit
    // We pass 'ai-chat' as keyPrefix. 
    // IMPORTANT: checkRateLimit now counts 'function_logs'. 
    // So for this to work, we MUST log the function call at the end (PerformanceMonitor does this).
    const rateLimit = await checkRateLimit(user.id, AI_RATE_LIMITS.chat);
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id} on ai-chat`);
      await logRateLimitExceeded(user.id, 'ai-chat', req.headers.get('x-forwarded-for') || undefined);
      // We don't log this *failed* attempt to function_logs as a success, 
      // but maybe as a failure/blocked if we wanted to track it.
      // PerformanceMonitor.end usually logs.
      await monitor.end(false, 'Rate limit exceeded');
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    const { message, context, imageUrl, conversationHistory } = await req.json();

    if (!message && !imageUrl) {
      return errorResponse('Missing message or imageUrl');
    }

    console.log('AI Chat request from user:', user.id);

    let aiResponse;

    if (imageUrl) {
      // Handle image analysis
      const prompt = message || 'Analyze this trading chart and provide insights.';
      aiResponse = await analyzeImage(imageUrl, prompt);
    } else {
      // Build messages array
      const messages = [
        {
          role: 'system' as const,
          content: `You are TradeLens AI, an expert trading assistant. You help traders analyze their trades, 
          provide insights, and improve their trading strategies. Be concise, actionable, and supportive.
          ${context ? `\n\nUser Context:\n${JSON.stringify(context, null, 2)}` : ''}`,
        },
      ];

      // Add conversation history if provided
      if (conversationHistory && Array.isArray(conversationHistory)) {
        messages.push(...conversationHistory);
      }

      // Add current message
      messages.push({
        role: 'user' as const,
        content: message,
      });

      aiResponse = await createChatCompletion(messages);
    }

    const responseText = aiResponse.choices[0]?.message?.content || 
                        aiResponse.choices[0]?.text || 
                        'No response generated';

    await monitor.end(true);

    return successResponse({
      response: responseText,
      usage: aiResponse.usage,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    await monitor.end(false, error.message);
    return errorResponse(error.message, 500);
  }
});
