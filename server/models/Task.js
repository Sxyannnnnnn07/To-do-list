const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  detail: {
    type: String,
    default: ''
  },
  dueDate: {
    type: String,
    required: true
  },
  dueTime: {
    type: String,
    default: '23:59'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  completedAt: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema);
