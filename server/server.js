require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Serve static files — disable cache for JS/CSS/HTML to fix Safari iOS stale cache
app.use((req, res, next) => {
  const ext = path.extname(req.path);
  if (['.js', '.css', '.html'].includes(ext)) {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
});
app.use(express.static(path.join(__dirname, '../public')));

// Fall back to index.html — always send fresh, no-cache to fix Safari iOS
app.get('*', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // One-time cleanup: Remove demo user if it exists
  try {
    const User = require('./models/User');
    const Task = require('./models/Task');
    const demoUser = await User.findOne({ username: 'demo' });
    if (demoUser) {
      await Task.deleteMany({ user: demoUser._id });
      await User.deleteOne({ _id: demoUser._id });
      console.log('Demo user and their tasks removed successfully.');
    }
  } catch (error) {
    console.error('Error removing demo user:', error.message);
  }
});
