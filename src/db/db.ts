import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';


const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    throw new Error('Missing required environment variables: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
}

const client = createClient({ 
    url: TURSO_DATABASE_URL, 
    authToken: TURSO_AUTH_TOKEN
});

const db = drizzle({client});

export default db;