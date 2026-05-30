const mongoose = require('mongoose');

const krSchema = new mongoose.Schema({
  media_header: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: 3, 
    maxlength: 100 
  },
  media_narration: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: 10, 
    maxlength: 1000 
  },
  media_url: { 
    type: String, 
    required: true, 
    match: /^https?:\/\/.+\..+/ 
  },
  media_type: { 
    type: String, 
    required: true, 
    enum: ['image', 'video', 'audio', 'document'] 
  },
  media_file: { 
    type: String, 
    required: true 
  },
  media_timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('KnowledgeRepo', krSchema);
