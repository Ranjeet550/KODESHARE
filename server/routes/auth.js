const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// Request password reset (generate and send OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiry (15 minutes from now)
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

    // Save OTP and expiry to user
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.username);

    res.json({
      message: 'Password reset OTP sent to your email',
      email: user.email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and is valid
    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (user.resetPasswordOTPExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Generate a temporary token for password reset
    const resetToken = jwt.sign(
      { userId: user._id, isPasswordReset: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      message: 'OTP verified successfully',
      resetToken
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password with verified OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    // Check if token is for password reset
    if (!decoded.isPasswordReset) {
      return res.status(401).json({ message: 'Invalid reset token' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Update password
    user.password = newPassword;

    // Clear reset OTP fields
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpiry = null;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
