import { createServiceClient } from './auth.ts';

export interface FunctionMetrics {
  functionName: string;
  userId?: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export async function logFunctionCall(metrics: FunctionMetrics) {
  try {
    const supabase = createServiceClient();
    
    await supabase.from('function_logs').insert({
      function_name: metrics.functionName,
      user_id: metrics.userId,
      duration_ms: metrics.duration,
      success: metrics.success,
      error_message: metrics.error,
      metadata: metrics.metadata,
      called_at: new Date().toISOString(),
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't break the function
    console.error('Error logging function call:', error);
  }
}

export class PerformanceMonitor {
  private startTime: number;
  private functionName: string;
  private userId?: string;
  private metadata: Record<string, any>;

  constructor(functionName: string, userId?: string, metadata?: Record<string, any>) {
    this.startTime = Date.now();
    this.functionName = functionName;
    this.userId = userId;
    this.metadata = metadata || {};
  }

  async end(success: boolean, error?: string) {
    const duration = Date.now() - this.startTime;

    await logFunctionCall({
      functionName: this.functionName,
      userId: this.userId,
      duration,
      success,
      error,
      metadata: this.metadata,
    });

    console.log(`[${this.functionName}] Duration: ${duration}ms, Success: ${success}`);
  }
}

export async function logError(
  functionName: string,
  error: Error,
  userId?: string,
  context?: Record<string, any>
) {
  try {
    const supabase = createServiceClient();
    
    await supabase.from('error_logs').insert({
      function_name: functionName,
      user_id: userId,
      error_message: error.message,
      error_stack: error.stack,
      context,
      occurred_at: new Date().toISOString(),
    });
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
}

export function createPerformanceHeaders(duration: number, remaining?: number) {
  const headers: Record<string, string> = {
    'X-Response-Time': `${duration}ms`,
  };

  if (remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = remaining.toString();
  }

  return headers;
}
