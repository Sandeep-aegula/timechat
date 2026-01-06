import React from 'react';
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';

const TempCodeManager = ({ 
  tempCodeInput, 
  setTempCodeInput, 
  generatedCode, 
  chatMembers,
  selectedChat,
  chats,
  onGenerateTempCode, 
  onJoinWithTempCode 
}) => {
  const toast = useToast();

  const handleJoinChat = () => {
    if (chatMembers && chatMembers.length >= 50) {
      toast({
        title: "Chat is full",
        description: "This chat has reached the maximum limit of 50 members.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onJoinWithTempCode();
  };

  return (
    <VStack spacing={{ base: 2, md: 3 }}>
      <Button 
        onClick={onGenerateTempCode} 
        colorScheme={selectedChat ? "blue" : "gray"} 
        width="full"
        size={{ base: "sm", md: "md" }}
        isDisabled={!selectedChat}
      >
        <Text fontSize={{ base: "xs", md: "sm" }} textAlign="center">
          {selectedChat 
            ? `Generate Invite Code for "${selectedChat.chatName}"` 
            : 'Create a Chat First to Generate Code'
          }
        </Text>
      </Button>
      
      {!selectedChat && (
        <Box borderWidth="1px" rounded="md" p={3} bg="yellow.50" width="full">
          <Text fontSize="sm" color="orange.700" textAlign="center" fontWeight="medium">
            📝 Step 1: Click "Create New Chat" above
          </Text>
          <Text fontSize="sm" color="orange.700" textAlign="center">
            📋 Step 2: Select your chat from the list
          </Text>
          <Text fontSize="sm" color="orange.700" textAlign="center">
            🔗 Step 3: Generate invite code to share
          </Text>
        </Box>
      )}
      
      {generatedCode && selectedChat && (
        <Box borderWidth="2px" rounded="md" p={4} bg="green.50" borderColor="green.200" width="full">
          <Text fontWeight="bold" fontSize="md" color="green.700" textAlign="center">🎉 Invite Code Ready!</Text>
          <Text fontFamily="mono" fontSize="xl" mt={2} bg="white" p={3} rounded="md" textAlign="center" fontWeight="bold">
            {generatedCode.code}
          </Text>
          <Text fontSize="sm" color="green.600" mt={2} textAlign="center" fontWeight="medium">
            Share this code with friends to join "{generatedCode.chatName}"
          </Text>
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
            Expires: {new Date(generatedCode.expiresAt).toLocaleTimeString()}
          </Text>
        </Box>
      )}
      
      {/* Divider */}
      <Box width="full" textAlign="center" py={2}>
        <Text fontSize="sm" color="gray.400" fontWeight="medium">OR</Text>
      </Box>
      
      {/* Join someone else's chat */}
      <Text fontSize="sm" color="gray.700" fontWeight="medium" textAlign="center">
        Join Someone Else's Chat:
      </Text>
      
      <InputGroup>
        <Input
          placeholder="Enter invite code from a friend"
          value={tempCodeInput}
          onChange={(e) => setTempCodeInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' ? handleJoinChat() : null}
        />
        <InputRightElement width="4.5rem">
          <Button h="1.75rem" size="sm" onClick={handleJoinChat}>
            Join
          </Button>
        </InputRightElement>
      </InputGroup>
      
      {selectedChat && (
        <Box borderWidth="1px" rounded="md" p={2} bg="blue.50" width="full">
          <Text fontSize="sm" color="blue.700" textAlign="center" fontWeight="medium">
            📱 Current: {selectedChat.chatName}
          </Text>
          <Text fontSize="xs" color="blue.600" textAlign="center">
            {selectedChat.users?.length || 1} member(s) • Max 50 members
          </Text>
        </Box>
      )}
      
      {!selectedChat && chats && chats.length > 0 && (
        <Text fontSize="sm" color="blue.600" textAlign="center">
          👆 Select a chat above to generate its invite code
        </Text>
      )}
    </VStack>
  );
};

export default TempCodeManager;