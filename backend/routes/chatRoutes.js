const express = require('express');
const router = express.Router();
const {
  createChat,
  getChats,
  getChatById,
  joinChatByCode,
  generateNewCode,
  leaveChat,
  updateChat,
  addUserToChat,
  removeUserFromChat
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Chat CRUD routes
router.route('/')
  .get(getChats)
  .post(createChat);

router.route('/:chatId')
  .get(getChatById)
  .put(updateChat);

// Join chat by temporary code
router.post('/join', joinChatByCode);

// Generate new code for chat
router.post('/:chatId/code', generateNewCode);

// Leave chat
router.delete('/:chatId/leave', leaveChat);

// Add/remove users
router.put('/:chatId/add', addUserToChat);
router.put('/:chatId/remove', removeUserFromChat);

module.exports = router;
