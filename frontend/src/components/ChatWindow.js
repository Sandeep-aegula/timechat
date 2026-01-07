import React from 'react';
import { Box, VStack, Flex, Text, Button } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({
  selectedChat,
  messages,
  currentUser,
  newMessage,
  setNewMessage,
  file,
  setFile,
  isLoading,
  isUploading,
  typingUsers = [],
  onSendMessage,
  onTyping,
  onLeaveChat,
  onBackToSidebar,
}) => {
  if (!selectedChat) {
    return (
      <Flex 
        align="center" 
        justify="center" 
        height="100vh" 
        bg="gray.100"
        p={{ base: 4, md: 8 }}
      >
        <VStack spacing={4} textAlign="center" maxW="md">
          <Box fontSize={{ base: "4xl", md: "6xl" }}>💬</Box>
          <Text 
            fontSize={{ base: "lg", md: "xl" }} 
            fontWeight="bold" 
            color="gray.700"
          >
            Welcome to MERN Chat!
          </Text>
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            color="gray.600" 
            textAlign="center"
          >
            Create a new chat or select an existing one to start messaging.
          </Text>
          {/* Mobile: Show button to go back to sidebar */}
          <Button 
            display={{ base: "block", lg: "none" }}
            colorScheme="blue"
            onClick={onBackToSidebar}
            leftIcon={<ArrowBackIcon />}
          >
            Back to Chats
          </Button>
        </VStack>
      </Flex>
    );
  }

  return (
    <VStack spacing={0} height="100vh" flex="1">
      <ChatHeader
        selectedChat={selectedChat}
        onLeaveChat={onLeaveChat}
        onBackToSidebar={onBackToSidebar}
      />
      
      <Box flex="1" overflowY="auto" css={{
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '3px' },
      }}>
        <MessageList
          messages={messages}
          currentUser={currentUser}
          isLoading={isLoading}
          typingUsers={typingUsers}
        />
      </Box>
      
      {selectedChat && (
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          file={file}
          setFile={setFile}
          isLoading={isLoading}
          isUploading={isUploading}
          onSendMessage={onSendMessage}
          onTyping={onTyping}
        />
      )}
    </VStack>
  );
};

export default ChatWindow;