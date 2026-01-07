# Quick Start Guide - New Features

## Profile Management

### For Users
1. Look for your **name and avatar** in the top-left sidebar
2. Click the **dropdown menu** next to your profile
3. Select **"Edit Profile"**
4. Change your **display name** in the modal
5. Click **"Save Changes"**
6. Your profile updates **instantly**

### Features
- ✅ Change username anytime
- ✅ Real-time avatar generation
- ✅ View account creation date
- ✅ Email cannot be changed

---

## Chat Code Sharing

### Generate a Code (Share Your Chat)

**Requirements**: 
- You must be in a chat/have created it

**Steps**:
1. **Select a chat** from "My Chats" list
2. Click **"Generate Invite Code"** button
3. A 6-character code appears (e.g., `ABC123`)
4. **Copy and share** the code with friends
5. Code automatically **expires in 60 minutes**

### Join a Chat (Using Someone's Code)

**Requirements**:
- You have a code from someone

**Steps**:
1. In the **"Join Someone Else's Chat"** section
2. **Paste the code** you received
3. Click **"Join"** or press **Enter**
4. The chat **instantly appears** in your chat list
5. Start **chatting immediately**

### Code Features
- 🔤 6-8 character unique codes
- ⏱️ Auto-expires in 60 minutes
- 👥 Max 50 members per chat
- 🔄 Shows expiration time
- ✨ Case-insensitive

---

## File Changes Summary

### Backend (`backend/`)
**Modified**: `routes/auth.js`
- Added: `PUT /api/auth/profile` endpoint
- Validates username and saves changes

### Frontend (`frontend/src/`)
**Modified**: 
- `App.js` - Profile modal integration
- `components/ChatSidebar.js` - Profile menu added

**Created**:
- `components/ProfilePage.js` - Full profile view

---

## API Endpoints

### Profile Management
```
PUT /api/auth/profile
```
Update user profile (username, picture)

### Code Sharing
```
POST /api/temp-code/generate
```
Create invite code for a chat

```
POST /api/temp-code/join
```
Join chat using invite code

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Generate Code | Click button (when chat selected) |
| Join Chat | Enter key (in code input field) |
| Edit Profile | Click menu → Edit Profile |

---

## Troubleshooting

### Code doesn't work
- ❌ Check if **code is expired** (60 min limit)
- ❌ Verify **correct chat** - try generating new code
- ❌ Try **refreshing** the page
- ✅ Make sure you're **not already in the chat**

### Profile won't update
- ❌ Check **name length** (max 50 characters)
- ❌ Ensure you're **logged in**
- ❌ Try **refreshing** the page
- ✅ Check **network connection**

### Can't generate code
- ✅ **Select a chat first** from the list
- ✅ Make sure you're a **member** of the chat
- ✅ Chat shouldn't be **expired**

---

## Support

For issues:
1. Check browser **console** (F12) for errors
2. Verify **network connection**
3. Ensure **token** is valid (logout & login again)
4. Check that **backend** is running on correct port

---

## What's New?

### ✨ Profile Changes
- Edit username anytime
- See account creation date
- Avatar auto-generates from name

### ✨ Code Sharing
- Generate shareable invite codes
- Join chats instantly with code
- No email needed to join
- Automatic expiration for security
- Track usage of codes

---

## Tips & Tricks

1. **Share codes** via any method (text, email, link)
2. **Generate new code** if old one expires
3. **Edit profile** before sharing to set proper name
4. **Copy code** quickly with click
5. **Enter key** works in code input for faster joining

---

Good to go! 🚀 Enjoy the new features!
