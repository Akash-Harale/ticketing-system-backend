import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  privileges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Privilege'
  }]
}, {
  timestamps: true
});

export const Role = mongoose.model('Role', roleSchema);
