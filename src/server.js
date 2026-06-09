import dotenv from 'dotenv';
dotenv.config();


import app from './app.js';
import { connectDB } from './config/db.js';

// Connect DB before starting server (but don't block in serverless)
connectDB().catch(err => console.error("Initial DB connection failed:", err));

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});