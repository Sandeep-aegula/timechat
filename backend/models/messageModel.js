const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      trim: true
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    // File attachment fields
    fileUrl: {
      type: String
    },
    fileName: {
      type: String
    },
    fileType: {
      type: String
    },
    fileSize: {
      type: Number
    },
    // Message type: text, image, file, system
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
messageSchema.index({ chat: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
