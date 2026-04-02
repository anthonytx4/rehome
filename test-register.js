import axios from 'axios';

const run = async () => {
  const email = `test_${Math.floor(Math.random() * 100000)}@rehome.world`;
  console.log(`Testing registration for: ${email}`);
  
  try {
    const res = await axios.post('https://www.rehome.world/api/auth/register', {
      name: 'Test Runner',
      email: email,
      password: 'password123',
      location: 'New York, NY'
    });
    console.log('✅ Registration SUCCESS:', res.status, res.data);
  } catch (err) {
    console.error('❌ Registration FAILED:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
  }
};

run();
