const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/messageModel');
const Chat = require('../models/chatModel');
const { protect } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images, documents, audio files, and common file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/webm',
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// @route   GET /api/message/:chatId
// @desc    Get all messages for a chat
// @access  Private
router.get('/:chatId', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member of the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name email pic')
      .populate('chat')
      .sort({ createdAt: 1 });

    // Add avatar URL to sender
    const messagesWithAvatars = messages.map((msg) => ({
      ...msg.toObject(),
      sender: msg.sender
        ? {
            _id: msg.sender._id,
            name: msg.sender.name,
            email: msg.sender.email,
            avatar: msg.sender.pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=random`,
          }
        : null,
    }));

    res.json(messagesWithAvatars);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// @route   POST /api/message
// @desc    Send a text message
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({ error: 'Content and chatId are required' });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member of the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Check if chat is expired
    if (chat.isExpired) {
      return res.status(400).json({ error: 'This chat has expired' });
    }

    // Create the message
    let message = await Message.create({
      sender: req.user._id,
      content: content,
      chat: chatId,
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    // Populate sender and chat info
    message = await Message.findById(message._id)
      .populate('sender', 'name email pic')
      .populate('chat');

    const responseMessage = {
      ...message.toObject(),
      sender: {
        _id: message.sender._id,
        name: message.sender.name,
        email: message.sender.email,
        avatar: message.sender.pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=random`,
      },
    };

    res.status(201).json(responseMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// @route   POST /api/message/file
// @desc    Send a message with file attachment
// @access  Private
router.post('/file', protect, upload.single('file'), async (req, res) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member of the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Check if chat is expired
    if (chat.isExpired) {
      return res.status(400).json({ error: 'This chat has expired' });
    }

    // Create the message with file attachment
    let message = await Message.create({
      sender: req.user._id,
      content: content || `📎 ${req.file.originalname}`,
      chat: chatId,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    // Populate sender and chat info
    message = await Message.findById(message._id)
      .populate('sender', 'name email pic')
      .populate('chat');

    const responseMessage = {
      ...message.toObject(),
      sender: {
        _id: message.sender._id,
        name: message.sender.name,
        email: message.sender.email,
        avatar: message.sender.pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=random`,
      },
    };

    res.status(201).json(responseMessage);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

module.exports = router;
