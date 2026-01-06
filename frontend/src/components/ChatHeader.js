import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Text,
  Button,
  Avatar,
  AvatarGroup,
  Tooltip,
  VStack,
  Flex,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';

const ChatHeader = ({ selectedChat, onLeaveChat, onGenerateChartCode, onBackToSidebar }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

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
          {/* Mobile back button */}
          <IconButton
            display={{ base: "flex", lg: "none" }}
            size="sm"
            variant="ghost"
            aria-label="Back to chats"
            icon={<ArrowBackIcon />}
            onClick={onBackToSidebar}
          />
          
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
          <Button 
            size={{ base: "xs", md: "sm" }} 
            colorScheme="green" 
            onClick={onGenerateChartCode}
          >
            <Text display={{ base: "none", md: "block" }}>Chart Code</Text>
            <Text display={{ base: "block", md: "none" }}>📊</Text>
          </Button>
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