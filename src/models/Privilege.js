import mongoose from 'mongoose';

const privilegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Privilege name is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: [true, 'Resource reference is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      message: 'Action must be either CREATE, READ, UPDATE, or DELETE'
    },
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const Privilege = mongoose.model('Privilege', privilegeSchema);
