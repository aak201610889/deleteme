const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userphoneNumber: { 
    type: String, 
    required: true 
  },

  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    trim: true 
  },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Rating', ratingSchema);
