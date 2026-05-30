import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { connectDB } from './config/db.js';

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. Postman, curl, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin '${origin}' not allowed`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

app.use(express.json());

// ── DB connection middleware (serverless-safe) ───────────────────────────────
// On Vercel there is no persistent process, so server.js is never executed.
// This middleware ensures connectDB() is called (and cached) on every cold start.
app.use(async (_req, _res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// ── 404 catch-all ───────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;