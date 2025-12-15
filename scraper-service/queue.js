const { Queue } = require('bullmq');
const IORedis = require('ioredis');

/**
 * ==============================
 * CONFIGURAÇÃO REDIS
 * ==============================
 */

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error('❌ REDIS_URL não definida');
}

// Detecta TLS automaticamente (Upstash usa rediss://)
const isTls = redisUrl.startsWith('rediss://');

// 🔹 Cliente Redis REAL (para cache)
const redisClient = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 30000,
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {})
});

// 🔹 Conexão para BullMQ (fila)
const connection = {
    url: redisUrl,
    connectTimeout: 30000,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 1000, 10000)
};

/**
 * ==============================
 * FILA DE SCRAPING
 * ==============================
 */

const scrapeQueue = new Queue('scrape-queue', { connection });

async function addScrapeJob(data) {
    return await scrapeQueue.add('scrape-job', data, {
        attempts: 1, // 🚨 SEM RETRY EM PRODUÇÃO
        backoff: undefined, // Garantir sem backoff
        removeOnComplete: true, // Limpa sucesso imediatamente
        removeOnFail: true // Limpa falha imediatamente
    });
}

async function getJob(jobId) {
    return await scrapeQueue.getJob(jobId);
}

/**
 * ==============================
 * CACHE (REDIS)
 * ==============================
 */

function getCacheKey(pnr, lastname, provider) {
    return `scrape:${provider}:${pnr}:${lastname}`.toUpperCase();
}

async function getCachedResult(pnr, lastname, provider) {
    const key = getCacheKey(pnr, lastname, provider);
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
}

async function setCachedResult(pnr, lastname, provider, data, ttlSeconds = 300) {
    const key = getCacheKey(pnr, lastname, provider);
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
}

/**
 * ==============================
 * EXPORTS
 * ==============================
 */

module.exports = {
    scrapeQueue,
    addScrapeJob,
    getJob,
    getCachedResult,
    setCachedResult,
    connection
};