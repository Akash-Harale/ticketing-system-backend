import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import rbacRoutes from './modules/rbac/rbac.routes.js';
import userRoutes from './modules/users/user.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
    cors({
        origin: true, // Reflect the request origin — allows all origins
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/admin', express.static(path.join(__dirname, 'public')));

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
app.use('/api/rbac', rbacRoutes);
app.use('/api/users', userRoutes);

// ── 404 catch-all ───────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;