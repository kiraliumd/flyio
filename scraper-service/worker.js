require('dotenv').config();
const DISABLE_PROXY = process.env.DISABLE_PROXY === 'true';
const { Worker } = require('bullmq');
const browserPool = require('./browserPool');
const scrapers = require('./scraper');
const { connection, setCachedResult } = require('./queue');

// ==============================
// PROXY CONFIG
// ==============================

const PROXY_SERVER = process.env.PROXY_SERVER || 'http://p.webshare.io:80';
const PROXY_PASSWORD = process.env.PROXY_PASSWORD || '5so72ui3knmj';
const TOTAL_PROXIES = Number(process.env.TOTAL_PROXIES || 250);

function getRandomProxy() {
    const randomIndex = Math.floor(Math.random() * TOTAL_PROXIES) + 1;
    const username = `xtweuspr-BR-${randomIndex}`;
    console.log(`🎲 Proxy sorteado: ${username}`);

    return {
        server: PROXY_SERVER,
        username,
        password: PROXY_PASSWORD
    };
}

// ==============================
// WORKER
// ==============================

let workerInstance = null;

function startWorker() {
    // 5. Controle de Worker em Produção
    if (process.env.ENABLE_WORKER !== 'true') {
        console.log('🚫 Worker desabilitado (ENABLE_WORKER != true). Apenas API responderá.');
        return null;
    }

    if (workerInstance) return workerInstance;

    console.log('👷 Iniciando Worker no mesmo processo...');

    workerInstance = new Worker(
        'scrape-queue',
        async (job) => {
            const { airline, pnr, lastname, origin } = job.data;
            console.log(`[Job ${job.id}] Processando ${airline} - ${pnr}`);

            try {
                const proxyConfig = getRandomProxy();

                const result = await browserPool.withPage(
                    async (page) => {
                        switch (airline) {
                            case 'GOL':
                                return await scrapers.scrapeGol(page, pnr, lastname, origin);
                            case 'LATAM':
                                return await scrapers.scrapeLatam(page, pnr, lastname);
                            case 'AZUL':
                                return await scrapers.scrapeAzul(page, pnr, origin);
                            default:
                                throw new Error(`Airline ${airline} não suportada`);
                        }
                    },
                    { proxy: proxyConfig }
                );

                await setCachedResult(pnr, lastname, airline, result, 300);

                console.log(`[Job ${job.id}] ✅ Job finalizado com sucesso`);
                return result;

            } catch (error) {
                // 3. Encerramento Limpo (Sem Retry)
                const errorMsg = error.message || 'Erro desconhecido';
                console.error(`[Job ${job.id}] ❌ Job finalizado com erro definitivo: ${errorMsg}`);

                // Retornar objeto de erro FINAL para evitar retry automático do BullMQ
                return {
                    status: 'ERROR',
                    message: errorMsg,
                    details: 'Falha definitiva. Sem retry.'
                };
            }
        },
        {
            connection,          // 🚨 ESSENCIAL (BullMQ)
            concurrency: 1,      // Cloud Run é mais estável assim
            limiter: {
                max: 5,
                duration: 1000
            }
        }
    );

    // Logs apenas informativos, sem lógica de retry
    workerInstance.on('completed', (job) => {
        // console.log(`[Job ${job.id}] Completado (Evento BullMQ).`);
    });

    workerInstance.on('failed', (job, err) => {
        console.error(`[Job ${job.id}] ☠️ Falha Crítica BullMQ: ${err.message}`);
    });

    return workerInstance;
}

async function stopWorker() {
    if (workerInstance) {
        console.log('🛑 Parando Worker...');
        await workerInstance.close();
        workerInstance = null;
    }
}

module.exports = { startWorker, stopWorker };