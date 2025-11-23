import { calculateCheckinStatus } from '../lib/business-rules';
import { addHours } from 'date-fns';

const now = new Date();

console.log('--- Testing Check-in Logic ---');

// Test LATAM (48h)
const latamFlight = addHours(now, 24); // Should be OPEN
const latamResult = calculateCheckinStatus('LATAM', latamFlight);
console.log(`LATAM (Flight in 24h): ${latamResult.isCheckinOpen} - ${latamResult.description}`);

const latamFlightFar = addHours(now, 50); // Should be CLOSED (Not open yet)
const latamResultFar = calculateCheckinStatus('LATAM', latamFlightFar);
console.log(`LATAM (Flight in 50h): ${latamResultFar.isCheckinOpen} - ${latamResultFar.description}`);

// Test AZUL (72h)
const azulFlight = addHours(now, 60); // Should be OPEN
const azulResult = calculateCheckinStatus('AZUL', azulFlight);
console.log(`AZUL (Flight in 60h): ${azulResult.isCheckinOpen} - ${azulResult.description}`);

const azulFlightFar = addHours(now, 80); // Should be CLOSED (Not open yet)
const azulResultFar = calculateCheckinStatus('AZUL', azulFlightFar);
console.log(`AZUL (Flight in 80h): ${azulResultFar.isCheckinOpen} - ${azulResultFar.description}`);
