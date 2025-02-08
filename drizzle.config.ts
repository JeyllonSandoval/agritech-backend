import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

export default defineConfig({
    schema: './src/db/schemas/schemas.ts',
    out: './migrations',
    dialect: 'turso',
    dbCredentials: {
        url: process.env.TURSO_CONNECTION_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    },
});
