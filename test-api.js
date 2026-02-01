// Simple API test script
// Run with: node test-api.js

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Testing CodeEditor APIs...\n');

    try {
        // Test 1: Get projects
        console.log('1. Testing GET /api/projects');
        const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
        const projectsData = await projectsResponse.json();
        console.log('✅ Projects:', projectsData);
        console.log('');

        // Test 2: Create a new project
        console.log('2. Testing POST /api/projects');
        const newProject = {
            name: 'Test Project',
            language: 'javascript',
            code: 'console.log("Hello from API test!");'
        };

        const createResponse = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProject)
        });

        const createData = await createResponse.json();
        console.log('✅ Created project:', createData);
        console.log('');

        // Test 3: Execute code
        console.log('3. Testing POST /api/execute');
        const executeResponse = await fetch(`${BASE_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: 'console.log("Hello, World!");',
                language: 'javascript'
            })
        });

        const executeData = await executeResponse.json();
        console.log('✅ Code execution:', executeData);
        console.log('');

        // Test 4: Get supported languages
        console.log('4. Testing GET /api/execute');
        const languagesResponse = await fetch(`${BASE_URL}/api/execute`);
        const languagesData = await languagesResponse.json();
        console.log('✅ Supported languages:', languagesData);
        console.log('');

        console.log('🎉 All API tests passed!');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

// Run tests
testAPI();