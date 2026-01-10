import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  Button,
  VStack,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { ArrowBackIcon, DownloadIcon } from '@chakra-ui/icons';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const ChatHeader = ({ selectedChat, onLeaveChat, onBackToSidebar, onGenerateTempCode }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const toast = useToast();

  const handleGenerateCode = async () => {
    try {
      const token = localStorage.getItem('chat_token');
      const { data } = await axios.post(
        `${API_BASE}/api/temp-code/generate`,
        { chatId: selectedChat._id, expiryMinutes: 60 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(data.code);
        toast({
          title: '🔗 Invite Code Generated & Copied!',
          description: `Code: ${data.code} - Share it with others!`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: '🔗 Invite Code Generated!',
          description: `Code: ${data.code} - Share it with others!`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      
      if (onGenerateTempCode) {
        onGenerateTempCode();
      }
    } catch (error) {
      toast({
        title: 'Failed to generate code',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    if (!selectedChat?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expiryTime = new Date(selectedChat.expiresAt);
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedChat?.expiresAt]);

  const handleDownloadChat = async () => {
    try {
      const token = localStorage.getItem('chat_token');
      const response = await axios.get(
        `${API_BASE}/api/chat/${selectedChat._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedChat.chatName.replace(/[^a-z0-9]/gi, '_')}_chat_export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Chat exported successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to download chat',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!selectedChat) {
    return (
      <Box p={{ base: 3, md: 4 }} borderBottomWidth="1px" textAlign="center">
        <Text color="gray.500">Select a chat to start messaging</Text>
      </Box>
    );
  }

  return (
    <Box p={{ base: 3, md: 4 }} borderBottomWidth="1px" bg="white" flexShrink={0}>
      <Flex justify="space-between" align="center">
        <HStack spacing={{ base: 2, md: 3 }}>
          {/* Mobile/Tablet back button - more prominent */}
          <Button
            display={{ base: "flex", lg: "none" }}
            size={{ base: "sm", md: "sm" }}
            variant="solid"
            colorScheme="blue"
            aria-label="Back to chats"
            leftIcon={<ArrowBackIcon boxSize={{ base: 4, md: 4 }} />}
            onClick={onBackToSidebar}
          >
            Chats
          </Button>
          
          <VStack align="start" spacing={0}>
            <Text 
              fontWeight="bold" 
              fontSize={{ base: "md", md: "lg" }}
              isTruncated
              maxW={{ base: "150px", md: "300px" }}
            >
              {selectedChat.chatName}
            </Text>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.600">
                {selectedChat.users?.length || 1} member(s)
              </Text>
              {timeRemaining && (
                <Text 
                  fontSize="xs" 
                  color={timeRemaining === 'Expired' ? 'red.500' : 'orange.500'}
                  fontWeight={timeRemaining === 'Expired' ? 'bold' : 'normal'}
                >
                  {timeRemaining}
                </Text>
              )}
            </VStack>
          </VStack>
        </HStack>
        
        <HStack spacing={{ base: 1, md: 2 }}>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={
                <Icon viewBox="0 0 24 24" boxSize={{ base: 5, md: 6 }}>
                  <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </Icon>
              }
              variant="ghost"
              size={{ base: "sm", md: "md" }}
              aria-label="Chat options"
              _hover={{ bg: "gray.100" }}
            />
            <MenuList minW="200px" zIndex={100}>
              {/* Generate Invite Code - Most important action */}
              <MenuItem 
                icon={
                  <Icon viewBox="0 0 24 24" boxSize={4} color="green.500">
                    <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                  </Icon>
                }
                onClick={handleGenerateCode}
                color="green.600"
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="medium"
                _hover={{ bg: "green.50" }}
              >
                Generate Invite Code
              </MenuItem>
              <MenuDivider />
              <MenuItem 
                icon={<DownloadIcon />} 
                onClick={handleDownloadChat}
                fontSize={{ base: "sm", md: "md" }}
              >
                Download Chat
              </MenuItem>
              <MenuDivider />
              <MenuItem 
                icon={
                  <Icon viewBox="0 0 24 24" boxSize={4} color="red.500">
                    <path fill="currentColor" d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                  </Icon>
                }
                onClick={onLeaveChat}
                color="red.500"
                fontSize={{ base: "sm", md: "md" }}
                _hover={{ bg: "red.50" }}
              >
                Leave Chat
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default ChatHeader;