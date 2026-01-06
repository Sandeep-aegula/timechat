const Message = require('../models/messageModel');
const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const archiver = require('archiver');

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
    }

    const newMessage = {
      sender: req.user._id,
      content: `Sent a ${messageType}`,
      chat: chatId,
      messageType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
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
  downloadChatHistory,
  markMessagesAsRead
};
