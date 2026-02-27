const mongoose = require('mongoose');

const codeShareSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Code'
  },
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow anonymous code shares
    validate: {
      validator: function(v) {
        return v === null || v === undefined || mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Invalid owner ID'
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 24 hours from creation for anonymous users
      // For logged-in users (with owner), no expiration (null)
      if (!this.owner) {
        const now = new Date();
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }
      return null; // No expiration for logged-in users
    }
  },
  accessCount: {
    type: Number,
    default: 0
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  customId: {
    type: String,
    trim: true,
    sparse: true, // Allow multiple documents without customId
    validate: {
      validator: function(v) {
        return !v || /^[a-zA-Z0-9_-]{1,50}$/.test(v);
      },
      message: props => `${props.value} is not a valid custom ID. Use only letters, numbers, underscores, and hyphens.`
    }
  }
}, {
  timestamps: true
});

// Create a unique URL-friendly ID
codeShareSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate a random ID if not provided
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
  }
  next();
});

const CodeShare = mongoose.model('CodeShare', codeShareSchema);

module.exports = CodeShare;
