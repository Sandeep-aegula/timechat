const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  sendMessage,
  getMessages,
  sendFileMessage,
  sendVideoMessage,
  downloadChatHistory,
  markMessagesAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Check if running on Vercel (serverless environment with read-only filesystem)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Configure multer for file uploads
let storage;

if (isVercel) {
  // Use memory storage on Vercel - files should be uploaded to cloud storage
  storage = multer.memoryStorage();
} else {
  // Local development - use disk storage
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}



// General file filter for non-video uploads (allow all file types)
const fileFilter = (req, file, cb) => {
  cb(null, true);
};

// Video file filter (relaxed: allow .mp4 extension if mimetype is missing or wrong)
const videoFileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else if (file.originalname && file.originalname.match(/\.mp4$/i)) {
    console.log('Allowing video upload by .mp4 extension:', file.originalname);
    cb(null, true);
  } else {
    console.log('Rejected file in videoFileFilter:', file.mimetype, file.originalname);
    cb(new Error('Only video files are allowed'), false);
  }
};


const MAX_UPLOAD_BYTES = 600 * 1024 * 1024; // 600MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES }, // 600MB limit for general files
  fileFilter
});

// For video uploads, prefer disk storage to avoid large memory usage locally.
// On Vercel (serverless) storage will be memory by design.
const videoUpload = multer({
  storage: storage,
  limits: { fileSize: MAX_UPLOAD_BYTES }, // 600MB limit for videos
  fileFilter: videoFileFilter
});

// All routes are protected
router.use(protect);

// Send text message
router.post('/', sendMessage);

// Send file message
router.post('/file', upload.single('file'), sendFileMessage);


// Upload a video message
router.post('/video', videoUpload.single('file'), sendVideoMessage);

// Get messages for a chat
router.get('/:chatId', getMessages);

// Download chat history
router.get('/:chatId/download', downloadChatHistory);

// Mark messages as read
router.put('/:chatId/read', markMessagesAsRead);

module.exports = router;
