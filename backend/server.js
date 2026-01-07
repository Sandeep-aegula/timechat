require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');
const tempCodeRoutes = require('./routes/tempCode');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'https://timechat-alpha.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000'
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
}));

// Additional headers for CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/temp-code', tempCodeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler middleware
app.use(errorHandler);

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  // User setup - store user info
  socket.on('setup', (userData) => {
    if (userData && userData.id) {
      socket.userId = userData.id;
      socket.userName = userData.name;
      connectedUsers.set(userData.id, socket.id);
      socket.join(userData.id);
      socket.emit('connected');
      console.log(`User ${userData.name} (${userData.id}) connected`);
    }
  });

  // Join a chat room
  socket.on('join chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.userName || socket.id} joined chat: ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.userName || socket.id} left chat: ${chatId}`);
  });

  // Handle new message
  socket.on('new message', (message) => {
    const chat = message.chat;
    
    if (!chat || !chat._id) {
      console.log('Invalid message structure - no chat info');
      return;
    }

    // Broadcast to all users in the chat except sender
    socket.to(chat._id).emit('message received', message);
    
    // Also send to individual user rooms for notifications
    if (chat.users) {
      chat.users.forEach((user) => {
        const recipientId = user._id || user;
        if (recipientId.toString() !== socket.userId) {
          socket.to(recipientId.toString()).emit('message received', message);
        }
      });
    }
  });

  // Handle typing indicator
  socket.on('typing', (chatId) => {
    socket.to(chatId).emit('typing', {
      chatId,
      userId: socket.userId,
      userName: socket.userName,
    });
  });

  // Handle stop typing
  socket.on('stop typing', (chatId) => {
    socket.to(chatId).emit('stop typing', {
      chatId,
      userId: socket.userId,
    });
  });

  // Handle user going online/offline
  socket.on('user online', () => {
    socket.broadcast.emit('user status', {
      userId: socket.userId,
      isOnline: true,
    });
  });

  socket.on('user offline', () => {
    socket.broadcast.emit('user status', {
      userId: socket.userId,
      isOnline: false,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userName || socket.id} disconnected`);
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      socket.broadcast.emit('user status', {
        userId: socket.userId,
        isOnline: false,
      });
    }
  });
});

// Cleanup expired chats and temp codes (runs every hour)
const cleanupExpiredData = async () => {
  try {
    const Chat = require('./models/chatModel');
    const TempCode = require('./models/tempCodeModel');
    const Message = require('./models/messageModel');

    // Find and delete expired chats
    const expiredChats = await Chat.find({
      expiresAt: { $lt: new Date() },
    });

    for (const chat of expiredChats) {
      // Delete messages in the chat
      await Message.deleteMany({ chat: chat._id });
      // Delete temp codes for the chat
      await TempCode.deleteMany({ chat: chat._id });
      // Delete the chat
      await Chat.findByIdAndDelete(chat._id);
      console.log(`Cleaned up expired chat: ${chat.chatName}`);
    }

    // Deactivate expired temp codes
    await TempCode.updateMany(
      { expiresAt: { $lt: new Date() }, isActive: true },
      { isActive: false }
    );

    console.log('Cleanup completed at:', new Date().toISOString());
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredData, 60 * 60 * 1000);

// Run initial cleanup after 10 seconds
setTimeout(cleanupExpiredData, 10000);

// For Vercel serverless deployment
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // For local development
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = { app, server, io };
