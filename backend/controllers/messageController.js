// @desc    Upload a video file and create a video message
// @route   POST /api/message/video
// @access  Private
const sendVideoMessage = async (req, res) => {
  try {
    // Debug log: what is received
    console.log('DEBUG /api/message/video req.body:', req.body);
    console.log('DEBUG /api/message/video req.file:', req.file);
    const { chatId } = req.body;

    if (!req.file || !chatId) {
      console.error('Video upload error: Missing file or chatId', { file: !!req.file, chatId });
      return res.status(400).json({ error: 'Video file and chatId are required' });
    }

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $elemMatch: { $eq: req.user._id } },
      isActive: true
    });

    if (!chat) {
      console.error('Video upload error: Chat not found or access denied', { chatId, user: req.user._id });
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    // Upload video to Cloudinary
    let fileUrl = null;
    let fileName = req.file.originalname;
    let fileType = req.file.mimetype;
    let fileSize = req.file.size;

    try {
      // Support both memory-buffer uploads (req.file.buffer) and disk path uploads (req.file.path)
      if (req.file && req.file.buffer) {
        await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'timechat/videos',
              public_id: fileName.split('.')[0],
              overwrite: true
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error (stream):', error);
                return reject(error);
              }
              fileUrl = result.secure_url;
              resolve();
            }
          );
          stream.end(req.file.buffer);
        });
      } else if (req.file && req.file.path) {
        // Upload directly from filesystem
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'video',
          folder: 'timechat/videos',
          public_id: fileName.split('.')[0],
          overwrite: true
        });
        fileUrl = result.secure_url;
        // Remove local file after successful upload
        const fs = require('fs');
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.warn('Could not remove temp video file:', req.file.path, e.message);
        }
      } else {
        throw new Error('No file buffer or path available for upload');
      }
    } catch (cloudErr) {
      console.error('Cloudinary upload failed:', cloudErr);
      return res.status(500).json({ error: 'Cloudinary upload failed', details: cloudErr.message });
    }

    // Defensive: ensure messageType is valid according to schema (avoid 500s if schema not reloaded)
    const schemaEnum = Message.schema.path('messageType')?.enumValues || ['text','image','file','system'];
    const safeMessageType = schemaEnum.includes('video') ? 'video' : 'file';

    const newMessage = {
      sender: req.user._id,
      content: 'Sent a video',
      chat: chatId,
      messageType: safeMessageType,
      fileUrl,
      fileName,
      fileType,
      fileSize
    };

    let message = await Message.create(newMessage);

    message = await message.populate('sender', 'name pic');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name pic email'
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    console.error('sendVideoMessage controller error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload video' });
  }
};

// ...existing code...
const Message = require('../models/messageModel');
const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const archiver = require('archiver');
const cloudinary = require('../config/cloudinary');

// @desc    Send a message
// @route   POST /api/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
      res.status(400);
      throw new Error('Content and chatId are required');
    }

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $elemMatch: { $eq: req.user._id } },
      isActive: true
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found or access denied');
    }

    const newMessage = {
      sender: req.user._id,
      content,
      chat: chatId,
      messageType: 'text'
    };

    let message = await Message.create(newMessage);

    message = await message.populate('sender', 'name pic');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name pic email'
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/message/:chatId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $elemMatch: { $eq: req.user._id } },
      isActive: true
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found or access denied');
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name pic email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ chat: chatId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Send a file message
// @route   POST /api/message/file
// @access  Private
const sendFileMessage = async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!req.file || !chatId) {
      res.status(400);
      throw new Error('File and chatId are required');
    }

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $elemMatch: { $eq: req.user._id } },
      isActive: true
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found or access denied');
    }

    // Determine message type based on file mimetype
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    }

    let fileUrl = null;
    let fileName = req.file.originalname;
    let fileType = req.file.mimetype;
    let fileSize = req.file.size;

    // Upload video files to Cloudinary
    if (messageType === 'video') {
      try {
        // If using memoryStorage, buffer is available
        const uploadResult = await cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'timechat/videos',
            public_id: fileName.split('.')[0],
            overwrite: true
          },
          (error, result) => {
            if (error) throw error;
            fileUrl = result.secure_url;
          }
        );
        // Pipe the buffer to the upload_stream
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'timechat/videos',
            public_id: fileName.split('.')[0],
            overwrite: true
          },
          (error, result) => {
            if (error) {
              throw error;
            }
            fileUrl = result.secure_url;
          }
        );
        stream.end(req.file.buffer);
        // Wait for upload to finish
        await new Promise((resolve, reject) => {
          stream.on('finish', resolve);
          stream.on('error', reject);
        });
      } catch (err) {
        return res.status(500).json({ error: 'Cloudinary upload failed', details: err.message });
      }
    } else {
      // For non-video files, use local storage as before
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const newMessage = {
      sender: req.user._id,
      content: `Sent a ${messageType}`,
      chat: chatId,
      messageType,
      fileUrl,
      fileName,
      fileType,
      fileSize
    };

    let message = await Message.create(newMessage);

    message = await message.populate('sender', 'name pic');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name pic email'
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Download chat history as JSON/ZIP
// @route   GET /api/message/:chatId/download
// @access  Private
const downloadChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { format = 'json' } = req.query;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $elemMatch: { $eq: req.user._id } }
    })
      .populate('users', 'name email')
      .populate('groupAdmin', 'name email');

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found or access denied');
    }

    // Get all messages
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    // Prepare chat export data
    const chatExport = {
      chatInfo: {
        name: chat.chatName,
        isGroupChat: chat.isGroupChat,
        createdAt: chat.createdAt,
        expiresAt: chat.expiresAt,
        participants: chat.users.map((u) => ({
          name: u.name,
          email: u.email
        })),
        admin: chat.groupAdmin
          ? { name: chat.groupAdmin.name, email: chat.groupAdmin.email }
          : null
      },
      exportedAt: new Date().toISOString(),
      exportedBy: {
        name: req.user.name,
        email: req.user.email
      },
      totalMessages: messages.length,
      messages: messages.map((msg) => ({
        sender: msg.sender ? msg.sender.name : 'Unknown',
        senderEmail: msg.sender ? msg.sender.email : null,
        content: msg.content,
        messageType: msg.messageType,
        fileName: msg.fileName || null,
        fileUrl: msg.fileUrl || null,
        timestamp: msg.createdAt
      }))
    };

    if (format === 'zip') {
      // Create ZIP archive
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${chat.chatName.replace(/[^a-z0-9]/gi, '_')}_chat_export.zip"`
      );

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      // Add JSON file to archive
      archive.append(JSON.stringify(chatExport, null, 2), {
        name: 'chat_history.json'
      });

      // Add a readme
      const readme = `Chat Export: ${chat.chatName}
Exported on: ${new Date().toISOString()}
Total Messages: ${messages.length}
Participants: ${chat.users.map((u) => u.name).join(', ')}

This archive contains the complete chat history in JSON format.
`;
      archive.append(readme, { name: 'README.txt' });

      await archive.finalize();
    } else {
      // Return as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${chat.chatName.replace(/[^a-z0-9]/gi, '_')}_chat_export.json"`
      );
      res.json(chatExport);
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/message/:chatId/read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $elemMatch: { $eq: req.user._id } }
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found or access denied');
    }

    // Mark all messages as read by this user
    await Message.updateMany(
      {
        chat: chatId,
        readBy: { $ne: req.user._id }
      },
      {
        $addToSet: { readBy: req.user._id }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  sendFileMessage,
  sendVideoMessage,
  downloadChatHistory,
  markMessagesAsRead
};
