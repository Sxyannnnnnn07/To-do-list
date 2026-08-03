const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  googleId: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: 'icons/clean_avatar_boy.png?v=6'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
