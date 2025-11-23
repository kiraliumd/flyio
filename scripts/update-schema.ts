import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function updateSchema() {
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

        console.log('Applying schema updates...');

        // 1. Ensure PNR is TEXT
        await client.query(`ALTER TABLE tickets ALTER COLUMN pnr TYPE text;`);
        console.log('Updated pnr type to text');

        // 2. Set default for passenger_name
        await client.query(`ALTER TABLE tickets ALTER COLUMN passenger_name SET DEFAULT 'Passageiro (Editar)';`);
        console.log('Set default for passenger_name');

        // 3. Ensure origin/destination are TEXT
        await client.query(`ALTER TABLE tickets ALTER COLUMN origin TYPE text;`);
        await client.query(`ALTER TABLE tickets ALTER COLUMN destination TYPE text;`);
        console.log('Verified origin/destination types');

        console.log('Schema updates completed successfully!');
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

updateSchema();
