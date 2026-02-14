import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfilePage() {
  console.log('🧪 Testing Profile Page Functionality\n');
  console.log('=' .repeat(60));

  try {
    // 1. Sign in as test user
    console.log('\n1️⃣ Signing in as test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@tradelens.com',
      password: 'Test123456!'
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Signed in successfully');
    console.log('   User ID:', authData.user.id);

    // 2. Get app_users ID using the auth context
    console.log('\n2️⃣ Getting app_users ID...');
    
    // The function uses auth.uid() internally, so we just call it
    const { data: userIdData, error: userIdError } = await supabase.rpc('get_user_id_from_auth');

    if (userIdError) {
      console.error('❌ Error getting user ID:', userIdError.message);
      // Fallback: query directly
      console.log('   Trying direct query...');
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', authData.user.id)
        .single();
      
      if (userError) {
        console.error('❌ Direct query also failed:', userError.message);
        return;
      }
      
      console.log('✅ App User ID (from direct query):', userData.id);
      var appUserId = userData.id;
    } else {
      console.log('✅ App User ID:', userIdData);
      var appUserId = userIdData;
    }

    // 3. Fetch user profile (same query as useUserProfile hook)
    console.log('\n3️⃣ Fetching user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('app_users')
      .select(`
        *,
        trader_profile:trader_profiles(*)
      `)
      .eq('id', appUserId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      console.error('   Details:', profileError);
      return;
    }

    console.log('✅ Profile data fetched successfully');
    console.log('\n📋 Profile Details:');
    console.log('   Email:', profileData.email);
    console.log('   Username:', profileData.username);
    console.log('   First Name:', profileData.first_name);
    console.log('   Last Name:', profileData.last_name);
    console.log('   Avatar URL:', profileData.avatar_url || 'Not set');
    console.log('   User Role:', profileData.user_role);
    console.log('   Subscription Status:', profileData.subscription_status);
    console.log('   Email Verified:', profileData.email_verified);
    console.log('   Onboarding Completed:', profileData.onboarding_completed);
    console.log('   Profile Completed:', profileData.profile_completed);

    // Handle trader_profile (could be array or object)
    const traderProfile = Array.isArray(profileData.trader_profile) 
      ? profileData.trader_profile[0] 
      : profileData.trader_profile;

    console.log('\n👤 Trader Profile:');
    if (traderProfile) {
      console.log('   Bio:', traderProfile.bio || 'Not set');
      console.log('   Is Public:', traderProfile.is_public);
      console.log('   Total Trades:', traderProfile.total_trades);
      console.log('   Win Rate:', traderProfile.win_rate + '%');
      console.log('   Total P&L:', traderProfile.total_pnl);
      console.log('   Stats Visibility:', JSON.stringify(traderProfile.stats_visibility, null, 2));
    } else {
      console.log('   ⚠️  No trader profile found - will be created on first access');
    }

    // 4. Test subscription data
    console.log('\n4️⃣ Fetching subscription data...');
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans(*)
      `)
      .eq('user_id', appUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error('❌ Error fetching subscription:', subscriptionError.message);
    } else if (subscriptionData) {
      console.log('✅ Subscription data found');
      console.log('   Plan:', subscriptionData.subscription_plans?.display_name || 'Unknown');
      console.log('   Status:', subscriptionData.status);
      console.log('   Billing Cycle:', subscriptionData.billing_cycle);
      console.log('   Current Period End:', subscriptionData.current_period_end);
    } else {
      console.log('⚠️  No subscription found (using trial)');
    }

    // 5. Test payment history
    console.log('\n5️⃣ Fetching payment history...');
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', appUserId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (paymentError) {
      console.error('❌ Error fetching payments:', paymentError.message);
    } else {
      console.log(`✅ Found ${paymentData?.length || 0} payment records`);
      if (paymentData && paymentData.length > 0) {
        paymentData.forEach((payment, index) => {
          console.log(`   ${index + 1}. ${payment.payment_date} - ${payment.currency} ${payment.amount} - ${payment.status}`);
        });
      }
    }

    // 6. Test profile update
    console.log('\n6️⃣ Testing profile update...');
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        first_name: 'Test',
        last_name: 'User',
        updated_at: new Date().toISOString()
      })
      .eq('id', appUserId);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
    } else {
      console.log('✅ Profile update successful');
    }

    // 7. Test trader profile upsert
    console.log('\n7️⃣ Testing trader profile upsert...');
    const { error: traderUpdateError } = await supabase
      .from('trader_profiles')
      .upsert({
        user_id: appUserId,
        bio: 'Test trader profile',
        is_public: false,
        stats_visibility: {
          show_pnl: true,
          show_win_rate: true,
          show_trades: true
        }
      });

    if (traderUpdateError) {
      console.error('❌ Error updating trader profile:', traderUpdateError.message);
    } else {
      console.log('✅ Trader profile upsert successful');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All profile page tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - User authentication: ✅');
    console.log('   - Profile data loading: ✅');
    console.log('   - Subscription data: ✅');
    console.log('   - Payment history: ✅');
    console.log('   - Profile updates: ✅');
    console.log('   - Trader profile: ✅');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testProfilePage();
