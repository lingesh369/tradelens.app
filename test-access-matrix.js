// Test access matrix
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testAccessMatrix() {
  // First signup
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('1. Creating test user:', testEmail);
  
  const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });
  
  const signupData = await signupResponse.json();
  
  if (!signupResponse.ok) {
    console.error('❌ Signup failed:', signupData);
    return false;
  }
  
  if (!signupData.user || !signupData.access_token) {
    console.error('❌ No session returned. Response:', JSON.stringify(signupData, null, 2));
    return false;
  }
  
  const userId = signupData.user.id;
  const accessToken = signupData.access_token;
  
  console.log('✅ User created:', userId);
  
  // Now test the access matrix
  console.log('\n2. Testing get_user_access_matrix...');
  
  const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_access_matrix`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      auth_user_id: userId
    })
  });
  
  const accessData = await rpcResponse.json();
  
  if (!rpcResponse.ok) {
    console.error('❌ RPC failed:', accessData);
    return false;
  }
  
  console.log('\n✅ Access Matrix Data:');
  console.log(JSON.stringify(accessData, null, 2));
  
  // Check key fields
  const data = Array.isArray(accessData) ? accessData[0] : accessData;
  
  console.log('\n📊 Key Fields:');
  console.log('  Plan Name:', data.plan_name);
  console.log('  Status:', data.status);
  console.log('  Is Active:', data.isactive);
  console.log('  Trial End Date:', data.trialenddate);
  console.log('  Notes Access:', data.notesaccess);
  console.log('  Profile Access:', data.profileaccess);
  
  if (data.isactive) {
    console.log('\n✅ SUCCESS: User has active access!');
    return true;
  } else {
    console.log('\n❌ FAIL: User does not have active access');
    return false;
  }
}

testAccessMatrix().then(success => {
  process.exit(success ? 0 : 1);
});
