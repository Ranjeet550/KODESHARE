const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const CodeShare = require('../models/CodeShare');
const router = express.Router();

// Middleware to authenticate user (optional)
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      // Allow anonymous access
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    // If token is invalid, continue as anonymous
    req.user = null;
    next();
  }
};

// Create a new code share
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, code, language, isPublic, expiresIn, customId } = req.body;

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));
    }

    // Check if custom ID is provided and not already in use
    if (customId) {
      const existingCodeShare = await CodeShare.findOne({ customId });
      if (existingCodeShare) {
        return res.status(400).json({ message: 'This custom ID is already in use' });
      }
    }

    const newCodeShare = new CodeShare({
      title: title || 'Untitled Code',
      code: code || '',
      language: language || 'javascript',
      owner: req.user ? req.user.id : null,
      isPublic: isPublic !== undefined ? isPublic : true,
      expiresAt: expiresAt,
      customId: customId || null
    });

    await newCodeShare.save();

    res.status(201).json({
      message: 'Code share created successfully',
      codeShare: {
        id: customId || newCodeShare._id,
        title: newCodeShare.title,
        language: newCodeShare.language,
        isPublic: newCodeShare.isPublic,
        expiresAt: newCodeShare.expiresAt
      }
    });
  } catch (error) {
    console.error('Create code share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a code share by ID or custom ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let codeShare;

    // First try to find by custom ID
    codeShare = await CodeShare.findOne({ customId: id });

    // If not found, try to find by MongoDB ID
    if (!codeShare && mongoose.Types.ObjectId.isValid(id)) {
      codeShare = await CodeShare.findById(id);
    }

    // If still not found, create a new code share with the custom ID
    if (!codeShare) {
      // Only create a new code share if the ID is not a MongoDB ObjectId
      // and looks like a valid custom ID
      if (!mongoose.Types.ObjectId.isValid(id) && /^[a-zA-Z0-9_-]{1,50}$/.test(id)) {
        try {
          codeShare = new CodeShare({
            title: 'Untitled Code',
            code: '// Start coding here...',
            language: 'javascript',
            isPublic: true,
            customId: id
          });

          await codeShare.save();
          console.log(`Created new code share with custom ID: ${id}`);
        } catch (saveError) {
          console.error('Error creating code share with custom ID:', saveError);
          return res.status(400).json({ message: 'Could not create code share with this ID. It may already be in use.' });
        }
      } else {
        return res.status(404).json({ message: 'Code share not found' });
      }
    } else {
      // Check if code share has expired
      if (codeShare.expiresAt && new Date() > codeShare.expiresAt) {
        return res.status(410).json({ message: 'This code share has expired' });
      }

      // Increment access count
      codeShare.accessCount += 1;
      await codeShare.save();
    }

    res.json(codeShare);
  } catch (error) {
    console.error('Get code share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a code share
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { title, code, language } = req.body;
    const id = req.params.id;

    // Find by custom ID or MongoDB ID
    let codeShare = await CodeShare.findOne({ customId: id });

    if (!codeShare && mongoose.Types.ObjectId.isValid(id)) {
      codeShare = await CodeShare.findById(id);
    }

    if (!codeShare) {
      return res.status(404).json({ message: 'Code share not found' });
    }

    // Check if user is owner or collaborator (if not anonymous)
    if (codeShare.owner && req.user) {
      const isOwner = codeShare.owner.toString() === req.user.id;
      const isCollaborator = codeShare.collaborators.some(
        collab => collab.toString() === req.user.id
      );

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ message: 'Not authorized to update this code share' });
      }
    }

    // Update fields
    if (title) codeShare.title = title;
    if (code !== undefined) codeShare.code = code;
    if (language) codeShare.language = language;

    await codeShare.save();

    res.json({
      message: 'Code share updated successfully',
      codeShare
    });
  } catch (error) {
    console.error('Update code share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a code share
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const id = req.params.id;

    // Find by custom ID or MongoDB ID
    let codeShare = await CodeShare.findOne({ customId: id });

    if (!codeShare && mongoose.Types.ObjectId.isValid(id)) {
      codeShare = await CodeShare.findById(id);
    }

    if (!codeShare) {
      return res.status(404).json({ message: 'Code share not found' });
    }

    // Check if user is the owner
    if (codeShare.owner && req.user) {
      if (codeShare.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this code share' });
      }
    } else if (codeShare.owner && !req.user) {
      return res.status(403).json({ message: 'Authentication required' });
    }

    await CodeShare.deleteOne({ _id: codeShare._id });

    res.json({ message: 'Code share deleted successfully' });
  } catch (error) {
    console.error('Delete code share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all code shares for a user
router.get('/user/me', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const codeShares = await CodeShare.find({ owner: req.user.id })
      .sort({ createdAt: -1 });

    res.json(codeShares);
  } catch (error) {
    console.error('Get user code shares error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a collaborator to a code share
router.post('/:id/collaborators', authenticateUser, async (req, res) => {
  try {
    const { collaboratorId } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const codeShare = await CodeShare.findById(req.params.id);

    if (!codeShare) {
      return res.status(404).json({ message: 'Code share not found' });
    }

    // Check if user is the owner
    if (codeShare.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add collaborators' });
    }

    // Check if collaborator is already added
    if (codeShare.collaborators.includes(collaboratorId)) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    codeShare.collaborators.push(collaboratorId);
    await codeShare.save();

    res.json({
      message: 'Collaborator added successfully',
      codeShare
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
