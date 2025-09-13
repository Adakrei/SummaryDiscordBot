import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// Ensure DATABASE_URL is properly set at the start
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Replace the function with a static export object
export default defineConfig({
    out: './dist/drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL
    }
});
