import { createServiceClient } from './auth.ts';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `${config.keyPrefix || 'default'}:${userId}`;
  const now = Date.now();

  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetAt < now) {
      rateLimitStore.delete(k);
    }
  }

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
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

// Payment rate limits
export const PAYMENT_RATE_LIMITS = {
  createOrder: { maxRequests: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'payment-create' }, // 10 per hour
};

// Community rate limits
export const COMMUNITY_RATE_LIMITS = {
  like: { maxRequests: 100, windowMs: 60 * 60 * 1000, keyPrefix: 'community-like' }, // 100 per hour
  comment: { maxRequests: 50, windowMs: 60 * 60 * 1000, keyPrefix: 'community-comment' }, // 50 per hour
  follow: { maxRequests: 50, windowMs: 60 * 60 * 1000, keyPrefix: 'community-follow' }, // 50 per hour
};
