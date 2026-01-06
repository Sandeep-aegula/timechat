const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Chat name cannot exceed 100 characters'],
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    maxMembers: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chatSchema.index({ users: 1 });
chatSchema.index({ expiresAt: 1 });

// Virtual to check if chat is expired
chatSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Ensure virtuals are included in JSON
chatSchema.set('toJSON', { virtuals: true });
chatSchema.set('toObject', { virtuals: true });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
