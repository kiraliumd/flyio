import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupDatabase() {
    const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('POSTGRES_URL not found in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false,
        },
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await client.query(schemaSql);
        console.log('Schema applied successfully!');
    } catch (err) {
        console.error('Error applying schema:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

setupDatabase();
