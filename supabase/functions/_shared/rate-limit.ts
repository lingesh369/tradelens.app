import { createServiceClient } from './auth.ts';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string; // Used as 'function_name' in logs
}

/**
 * Checks rate limit by counting function_logs for the given user and function in the time window.
 * This is stateless and robust across Edge Function restarts.
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const supabase = createServiceClient();
  const now = Date.now();
  const windowStart = new Date(now - config.windowMs).toISOString();
  const functionName = config.keyPrefix || 'default';

  // Count requests in the window
  // "function_logs" tracks executions. 
  // Note: This counts *completed* executions. Buffered requests might slip through in high concurrency,
  // but for 50/hour limits, strict atomicity isn't required vs performance.
  // We use 'count' which is fast on indexed columns.
  const { count, error } = await supabase
    .from('function_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .gte('called_at', windowStart);

  if (error) {
     console.error('Rate limit check failed:', error);
     // Fail open to avoid blocking users on DB error, but log it.
     return { allowed: true, remaining: 1, resetAt: now + config.windowMs };
  }

  const currentUsage = count || 0;
  const remaining = Math.max(0, config.maxRequests - currentUsage);
  const resetAt = now + config.windowMs; // Simplified reset (rolling window)

  if (currentUsage >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

export async function logRateLimitExceeded(
  userId: string,
  endpoint: string,
  ip?: string
) {
  try {
    const supabase = createServiceClient();
    await supabase.from('rate_limit_logs').insert({
      user_id: userId,
      endpoint,
      ip_address: ip,
      exceeded_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging rate limit:', error);
  }
}

// AI-specific rate limits
export const AI_RATE_LIMITS = {
  chat: { maxRequests: 50, windowMs: 60 * 60 * 1000, keyPrefix: 'ai-chat' }, // 50 per hour
  analysis: { maxRequests: 20, windowMs: 60 * 60 * 1000, keyPrefix: 'ai-analysis' }, // 20 per hour
  intent: { maxRequests: 100, windowMs: 60 * 60 * 1000, keyPrefix: 'ai-intent' }, // 100 per hour
};

// Payment rate limits (Stricter, perhaps different table or logic, but reusing for consistency)
export const PAYMENT_RATE_LIMITS = {
  createOrder: { maxRequests: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'payment-create' }, // 10 per hour
};

// Community rate limits
export const COMMUNITY_RATE_LIMITS = {
  like: { maxRequests: 100, windowMs: 60 * 60 * 1000, keyPrefix: 'community-like' }, // 100 per hour
  comment: { maxRequests: 50, windowMs: 60 * 60 * 1000, keyPrefix: 'community-comment' }, // 50 per hour
  follow: { maxRequests: 50, windowMs: 60 * 60 * 1000, keyPrefix: 'community-follow' }, // 50 per hour
};
