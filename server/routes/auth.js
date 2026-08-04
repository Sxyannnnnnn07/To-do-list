const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { username, displayName, password, avatar, email } = req.body;
    
    let user = await User.findOne({ username: username.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      displayName,
      password: hashedPassword,
      email: email ? email.toLowerCase() : null,
      avatar: avatar || 'icons/clean_avatar_boy.png?v=7'
    });

    await user.save();

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /config (Public config for frontend)
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

// POST /google (Google Auth & Auto-link matching email)
router.post('/google', async (req, res) => {
  try {
    let { credential, googleId, email, displayName, avatar } = req.body;

    // Decode Google JWT Credential Token if provided by Google Identity Services SDK
    if (credential) {
      try {
        const decoded = jwt.decode(credential);
        if (decoded) {
          googleId = decoded.sub || googleId;
          email = decoded.email || email;
          displayName = decoded.name || displayName;
          avatar = decoded.picture || avatar;
        }
      } catch (err) {
        console.error('Error decoding credential JWT:', err);
      }
    }

    if (!email && !googleId) {
      return res.status(400).json({ message: 'Invalid Google user data' });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    let user = null;

    // 1. Try finding user by googleId
    if (googleId) {
      user = await User.findOne({ googleId });
    }

    // 2. Try finding user by email if not found by googleId
    if (!user && normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (user) {
      // Link googleId and avatar if not set
      let updated = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (normalizedEmail && !user.email) {
        user.email = normalizedEmail;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // 3. Create a new user with Google details
      const baseUsername = (normalizedEmail ? normalizedEmail.split('@')[0] : (displayName || 'google_user'))
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
      let username = baseUsername || `user_${Math.floor(1000 + Math.random() * 9000)}`;

      // Ensure username is unique
      let existingUsername = await User.findOne({ username });
      while (existingUsername) {
        username = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
        existingUsername = await User.findOne({ username });
      }

      user = new User({
        username,
        displayName: displayName || username,
        email: normalizedEmail,
        googleId: googleId || `g_${Date.now()}`,
        avatar: avatar || 'icons/clean_avatar_boy.png?v=8'
      });

      await user.save();
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        googleId: user.googleId,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Account was registered via Google. Please log in with Google.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username displayName email googleId avatar');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /link-email (Bind/update email & optional googleId for logged in user)
router.put('/link-email', auth, async (req, res) => {
  try {
    const { email, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ message: 'This email is already linked to another account' });
    }

    const updateData = { email: normalizedEmail };
    if (googleId) updateData.googleId = googleId;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      googleId: user.googleId,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Link email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { avatar, displayName } = req.body;
    const updateData = {};
    if (avatar) updateData.avatar = avatar;
    if (displayName && displayName.trim()) updateData.displayName = displayName.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      googleId: user.googleId,
      avatar: user.avatar
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /me
router.delete('/me', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    await Task.deleteMany({ userId: req.user.id });
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
