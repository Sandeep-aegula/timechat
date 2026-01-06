const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  sendMessage,
  getMessages,
  sendFileMessage,
  downloadChatHistory,
  markMessagesAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and common document types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// All routes are protected
router.use(protect);

// Send text message
router.post('/', sendMessage);

// Send file message
router.post('/file', upload.single('file'), sendFileMessage);

// Get messages for a chat
router.get('/:chatId', getMessages);

// Download chat history
router.get('/:chatId/download', downloadChatHistory);

// Mark messages as read
router.put('/:chatId/read', markMessagesAsRead);

module.exports = router;
