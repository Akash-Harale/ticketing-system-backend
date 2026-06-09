import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const Resource = mongoose.model('Resource', resourceSchema);
