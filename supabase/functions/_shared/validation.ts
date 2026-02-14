import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Payment validation schemas
export const PaymentSchema = z.object({
  planId: z.string().uuid('Invalid plan ID format'),
  amount: z.number().positive('Amount must be positive').max(100000, 'Amount too large'),
  billingCycle: z.enum(['monthly', 'yearly', 'lifetime'], {
    errorMap: () => ({ message: 'Invalid billing cycle' })
  }),
  userId: z.string().uuid('Invalid user ID format'),
});

export const WebhookPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  status: z.string().min(1, 'Status required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Invalid currency code'),
});

// User validation schemas
export const UserUpdateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).optional(),
  full_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url('Invalid URL').optional(),
});

export const PasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

// Trade validation schemas
export const TradeCreateSchema = z.object({
  instrument: z.string().min(1, 'Instrument required').max(50),
  action: z.enum(['Buy', 'Sell'], { errorMap: () => ({ message: 'Invalid action' }) }),
  quantity: z.number().positive('Quantity must be positive'),
  entry_price: z.number().positive('Entry price must be positive'),
  exit_price: z.number().positive('Exit price must be positive').optional(),
  stop_loss: z.number().positive().optional(),
  take_profit: z.number().positive().optional(),
  notes: z.string().max(10000, 'Notes too long').optional(),
  strategy_id: z.string().uuid().optional(),
  account_id: z.string().uuid('Invalid account ID'),
});

// AI validation schemas
export const AIChatSchema = z.object({
  message: z.string().min(1, 'Message required').max(2000, 'Message too long'),
  context: z.record(z.any()).optional(),
  conversationId: z.string().uuid().optional(),
});

// Coupon validation schemas
export const CouponValidationSchema = z.object({
  code: z.string().min(3, 'Coupon code too short').max(50, 'Coupon code too long'),
  planId: z.string().uuid('Invalid plan ID'),
});

// Notification validation schemas
export const NotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(['info', 'success', 'warning', 'error']),
  userId: z.string().uuid().optional(),
  segment: z.enum(['all_users', 'trial_users', 'active_subscribers', 'expired_users', 'premium_users']).optional(),
});

// Helper function to validate and return typed data
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}

// Sanitize string inputs to prevent injection
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rate limit validation
export function validateRateLimit(remaining: number, resetAt: number): void {
  if (remaining <= 0) {
    const resetDate = new Date(resetAt);
    throw new Error(`Rate limit exceeded. Try again at ${resetDate.toISOString()}`);
  }
}
