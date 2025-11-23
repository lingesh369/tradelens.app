import { handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createChatCompletion } from '../_shared/ai/openai.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await verifyAuth(req);
    const { message } = await req.json();

    if (!message) {
      return errorResponse('Missing message');
    }

    const systemPrompt = `You are an intent classifier for a trading platform. Classify the user's message into one of these categories:
    - trade_analysis: User wants to analyze specific trades
    - strategy_review: User wants to review their overall strategy
    - general_question: General trading questions
    - chart_analysis: User wants to analyze a chart (if they mention uploading/showing a chart)
    
    Respond with ONLY a JSON object: {"intent": "category", "confidence": 0.0-1.0, "entities": {}}
    Extract relevant entities like trade IDs, date ranges, symbols, etc.`;

    const aiResponse = await createChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ], 'gpt-3.5-turbo', 0.3, 200);

    const responseText = aiResponse.choices[0]?.message?.content || '{}';
    const intentData = JSON.parse(responseText);

    return successResponse(intentData);
  } catch (error) {
    console.error('Intent classification error:', error);
    return errorResponse(error.message, 500);
  }
});
