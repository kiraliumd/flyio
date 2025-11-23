import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
    console.log('Running flight monitor test...');
    const { updateFlightStatus } = await import('../lib/flight-monitor');
    await updateFlightStatus();
    console.log('Done.');
}

run();
