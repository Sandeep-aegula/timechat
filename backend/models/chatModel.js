const mongoose = require('mongoose');

const chatSchema = mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
      required: [true, 'Chat name is required']
    },
    isGroupChat: {
      type: Boolean,
      default: false
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Temporary code for joining the chat
    tempCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TempCode'
    },
    // Chat expiration - auto-delete after 5 hours from creation
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now
      },
      index: { expires: 0 } // TTL index - MongoDB will auto-delete when expired
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for time remaining
chatSchema.virtual('timeRemaining').get(function () {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return remaining > 0 ? remaining : 0;
});

// Ensure virtuals are included in JSON output
chatSchema.set('toJSON', { virtuals: true });
chatSchema.set('toObject', { virtuals: true });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
