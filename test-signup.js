// Test signup script
// Node 22+ has built-in fetch

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testSignup() {
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('Testing signup with:', testEmail);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        data: {
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser'
        }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Signup failed:', response.status, response.statusText);
      console.error('Error details:', JSON.stringify(data, null, 2));
      return false;
    }
    
    console.log('✅ Signup successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    
    // Check if user was created in app_users
    console.log('\nChecking database records...');
    
    return true;
  } catch (error) {
    console.error('❌ Error during signup:', error.message);
    return false;
  }
}

testSignup().then(success => {
  process.exit(success ? 0 : 1);
});
