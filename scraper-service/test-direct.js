require('dotenv').config();
const scrapers = require('./scraper');

async function test() {
    const params = {
        pnr: process.env.TEST_PNR || 'XXXXXX',
        lastname: process.env.TEST_LASTNAME || 'TEST',
        origin: process.env.TEST_ORIGIN || 'NVT',
        useProxy: process.env.TEST_USE_PROXY === 'true',
        agencyId: null
    };

    console.log('🚀 Iniciando teste direto do Scraper GOL...');
    console.log('Parâmetros:', params);

    try {
        const result = await scrapers.scrapeGol(params);
        console.log('✅ Resultado do Scraper:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

test();
