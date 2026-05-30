import mongoose from 'mongoose';

/**
 * GET /api/health
 * Returns overall service health and MongoDB connection status.
 */
export const healthCheck = (_req, res) => {
    const dbState = mongoose.connection.readyState;

    // Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };

    const dbStatus = stateMap[dbState] ?? 'unknown';
    const isHealthy = dbState === 1;

    const payload = {
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        services: {
            database: {
                status: dbStatus,
                name: mongoose.connection.name || null,
            },
        },
    };

    return res.status(isHealthy ? 200 : 503).json(payload);
};
