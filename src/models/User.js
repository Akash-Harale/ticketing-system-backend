import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: ['admin', 'agent', 'user'],
            default: 'user',
        },

        refreshToken: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

userSchema.pre('save', async function () {
    // Removed 'next' parameter
    if (!this.isModified('password')) return;   // Just return, no next()

    this.password = await bcrypt.hash(this.password, 10);
    // No need to call next() when using async
});
userSchema.methods.comparePassword =
    function (password) {
        return bcrypt.compare(
            password,
            this.password,
        );
    };

export const User = mongoose.model(
    'User',
    userSchema,
);