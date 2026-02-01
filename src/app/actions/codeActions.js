'use server';

// Server Actions - Direct server-side functions callable from client components
// These run on the server and can be called directly from React components

import { revalidatePath } from 'next/cache';

// Server action to save code
export async function saveCode(formData) {
    try {
        const name = formData.get('name');
        const language = formData.get('language');
        const code = formData.get('code');

        // Validate input
        if (!name || !language || !code) {
            return {
                success: false,
                error: 'All fields are required'
            };
        }

        // In production, save to database
        console.log('Saving code:', { name, language, code: code.substring(0, 100) + '...' });

        // Simulate database save
        await new Promise(resolve => setTimeout(resolve, 500));

        // Revalidate the projects page cache
        revalidatePath('/projects');

        return {
            success: true,
            message: 'Code saved successfully',
            project: {
                id: Date.now(),
                name,
                language,
                code,
                createdAt: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Error saving code:', error);
        return {
            success: false,
            error: 'Failed to save code'
        };
    }
}

// Server action to format code
export async function formatCode(code, language) {
    try {
        // Simulate code formatting (in production, use prettier, eslint, etc.)
        await new Promise(resolve => setTimeout(resolve, 200));

        let formattedCode = code;

        // Basic formatting based on language
        switch (language) {
            case 'javascript':
            case 'typescript':
                // Add basic JS formatting
                formattedCode = code
                    .replace(/;/g, ';\n')
                    .replace(/{/g, ' {\n  ')
                    .replace(/}/g, '\n}')
                    .replace(/\n\s*\n/g, '\n');
                break;

            case 'python':
                // Add basic Python formatting
                formattedCode = code
                    .replace(/:/g, ':\n    ')
                    .replace(/\n\s*\n/g, '\n');
                break;

            default:
                // Basic formatting for other languages
                formattedCode = code.replace(/\n\s*\n/g, '\n');
        }

        return {
            success: true,
            formattedCode,
            message: 'Code formatted successfully'
        };

    } catch (error) {
        console.error('Error formatting code:', error);
        return {
            success: false,
            error: 'Failed to format code'
        };
    }
}

// Server action to validate code syntax
export async function validateCode(code, language) {
    try {
        // Simulate syntax validation
        await new Promise(resolve => setTimeout(resolve, 300));

        const errors = [];
        const warnings = [];

        // Basic validation rules
        if (language === 'javascript' || language === 'typescript') {
            if (!code.includes('function') && !code.includes('=>') && !code.includes('const') && !code.includes('let')) {
                warnings.push('Consider using proper variable declarations or functions');
            }

            const openBraces = (code.match(/{/g) || []).length;
            const closeBraces = (code.match(/}/g) || []).length;

            if (openBraces !== closeBraces) {
                errors.push('Mismatched braces detected');
            }
        }

        if (language === 'python') {
            if (code.includes('\t') && code.includes('    ')) {
                warnings.push('Mixed tabs and spaces detected. Use consistent indentation.');
            }
        }

        return {
            success: true,
            isValid: errors.length === 0,
            errors,
            warnings,
            message: errors.length === 0 ? 'Code validation passed' : 'Code validation failed'
        };

    } catch (error) {
        console.error('Error validating code:', error);
        return {
            success: false,
            error: 'Failed to validate code'
        };
    }
}