const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const Message = require('../models/messageModel');
const TempCode = require('../models/tempCodeModel');
const { generateRandomCode } = require('../utils/helpers');

// @desc    Create a new chat room with temporary code
// @route   POST /api/chat
// @access  Private
const createChat = async (req, res) => {
  try {
    const { chatName, users, isGroupChat } = req.body;

    if (!chatName) {
      res.status(400);
      throw new Error('Chat name is required');
    }

    // Include the creator in the users array
    let chatUsers = [req.user._id];
    
    if (users && Array.isArray(users)) {
      chatUsers = [...new Set([...chatUsers, ...users])]; // Remove duplicates
    }

    // Create the chat
    const chat = await Chat.create({
      chatName,
      isGroupChat: isGroupChat || chatUsers.length > 2,
      users: chatUsers,
      groupAdmin: req.user._id
    });

    // Generate a temporary code for this chat
    let code;
    let codeExists = true;
    
    while (codeExists) {
      code = generateRandomCode(6);
      codeExists = await TempCode.findOne({ code, isActive: true });
    }

    const tempCode = await TempCode.create({
      code,
      chat: chat._id,
      createdBy: req.user._id,
      expiresAt: chat.expiresAt // Same expiry as chat
    });

    // Update chat with temp code reference
    chat.tempCode = tempCode._id;
    await chat.save();

    // Populate and return the chat
    const fullChat = await Chat.findById(chat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('tempCode');

    res.status(201).json({
      ...fullChat.toObject(),
      joinCode: tempCode.code
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chat
// @access  Private
const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
      isActive: true
    })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .populate('tempCode')
      .sort({ updatedAt: -1 });

    // Populate sender in latest message
    const populatedChats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'name pic email'
    });

    res.json(populatedChats);
  } catch (error) {
    res.status(500);
    res.json({ message: error.message });
  }
};

// @desc    Get single chat by ID
// @route   GET /api/chat/:chatId
// @access  Private
const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      users: { $elemMatch: { $eq: req.user._id } },
      isActive: true
    })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('tempCode');

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found or access denied');
    }

    res.json(chat);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Join a chat using temporary code
// @route   POST /api/chat/join
// @access  Private
const joinChatByCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400);
      throw new Error('Join code is required');
    }

    // Find the temp code
    const tempCode = await TempCode.findOne({
      code: code.toUpperCase(),
      isActive: true
    }).populate('chat');

    if (!tempCode) {
      res.status(404);
      throw new Error('Invalid or expired code');
    }

    // Check if code is still valid
    if (!tempCode.isValid()) {
      res.status(400);
      throw new Error('This code has expired or reached maximum uses');
    }

    const chat = await Chat.findById(tempCode.chat._id);

    if (!chat || !chat.isActive) {
      res.status(404);
      throw new Error('Chat no longer exists');
    }

    // Check if user is already in the chat
    if (chat.users.includes(req.user._id)) {
      res.status(400);
      throw new Error('You are already a member of this chat');
    }

    // Add user to chat
    chat.users.push(req.user._id);
    await chat.save();

    // Update temp code usage
    tempCode.usageCount += 1;
    tempCode.usedBy.push({
      user: req.user._id,
      usedAt: new Date()
    });
    await tempCode.save();

    // Return populated chat
    const fullChat = await Chat.findById(chat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('tempCode');

    res.json(fullChat);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Generate new temporary code for chat
// @route   POST /api/chat/:chatId/code
// @access  Private (admin only)
const generateNewCode = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Check if user is admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the chat admin can generate new codes');
    }

    // Deactivate old code
    if (chat.tempCode) {
      await TempCode.findByIdAndUpdate(chat.tempCode, { isActive: false });
    }

    // Generate new code
    let code;
    let codeExists = true;
    
    while (codeExists) {
      code = generateRandomCode(6);
      codeExists = await TempCode.findOne({ code, isActive: true });
    }

    const tempCode = await TempCode.create({
      code,
      chat: chat._id,
      createdBy: req.user._id,
      expiresAt: chat.expiresAt
    });

    chat.tempCode = tempCode._id;
    await chat.save();

    res.json({
      code: tempCode.code,
      expiresAt: tempCode.expiresAt
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Leave a chat
// @route   DELETE /api/chat/:chatId/leave
// @access  Private
const leaveChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Remove user from chat
    chat.users = chat.users.filter(
      (user) => user.toString() !== req.user._id.toString()
    );

    // If admin leaves, assign new admin or deactivate chat
    if (chat.groupAdmin.toString() === req.user._id.toString()) {
      if (chat.users.length > 0) {
        chat.groupAdmin = chat.users[0];
      } else {
        chat.isActive = false;
      }
    }

    await chat.save();

    res.json({ message: 'Left chat successfully' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Update chat details
// @route   PUT /api/chat/:chatId
// @access  Private (admin only)
const updateChat = async (req, res) => {
  try {
    const { chatName } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Check if user is admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the chat admin can update chat details');
    }

    if (chatName) chat.chatName = chatName;

    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('tempCode');

    res.json(updatedChat);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Add user to chat
// @route   PUT /api/chat/:chatId/add
// @access  Private (admin only)
const addUserToChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the chat admin can add users');
    }

    if (chat.users.includes(userId)) {
      res.status(400);
      throw new Error('User is already in the chat');
    }

    chat.users.push(userId);
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Remove user from chat
// @route   PUT /api/chat/:chatId/remove
// @access  Private (admin only)
const removeUserFromChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the chat admin can remove users');
    }

    chat.users = chat.users.filter((user) => user.toString() !== userId);
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

module.exports = {
  createChat,
  getChats,
  getChatById,
  joinChatByCode,
  generateNewCode,
  leaveChat,
  updateChat,
  addUserToChat,
  removeUserFromChat
};
