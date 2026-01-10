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
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon, ChevronDownIcon, DownloadIcon } from '@chakra-ui/icons';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const ChatHeader = ({ selectedChat, onLeaveChat, onBackToSidebar }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const toast = useToast();

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
        
        <HStack spacing={1}>
          <Menu>
            <MenuButton
              as={Button}
              size={{ base: "xs", md: "sm" }}
              variant="outline"
              rightIcon={<ChevronDownIcon />}
            >
              <Text display={{ base: "none", md: "block" }}>Options</Text>
              <Text display={{ base: "block", md: "none" }}>⋮</Text>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<DownloadIcon />} onClick={handleDownloadChat}>
                Download Chat History
              </MenuItem>
            </MenuList>
          </Menu>
          <Button 
            size={{ base: "xs", md: "sm" }} 
            colorScheme="red" 
            onClick={onLeaveChat}
          >
            <Text display={{ base: "none", md: "block" }}>Leave</Text>
            <Text display={{ base: "block", md: "none" }}>🚪</Text>
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default ChatHeader;