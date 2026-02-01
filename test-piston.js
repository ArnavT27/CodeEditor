// Test Piston API Integration
// Run with: node test-piston.js

const BASE_URL = 'http://localhost:3000';

async function testPistonIntegration() {
    console.log('🧪 Testing Piston API Integration...\n');

    try {
        // Test 1: Check Piston API status
        console.log('1. Checking Piston API status...');
        const statusResponse = await fetch(`${BASE_URL}/api/execute`);
        const statusData = await statusResponse.json();
        console.log('✅ Piston Status:', statusData.pistonApiStatus);
        console.log('📊 Supported Languages:', statusData.totalLanguages);
        console.log('');

        // Test 2: Execute JavaScript code
        console.log('2. Testing JavaScript execution...');
        const jsCode = `
console.log("Hello from Piston API!");
console.log("Current time:", new Date().toISOString());
console.log("Math calculation:", 2 + 2 * 3);

// Test array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);
`;

        const jsResponse = await fetch(`${BASE_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: jsCode,
                language: 'javascript'
            })
        });

        const jsData = await jsResponse.json();
        console.log('✅ JavaScript Result:');
        console.log(jsData.result.output);
        console.log('');

        // Test 3: Execute Python code
        console.log('3. Testing Python execution...');
        const pythonCode = `
print("Hello from Python via Piston!")
print("Python version check...")

# Test basic operations
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print(f"Original: {numbers}")
print(f"Doubled: {doubled}")

# Test function
def greet(name):
    return f"Hello, {name}!"

print(greet("Piston API"))
`;

        const pythonResponse = await fetch(`${BASE_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: pythonCode,
                language: 'python'
            })
        });

        const pythonData = await pythonResponse.json();
        console.log('✅ Python Result:');
        console.log(pythonData.result.output);
        console.log('');

        // Test 4: Execute C++ code
        console.log('4. Testing C++ execution...');
        const cppCode = `
#include <iostream>
#include <vector>

int main() {
    std::cout << "Hello from C++ via Piston!" << std::endl;
    
    // Test vector operations
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << "Numbers: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Test calculation
    int sum = 0;
    for (int num : numbers) {
        sum += num;
    }
    std::cout << "Sum: " << sum << std::endl;
    
    return 0;
}
`;

        const cppResponse = await fetch(`${BASE_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: cppCode,
                language: 'cpp'
            })
        });

        const cppData = await cppResponse.json();
        console.log('✅ C++ Result:');
        console.log(cppData.result.output);
        console.log('');

        // Test 5: Test error handling
        console.log('5. Testing error handling...');
        const errorCode = `
console.log("This will work");
undefinedFunction(); // This will cause an error
console.log("This won't execute");
`;

        const errorResponse = await fetch(`${BASE_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: errorCode,
                language: 'javascript'
            })
        });

        const errorData = await errorResponse.json();
        console.log('✅ Error Handling Result:');
        console.log(errorData.result.output);
        console.log('');

        console.log('🎉 All Piston API tests completed!');
        console.log('🚀 Your CodeEditor is now powered by real code execution!');

    } catch (error) {
        console.error('❌ Piston API test failed:', error.message);
        console.log('\n💡 Make sure:');
        console.log('- Your Next.js server is running (npm run dev)');
        console.log('- You have internet connection');
        console.log('- Piston API (emkc.org) is accessible');
    }
}

// Run tests
testPistonIntegration();