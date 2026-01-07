# TimeChat - MERN Chat Application

A full-stack chat experience with temporary access codes, realtime messaging, file sharing, and downloadable chat archives.

## Features
- JWT auth (register/login) with profile avatar fallback
- One-to-one and group chats with latest message preview
- Realtime messaging via Socket.IO, typing-safe send on Enter
- Voice messages and file attachments stored on the server
- Temporary join codes with configurable expiry to grant chat access
- One-click chat export to JSON with download prompt
- Responsive design for mobile and desktop

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- npm or yarn

### Local Development
1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd timechat
   npm run install:all
   ```

2. **Backend setup**
   - Copy `backend/.env.example` to `backend/.env`
   - Update environment variables (MongoDB URI, JWT secret, etc.)
   - Start backend: `npm run start:backend`

3. **Frontend setup**
   - Start frontend: `npm run start:frontend`
   - Or run both: `npm run dev`

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Deployment

### Option 1: Manual Deployment
1. **Run deployment script**
   ```bash
   # Linux/Mac
   ./deploy.sh

   # Windows
   deploy.bat
   ```

2. **Production start**
   ```bash
   npm run prod
   ```

### Option 2: Docker Deployment
1. **Build and run with Docker**
   ```bash
   docker-compose up -d
   ```

2. **Or build manually**
   ```bash
   docker build -t timechat .
   docker run -p 5000:5000 timechat
   ```

### Option 3: Cloud Platforms

#### Vercel (Frontend) + Railway/Heroku (Backend)
- **Frontend**: Deploy `frontend/` folder to Vercel
- **Backend**: Deploy `backend/` folder to Railway/Heroku

#### Heroku (Full-stack)
1. Create Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy with git push

#### DigitalOcean App Platform
1. Connect repository
2. Set environment variables
3. Deploy automatically

### Environment Variables
Create `backend/.env` with:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

## API Endpoints
- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/chat` list chats; `POST /api/chat` start 1:1; `POST /api/chat/group` create group
- `GET /api/message/:chatId` list messages; `POST /api/message` send text; `POST /api/message/file` upload attachment
- `POST /api/temp-code/generate` create a time-bound chat code; `POST /api/temp-code/join` redeem a code
- `GET /api/chat/:chatId/download` download chat history as JSON

## Tech Stack
- **Frontend**: React, Chakra UI, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, MongoDB
- **Authentication**: JWT
- **File Storage**: Local filesystem (configurable for cloud storage)

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License
MIT License - see LICENSE file for details
