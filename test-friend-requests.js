// Friend Request API Testing Script
// Run this in browser console to test all endpoints

const API_BASE = 'http://localhost:3000/api';

// Get your user ID from localStorage
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const userId = currentUser?.id;

console.log('🧪 Testing Friend Request System');
console.log('Current User ID:', userId);

async function testEndpoints() {
  if (!userId) {
    console.error('❌ No user logged in! Please login first.');
    return;
  }

  console.log('\n📡 Test 1: Get Pending Requests');
  try {
    const response = await fetch(`${API_BASE}/friend-request/pending?userId=${userId}`);
    const data = await response.json();
    console.log('✅ Pending requests:', data.length || 0);
    console.log(data);
  } catch (error) {
    console.error('❌ Failed:', error);
  }

  console.log('\n📡 Test 2: Get Sent Requests');
  try {
    const response = await fetch(`${API_BASE}/friend-request/sent?userId=${userId}`);
    const data = await response.json();
    console.log('✅ Sent requests:', data.length || 0);
    console.log(data);
  } catch (error) {
    console.error('❌ Failed:', error);
  }

  console.log('\n📡 Test 3: Get Matches (Friends)');
  try {
    const response = await fetch(`${API_BASE}/matches?userId=${userId}`);
    const data = await response.json();
    console.log('✅ Friends:', data.matches?.length || 0);
    console.log(data.matches);
  } catch (error) {
    console.error('❌ Failed:', error);
  }

  console.log('\n✅ All tests completed!');
  console.log('\n💡 To send a friend request, use:');
  console.log(`
await fetch('${API_BASE}/friend-request/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderId: '${userId}',
    receiverId: 'PASTE_RECEIVER_ID_HERE'
  })
}).then(r => r.json()).then(console.log)
  `);
}

testEndpoints();
