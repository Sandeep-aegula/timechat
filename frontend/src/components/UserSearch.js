import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon } from '@chakra-ui/icons';

const UserSearch = ({ 
  searchTerm, 
  setSearchTerm, 
  searchResults, 
  onSearchUsers, 
  onStartChat,
  onCreateNewChat
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newChatName, setNewChatName] = useState('');
  
  const handleCreateNewChat = async () => {
    if (!newChatName.trim()) return;
    
    try {
      await onCreateNewChat(newChatName.trim());
      setNewChatName('');
      onClose();
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };
  
  return (
    <>
      <VStack spacing={{ base: 2, md: 3 }}>
        {/* Create New Chat Button */}
        <Button 
          size={{ base: "sm", md: "md" }}
          colorScheme="blue" 
          width="full" 
          leftIcon={<AddIcon boxSize={{ base: "10px", md: "12px" }} />}
          onClick={onOpen}
          fontSize={{ base: "sm", md: "md" }}
        >
          Create New Chat
        </Button>
        
        {/* Divider and User Search for Direct Messages */}
        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" textAlign="center">
          Or search to start direct message:
        </Text>
        
        <InputGroup size={{ base: "sm", md: "md" }}>
          <Input
            placeholder="Search users for DM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' ? onSearchUsers() : null}
            fontSize={{ base: "16px", md: "md" }}
          />
          <InputRightElement>
            <IconButton 
              aria-label="Search" 
              size={{ base: "xs", md: "sm" }} 
              onClick={onSearchUsers}
            >
              <SearchIcon boxSize={{ base: "12px", md: "14px" }} />
            </IconButton>
          </InputRightElement>
        </InputGroup>
      </VStack>
      
      {searchResults.length > 0 && (
        <Box 
          borderWidth="1px" 
          rounded="md" 
          p={{ base: 1.5, md: 2 }} 
          maxH={{ base: "120px", md: "160px" }} 
          overflowY="auto"
          mt={2}
        >
          <Text 
            fontWeight="semibold" 
            mb={1} 
            fontSize={{ base: "xs", md: "sm" }}
          >
            Start a chat
          </Text>
          {searchResults.map((u) => (
            <HStack key={u._id} justify="space-between" py={1}>
              <Text 
                fontSize={{ base: "sm", md: "md" }} 
                isTruncated 
                flex={1}
              >
                {u.name}
              </Text>
              <Button 
                size="xs" 
                onClick={() => onStartChat(u._id)}
                fontSize={{ base: "xs", md: "sm" }}
              >
                Chat
              </Button>
            </HStack>
          ))}
        </Box>
      )}
      
      {/* Create New Chat Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "xs", md: "md" }} isCentered>
        <ModalOverlay />
        <ModalContent mx={{ base: 4, md: 0 }}>
          <ModalHeader fontSize={{ base: "lg", md: "xl" }}>
            Create Your Chat
          </ModalHeader>
          <ModalBody>
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" mb={3}>
              Create a new chat room. You'll be the only member initially, 
              then you can generate a code to invite others to join.
            </Text>
            <Input
              placeholder="Enter chat name"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' ? handleCreateNewChat() : null}
              fontSize={{ base: "16px", md: "md" }}
              size={{ base: "md", md: "lg" }}
            />
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onClose}
              size={{ base: "sm", md: "md" }}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCreateNewChat}
              isDisabled={!newChatName.trim()}
              size={{ base: "sm", md: "md" }}
            >
              Create My Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserSearch;