const mongoose = require('mongoose');
const crypto = require('crypto');

const tempCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    maxUsage: {
      type: Number,
      default: 100, // Maximum times code can be used
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookup and cleanup
tempCodeSchema.index({ code: 1 });
tempCodeSchema.index({ expiresAt: 1 });
tempCodeSchema.index({ chat: 1 });

// Virtual to check if code is expired
tempCodeSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

// Virtual to check if code is valid (not expired and within usage limit)
tempCodeSchema.virtual('isValid').get(function () {
  return this.isActive && !this.isExpired && this.usageCount < this.maxUsage;
});

// Static method to generate a unique code
tempCodeSchema.statics.generateUniqueCode = async function () {
  let code;
  let exists = true;

  while (exists) {
    // Generate a 6-character alphanumeric code
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
    exists = await this.findOne({ code });
  }

  return code;
};

// Ensure virtuals are included in JSON
tempCodeSchema.set('toJSON', { virtuals: true });
tempCodeSchema.set('toObject', { virtuals: true });

const TempCode = mongoose.model('TempCode', tempCodeSchema);

module.exports = TempCode;
