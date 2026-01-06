const express = require('express');
const router = express.Router();
const TempCode = require('../models/tempCodeModel');
const Chat = require('../models/chatModel');
const { protect } = require('../middleware/auth');

// @route   POST /api/temp-code/generate
// @desc    Generate a temporary code for a chat
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const { chatId, expiryMinutes = 60 } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    // Find the chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member of the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Check if chat is expired
    if (chat.timeRemaining === 0 && chat.expiresAt) {
      return res.status(400).json({ error: 'Cannot generate code for an expired chat' });
    }

    // Generate unique code
    let code;
    let codeExists = true;
    while (codeExists) {
      code = TempCode.generateCode(6);
      codeExists = await TempCode.findOne({ code, isActive: true });
    }

    // Calculate expiry time (minimum of requested expiry or chat expiry)
    let expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // If chat has an expiry, don't let code outlast the chat
    if (chat.expiresAt && expiresAt > chat.expiresAt) {
      expiresAt = chat.expiresAt;
    }

    // Create the temp code
    const tempCode = await TempCode.create({
      code,
      chat: chatId,
      createdBy: req.user._id,
      expiresAt,
    });

    res.status(201).json({
      code: tempCode.code,
      chatId: chat._id,
      chatName: chat.chatName,
      expiresAt: tempCode.expiresAt,
      createdBy: req.user.name,
    });
  } catch (error) {
    console.error('Generate temp code error:', error);
    res.status(500).json({ error: 'Failed to generate temporary code' });
  }
});

// @route   POST /api/temp-code/join
// @desc    Join a chat using a temporary code
// @access  Private
router.post('/join', protect, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Temporary code is required' });
    }

    // Find the temp code
    const tempCode = await TempCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
    }).populate('chat');

    if (!tempCode) {
      return res.status(404).json({ error: 'Invalid or expired code' });
    }

    // Check if code is valid using model method
    if (!tempCode.isValid()) {
      return res.status(400).json({ error: 'This code has expired or reached its usage limit' });
    }

    const chat = tempCode.chat;

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if chat is expired
    if (chat.timeRemaining === 0 && chat.expiresAt) {
      return res.status(400).json({ error: 'This chat has expired' });
    }

    // Check if user is already in the chat
    const userInChat = chat.users.some(u => u.toString() === req.user._id.toString());
    if (userInChat) {
      return res.json({
        message: 'Welcome back! You are already a member of this chat.',
        chat: {
          id: chat._id,
          chatName: chat.chatName,
          isGroupChat: chat.isGroupChat,
          users: chat.users,
        },
      });
    }

    // Check member limit
    if (chat.users.length >= chat.maxMembers) {
      return res.status(400).json({ error: 'This chat has reached its maximum member limit' });
    }

    // Add user to chat
    chat.users.push(req.user._id);
    await chat.save();

    // Increment usage count and track who used it
    tempCode.usageCount += 1;
    tempCode.usedBy.push({
      user: req.user._id,
      usedAt: new Date(),
    });
    await tempCode.save();

    // Get updated chat with populated users
    const updatedChat = await Chat.findById(chat._id)
      .populate('users', 'name email pic')
      .populate('groupAdmin', 'name email pic');

    res.json({
      message: `Successfully joined "${chat.chatName}"!`,
      chat: {
        id: updatedChat._id,
        chatName: updatedChat.chatName,
        isGroupChat: updatedChat.isGroupChat,
        users: updatedChat.users,
        expiresAt: updatedChat.expiresAt,
      },
    });
  } catch (error) {
    console.error('Join with code error:', error);
    res.status(500).json({ error: 'Failed to join chat with code' });
  }
});

// @route   GET /api/temp-code/:chatId
// @desc    Get active temp codes for a chat
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

    // Get active codes for this chat
    const codes = await TempCode.find({
      chat: req.params.chatId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(
      codes.map((code) => ({
        code: code.code,
        createdBy: code.createdBy?.name || 'Unknown',
        expiresAt: code.expiresAt,
        usageCount: code.usageCount,
        maxUsage: code.maxUsage,
      }))
    );
  } catch (error) {
    console.error('Get temp codes error:', error);
    res.status(500).json({ error: 'Failed to get temporary codes' });
  }
});

// @route   DELETE /api/temp-code/:codeId
// @desc    Deactivate a temp code
// @access  Private
router.delete('/:codeId', protect, async (req, res) => {
  try {
    const tempCode = await TempCode.findById(req.params.codeId).populate('chat');

    if (!tempCode) {
      return res.status(404).json({ error: 'Code not found' });
    }

    // Check if user is the creator or chat admin
    const chat = tempCode.chat;
    const isCreator = tempCode.createdBy.toString() === req.user._id.toString();
    const isAdmin = chat.groupAdmin && chat.groupAdmin.toString() === req.user._id.toString();

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Only the code creator or chat admin can deactivate this code' });
    }

    tempCode.isActive = false;
    await tempCode.save();

    res.json({ message: 'Code deactivated successfully' });
  } catch (error) {
    console.error('Delete temp code error:', error);
    res.status(500).json({ error: 'Failed to deactivate code' });
  }
});

module.exports = router;
