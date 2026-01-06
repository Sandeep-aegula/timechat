# Backend

This is the backend server for TimeChat - a 5-hour temporary chat application.

## Setup

1. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/user?search=query` - Search users

### Chats
- `GET /api/chat` - Get all chats for user
- `POST /api/chat` - Create or access 1:1 chat
- `POST /api/chat/group` - Create a group chat
- `POST /api/chat/join-global` - Join global chat
- `POST /api/chat/:chatId/leave` - Leave a chat
- `GET /api/chat/:chatId/download` - Download chat history

### Messages
- `GET /api/message/:chatId` - Get messages for a chat
- `POST /api/message` - Send a text message
- `POST /api/message/file` - Send a file message

### Temporary Codes
- `POST /api/temp-code/generate` - Generate invite code for a chat
- `POST /api/temp-code/join` - Join chat using invite code
- `GET /api/temp-code/:chatId` - Get active codes for a chat

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/mern-chat` |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
