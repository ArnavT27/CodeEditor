// API Route Handler - Execute Code with Piston API
import { NextResponse } from 'next/server';

// Piston API configuration
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Language mapping for Piston API
const languageMap = {
    javascript: { language: 'javascript', version: '18.15.0' },
    typescript: { language: 'typescript', version: '5.0.3' },
    python: { language: 'python', version: '3.10.0' },
    java: { language: 'java', version: '15.0.2' },
    cpp: { language: 'cpp', version: '10.2.0' },
    c: { language: 'c', version: '10.2.0' },
    csharp: { language: 'csharp', version: '6.12.0' },
    go: { language: 'go', version: '1.16.2' },
    rust: { language: 'rust', version: '1.68.2' },
    php: { language: 'php', version: '8.2.3' },
    ruby: { language: 'ruby', version: '3.0.1' },
    swift: { language: 'swift', version: '5.3.3' },
    kotlin: { language: 'kotlin', version: '1.8.20' },
    html: { language: 'javascript', version: '18.15.0' }, // HTML will be processed as JS
    css: { language: 'javascript', version: '18.15.0' }, // CSS will be processed as JS
    json: { language: 'javascript', version: '18.15.0' }, // JSON will be processed as JS
    xml: { language: 'javascript', version: '18.15.0' }, // XML will be processed as JS
    markdown: { language: 'javascript', version: '18.15.0' }, // Markdown will be processed as JS
    sql: { language: 'javascript', version: '18.15.0' } // SQL will be processed as JS for demo
};

// Execute code using Piston API
const executeCodeWithPiston = async (code, language) => {
    try {
        const pistonConfig = languageMap[language];

        if (!pistonConfig) {
            throw new Error(`Language ${language} is not supported`);
        }

        // Special handling for web languages (HTML, CSS, etc.)
        let processedCode = code;
        let executionLanguage = pistonConfig.language;
        let version = pistonConfig.version;

        if (language === 'html') {
            // For HTML, we'll extract and run any JavaScript
            const jsMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
            if (jsMatch) {
                processedCode = jsMatch[1];
            } else {
                processedCode = `console.log("HTML code received. Length: ${code.length} characters\\nContent preview:\\n${code.substring(0, 200)}${code.length > 200 ? '...' : ''}");`;
            }
        } else if (language === 'css') {
            // For CSS, we'll just show the CSS content
            processedCode = `console.log("CSS code received:\\n${code.replace(/"/g, '\\"').replace(/\n/g, '\\n')}");`;
        } else if (language === 'json') {
            // For JSON, we'll parse and display it
            processedCode = `
try {
  const data = ${code};
  console.log("JSON parsed successfully:");
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.log("JSON parsing error:", error.message);
}`;
        } else if (language === 'xml' || language === 'markdown' || language === 'sql') {
            // For other markup languages, just display them
            processedCode = `console.log("${language.toUpperCase()} code received:\\n${code.replace(/"/g, '\\"').replace(/\n/g, '\\n')}");`;
        }

        const pistonRequest = {
            language: executionLanguage,
            version: version,
            files: [
                {
                    name: `main.${getFileExtension(language)}`,
                    content: processedCode
                }
            ],
            stdin: "",
            args: [],
            compile_timeout: 10000,
            run_timeout: 3000,
            compile_memory_limit: -1,
            run_memory_limit: -1
        };

        console.log('Sending request to Piston API:', {
            language: executionLanguage,
            version: version,
            codeLength: processedCode.length
        });

        const response = await fetch(`${PISTON_API_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pistonRequest)
        });

        if (!response.ok) {
            throw new Error(`Piston API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Format the output
        let output = '';
        let hasError = false;

        if (result.compile && result.compile.code !== 0) {
            output += `📋 Compilation Error:\n${result.compile.stderr || result.compile.stdout}\n\n`;
            hasError = true;
        }

        if (result.run) {
            if (result.run.code !== 0) {
                output += `❌ Runtime Error (Exit code: ${result.run.code}):\n`;
                hasError = true;
            } else {
                output += `✅ Execution completed successfully:\n`;
            }

            if (result.run.stdout) {
                output += `📤 Output:\n${result.run.stdout}\n`;
            }

            if (result.run.stderr) {
                output += `⚠️ Error/Warning:\n${result.run.stderr}\n`;
            }
        }

        if (!output.trim()) {
            output = '✅ Code executed successfully with no output.';
        }

        return {
            success: !hasError,
            output: output,
            executionTime: result.run ? result.run.signal : null,
            language: executionLanguage,
            version: version,
            rawResult: result
        };

    } catch (error) {
        console.error('Piston execution error:', error);
        return {
            success: false,
            output: `❌ Execution Error: ${error.message}\n\nThis could be due to:\n- Network connectivity issues\n- Unsupported language features\n- Code syntax errors\n- Piston API limitations`,
            executionTime: null,
            language: language,
            version: 'unknown'
        };
    }
};

// Get file extension for different languages
const getFileExtension = (language) => {
    const extensions = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        csharp: 'cs',
        go: 'go',
        rust: 'rs',
        php: 'php',
        ruby: 'rb',
        swift: 'swift',
        kotlin: 'kt',
        html: 'html',
        css: 'css',
        json: 'json',
        xml: 'xml',
        markdown: 'md',
        sql: 'sql'
    };
    return extensions[language] || 'txt';
};

// POST handler for code execution
export async function POST(request) {
    try {
        const { code, language } = await request.json();

        // Validate input
        if (!code || !language) {
            return NextResponse.json(
                { error: 'Code and language are required' },
                { status: 400 }
            );
        }

        // Security check - limit code length
        if (code.length > 50000) {
            return NextResponse.json(
                { error: 'Code too long. Maximum 50,000 characters allowed.' },
                { status: 400 }
            );
        }

        // Check if language is supported
        if (!languageMap[language]) {
            return NextResponse.json(
                { error: `Language '${language}' is not supported. Supported languages: ${Object.keys(languageMap).join(', ')}` },
                { status: 400 }
            );
        }

        console.log(`Executing ${language} code (${code.length} characters)`);

        // Execute code using Piston API
        const result = await executeCodeWithPiston(code, language);

        return NextResponse.json({
            success: true,
            result: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Code execution error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// GET handler for supported languages and Piston API status
export async function GET() {
    try {
        // Get available runtimes from Piston API
        const response = await fetch(`${PISTON_API_URL}/runtimes`);
        const runtimes = response.ok ? await response.json() : [];

        const supportedLanguages = Object.keys(languageMap).map(lang => ({
            language: lang,
            pistonLanguage: languageMap[lang].language,
            version: languageMap[lang].version,
            available: runtimes.some(runtime =>
                runtime.language === languageMap[lang].language &&
                runtime.version === languageMap[lang].version
            )
        }));

        return NextResponse.json({
            success: true,
            supportedLanguages,
            totalLanguages: supportedLanguages.length,
            pistonApiStatus: response.ok ? 'online' : 'offline',
            availableRuntimes: runtimes.length
        });

    } catch (error) {
        console.error('Error fetching supported languages:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch supported languages',
                supportedLanguages: Object.keys(languageMap),
                pistonApiStatus: 'unknown'
            },
            { status: 500 }
        );
    }
}