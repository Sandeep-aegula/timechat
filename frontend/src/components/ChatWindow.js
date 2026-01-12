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
            Welcome to TimeChat
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      minHeight: 0,
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header always at the top */}
      <div style={{ flexShrink: 0, background: 'white', zIndex: 5 }}>
        <ChatHeader
          selectedChat={selectedChat}
          onLeaveChat={onLeaveChat}
          onBackToSidebar={onBackToSidebar}
        />
      </div>

      {/* Scrollable chat area */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#f8fafc',
        paddingBottom: 0,
        WebkitOverflowScrolling: 'touch',
      }}>
        <MessageList
          messages={messages}
          currentUser={currentUser}
          isLoading={isLoading}
          typingUsers={typingUsers}
        />
      </div>

      {/* Input always at the bottom */}
      {selectedChat && (
        <div className="chat-input-container" style={{
          flexShrink: 0,
          background: 'white',
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}>
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
        </div>
      )}
    </div>
  );
};

export default ChatWindow;