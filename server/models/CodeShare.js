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
    required: false // Allow anonymous code shares
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 24 hours from creation
      const now = new Date();
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
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
    validate: {
      validator: function(v) {
        return v === null || v === undefined || /^[a-zA-Z0-9_-]{1,50}$/.test(v);
      },
      message: props => `${props.value} is not a valid custom ID. Use only letters, numbers, underscores, and hyphens.`
    }
  }
}, {
  timestamps: true
});

// Create index for customId
codeShareSchema.index({ customId: 1 }, { unique: true, sparse: true });

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
