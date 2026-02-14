import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmTestUser() {
  console.log('🔧 Confirming test user email...\n');

  try {
    // Get the test user from auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    const testUser = users.find(u => u.email === 'test@tradelens.com');
    
    if (!testUser) {
      console.error('❌ Test user not found');
      return;
    }

    console.log('✅ Found test user:', testUser.id);

    // Update the user to confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(
      testUser.id,
      { email_confirm: true }
    );

    if (error) {
      console.error('❌ Error confirming email:', error.message);
      return;
    }

    console.log('✅ Email confirmed successfully');

    // Also update app_users table
    const { error: updateError } = await supabase
      .from('app_users')
      .update({ email_verified: true })
      .eq('id', testUser.id);

    if (updateError) {
      console.error('❌ Error updating app_users:', updateError.message);
    } else {
      console.log('✅ app_users updated');
    }

    console.log('\n✅ Test user is now ready to use!');
    console.log('   Email: test@tradelens.com');
    console.log('   Password: Test123456!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

confirmTestUser();
