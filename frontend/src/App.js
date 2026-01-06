
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HStack, Box, useToast, useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

// Import our new components
import LoginForm from './components/LoginForm';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import ChartCodeGenerator from './components/ChartCodeGenerator';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const apiClient = axios.create({ baseURL: API_BASE });

function App() {
  const toast = useToast();
  const { isOpen: isChartModalOpen, onOpen: openChartModal, onClose: closeChartModal } = useDisclosure();
  
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
  const socketRef = useRef(null);
  const selectedChatIdRef = useRef(null);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common.Authorization;
    }
  }, [token]);

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

  const handleCreateTestGroup = async () => {
    try {
      const { data } = await apiClient.post('/api/chat/group', {
        name: "Test Group Chat",
        users: [] // Just the current user will be added automatically
      });
      notify('Test group chat created!');
      setChats((prev) => {
        const exists = prev.find((c) => c._id === data._id);
        return exists ? prev : [data, ...prev];
      });
      handleSelectChat(data);
    } catch (err) {
      notify(err.response?.data?.error || 'Could not create test group', 'error');
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

  const joinOrCreateGlobalChat = async () => {
    try {
      // Try to find existing global chat
      const { data: existingChats } = await apiClient.get('/api/chat');
      const globalChat = existingChats.find(chat => 
        chat.chatName === 'Global Chat' && chat.isGroupChat
      );
      
      if (globalChat) {
        // User is already in global chat
        return;
      }
      
      // Try to join existing global chat or create new one
      const { data } = await apiClient.post('/api/chat/join-global');
      notify('Welcome to Global Chat!');
      fetchChats();
    } catch (err) {
      console.log('Global chat setup:', err.message);
      // If global chat doesn't exist, it will be created by backend
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

  const handleGenerateChartCode = () => {
    openChartModal();
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
    <Box display="flex" flexDirection={{ base: "column", lg: "row" }} height="100vh" overflow="hidden">
      {/* Mobile/Tablet: Show sidebar or chat, Desktop: Show both */}
      <Box 
        display={{ base: selectedChat ? "none" : "block", lg: "block" }}
        width={{ base: "100%", lg: "350px" }}
        minWidth={{ lg: "350px" }}
        height={{ base: selectedChat ? "0" : "100vh", lg: "100vh" }}
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
        />
      </Box>
      
      {/* Chat Window */}
      <Box 
        flex="1"
        display={{ base: selectedChat ? "block" : "none", lg: "block" }}
        height="100vh"
        position="relative"
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
          onSendMessage={handleSendMessage}
          onLeaveChat={handleLeaveChat}
          onGenerateChartCode={handleGenerateChartCode}
          onBackToSidebar={() => setSelectedChat(null)} // Add back button for mobile
        />
      </Box>
      
      <ChartCodeGenerator 
        isOpen={isChartModalOpen} 
        onClose={closeChartModal} 
      />
    </Box>
  );
}

export default App;
