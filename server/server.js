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

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Fall back to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Create default demo user if no users exist
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const count = await User.countDocuments();
    if (count === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('demo123', salt);
      await User.create({
        username: 'demo',
        displayName: 'Demo User',
        password: hashedPassword
      });
      console.log('Created default demo user (demo/demo123)');
    }
  } catch (error) {
    console.error('Error creating demo user:', error.message);
  }
});
