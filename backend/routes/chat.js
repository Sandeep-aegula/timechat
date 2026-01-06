const express = require('express');
const router = express.Router();
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { protect } = require('../middleware/auth');

// @route   GET /api/chat
// @desc    Get all chats for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
      isActive: true,
    })
      .populate('users', 'name email pic')
      .populate('groupAdmin', 'name email pic')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'name email pic',
        },
      })
      .sort({ updatedAt: -1 });

    // Filter out expired chats
    chats = chats.filter((chat) => chat.timeRemaining > 0 || !chat.expiresAt);

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// @route   POST /api/chat
// @desc    Create or access a one-on-one chat
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if chat already exists between these users
    let chat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', 'name email pic')
      .populate('latestMessage');

    if (chat) {
      return res.json(chat);
    }

    // Create new one-on-one chat
    const newChat = await Chat.create({
      chatName: targetUser.name,
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id)
      .populate('users', 'name email pic');

    res.status(201).json(fullChat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// @route   POST /api/chat/group
// @desc    Create a group chat
// @access  Private
router.post('/group', protect, async (req, res) => {
  try {
    const { name, users = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Parse users if it's a string
    let userIds = typeof users === 'string' ? JSON.parse(users) : users;

    // Add the creator to the group
    if (!userIds.includes(req.user._id.toString())) {
      userIds.push(req.user._id);
    }

    // Create the group chat with 5-hour expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: userIds,
      groupAdmin: req.user._id,
      expiresAt: expiresAt,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('users', 'name email pic')
      .populate('groupAdmin', 'name email pic');

    res.status(201).json(fullGroupChat);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group chat' });
  }
});

// @route   POST /api/chat/join-global
// @desc    Join or create global chat
// @access  Private
router.post('/join-global', protect, async (req, res) => {
  try {
    // Try to find existing global chat
    let globalChat = await Chat.findOne({
      chatName: 'Global Chat',
      isGroupChat: true,
    });

    if (!globalChat) {
      // Create global chat if it doesn't exist
      globalChat = await Chat.create({
        chatName: 'Global Chat',
        isGroupChat: true,
        users: [req.user._id],
        groupAdmin: req.user._id,
        expiresAt: null, // Global chat never expires
      });
    } else {
      // Add user to global chat if not already a member
      if (!globalChat.users.includes(req.user._id)) {
        globalChat.users.push(req.user._id);
        await globalChat.save();
      }
    }

    const fullGlobalChat = await Chat.findById(globalChat._id)
      .populate('users', 'name email pic')
      .populate('groupAdmin', 'name email pic');

    res.json(fullGlobalChat);
  } catch (error) {
    console.error('Join global chat error:', error);
    res.status(500).json({ error: 'Failed to join global chat' });
  }
});

// @route   POST /api/chat/:chatId/leave
// @desc    Leave a chat
// @access  Private
router.post('/:chatId/leave', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is in the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(400).json({ error: 'You are not a member of this chat' });
    }

    // Remove user from chat
    chat.users = chat.users.filter(
      (userId) => userId.toString() !== req.user._id.toString()
    );

    // If no users left, delete the chat
    if (chat.users.length === 0) {
      await Message.deleteMany({ chat: chat._id });
      await Chat.findByIdAndDelete(chat._id);
      return res.json({ message: 'Chat deleted as it has no members' });
    }

    // If the leaving user was the admin, assign a new admin
    if (chat.groupAdmin && chat.groupAdmin.toString() === req.user._id.toString()) {
      chat.groupAdmin = chat.users[0];
    }

    await chat.save();

    res.json({ message: 'Left chat successfully' });
  } catch (error) {
    console.error('Leave chat error:', error);
    res.status(500).json({ error: 'Failed to leave chat' });
  }
});

// @route   GET /api/chat/:chatId/download
// @desc    Download chat history as JSON
// @access  Private
router.get('/:chatId/download', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('users', 'name email');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member of the chat
    if (!chat.users.some((u) => u._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Get all messages
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    // Format the export
    const chatExport = {
      chatName: chat.chatName,
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.name,
      participants: chat.users.map((u) => ({
        name: u.name,
        email: u.email,
      })),
      messageCount: messages.length,
      messages: messages.map((msg) => ({
        sender: msg.sender?.name || 'Unknown',
        content: msg.content,
        timestamp: msg.createdAt,
        hasAttachment: !!msg.fileUrl,
        attachmentName: msg.fileName,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${chat.chatName.replace(/[^a-z0-9]/gi, '_')}_export.json"`
    );

    res.json(chatExport);
  } catch (error) {
    console.error('Download chat error:', error);
    res.status(500).json({ error: 'Failed to download chat' });
  }
});

// @route   PUT /api/chat/:chatId
// @desc    Update group chat name
// @access  Private (Group Admin only)
router.put('/:chatId', protect, async (req, res) => {
  try {
    const { chatName } = req.body;

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ error: 'Cannot rename one-on-one chat' });
    }

    // Check if user is admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only group admin can rename the chat' });
    }

    chat.chatName = chatName;
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('users', 'name email pic')
      .populate('groupAdmin', 'name email pic');

    res.json(updatedChat);
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// @route   PUT /api/chat/:chatId/add
// @desc    Add user to group chat
// @access  Private (Group Admin only)
router.put('/:chatId/add', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ error: 'Cannot add users to one-on-one chat' });
    }

    // Check member limit
    if (chat.users.length >= chat.maxMembers) {
      return res.status(400).json({ error: 'Chat has reached maximum members limit' });
    }

    // Check if user is already in chat
    if (chat.users.includes(userId)) {
      return res.status(400).json({ error: 'User is already in this chat' });
    }

    chat.users.push(userId);
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('users', 'name email pic')
      .populate('groupAdmin', 'name email pic');

    res.json(updatedChat);
  } catch (error) {
    console.error('Add user to chat error:', error);
    res.status(500).json({ error: 'Failed to add user to chat' });
  }
});

module.exports = router;
