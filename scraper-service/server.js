const express = require('express');
require('dotenv').config(); // Carrega .env do diretorio atual
const { addScrapeJob, getJob, getCachedResult } = require('./queue');

const app = express();
app.use(express.json());

// Endpoint Principal
app.post('/scrape', async (req, res) => {
    const { airline, pnr, lastname, origin, agencyId } = req.body;

    if (!airline || !pnr || !lastname) {
        return res.status(400).json({ error: 'Missing required fields (airline, pnr, lastname)' });
    }

    try {
        // 1. Tenta Cache
        const cached = await getCachedResult(pnr, lastname, airline);
        if (cached) {
            return res.json({ status: 'completed', result: cached, source: 'cache' });
        }

        // 2. Enfileira
        const job = await addScrapeJob({ airline, pnr, lastname, origin, agencyId });

        return res.status(202).json({
            jobId: job.id,
            status: 'queued',
            message: 'Scraping request queued.'
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Status do Job
app.get('/scrape/:jobId', async (req, res) => {
    const { jobId } = req.params;

    try {
        const job = await getJob(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        res.json({
            jobId,
            status: state, // completed, failed, active, waiting, delayed
            result,
            failedReason
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { startWorker, stopWorker } = require('./worker');

// --- Inicialização ---
(async () => {
    // Inicia o Worker (Fila) junto com a API
    startWorker();
})();

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));

// --- Graceful Shutdown ---
async function shutdown(signal) {
    console.log(`\n🛑 Recebido ${signal}. Encerrando graciosamente...`);

    server.close(() => {
        console.log('API HTTP fechada.');
    });

    try {
        await stopWorker();
        console.log('Worker encerrado.');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao encerrar:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));