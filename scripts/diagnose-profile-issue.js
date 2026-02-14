/**
 * Diagnostic Script: Profile Creation Issue
 * 
 * This script checks:
 * 1. If the trigger exists and is enabled
 * 2. If RLS policies are blocking profile creation
 * 3. Recent user creation attempts and errors
 * 4. Current RLS policies on app_users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTrigger() {
  console.log('\n📋 Checking Database Trigger...');
  console.log('='.repeat(50));
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        t.tgname as trigger_name,
        t.tgenabled as enabled,
        p.proname as function_name,
        c.relname as table_name
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname = 'on_auth_user_created'
    `
  });
  
  if (error) {
    console.error('❌ Error checking trigger:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✓ Trigger found:', data[0]);
  } else {
    console.log('❌ Trigger NOT found - this is the problem!');
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Checking RLS Policies on app_users...');
  console.log('='.repeat(50));
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        polname as policy_name,
        polcmd as command,
        polpermissive as permissive,
        pg_get_expr(polqual, polrelid) as using_expression,
        pg_get_expr(polwithcheck, polrelid) as with_check_expression
      FROM pg_policy
      WHERE polrelid = 'app_users'::regclass
      ORDER BY polname
    `
  });
  
  if (error) {
    console.error('❌ Error checking policies:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log(`Found ${data.length} policies:`);
    data.forEach(policy => {
      console.log(`\n  Policy: ${policy.policy_name}`);
      console.log(`  Command: ${policy.command}`);
      console.log(`  Using: ${policy.using_expression || 'N/A'}`);
      console.log(`  With Check: ${policy.with_check_expression || 'N/A'}`);
    });
  } else {
    console.log('⚠️  No RLS policies found on app_users');
  }
}

async function checkRecentCreationAttempts() {
  console.log('\n📊 Recent User Creation Attempts...');
  console.log('='.repeat(50));
  
  const { data, error } = await supabase
    .from('user_creation_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error checking creation log:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log(`Found ${data.length} recent attempts:\n`);
    data.forEach(log => {
      const status = log.profile_created ? '✓' : '❌';
      console.log(`${status} ${log.email}`);
      console.log(`   Created: ${log.created_at}`);
      console.log(`   Attempts: ${log.profile_creation_attempts}`);
      if (log.profile_creation_error) {
        console.log(`   Error: ${log.profile_creation_error}`);
      }
      console.log('');
    });
  } else {
    console.log('No creation attempts found in log');
  }
}

async function checkAuthUsers() {
  console.log('\n👥 Recent Auth Users vs App Users...');
  console.log('='.repeat(50));
  
  // Get recent auth users
  const { data: authData, error: authError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT id, email, created_at, email_confirmed_at
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 5
    `
  });
  
  if (authError) {
    console.error('❌ Error checking auth users:', authError.message);
    return;
  }
  
  if (authData && authData.length > 0) {
    console.log('Recent auth.users:');
    for (const user of authData) {
      console.log(`\n  ${user.email} (${user.id})`);
      console.log(`  Created: ${user.created_at}`);
      
      // Check if app_users record exists
      const { data: appUser, error: appError } = await supabase
        .from('app_users')
        .select('id, created_at, profile_completed')
        .eq('id', user.id)
        .maybeSingle();
      
      if (appUser) {
        console.log(`  ✓ app_users record exists`);
        console.log(`  Profile completed: ${appUser.profile_completed}`);
      } else {
        console.log(`  ❌ NO app_users record - TRIGGER FAILED!`);
      }
    }
  } else {
    console.log('No auth users found');
  }
}

async function testRLSAccess() {
  console.log('\n🧪 Testing RLS Access...');
  console.log('='.repeat(50));
  
  // Try to query app_users with service role
  const { data, error, count } = await supabase
    .from('app_users')
    .select('id, email', { count: 'exact' })
    .limit(1);
  
  if (error) {
    console.error('❌ Service role cannot query app_users:', error.message);
  } else {
    console.log(`✓ Service role can query app_users (${count} total users)`);
  }
}

async function main() {
  console.log('\n🔍 Profile Creation Diagnostic Tool');
  console.log('='.repeat(50));
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('Using service role key for diagnostics\n');
  
  try {
    await checkTrigger();
    await checkRLSPolicies();
    await checkRecentCreationAttempts();
    await checkAuthUsers();
    await testRLSAccess();
    
    console.log('\n' + '='.repeat(50));
    console.log('📝 Summary & Recommendations:');
    console.log('='.repeat(50));
    console.log(`
1. If trigger is missing: Run the migration to create it
2. If RLS policies are blocking: Apply the RLS fix migration
3. If creation log shows errors: Check the error messages
4. If auth users exist but app_users don't: Trigger is failing

Next steps:
- Run: npm run fix-profile-creation (or the .bat script)
- Check Supabase logs: supabase logs
- Test signup with a new email address
    `);
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
  }
}

main();
