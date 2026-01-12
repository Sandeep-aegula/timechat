
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, useToast, useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

// Import our new components
import LoginForm from './components/LoginForm';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import ProfileEditor from './components/ProfileEditor';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const apiClient = axios.create({ 
  baseURL: API_BASE
});

function App() {
  const toast = useToast();
  const { isOpen: isProfileModalOpen, onOpen: openProfileModal, onClose: closeProfileModal } = useDisclosure();
  
  const [token, setToken] = useState(() => localStorage.getItem('chat_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('chat_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tempCodeInput, setTempCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle logout - defined early so interceptor can use it
  const handleLogout = useCallback(() => {
    setToken('');
    setUser(null);
    setChats([]);
    setMessages([]);
    setSelectedChat(null);
    setGeneratedCode(null);
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common.Authorization;
    }
    
    // Add response interceptor to handle auth errors
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token is invalid or expired - logout user
          console.log('Auth error, logging out:', error.response?.data?.message);
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, [token, handleLogout]);

  useEffect(() => {
    selectedChatIdRef.current = selectedChat ? selectedChat._id : null;
  }, [selectedChat]);

  const notify = useCallback((title, status = 'info') => {
    toast({ title, status, duration: 3000, isClosable: true });
  }, [toast]);

  const handleAuthSuccess = useCallback((payload) => {
    const { token: issuedToken, user: issuedUser } = payload;
    setToken(issuedToken);
    setUser(issuedUser);
    localStorage.setItem('chat_token', issuedToken);
    localStorage.setItem('chat_user', JSON.stringify(issuedUser));
  }, []);

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await apiClient.get('/api/chat');
      setChats(data);
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to load chats', 'error');
    }
  }, [notify, token]);

  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      setLoadingMessages(true);
      const { data } = await apiClient.get(`/api/message/${chatId}`);
      setMessages(data);
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to load messages', 'error');
    } finally {
      setLoadingMessages(false);
    }
  }, [notify]);

  const handleSelectChat = useCallback((chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
    if (socketRef.current) {
      socketRef.current.emit('join chat', chat._id);
    }
  }, [fetchMessages]);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(API_BASE, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('setup', { id: user.id || user._id, name: user.name });
    socket.on('connected', () => notify('Realtime connected', 'success'));
    socket.on('message received', (incoming) => {
      const chatId = incoming.chat?._id || incoming.chat;
      if (selectedChatIdRef.current && chatId === selectedChatIdRef.current) {
        setMessages((prev) => [...prev, incoming]);
      } else {
        fetchChats();
      }
    });

    // Typing indicator handlers
    socket.on('typing', ({ chatId, userId, userName }) => {
      if (selectedChatIdRef.current === chatId && userId !== (user.id || user._id)) {
        setTypingUsers((prev) => {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, { userId, userName }];
          }
          return prev;
        });
      }
    });

    socket.on('stop typing', ({ chatId, userId }) => {
      if (selectedChatIdRef.current === chatId) {
        setTypingUsers((prev) => prev.filter(u => u.userId !== userId));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchChats, notify, token, user]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleLogin = async (formData) => {
    try {
      const { data } = await apiClient.post('/api/auth/login', formData);
      handleAuthSuccess(data);
      notify('Logged in');
    } catch (err) {
      notify(err.response?.data?.error || 'Login failed', 'error');
    }
  };

  const handleRegister = async (formData) => {
    try {
      const { data } = await apiClient.post('/api/auth/register', formData);
      handleAuthSuccess(data);
      notify('Account created');
    } catch (err) {
      notify(err.response?.data?.error || 'Registration failed', 'error');
    }
  };

  const handleSearchUsers = async () => {
    if (!searchTerm.trim()) return;
    try {
      const { data } = await apiClient.get(`/api/user?search=${encodeURIComponent(searchTerm)}`);
      setSearchResults(data);
    } catch (err) {
      notify(err.response?.data?.error || 'User search failed', 'error');
    }
  };

  const handleStartChat = async (userId) => {
    try {
      const { data } = await apiClient.post('/api/chat', { userId });
      notify('Chat ready');
      setSearchResults([]);
      setSearchTerm('');
      setChats((prev) => {
        const exists = prev.find((c) => c._id === data._id);
        return exists ? prev : [data, ...prev];
      });
      handleSelectChat(data);
    } catch (err) {
      notify(err.response?.data?.error || 'Could not start chat', 'error');
    }
  };

  const handleCreateNewChat = async (chatName) => {
    try {
      const { data } = await apiClient.post('/api/chat/group', {
        name: chatName,
        users: []
      });
      notify(`Chat "${chatName}" created successfully!`);
      setChats((prev) => {
        const exists = prev.find((c) => c._id === data._id);
        return exists ? prev : [data, ...prev];
      });
      handleSelectChat(data);
      return data;
    } catch (err) {
      notify(err.response?.data?.error || 'Could not create chat', 'error');
      throw err;
    }
  };

  const handleGenerateTempCode = async () => {
    if (!selectedChat) {
      notify('Please select a chat first to generate a code', 'warning');
      return;
    }
    
    try {
      const { data } = await apiClient.post('/api/temp-code/generate', {
        chatId: selectedChat._id,
        expiryMinutes: 60
      });
      setGeneratedCode(data);
      notify(`Temp code created for "${selectedChat.chatName}" - share it with others!`);
    } catch (err) {
      notify(err.response?.data?.error || 'Could not generate code', 'error');
    }
  };

  const handleJoinWithTempCode = async () => {
    if (!tempCodeInput.trim()) return;
    
    console.log('Attempting to join with code:', tempCodeInput.trim().toUpperCase());
    
    try {
      const { data } = await apiClient.post('/api/temp-code/join', { 
        code: tempCodeInput.trim().toUpperCase() 
      });
      
      console.log('Join response:', data);
      
      // Handle both new joins and welcome back scenarios
      const isWelcomeBack = data.message && data.message.includes('Welcome back');
      
      notify(
        isWelcomeBack ? 'Welcome back to the chat!' : `Successfully joined "${data.chat.chatName}"!`,
        'success'
      );
      
      setTempCodeInput('');
      fetchChats();
      
      // Select the joined chat if it's not already selected
      if (data.chat && data.chat.id !== selectedChat?._id) {
        setSelectedChat({
          _id: data.chat.id,
          chatName: data.chat.chatName,
          isGroupChat: data.chat.isGroupChat,
          users: data.chat.users
        });
      }
      
    } catch (err) {
      console.error('Join failed:', err.response?.data || err.message);
      notify(err.response?.data?.error || 'Join failed', 'error');
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !file) || !selectedChat) return;
    
    // Stop typing indicator when sending
    if (socketRef.current && selectedChat) {
      socketRef.current.emit('stop typing', selectedChat._id);
    }
    
    try {
      setIsSending(true);
      
      let messageData;
      if (file) {
        // File upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatId', selectedChat._id);
        if (newMessage.trim()) {
          formData.append('content', newMessage);
        }
        
        setIsUploading(true);
        const { data } = await apiClient.post('/api/message/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        messageData = data;
      } else {
        // Text message
        const { data } = await apiClient.post('/api/message', {
          content: newMessage,
          chatId: selectedChat._id
        });
        messageData = data;
      }
      
      setMessages((prev) => [...prev, messageData]);
      setNewMessage('');
      setFile(null);
      
      if (socketRef.current) {
        socketRef.current.emit('new message', messageData);
      }
      fetchChats();
    } catch (err) {
      notify(err.response?.data?.error || 'Could not send message', 'error');
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleTyping = useCallback(() => {
    if (!socketRef.current || !selectedChat) return;
    
    socketRef.current.emit('typing', selectedChat._id);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && selectedChat) {
        socketRef.current.emit('stop typing', selectedChat._id);
      }
    }, 3000);
  }, [selectedChat]);

  const handleLeaveChat = async () => {
    if (!selectedChat) return;
    
    try {
      await apiClient.post(`/api/chat/${selectedChat._id}/leave`);
      notify('Left chat successfully');
      setSelectedChat(null);
      setMessages([]);
      fetchChats();
    } catch (err) {
      notify(err.response?.data?.error || 'Could not leave chat', 'error');
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const { data } = await apiClient.put('/api/auth/profile', profileData);
      
      // Update user state with new profile data
      const updatedUser = {
        ...user,
        name: data.name,
        pic: data.pic || user.pic
      };
      setUser(updatedUser);
      localStorage.setItem('chat_user', JSON.stringify(updatedUser));
      
      notify('Profile updated successfully!', 'success');
      closeProfileModal();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  if (!isAuthenticated) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
      />
    );
  }

  return (
    <div className="app-shell">
      <Box bg="gray.100" style={{ minHeight: '100vh' }} overflow="hidden" py={{ base: 0, md: 4 }}>
        <Box
          display="flex"
          flexDirection={{ base: "column", lg: "row" }}
          height={{ base: "100%", md: "calc(100% - 32px)" }}
          maxW={{ base: "100%", xl: "1400px" }}
          mx="auto"
          bg="white"
          boxShadow={{ base: 'none', md: 'xl' }}
          borderRadius={{ base: 0, md: 'xl' }}
          overflow="hidden"
        >
        {/* Mobile/Tablet: Show sidebar or chat, Desktop: Show both */}
        <Box 
          display={{ base: selectedChat ? "none" : "flex", lg: "flex" }}
          width={{ base: "100%", lg: "32%" }}
          minWidth={{ lg: "320px" }}
          maxWidth={{ lg: "360px" }}
          height={{ base: selectedChat ? "0" : "100%", lg: "100%" }}
          overflow="hidden"
          borderRightWidth={{ lg: "1px" }}
          bg="gray.50"
        >
          <ChatSidebar
            user={user}
            chats={chats}
            selectedChat={selectedChat}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchResults={searchResults}
            tempCodeInput={tempCodeInput}
            setTempCodeInput={setTempCodeInput}
            generatedCode={generatedCode}
            onLogout={handleLogout}
            onSearchUsers={handleSearchUsers}
            onStartChat={handleStartChat}
            onCreateNewChat={handleCreateNewChat}
            onSelectChat={handleSelectChat}
            onGenerateTempCode={handleGenerateTempCode}
            onJoinWithTempCode={handleJoinWithTempCode}
            onOpenProfileModal={openProfileModal}
          />
        </Box>
        
        {/* Chat Window */}
        <Box 
          flex="1"
          display={{ base: selectedChat ? "flex" : "none", lg: "flex" }}
          height="100%"
          overflow="hidden"
          bg="white"
        >
          <ChatWindow
            selectedChat={selectedChat}
            messages={messages}
            currentUser={user}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            file={file}
            setFile={setFile}
            isLoading={loadingMessages}
            isUploading={isUploading || isSending}
            typingUsers={typingUsers}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onLeaveChat={handleLeaveChat}
            onBackToSidebar={() => setSelectedChat(null)}
          />
        </Box>
        
        <ProfileEditor
          isOpen={isProfileModalOpen}
          onClose={closeProfileModal}
          user={user}
          onUpdateProfile={handleUpdateProfile}
        />
        <Analytics />
        </Box>
      </Box>
    </div>
  );
}

export default App;
