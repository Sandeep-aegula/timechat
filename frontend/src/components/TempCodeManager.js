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
        whiteSpace="normal"
        height="auto"
        py={{ base: 2, md: 3 }}
      >
        <Text fontSize={{ base: "xs", md: "sm" }} textAlign="center">
          {selectedChat 
            ? `Generate Invite Code` 
            : 'Create a Chat First'
          }
        </Text>
      </Button>
      
      {!selectedChat && (
        <Box 
          borderWidth="1px" 
          rounded="md" 
          p={{ base: 2, md: 3 }} 
          bg="yellow.50" 
          width="full"
        >
          <VStack spacing={1}>
            <Text fontSize={{ base: "xs", md: "sm" }} color="orange.700" textAlign="center" fontWeight="medium">
              📝 Create a chat above
            </Text>
            <Text fontSize={{ base: "xs", md: "sm" }} color="orange.700" textAlign="center">
              📋 Select it from the list
            </Text>
            <Text fontSize={{ base: "xs", md: "sm" }} color="orange.700" textAlign="center">
              🔗 Generate invite code
            </Text>
          </VStack>
        </Box>
      )}
      
      {generatedCode && selectedChat && (
        <Box 
          borderWidth="2px" 
          rounded="md" 
          p={{ base: 3, md: 4 }} 
          bg="green.50" 
          borderColor="green.200" 
          width="full"
        >
          <Text 
            fontWeight="bold" 
            fontSize={{ base: "sm", md: "md" }} 
            color="green.700" 
            textAlign="center"
          >
            🎉 Invite Code Ready!
          </Text>
          <Text 
            fontFamily="mono" 
            fontSize={{ base: "lg", md: "xl" }} 
            mt={2} 
            bg="white" 
            p={{ base: 2, md: 3 }} 
            rounded="md" 
            textAlign="center" 
            fontWeight="bold"
            letterSpacing="wider"
          >
            {generatedCode.code}
          </Text>
          <Text 
            fontSize={{ base: "xs", md: "sm" }} 
            color="green.600" 
            mt={2} 
            textAlign="center" 
            fontWeight="medium"
            noOfLines={2}
          >
            Share to join "{generatedCode.chatName}"
          </Text>
          <Text 
            fontSize={{ base: "2xs", md: "xs" }} 
            color="gray.500" 
            textAlign="center" 
            mt={1}
          >
            Expires: {new Date(generatedCode.expiresAt).toLocaleTimeString()}
          </Text>
        </Box>
      )}
      
      {/* Divider */}
      <Box width="full" textAlign="center" py={{ base: 1, md: 2 }}>
        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.400" fontWeight="medium">
          OR
        </Text>
      </Box>
      
      {/* Join someone else's chat */}
      <Text 
        fontSize={{ base: "xs", md: "sm" }} 
        color="gray.700" 
        fontWeight="medium" 
        textAlign="center"
      >
        Join Someone Else's Chat:
      </Text>
      
      <InputGroup size={{ base: "sm", md: "md" }}>
        <Input
          placeholder="Enter invite code"
          value={tempCodeInput}
          onChange={(e) => setTempCodeInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' ? handleJoinChat() : null}
          fontSize={{ base: "16px", md: "md" }}
          textTransform="uppercase"
          letterSpacing="wide"
        />
        <InputRightElement width={{ base: "3.5rem", md: "4.5rem" }}>
          <Button 
            h={{ base: "1.5rem", md: "1.75rem" }} 
            size="sm" 
            onClick={handleJoinChat}
            fontSize={{ base: "xs", md: "sm" }}
          >
            Join
          </Button>
        </InputRightElement>
      </InputGroup>
      
      {selectedChat && (
        <Box 
          borderWidth="1px" 
          rounded="md" 
          p={2} 
          bg="blue.50" 
          width="full"
        >
          <Text 
            fontSize={{ base: "xs", md: "sm" }} 
            color="blue.700" 
            textAlign="center" 
            fontWeight="medium"
            noOfLines={1}
          >
            📱 {selectedChat.chatName}
          </Text>
          <Text 
            fontSize={{ base: "2xs", md: "xs" }} 
            color="blue.600" 
            textAlign="center"
          >
            {selectedChat.users?.length || 1}/50 members
          </Text>
        </Box>
      )}
      
      {!selectedChat && chats && chats.length > 0 && (
        <Text 
          fontSize={{ base: "xs", md: "sm" }} 
          color="blue.600" 
          textAlign="center"
        >
          👆 Select a chat to generate its code
        </Text>
      )}
    </VStack>
  );
};

export default TempCodeManager;