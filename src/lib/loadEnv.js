import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from config.env
export function loadEnv() {
    try {
        const envPath = join(process.cwd(), 'config.env');
        const envFile = readFileSync(envPath, 'utf-8');

        envFile.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            }
        });
    } catch (error) {
        console.warn('Warning: Could not load config.env file');
    }
}

// Auto-load on import
loadEnv();
