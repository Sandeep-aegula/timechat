import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Link,
  Image,
} from '@chakra-ui/react';

const MessageList = ({ messages, currentUser, isLoading }) => {
  const isMyMessage = (message) => message.sender._id === currentUser._id;

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Box flex="1" p={4} display="flex" alignItems="center" justifyContent="center">
        <Text>Loading messages...</Text>
      </Box>
    );
  }

  return (
    <Box flex="1" p={4} overflowY="auto">
      <VStack spacing={3} align="stretch">
        {messages.map((message) => (
          <HStack
            key={message._id}
            justify={isMyMessage(message) ? 'flex-end' : 'flex-start'}
            align="flex-start"
          >
            {!isMyMessage(message) && (
              <Avatar name={message.sender.name} size="sm" />
            )}
            
            <Box
              maxW="70%"
              bg={isMyMessage(message) ? 'blue.500' : 'gray.200'}
              color={isMyMessage(message) ? 'white' : 'black'}
              rounded="lg"
              p={3}
            >
              {!isMyMessage(message) && (
                <Text fontSize="xs" fontWeight="semibold" mb={1}>
                  {message.sender.name}
                </Text>
              )}
              
              {message.content && (
                <Text>{message.content}</Text>
              )}
              
              {message.file && (
                <Box mt={2}>
                  {message.file.includes('.jpg') || 
                   message.file.includes('.jpeg') || 
                   message.file.includes('.png') || 
                   message.file.includes('.gif') ? (
                    <Image
                      src={`http://localhost:5000${message.file}`}
                      alt="Shared file"
                      maxW="200px"
                      rounded="md"
                    />
                  ) : (
                    <Link
                      href={`http://localhost:5000${message.file}`}
                      isExternal
                      color={isMyMessage(message) ? 'white' : 'blue.500'}
                      textDecoration="underline"
                    >
                      📎 View file
                    </Link>
                  )}
                </Box>
              )}
              
              <Text fontSize="xs" mt={2} opacity={0.8}>
                {formatTime(message.createdAt)}
              </Text>
            </Box>
            
            {isMyMessage(message) && (
              <Avatar name={message.sender.name} size="sm" />
            )}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

export default MessageList;