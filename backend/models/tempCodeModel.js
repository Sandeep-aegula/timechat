const mongoose = require('mongoose');

const tempCodeSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 6,
      maxlength: 8
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Code expires with the chat (5 hours) or can have custom expiry
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Track how many times the code has been used
    usageCount: {
      type: Number,
      default: 0
    },
    // Maximum number of uses (null = unlimited)
    maxUses: {
      type: Number,
      default: null
    },
    // Users who have used this code
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        usedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Generate a random alphanumeric code
tempCodeSchema.statics.generateCode = function (length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check if code is still valid
tempCodeSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (new Date() > this.expiresAt) return false;
  if (this.maxUses && this.usageCount >= this.maxUses) return false;
  return true;
};

// Index for efficient code lookup
tempCodeSchema.index({ code: 1, isActive: 1 });

const TempCode = mongoose.model('TempCode', tempCodeSchema);

module.exports = TempCode;
