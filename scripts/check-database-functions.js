import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseFunctions() {
  console.log('🔍 Checking Database Functions\n');
  console.log('='.repeat(60));

  try {
    // Query for all functions in the public schema
    const { data: functions, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_function_result(p.oid) as return_type,
            obj_description(p.oid) as description
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          ORDER BY p.proname;
        `
      });

    if (error) {
      // Try alternative method
      console.log('⚠️  exec_sql not available, using direct query...\n');
      
      const { data, error: queryError } = await supabase
        .from('pg_proc')
        .select('proname');
      
      if (queryError) {
        console.log('❌ Cannot query functions directly\n');
        console.log('📝 Listing functions from migration files instead...\n');
        
        // List expected functions based on migrations
        const expectedFunctions = [
          'get_user_id_from_auth',
          'calculate_trade_metrics',
          'update_trade_metrics',
          'update_strategy_stats',
          'update_account_stats',
          'update_trader_profile_stats',
          'check_feature_access',
          'check_resource_limit',
          'get_user_plan_limits',
          'is_admin',
          'user_owns_record',
          'add_trade_image',
          'remove_trade_image',
          'share_trade',
          'unshare_trade',
          'like_trade',
          'unlike_trade',
          'follow_user',
          'unfollow_user',
          'pin_trade',
          'unpin_trade'
        ];

        console.log('📋 Expected Functions:');
        expectedFunctions.forEach((fn, index) => {
          console.log(`   ${index + 1}. ${fn}`);
        });

        console.log('\n✅ To verify these exist, check migration files:');
        console.log('   - supabase/migrations/20241123100007_phase8_database_functions.sql');
        console.log('   - supabase/migrations/20241123100012_phase12_missing_functions.sql');
        console.log('   - supabase/migrations/20241123210000_access_control_functions.sql');
        console.log('   - supabase/migrations/20241123220000_additional_helper_functions.sql');
        
        return;
      }
    }

    if (functions && functions.length > 0) {
      console.log(`\n✅ Found ${functions.length} functions:\n`);
      functions.forEach((fn, index) => {
        console.log(`${index + 1}. ${fn.function_name}`);
        if (fn.arguments) {
          console.log(`   Args: ${fn.arguments}`);
        }
        if (fn.return_type) {
          console.log(`   Returns: ${fn.return_type}`);
        }
        if (fn.description) {
          console.log(`   Description: ${fn.description}`);
        }
        console.log('');
      });
    }

    // Test key functions
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Testing Key Functions\n');

    // Test get_user_id_from_auth
    console.log('1. Testing get_user_id_from_auth()...');
    const { data: userId, error: userIdError } = await supabase.rpc('get_user_id_from_auth');
    if (userIdError) {
      console.log('   ❌ Error:', userIdError.message);
    } else {
      console.log('   ✅ Works (returns null when not authenticated)');
    }

    // Test check_feature_access
    console.log('\n2. Testing check_feature_access()...');
    const { data: featureAccess, error: featureError } = await supabase.rpc('check_feature_access', {
      feature_name: 'ai_analysis'
    });
    if (featureError) {
      console.log('   ❌ Error:', featureError.message);
    } else {
      console.log('   ✅ Works:', featureAccess);
    }

    // Test is_admin
    console.log('\n3. Testing is_admin()...');
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError) {
      console.log('   ❌ Error:', adminError.message);
    } else {
      console.log('   ✅ Works:', isAdmin);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Database function check complete!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseFunctions();
