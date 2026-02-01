"use client";
import Editor from '@monaco-editor/react';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from './LanguageSelector';

// Sample code templates for different languages
const codeTemplates = {
  javascript: `// JavaScript Example
function greetUser(name) {
  console.log(\`Hello, \${name}! Welcome to CodeEditor.\`);
  return \`Greeting sent to \${name}\`;
}

// Call the function
const result = greetUser("Developer");
console.log(result);

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);`,

  typescript: `// TypeScript Example
interface User {
  name: string;
  age: number;
  email?: string;
}

function greetUser(user: User): string {
  console.log(\`Hello, \${user.name}! You are \${user.age} years old.\`);
  return \`Greeting sent to \${user.name}\`;
}

// Create a user object
const user: User = {
  name: "Developer",
  age: 25,
  email: "dev@example.com"
};

const result = greetUser(user);
console.log(result);`,

  python: `# Python Example
def greet_user(name, age=None):
    """Greet a user with their name and optional age."""
    if age:
        print(f"Hello, {name}! You are {age} years old.")
        return f"Greeting sent to {name} (age {age})"
    else:
        print(f"Hello, {name}! Welcome to CodeEditor.")
        return f"Greeting sent to {name}"

# Call the function
result = greet_user("Developer", 25)
print(result)

# List comprehension example
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled numbers:", doubled)`,

  java: `// Java Example
public class HelloWorld {
    public static void main(String[] args) {
        // Create an instance and call method
        HelloWorld app = new HelloWorld();
        String result = app.greetUser("Developer", 25);
        System.out.println(result);
        
        // Array operations
        int[] numbers = {1, 2, 3, 4, 5};
        app.printDoubledNumbers(numbers);
    }
    
    public String greetUser(String name, int age) {
        System.out.println("Hello, " + name + "! You are " + age + " years old.");
        return "Greeting sent to " + name;
    }
    
    public void printDoubledNumbers(int[] numbers) {
        System.out.print("Doubled numbers: ");
        for (int num : numbers) {
            System.out.print((num * 2) + " ");
        }
        System.out.println();
    }
}`,

  cpp: `// C++ Example
#include <iostream>
#include <string>
#include <vector>

class Greeter {
public:
    std::string greetUser(const std::string& name, int age) {
        std::cout << "Hello, " << name << "! You are " << age << " years old." << std::endl;
        return "Greeting sent to " + name;
    }
    
    void printDoubledNumbers(const std::vector<int>& numbers) {
        std::cout << "Doubled numbers: ";
        for (int num : numbers) {
            std::cout << (num * 2) << " ";
        }
        std::cout << std::endl;
    }
};

int main() {
    Greeter greeter;
    std::string result = greeter.greetUser("Developer", 25);
    std::cout << result << std::endl;
    
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    greeter.printDoubledNumbers(numbers);
    
    return 0;
}`,

  c: `// C Example
#include <stdio.h>
#include <string.h>

void greet_user(const char* name, int age) {
    printf("Hello, %s! You are %d years old.\\n", name, age);
}

void print_doubled_numbers(int numbers[], int size) {
    printf("Doubled numbers: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i] * 2);
    }
    printf("\\n");
}

int main() {
    // Greet user
    greet_user("Developer", 25);
    
    // Array operations
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    print_doubled_numbers(numbers, size);
    
    return 0;
}`,

  csharp: `// C# Example
using System;
using System.Linq;

public class Program
{
    public static void Main()
    {
        var program = new Program();
        string result = program.GreetUser("Developer", 25);
        Console.WriteLine(result);
        
        // Array operations with LINQ
        int[] numbers = {1, 2, 3, 4, 5};
        var doubled = numbers.Select(n => n * 2).ToArray();
        Console.WriteLine("Doubled numbers: " + string.Join(" ", doubled));
    }
    
    public string GreetUser(string name, int age)
    {
        Console.WriteLine($"Hello, {name}! You are {age} years old.");
        return $"Greeting sent to {name}";
    }
}`,

  go: `// Go Example
package main

import (
    "fmt"
)

func greetUser(name string, age int) string {
    fmt.Printf("Hello, %s! You are %d years old.\\n", name, age)
    return fmt.Sprintf("Greeting sent to %s", name)
}

func printDoubledNumbers(numbers []int) {
    fmt.Print("Doubled numbers: ")
    for _, num := range numbers {
        fmt.Printf("%d ", num*2)
    }
    fmt.Println()
}

func main() {
    // Greet user
    result := greetUser("Developer", 25)
    fmt.Println(result)
    
    // Slice operations
    numbers := []int{1, 2, 3, 4, 5}
    printDoubledNumbers(numbers)
}`,

  rust: `// Rust Example
fn greet_user(name: &str, age: u32) -> String {
    println!("Hello, {}! You are {} years old.", name, age);
    format!("Greeting sent to {}", name)
}

fn print_doubled_numbers(numbers: &[i32]) {
    print!("Doubled numbers: ");
    for &num in numbers {
        print!("{} ", num * 2);
    }
    println!();
}

fn main() {
    // Greet user
    let result = greet_user("Developer", 25);
    println!("{}", result);
    
    // Vector operations
    let numbers = vec![1, 2, 3, 4, 5];
    print_doubled_numbers(&numbers);
    
    // Functional approach
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    println!("Doubled (functional): {:?}", doubled);
}`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeEditor Example</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        button {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to CodeEditor!</h1>
        <p>This is a sample HTML page with embedded CSS and JavaScript.</p>
        <button onclick="greetUser()">Click me!</button>
        <div id="output"></div>
    </div>

    <script>
        function greetUser() {
            const output = document.getElementById('output');
            output.innerHTML = '<h3>Hello, Developer! Welcome to CodeEditor.</h3>';
        }
    </script>
</body>
</html>`,

  css: `/* CSS Example - Modern Card Design */
.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 30px;
  margin: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card-title {
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.card-content {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  font-size: 1.1rem;
}

.button {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.button:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
}`,

  json: `{
  "name": "CodeEditor Project",
  "version": "1.0.0",
  "description": "A modern code editor with syntax highlighting",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "webpack --mode production",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "monaco-editor": "^0.34.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "webpack": "^5.74.0",
    "jest": "^29.0.0"
  },
  "keywords": [
    "code-editor",
    "syntax-highlighting",
    "web-development",
    "javascript",
    "react"
  ],
  "author": {
    "name": "Developer",
    "email": "dev@codeeditor.com",
    "url": "https://codeeditor.com"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/codeeditor.git"
  },
  "bugs": {
    "url": "https://github.com/username/codeeditor/issues"
  },
  "homepage": "https://codeeditor.com"
}`,

  xml: `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <metadata>
        <name>CodeEditor</name>
        <version>1.0.0</version>
        <description>A modern web-based code editor</description>
        <author>Developer</author>
        <created>2024-01-01</created>
    </metadata>
    
    <configuration>
        <editor>
            <theme>dark</theme>
            <fontSize>14</fontSize>
            <tabSize>2</tabSize>
            <wordWrap>true</wordWrap>
            <lineNumbers>true</lineNumbers>
        </editor>
        
        <features>
            <syntaxHighlighting enabled="true"/>
            <autoCompletion enabled="true"/>
            <errorDetection enabled="true"/>
            <codeFormatting enabled="true"/>
        </features>
    </configuration>
    
    <supportedLanguages>
        <language name="JavaScript" extension="js"/>
        <language name="TypeScript" extension="ts"/>
        <language name="Python" extension="py"/>
        <language name="Java" extension="java"/>
        <language name="C++" extension="cpp"/>
        <language name="HTML" extension="html"/>
        <language name="CSS" extension="css"/>
    </supportedLanguages>
</project>`,

  markdown: `# CodeEditor - Modern Web-Based Code Editor

Welcome to **CodeEditor**, a powerful and intuitive web-based code editor built with modern technologies.

## Features

- 🎨 **Syntax Highlighting** - Beautiful syntax highlighting for 19+ programming languages
- 🚀 **Auto-completion** - Intelligent code completion powered by Monaco Editor
- 🔍 **Error Detection** - Real-time error detection and suggestions
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- 🌙 **Dark Theme** - Easy on the eyes with a modern dark theme

## Supported Languages

| Language | Extension | Status |
|----------|-----------|--------|
| JavaScript | \`.js\` | ✅ Supported |
| TypeScript | \`.ts\` | ✅ Supported |
| Python | \`.py\` | ✅ Supported |
| Java | \`.java\` | ✅ Supported |
| C++ | \`.cpp\` | ✅ Supported |
| HTML | \`.html\` | ✅ Supported |
| CSS | \`.css\` | ✅ Supported |

## Getting Started

1. **Choose your language** from the dropdown menu
2. **Start coding** in the editor panel
3. **View output** in the right panel
4. **Save your work** using Ctrl+S

## Keyboard Shortcuts

- \`Ctrl+S\` - Save file
- \`Ctrl+F\` - Find in file
- \`Shift+Alt+F\` - Format code
- \`Ctrl+/\` - Toggle comment
- \`Ctrl+D\` - Select next occurrence

## Code Example

\`\`\`javascript
function greetUser(name) {
  console.log(\`Hello, \${name}! Welcome to CodeEditor.\`);
  return \`Greeting sent to \${name}\`;
}

const result = greetUser("Developer");
console.log(result);
\`\`\`

---

**Happy Coding!** 🚀`,

  sql: `-- SQL Example - User Management System
-- Create database and tables

CREATE DATABASE IF NOT EXISTS codeeditor_db;
USE codeeditor_db;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    language VARCHAR(20) NOT NULL,
    code TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO users (username, email, password_hash) VALUES
('developer', 'dev@example.com', 'hashed_password_123'),
('coder', 'coder@example.com', 'hashed_password_456'),
('programmer', 'prog@example.com', 'hashed_password_789');

INSERT INTO projects (user_id, name, description, language, code, is_public) VALUES
(1, 'Hello World', 'My first JavaScript project', 'javascript', 'console.log("Hello, World!");', TRUE),
(1, 'Calculator', 'Simple calculator app', 'python', 'def add(a, b): return a + b', FALSE),
(2, 'Web Portfolio', 'Personal portfolio website', 'html', '<h1>Welcome to my portfolio</h1>', TRUE);

-- Query examples
SELECT u.username, COUNT(p.id) as project_count
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
GROUP BY u.id, u.username
ORDER BY project_count DESC;

SELECT * FROM projects 
WHERE language = 'javascript' 
AND is_public = TRUE 
ORDER BY created_at DESC;`,

  php: `<?php
// PHP Example - Simple Web Application

class UserManager {
    private $users = [];
    
    public function __construct() {
        $this->users = [
            ['id' => 1, 'name' => 'Developer', 'email' => 'dev@example.com'],
            ['id' => 2, 'name' => 'Coder', 'email' => 'coder@example.com']
        ];
    }
    
    public function greetUser($name, $age = null) {
        if ($age) {
            echo "Hello, $name! You are $age years old.\\n";
            return "Greeting sent to $name (age $age)";
        } else {
            echo "Hello, $name! Welcome to CodeEditor.\\n";
            return "Greeting sent to $name";
        }
    }
    
    public function getAllUsers() {
        return $this->users;
    }
    
    public function findUserByEmail($email) {
        foreach ($this->users as $user) {
            if ($user['email'] === $email) {
                return $user;
            }
        }
        return null;
    }
    
    public function doubleNumbers($numbers) {
        return array_map(function($n) { return $n * 2; }, $numbers);
    }
}

// Usage example
$userManager = new UserManager();

// Greet user
$result = $userManager->greetUser("Developer", 25);
echo $result . "\\n";

// Get all users
$users = $userManager->getAllUsers();
echo "All users:\\n";
foreach ($users as $user) {
    echo "- {$user['name']} ({$user['email']})\\n";
}

// Array operations
$numbers = [1, 2, 3, 4, 5];
$doubled = $userManager->doubleNumbers($numbers);
echo "Doubled numbers: " . implode(", ", $doubled) . "\\n";

?>`,

  ruby: `# Ruby Example - Simple Class and Methods

class UserGreeter
  def initialize
    @users = [
      { id: 1, name: 'Developer', email: 'dev@example.com' },
      { id: 2, name: 'Coder', email: 'coder@example.com' }
    ]
  end
  
  def greet_user(name, age = nil)
    if age
      puts "Hello, #{name}! You are #{age} years old."
      "Greeting sent to #{name} (age #{age})"
    else
      puts "Hello, #{name}! Welcome to CodeEditor."
      "Greeting sent to #{name}"
    end
  end
  
  def get_all_users
    @users
  end
  
  def find_user_by_email(email)
    @users.find { |user| user[:email] == email }
  end
  
  def double_numbers(numbers)
    numbers.map { |n| n * 2 }
  end
end

# Usage example
greeter = UserGreeter.new

# Greet user
result = greeter.greet_user("Developer", 25)
puts result

# Get all users
users = greeter.get_all_users
puts "All users:"
users.each do |user|
  puts "- #{user[:name]} (#{user[:email]})"
end

# Array operations
numbers = [1, 2, 3, 4, 5]
doubled = greeter.double_numbers(numbers)
puts "Doubled numbers: #{doubled.join(', ')}"

# Ruby-style iteration
puts "Original -> Doubled:"
numbers.each_with_index do |num, index|
  puts "#{num} -> #{doubled[index]}"
end`,

  swift: `// Swift Example - iOS App Structure

import Foundation

// User model
struct User {
    let id: Int
    let name: String
    let email: String
    let age: Int?
}

// User manager class
class UserManager {
    private var users: [User] = [
        User(id: 1, name: "Developer", email: "dev@example.com", age: 25),
        User(id: 2, name: "Coder", email: "coder@example.com", age: 30)
    ]
    
    func greetUser(name: String, age: Int? = nil) -> String {
        if let age = age {
            print("Hello, \\(name)! You are \\(age) years old.")
            return "Greeting sent to \\(name) (age \\(age))"
        } else {
            print("Hello, \\(name)! Welcome to CodeEditor.")
            return "Greeting sent to \\(name)"
        }
    }
    
    func getAllUsers() -> [User] {
        return users
    }
    
    func findUser(by email: String) -> User? {
        return users.first { $0.email == email }
    }
    
    func doubleNumbers(_ numbers: [Int]) -> [Int] {
        return numbers.map { $0 * 2 }
    }
}

// Usage example
let userManager = UserManager()

// Greet user
let result = userManager.greetUser(name: "Developer", age: 25)
print(result)

// Get all users
let users = userManager.getAllUsers()
print("All users:")
for user in users {
    print("- \\(user.name) (\\(user.email))")
}

// Array operations with functional programming
let numbers = [1, 2, 3, 4, 5]
let doubled = userManager.doubleNumbers(numbers)
print("Doubled numbers: \\(doubled)")

// Swift-style enumeration
for (index, number) in numbers.enumerated() {
    print("\\(number) -> \\(doubled[index])")
}`,

  kotlin: `// Kotlin Example - Android App Structure

data class User(
    val id: Int,
    val name: String,
    val email: String,
    val age: Int? = null
)

class UserManager {
    private val users = listOf(
        User(1, "Developer", "dev@example.com", 25),
        User(2, "Coder", "coder@example.com", 30)
    )
    
    fun greetUser(name: String, age: Int? = null): String {
        return if (age != null) {
            println("Hello, $name! You are $age years old.")
            "Greeting sent to $name (age $age)"
        } else {
            println("Hello, $name! Welcome to CodeEditor.")
            "Greeting sent to $name"
        }
    }
    
    fun getAllUsers(): List<User> = users
    
    fun findUserByEmail(email: String): User? {
        return users.find { it.email == email }
    }
    
    fun doubleNumbers(numbers: List<Int>): List<Int> {
        return numbers.map { it * 2 }
    }
}

fun main() {
    val userManager = UserManager()
    
    // Greet user
    val result = userManager.greetUser("Developer", 25)
    println(result)
    
    // Get all users
    val users = userManager.getAllUsers()
    println("All users:")
    users.forEach { user ->
        println("- \${user.name} (\${user.email})")
    }
    
    // Array operations with functional programming
    val numbers = listOf(1, 2, 3, 4, 5)
    val doubled = userManager.doubleNumbers(numbers)
    println("Doubled numbers: $doubled")
    
    // Kotlin-style enumeration
    numbers.forEachIndexed { index, number ->
        println("$number -> \${doubled[index]}")
    }
    
    // Using when expression
    val language = "kotlin"
    val message = when (language) {
        "kotlin" -> "You're using Kotlin! 🎯"
        "java" -> "Java is great too! ☕"
        "swift" -> "Swift development! 🦉"
        else -> "Happy coding! 💻"
    }
    println(message)
}`
};

export default function EditorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const editorRef = useRef(null);
  const [value, setValue] = useState(codeTemplates.javascript);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("🚀 CodeEditor with Piston API Integration\n\n• Real code execution in 19+ programming languages\n• Secure containerized environment\n• No local setup required\n\nClick 'Run Code' to execute your code safely in the cloud!\n\n⚡ Powered by Piston API (emkc.org)");
  const [isRunning, setIsRunning] = useState(false);
  const [projects, setProjects] = useState([]);
  const [pistonStatus, setPistonStatus] = useState('checking');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');

  function startCollaboration() {
    if (!user) {
      alert('🔒 Please sign in to create a collaborative room.\n\nGuest users can use the simple editor, but collaboration requires an account.');
      router.push('/auth/signin?redirect=/editor');
      return;
    }
    
    // Generate unique room ID
    const roomId = generateRoomId();
    router.push(`/collab-live/${roomId}`);
  }

  function openJoinModal() {
    if (!user) {
      alert('🔒 Please sign in to join a collaborative room.\n\nGuest users can use the simple editor, but collaboration requires an account.');
      router.push('/auth/signin?redirect=/editor');
      return;
    }
    setShowJoinModal(true);
  }

  function closeJoinModal() {
    setShowJoinModal(false);
    setRoomIdInput('');
  }

  function joinRoom() {
    if (!roomIdInput.trim()) {
      alert('Please enter a room ID');
      return;
    }
    
    const roomId = roomIdInput.trim();
    router.push(`/collab-live/${roomId}`);
  }

  function generateRoomId() {
    return 'room-' + Math.random().toString(36).substring(2, 15);
  }

  // Load projects and check Piston API status on component mount
  useEffect(() => {
    loadProjects();
    checkPistonStatus();
  }, []);

  async function checkPistonStatus() {
    try {
      const response = await fetch('/api/execute');
      const data = await response.json();
      setPistonStatus(data.pistonApiStatus || 'unknown');
    } catch (error) {
      setPistonStatus('offline');
    }
  }

  async function loadProjects() {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  async function saveProject() {
    const projectName = prompt('Enter project name:');
    if (!projectName) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          language: language,
          code: value
        })
      });

      const data = await response.json();

      if (data.success) {
        setOutput(`✅ Project "${projectName}" saved successfully!\n\nProject ID: ${data.project.id}\nLanguage: ${data.project.language}\nCreated: ${new Date(data.project.createdAt).toLocaleString()}`);
        loadProjects(); // Refresh projects list
      } else {
        setOutput(`❌ Failed to save project: ${data.error}`);
      }
    } catch (error) {
      setOutput(`❌ Network Error: ${error.message}`);
    }
  }
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    editor.focus();
  }

  function handleChange(newValue) {
    setValue(newValue);
  }

  function handleLanguageChange(newLanguage) {
    setLanguage(newLanguage);
    setValue(codeTemplates[newLanguage] || `// ${newLanguage} code example\n// Start coding here...`);
    setOutput(`// Output for ${newLanguage} will appear here\n// Click 'Run Code' to execute your ${newLanguage} code`);
  }

  async function runCode() {
    setIsRunning(true);
    const startTime = Date.now();
    setOutput("🔄 Connecting to Piston API...\n\nInitializing secure code execution environment...");

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: value,
          language: language
        })
      });

      const data = await response.json();
      console.log(data);
      const executionTime = Date.now() - startTime;

      if (data.success && data.result) {
        const result = data.result;
        let formattedOutput = `🚀 Code Execution Results\n`;
       
        formattedOutput += result.output;
        
        if (result.rawResult) {
          formattedOutput += `\n${'='.repeat(50)}\n`;
          formattedOutput += `📊 Execution Details:\n`;
          if (result.rawResult.run) {
            formattedOutput += `• Exit code: ${result.rawResult.run.code}\n`;
            if (result.rawResult.run.signal) {
              formattedOutput += `• Signal: ${result.rawResult.run.signal}\n`;
            }
          }
        }
        
        setOutput(formattedOutput);
      } else {
        let errorOutput = `❌ Execution Failed\n`;
        errorOutput += `⏱️ Failed after: ${executionTime}ms\n`;
        errorOutput += `🔧 Language: ${language}\n`;
        errorOutput += `${'='.repeat(50)}\n\n`;
        errorOutput += `Error: ${data.error || 'Unknown error occurred'}\n\n`;
        
        if (data.details) {
          errorOutput += `Details: ${data.details}\n\n`;
        }
        
        errorOutput += `💡 Troubleshooting tips:\n`;
        errorOutput += `• Check your code syntax\n`;
        errorOutput += `• Ensure all variables are defined\n`;
        errorOutput += `• Try a simpler example first\n`;
        errorOutput += `• Check if the language is supported\n`;
        
        setOutput(errorOutput);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      let networkError = `🌐 Network Error\n`;
      networkError += `⏱️ Failed after: ${executionTime}ms\n`;
      networkError += `${'='.repeat(50)}\n\n`;
      networkError += `❌ ${error.message}\n\n`;
      networkError += `🔧 Possible causes:\n`;
      networkError += `• Internet connection issues\n`;
      networkError += `• Piston API is temporarily unavailable\n`;
      networkError += `• Server configuration problems\n`;
      networkError += `• Request timeout\n\n`;
      networkError += `💡 Try again in a few moments or check your connection.`;
      
      setOutput(networkError);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold gradient-text-purple hover:scale-105 transition-transform duration-300">
            CodeEditor
          </Link>
          <span className="text-white/60">|</span>
          <span className="text-white/80 font-medium">Code Editor</span>
          {!user && (
            <span className="text-xs px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 font-medium">
              Guest Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!user && (
            <Link
              href="/auth/signin?redirect=/editor"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-medium text-sm"
            >
              Sign In for Collaboration
            </Link>
          )}
          <Link
            href="/"
            className="text-sm font-semibold leading-6 text-white/90 hover:text-white transition-all duration-300 hover:scale-110 relative group"
          >
            ← Back to Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </div>
      </nav>

      {/* Guest Mode Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10 p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-white/90">
                <strong>Guest Mode:</strong> You can use the editor and run code. 
                <span className="text-white/70 ml-1">Sign in to unlock collaborative editing features.</span>
              </p>
            </div>
            <Link
              href="/auth/signup"
              className="text-sm font-semibold text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-1"
            >
              Create Account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      <div className={`flex ${!user ? 'h-[calc(100vh-140px)]' : 'h-[calc(100vh-80px)]'}`}>
        {/* Left Panel - Editor */}
        <div className="flex-1 flex flex-col">
          {/* Language Selector */}
          <div className="p-4">
            <LanguageSelector
              selectedLanguage={language}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          
          {/* Monaco Editor */}
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg overflow-hidden border border-white/10 shadow-2xl">
              <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={value}
                onMount={handleEditorDidMount}
                onChange={handleChange}
                options={{
                  fontSize: 14,
                  fontFamily: 'var(--font-geist-mono), "Fira Code", "Cascadia Code", monospace',
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="flex-1 flex flex-col border-l border-white/10">
          {/* Output Header */}
          <div className="p-4  border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-white font-semibold">Output</h3>
              <div className="flex items-center gap-2">
                
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={startCollaboration}
                className={`px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:scale-105 font-medium text-sm flex items-center gap-2 ${!user ? 'opacity-75' : ''}`}
                title={!user ? 'Sign in required for collaboration' : 'Create a new collaborative room'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {user ? 'Create Room' : '🔒 Sign In to Collaborate'}
              </button>
              <button
                onClick={openJoinModal}
                className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 hover:scale-105 font-medium text-sm flex items-center gap-2 ${!user ? 'opacity-75' : ''}`}
                title={!user ? 'Sign in required to join rooms' : 'Join an existing collaborative room'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {user ? 'Join Room' : '🔒 Sign In to Join'}
              </button>
              <button
                onClick={saveProject}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 hover:scale-105 font-medium text-sm"
              >
                💾 Save Project
              </button>
              <button
                onClick={runCode}
                disabled={isRunning || pistonStatus === 'offline'}
                className={`px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 hover:scale-105 font-medium text-sm ${
                  isRunning || pistonStatus === 'offline' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isRunning ? '⏳ Running...' : pistonStatus === 'offline' ? '❌ API Offline' : '▶ Run Code'}
              </button>
            </div>
          </div>
          
          {/* Output Content */}
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg bg-gray-900 border border-white/10 shadow-2xl">
              <pre className="h-full p-4 text-green-400 font-mono text-sm overflow-auto whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-white/20 shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text-purple">Join Collaboration Room</h2>
              <button
                onClick={closeJoinModal}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-white/90 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                  placeholder="Enter room ID (e.g., room-abc123xyz)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  autoFocus
                />
                <p className="mt-2 text-xs text-white/60">
                  💡 Get the room ID from the person who created the room
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeJoinModal}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={joinRoom}
                  disabled={!roomIdInput.trim()}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-medium ${
                    !roomIdInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Join Room
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-white/70 mb-3">
                <strong>How to join:</strong>
              </p>
              <ol className="text-sm text-white/60 space-y-2 list-decimal list-inside">
                <li>Get the room ID from your collaborator</li>
                <li>Enter the room ID above</li>
                <li>Click "Join Room" to start collaborating</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

