import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
    if (cached.conn) {
        console.log('MongoDB: Using cached connection');
        return cached.conn;
    }

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in environment variables');
    }

    try {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            // Good options for Vercel
            bufferCommands: false,
            maxPoolSize: 10,
        });

        cached.conn = await cached.promise;
        console.log('MongoDB connected successfully');
        return cached.conn;
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        throw error;   // Don't use process.exit(1)
    }
};