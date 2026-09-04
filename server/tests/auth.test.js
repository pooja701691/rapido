require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Captain = require('../src/models/captain.model');

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let server;

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
};

const runTests = async () => {
  console.log('\n=============================================');
  console.log('🚀 Starting Rapido Authentication Module Tests');
  console.log('=============================================\n');

  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rapido');
    console.log('[Test Setup] Connected to MongoDB.');

    // Clean up test data
    await User.deleteMany({ email: /test.*@example\.com/i });
    await Captain.deleteMany({ email: /test.*@example\.com/i });
    console.log('[Test Setup] Cleaned up existing test records.\n');

    // 2. Start server
    server = app.listen(TEST_PORT);
    console.log(`[Test Server] Listening on ${BASE_URL}\n`);

    let userToken = '';
    let captainToken = '';

    // ----------------------------------------------------
    // TEST 1: Register User (Success)
    // ----------------------------------------------------
    console.log('--- TEST 1: Register New User ---');
    const userRegRes = await fetch(`${BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: 'testuser@example.com',
        password: 'Password123!',
        phone: '9876543210',
      }),
    });
    const userRegData = await userRegRes.json();
    assert(userRegRes.status === 201, `Status code is 201 (Got: ${userRegRes.status})`);
    assert(userRegData.success === true, 'Response indicates success: true');
    assert(userRegData.token, 'Response contains JWT token');
    assert(userRegData.data.user.email === 'testuser@example.com', 'User email matches input');
    assert(!userRegData.data.user.password, 'Password is NOT exposed in response');
    userToken = userRegData.token;

    // ----------------------------------------------------
    // TEST 2: Duplicate Email Registration (User)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Duplicate Email Registration ---');
    const dupEmailRes = await fetch(`${BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Duplicate',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'Password123!',
        phone: '9876543211',
      }),
    });
    const dupEmailData = await dupEmailRes.json();
    assert(dupEmailRes.status === 409, `Status code is 409 Conflict (Got: ${dupEmailRes.status})`);
    assert(dupEmailData.success === false, 'Response indicates success: false');

    // ----------------------------------------------------
    // TEST 3: Duplicate Phone Registration (User)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Duplicate Phone Registration ---');
    const dupPhoneRes = await fetch(`${BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Duplicate',
        lastName: 'Phone',
        email: 'testuser2@example.com',
        password: 'Password123!',
        phone: '9876543210',
      }),
    });
    const dupPhoneData = await dupPhoneRes.json();
    assert(dupPhoneRes.status === 409, `Status code is 409 Conflict (Got: ${dupPhoneRes.status})`);
    assert(dupPhoneData.success === false, 'Response indicates success: false');

    // ----------------------------------------------------
    // TEST 4: Validation Errors (Invalid email, short password)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Input Validation Errors ---');
    const invalidRes = await fetch(`${BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Jo',
        email: 'notanemail',
        password: '123',
        phone: '123',
      }),
    });
    const invalidData = await invalidRes.json();
    assert(invalidRes.status === 400, `Status code is 400 Bad Request (Got: ${invalidRes.status})`);
    assert(invalidData.errors && invalidData.errors.length >= 3, 'Errors array contains multiple validation messages');

    // ----------------------------------------------------
    // TEST 5: User Login (Wrong Password)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: User Login - Wrong Password ---');
    const wrongPassRes = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'WrongPassword!',
      }),
    });
    const wrongPassData = await wrongPassRes.json();
    assert(wrongPassRes.status === 401, `Status code is 401 Unauthorized (Got: ${wrongPassRes.status})`);
    assert(wrongPassData.success === false, 'Login failed');

    // ----------------------------------------------------
    // TEST 6: User Login (Valid Credentials)
    // ----------------------------------------------------
    console.log('\n--- TEST 6: User Login - Valid Credentials ---');
    const userLoginRes = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'Password123!',
      }),
    });
    const userLoginData = await userLoginRes.json();
    assert(userLoginRes.status === 200, `Status code is 200 OK (Got: ${userLoginRes.status})`);
    assert(userLoginData.token, 'Token returned on login');
    assert(!userLoginData.data.user.password, 'Password is NOT exposed in user data');

    // ----------------------------------------------------
    // TEST 7: Get User Profile (With Valid Token)
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Get User Profile (Valid Token) ---');
    const userProfRes = await fetch(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userProfData = await userProfRes.json();
    assert(userProfRes.status === 200, `Status code is 200 OK (Got: ${userProfRes.status})`);
    assert(userProfData.data.user.email === 'testuser@example.com', 'Profile email matches');

    // ----------------------------------------------------
    // TEST 8: Missing JWT Token
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Missing JWT Token ---');
    const noTokenRes = await fetch(`${BASE_URL}/api/users/profile`);
    const noTokenData = await noTokenRes.json();
    assert(noTokenRes.status === 401, `Status code is 401 Unauthorized (Got: ${noTokenRes.status})`);
    assert(noTokenData.success === false, 'Access rejected without token');

    // ----------------------------------------------------
    // TEST 9: Invalid JWT Token
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Invalid JWT Token ---');
    const badTokenRes = await fetch(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: 'Bearer thisisnotavalidjwttoken' },
    });
    assert(badTokenRes.status === 401, `Status code is 401 Unauthorized (Got: ${badTokenRes.status})`);

    // ----------------------------------------------------
    // TEST 10: Register Captain (With Vehicle Info)
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Register Captain with Vehicle ---');
    const capRegRes = await fetch(`${BASE_URL}/api/captains/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Vikram',
        lastName: 'Rathore',
        email: 'testcaptain@example.com',
        password: 'Password123!',
        phone: '9876543220',
        vehicle: {
          color: 'Black',
          plate: 'UP32AB1234',
          capacity: 1,
          vehicleType: 'bike',
        },
      }),
    });
    const capRegData = await capRegRes.json();
    assert(capRegRes.status === 201, `Status code is 201 (Got: ${capRegRes.status})`);
    assert(capRegData.token, 'Token returned for registered captain');
    assert(capRegData.data.captain.role === 'CAPTAIN', 'Captain role is CAPTAIN');
    assert(capRegData.data.captain.vehicle.vehicleType === 'bike', 'Vehicle details attached');
    assert(!capRegData.data.captain.password, 'Captain password is NOT exposed');
    captainToken = capRegData.token;

    // ----------------------------------------------------
    // TEST 11: Captain Login (Valid Credentials)
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Captain Login ---');
    const capLoginRes = await fetch(`${BASE_URL}/api/captains/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testcaptain@example.com',
        password: 'Password123!',
      }),
    });
    const capLoginData = await capLoginRes.json();
    assert(capLoginRes.status === 200, `Status code is 200 OK (Got: ${capLoginRes.status})`);
    assert(capLoginData.token, 'Token returned on captain login');

    // ----------------------------------------------------
    // TEST 12: Get Captain Profile (Valid Captain Token)
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Get Captain Profile ---');
    const capProfRes = await fetch(`${BASE_URL}/api/captains/profile`, {
      headers: { Authorization: `Bearer ${captainToken}` },
    });
    const capProfData = await capProfRes.json();
    assert(capProfRes.status === 200, `Status code is 200 OK (Got: ${capProfRes.status})`);
    assert(capProfData.data.captain.email === 'testcaptain@example.com', 'Profile email matches');

    // ----------------------------------------------------
    // TEST 13: USER accessing CAPTAIN Route (Forbidden)
    // ----------------------------------------------------
    console.log('\n--- TEST 13: USER accessing CAPTAIN Route (403 Forbidden) ---');
    const userForbiddenRes = await fetch(`${BASE_URL}/api/captains/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userForbiddenData = await userForbiddenRes.json();
    assert(userForbiddenRes.status === 403, `Status code is 403 Forbidden (Got: ${userForbiddenRes.status})`);
    assert(userForbiddenData.success === false, 'Access forbidden');

    // ----------------------------------------------------
    // TEST 14: CAPTAIN accessing USER Route (Forbidden)
    // ----------------------------------------------------
    console.log('\n--- TEST 14: CAPTAIN accessing USER Route (403 Forbidden) ---');
    const capForbiddenRes = await fetch(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${captainToken}` },
    });
    const capForbiddenData = await capForbiddenRes.json();
    assert(capForbiddenRes.status === 403, `Status code is 403 Forbidden (Got: ${capForbiddenRes.status})`);
    assert(capForbiddenData.success === false, 'Access forbidden');

    // ----------------------------------------------------
    // TEST 15: Logout User
    // ----------------------------------------------------
    console.log('\n--- TEST 15: User Logout ---');
    const userLogoutRes = await fetch(`${BASE_URL}/api/users/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userLogoutData = await userLogoutRes.json();
    assert(userLogoutRes.status === 200, `Status code is 200 OK (Got: ${userLogoutRes.status})`);
    assert(userLogoutData.success === true, 'User logged out successfully');

    // ----------------------------------------------------
    // TEST 16: Logout Captain
    // ----------------------------------------------------
    console.log('\n--- TEST 16: Captain Logout ---');
    const capLogoutRes = await fetch(`${BASE_URL}/api/captains/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${captainToken}` },
    });
    const capLogoutData = await capLogoutRes.json();
    assert(capLogoutRes.status === 200, `Status code is 200 OK (Got: ${capLogoutRes.status})`);
    assert(capLogoutData.success === true, 'Captain logged out successfully');

    console.log('\n=============================================');
    console.log('🎉 ALL 16 INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('=============================================\n');
  } catch (error) {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  } finally {
    // Cleanup test records and disconnect
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: /test.*@example\.com/i });
      await Captain.deleteMany({ email: /test.*@example\.com/i });
      await mongoose.connection.close();
    }
    if (server) server.close();
    process.exit(0);
  }
};

runTests();
