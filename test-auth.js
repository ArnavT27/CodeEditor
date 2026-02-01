/**
 * Authentication API Test Script
 * 
 * This script tests the authentication endpoints with MongoDB.
 * Run with: node test-auth.js
 * 
 * Make sure your Next.js dev server is running on http://localhost:3000
 * and MongoDB is connected via config.env
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`, // Unique email
    password: 'testpassword123',
    passwordConfirm: 'testpassword123'
};

// Helper function to make requests
async function makeRequest(endpoint, method, body) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        console.error('Request failed:', error.message);
        return { error: error.message };
    }
}

// Test functions
async function testSignUp() {
    console.log('\n🧪 Testing Sign Up...');
    console.log('Request:', testUser);

    const result = await makeRequest('/api/auth/signup', 'POST', testUser);

    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.data.success) {
        console.log('✅ Sign up successful!');
        return result.data;
    } else {
        console.log('❌ Sign up failed:', result.data.error);
        return null;
    }
}

async function testSignIn() {
    console.log('\n🧪 Testing Sign In...');
    const credentials = {
        email: testUser.email,
        password: testUser.password
    };
    console.log('Request:', credentials);

    const result = await makeRequest('/api/auth/signin', 'POST', credentials);

    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.data.success) {
        console.log('✅ Sign in successful!');
        return result.data;
    } else {
        console.log('❌ Sign in failed:', result.data.error);
        return null;
    }
}

async function testInvalidSignIn() {
    console.log('\n🧪 Testing Invalid Sign In...');
    const credentials = {
        email: testUser.email,
        password: 'wrongpassword'
    };
    console.log('Request:', credentials);

    const result = await makeRequest('/api/auth/signin', 'POST', credentials);

    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (!result.data.success && result.status === 401) {
        console.log('✅ Invalid credentials correctly rejected!');
        return true;
    } else {
        console.log('❌ Should have rejected invalid credentials');
        return false;
    }
}

async function testDuplicateSignUp() {
    console.log('\n🧪 Testing Duplicate Sign Up...');
    console.log('Request:', testUser);

    const result = await makeRequest('/api/auth/signup', 'POST', testUser);

    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (!result.data.success && result.status === 409) {
        console.log('✅ Duplicate email correctly rejected!');
        return true;
    } else {
        console.log('❌ Should have rejected duplicate email');
        return false;
    }
}

async function testWeakPassword() {
    console.log('\n🧪 Testing Weak Password...');
    const weakUser = {
        name: 'Weak User',
        email: `weak${Date.now()}@example.com`,
        password: 'short'
    };
    console.log('Request:', weakUser);

    const result = await makeRequest('/api/auth/signup', 'POST', weakUser);

    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (!result.data.success && result.status === 400) {
        console.log('✅ Weak password correctly rejected!');
        return true;
    } else {
        console.log('❌ Should have rejected weak password');
        return false;
    }
}

async function testInvalidEmail() {
    console.log('\n🧪 Testing Invalid Email...');
    const invalidUser = {
        name: 'Invalid User',
        email: 'not-an-email',
        password: 'testpassword123'
    };
    console.log('Request:', invalidUser);

    const result = await makeRequest('/api/auth/signup', 'POST', invalidUser);

    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (!result.data.success && result.status === 400) {
        console.log('✅ Invalid email correctly rejected!');
        return true;
    } else {
        console.log('❌ Should have rejected invalid email');
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Authentication Tests');
    console.log('================================');
    console.log('Base URL:', BASE_URL);
    console.log('Test User Email:', testUser.email);

    let passed = 0;
    let failed = 0;

    // Test 1: Sign Up
    const signUpResult = await testSignUp();
    if (signUpResult) passed++; else failed++;

    // Test 2: Sign In
    const signInResult = await testSignIn();
    if (signInResult) passed++; else failed++;

    // Test 3: Invalid Sign In
    const invalidSignInResult = await testInvalidSignIn();
    if (invalidSignInResult) passed++; else failed++;

    // Test 4: Duplicate Sign Up
    const duplicateResult = await testDuplicateSignUp();
    if (duplicateResult) passed++; else failed++;

    // Test 5: Weak Password
    const weakPasswordResult = await testWeakPassword();
    if (weakPasswordResult) passed++; else failed++;

    // Test 6: Invalid Email
    const invalidEmailResult = await testInvalidEmail();
    if (invalidEmailResult) passed++; else failed++;

    // Summary
    console.log('\n================================');
    console.log('📊 Test Summary');
    console.log('================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);
    console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the output above.');
    }
}

// Run tests
runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
