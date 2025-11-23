import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const fetchUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { data: null, error: error.message };
  }
};

// Add the missing fetchAllUsers export that UsersPage is looking for
export const fetchAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('user_id, email, first_name, last_name, username, user_status, user_role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to include subscription plan info
    const usersWithPlans = await Promise.all((data || []).map(async (user) => {
      try {
        const { data: subscription } = await supabase
          .from('user_subscriptions_new')
          .select(`
            status,
            end_date,
            subscription_plans (name)
          `)
          .eq('user_id', user.user_id)
          .eq('status', 'active')
          .maybeSingle();

        return {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          user_status: user.user_status,
          user_role: user.user_role,
          signup_date: user.created_at,
          last_login: user.updated_at,
          subscription_plan: subscription?.subscription_plans?.name || 'Free Trial',
          trial_active: subscription?.end_date ? new Date(subscription.end_date) > new Date() : false
        };
      } catch (err) {
        return {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          user_status: user.user_status,
          user_role: user.user_role,
          signup_date: user.created_at,
          last_login: user.updated_at,
          subscription_plan: 'Free Trial',
          trial_active: false
        };
      }
    }));

    return { data: usersWithPlans, error: null };
  } catch (error: any) {
    console.error('Error fetching all users:', error);
    return { data: null, error: error.message };
  }
};

export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return { data: null, error: error.message };
  }
};

export const getAdminUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    
    // Transform to match expected format
    const userData = {
      user_id: data.user_id,
      email: data.email,
      username: data.username || '',
      first_name: data.first_name,
      last_name: data.last_name,
      subscription_plan: 'Free Trial', // Default, will be updated with actual subscription
      trial_active: false,
      trial_start_date: null,
      signup_date: data.created_at,
      last_login: data.updated_at,
      user_status: data.user_status,
      subscription_start: null,
      subscription_end: null,
      user_role: data.user_role,
      notes: data.notes
    };
    
    return { data: userData, error: null };
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return { data: null, error: error.message };
  }
};

export const getAdminUserByUsername = async (username: string) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;

    const userData: any = {
      user_id: data.user_id,
      email: data.email,
      username: data.username || '',
      first_name: data.first_name,
      last_name: data.last_name,
      subscription_plan: 'Free Trial', // Default
      signup_date: data.created_at,
      last_login: data.updated_at,
      user_status: data.user_status,
      user_role: data.user_role,
      notes: data.notes,
      location: (data.profile_data as any)?.country || 'N/A',
      timezone: (data.profile_data as any)?.timezone || 'N/A',
      days_left: 0,
      subscription_id: null,
      start_date: null,
      next_billing_date: null,
      trial_end_date: null,
      payment_method: null,
      end_date: null,
    };

    const { data: subscription } = await supabase
      .from('user_subscriptions_new')
      .select(`
        *,
        subscription_plans (name)
      `)
      .eq('user_id', data.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (subscription) {
      userData.subscription_plan = subscription.subscription_plans?.name || 'Free Trial';
      userData.subscription_id = subscription.subscription_id;
      userData.start_date = subscription.start_date;
      userData.next_billing_date = subscription.next_billing_date;

      userData.payment_method = subscription.payment_method || 'N/A';
      
      if (subscription.end_date) {
        userData.end_date = subscription.end_date;
        const endDate = new Date(subscription.end_date);
        const now = new Date();
        if (endDate > now) {
          const diffTime = Math.abs(endDate.getTime() - now.getTime());
          userData.days_left = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }
    }

    return { data: userData, error: null };
  } catch (error: any) {
    console.error('Error fetching user by username:', error);
    return { data: null, error: error.message };
  }
};

export const updateUser = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { data: null, error: error.message };
  }
};

export const updateUserBasicInfo = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null, success: true };
  } catch (error: any) {
    console.error('Error updating user basic info:', error);
    return { data: null, error: error.message, success: false };
  }
};

export const updateUserStatus = async (userId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .update({ user_status: status })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null, success: true };
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return { data: null, error: error.message, success: false };
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .update({ user_role: role })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null, success: true };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return { data: null, error: error.message, success: false };
  }
};

export const updateUserTrial = async (userId: string, trialData: any) => {
  try {
    // Update subscription instead of user directly
    const { data, error } = await supabase
      .from('user_subscriptions_new')
      .update({
        end_date: trialData.trial_end_date
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating user trial:', error);
    return { data: null, error: error.message };
  }
};

export const extendUserTrial = async (userId: string, days: number) => {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const { data, error } = await supabase
      .from('user_subscriptions_new')
      .update({
        end_date: endDate.toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null, success: true };
  } catch (error: any) {
    console.error('Error extending user trial:', error);
    return { data: null, error: error.message, success: false };
  }
};

export const updateSubscriptionExpiry = async (userId: string, newEndDate: Date | undefined) => {
  if (!newEndDate) {
    return { data: null, error: 'Invalid date provided.', success: false };
  }
  try {
    // First check if there's an active subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_subscriptions_new')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existingSubscription) {
      return { data: null, error: 'No active subscription found.', success: false };
    }

    // Update the subscription with the new end date
    const { data, error } = await supabase
      .from('user_subscriptions_new')
      .update({ 
        end_date: newEndDate.toISOString(),
        // If the new end date is in the past, mark as expired
        status: newEndDate < new Date() ? 'expired' : 'active'
      })
      .eq('subscription_id', existingSubscription.subscription_id)
      .select()
      .single();

    if (error) throw error;
    
    // Invalidate the user access matrix cache
    await supabase.rpc('invalidate_user_access_cache', { target_user_id: userId });
    
    return { data, error: null, success: true };
  } catch (error: any) {
    console.error('Error updating subscription expiry:', error);
    return { data: null, error: error.message, success: false };
  }
};

export const getSubscriptionPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    return { data: null, error: error.message };
  }
};

export const assignUserPlan = async (userId: string, planId: string, billingCycle: string = 'monthly') => {
  try {
    // We need plan name, not plan id for the rpc call.
    const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('name')
        .eq('plan_id', planId)
        .single();
    
    if(planError) throw planError;

    // First, mark any existing active subscriptions as expired
    await supabase
      .from('user_subscriptions_new')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Then assign the new plan
    const { data, error } = await supabase.rpc('assign_user_plan', {
      target_user_id: userId,
      plan_name_param: planData.name,
      billing_cycle_param: billingCycle
    });

    if (error) throw error;
    
    // Invalidate the user access matrix cache
    await supabase.rpc('invalidate_user_access_cache', { target_user_id: userId });
    
    return { data, error: null, success: true };
  } catch (error: any) {
    console.error('Error assigning user plan:', error);
    return { data: null, error: error.message, success: false };
  }
};

export const updatePaymentStatus = async (paymentId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({ payment_status: status })
      .eq('payment_id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null, success: true };
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return { data: null, error: error.message, success: false };
  }
};

export const addUserPayment = async (userId: string, paymentData: any) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: paymentData.amount,
        payment_status: 'completed',
        currency: 'USD',
        subscription_plan: paymentData.subscription_plan,
        payment_method: paymentData.payment_method,
        description: paymentData.description,
        payment_date: paymentData.payment_date
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null, success: true };
  } catch (error: any) {
    console.error('Error adding user payment:', error);
    return { data: null, error: error.message, success: false };
  }
};

export const fetchCoupons = async () => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return { data: null, error: error.message };
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { data: null, error: error.message };
  }
};

export const getUserStats = async (userId: string) => {
  try {
    // Get basic user subscription info
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions_new')
      .select(`
        *,
        subscription_plans (
          name,
          validity_days
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    // Calculate trial days remaining if applicable
    let trial_days_remaining = 0;
    if (subscription?.end_date) {
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      if (endDate > now) {
        trial_days_remaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Get trade counts
    const { count: tradeCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get account counts
    const { count: accountCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Get strategy count
    const { count: strategyCount } = await supabase
      .from('strategies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get trade metrics for P&L and Win Rate
    const { data: metrics, error: metricsError } = await supabase
      .from('trade_metrics')
      .select('net_p_and_l, trade_outcome')
      .eq('user_id', userId);

    if (metricsError) throw metricsError;

    const totalPnl = metrics.reduce((acc, m) => acc + (m.net_p_and_l || 0), 0);
    const wins = metrics.filter(m => m.trade_outcome === 'WIN').length;
    const winRate = metrics.length > 0 ? (wins / metrics.length) * 100 : 0;

    // Get last trade logged
    const { data: lastTrade, error: lastTradeError } = await supabase
      .from('trades')
      .select('entry_time')
      .eq('user_id', userId)
      .order('entry_time', { ascending: false })
      .limit(1)
      .single();

    if (lastTradeError && lastTradeError.code !== 'PGRST116') {
        throw lastTradeError;
    }
    const lastTradeLogged = lastTrade?.entry_time ? format(new Date(lastTrade.entry_time), 'MMM d, yyyy') : 'N/A';

    const stats = {
      trial_days_remaining,
      accounts_count: accountCount || 0,
      trades_count: tradeCount || 0,
      notes_count: 0,
      strategies_count: strategyCount || 0,
      total_trades: tradeCount || 0,
      total_accounts: accountCount || 0,
      subscription_status: subscription?.status || 'inactive',
    plan_name: subscription?.subscription_plans?.name || 'Free Trial',
      net_pnl: `€${totalPnl.toFixed(2)}`,
      win_rate: `${winRate.toFixed(1)}%`,
      last_trade_logged: lastTradeLogged,
    };

    return { data: stats, error: null };
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return { data: null, error: error.message };
  }
};

export const getCompleteUserSettings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', userId)
      .eq('settings_type', 'global')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    
    const defaultSettings = {
      base_currency: 'USD',
      time_zone: 'UTC',
      dark_mode: false,
    };

    const userSettingsData = (data?.settings_data as any) || {};
    
    const settings = {
      base_currency: userSettingsData.base_currency || defaultSettings.base_currency,
      time_zone: userSettingsData.time_zone || defaultSettings.time_zone,
      dark_mode: userSettingsData.dark_mode === true,
    };
    
    return { data: settings, error: null };
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    return { data: null, error: error.message };
  }
};

export const getUserPayments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching user payments:', error);
    return { data: null, error: error.message };
  }
};

export const createCoupon = async (couponData: any) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        name: couponData.name,
        code: couponData.code,
        discount_type: couponData.discount_type,
        discount_value: couponData.discount_value,
        usage_limit_total: couponData.usage_limit_total,
        usage_limit_per_user: couponData.usage_limit_per_user,
        applicable_plans: couponData.applicable_plans,
        validity_start_date: couponData.validity_start_date?.toISOString(),
        validity_end_date: couponData.validity_end_date?.toISOString(),
        currency_restriction: couponData.currency_restriction,
        status: couponData.status,
        notes: couponData.notes,
        used_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return { data: null, error: error.message };
  }
};

export const updateCoupon = async (couponId: string, updates: any) => {
  try {
    const updateData: any = { ...updates };
    
    // Convert dates to ISO strings if they exist
    if (updateData.validity_start_date) {
      updateData.validity_start_date = updateData.validity_start_date.toISOString();
    }
    if (updateData.validity_end_date) {
      updateData.validity_end_date = updateData.validity_end_date.toISOString();
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', couponId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return { data: null, error: error.message };
  }
};

export const deleteCoupon = async (couponId: string) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return { data: null, error: error.message };
  }
};

export const duplicateCoupon = async (couponId: string) => {
  try {
    // First get the original coupon
    const { data: originalCoupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single();

    if (fetchError) throw fetchError;

    // Create a new coupon with modified data
    const duplicatedData = {
      ...originalCoupon,
      name: `${originalCoupon.name} (Copy)`,
      code: `${originalCoupon.code}_COPY`,
      used_count: 0,
      status: 'disabled', // Start disabled for safety
    };

    // Remove the id and timestamps
    delete duplicatedData.id;
    delete duplicatedData.created_at;
    delete duplicatedData.updated_at;

    const { data, error } = await supabase
      .from('coupons')
      .insert(duplicatedData)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error duplicating coupon:', error);
    return { data: null, error: error.message };
  }
};

export const exportCouponsToCSV = async (coupons: any[]) => {
  try {
    const csvHeaders = [
      'Name',
      'Code', 
      'Discount Type',
      'Discount Value',
      'Status',
      'Usage Limit',
      'Used Count',
      'Validity Start',
      'Validity End',
      'Created At',
      'Notes'
    ];

    const csvRows = coupons.map(coupon => [
      coupon.name,
      coupon.code,
      coupon.discount_type,
      coupon.discount_value,
      coupon.status,
      coupon.usage_limit_total || 'Unlimited',
      coupon.used_count,
      coupon.validity_start_date ? format(new Date(coupon.validity_start_date), 'yyyy-MM-dd') : '',
      coupon.validity_end_date ? format(new Date(coupon.validity_end_date), 'yyyy-MM-dd') : '',
      format(new Date(coupon.created_at), 'yyyy-MM-dd HH:mm:ss'),
      coupon.notes || ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `coupons_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error: any) {
    console.error('Error exporting coupons to CSV:', error);
    throw error;
  }
};
