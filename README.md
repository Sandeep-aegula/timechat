# MERN Chat App

A full-stack chat experience with temporary access codes, realtime messaging, file sharing, and downloadable chat archives.

## Features
- JWT auth (register/login) with profile avatar fallback
- One-to-one and group chats with latest message preview
- Realtime messaging via Socket.IO, typing-safe send on Enter
- File attachments stored on the server and linked in the chat
- Temporary join codes with configurable expiry to grant chat access
- One-click chat export to JSON with download prompt

## Quick start
1. **Backend setup**
   - Copy `backend/.env.example` to `backend/.env` and adjust values.
   - Install dependencies at the repo root:
     ```bash
     npm install
     npm start
     ```
   - The API defaults to `http://localhost:5000`.

2. **Frontend setup**
   - From `frontend/` install and run:
     ```bash
     npm install
     npm start
     ```
   - Optionally set `REACT_APP_API_BASE` to point to your API origin.

## API highlights
- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/chat` list chats; `POST /api/chat` start 1:1; `POST /api/chat/group` create group
- `GET /api/message/:chatId` list messages; `POST /api/message` send text; `POST /api/message/file` upload attachment
- `POST /api/temp-code/generate` create a time-bound chat code; `POST /api/temp-code/join` redeem a code
- `GET /api/chat/:chatId/download` download chat history as JSON

## Notes
- MongoDB connection defaults to `mongodb://localhost:27017/mern-chat` unless overridden.
- The server serves uploads from `/uploads`; ensure the backend process has write access.
- For production, configure CORS and secrets appropriately.
# timechat
