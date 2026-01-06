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
      <VStack spacing={3}>
        {/* Create New Chat Button */}
        <Button 
          size="sm" 
          colorScheme="blue" 
          width="full" 
          leftIcon={<AddIcon />}
          onClick={onOpen}
        >
          Create New Chat
        </Button>
        
        {/* Divider and User Search for Direct Messages */}
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Or search to start direct message:
        </Text>
        
        <InputGroup>
          <Input
            placeholder="Search users for DM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' ? onSearchUsers() : null}
          />
          <InputRightElement>
            <IconButton aria-label="Search" size="sm" onClick={onSearchUsers}>
              <SearchIcon />
            </IconButton>
          </InputRightElement>
        </InputGroup>
      </VStack>
      
      {searchResults.length > 0 && (
        <Box borderWidth="1px" rounded="md" p={2} maxH="160px" overflowY="auto">
          <Text fontWeight="semibold" mb={1}>Start a chat</Text>
          {searchResults.map((u) => (
            <HStack key={u._id} justify="space-between" py={1}>
              <Text>{u.name}</Text>
              <Button size="xs" onClick={() => onStartChat(u._id)}>Chat</Button>
            </HStack>
          ))}
        </Box>
      )}
      
      {/* Create New Chat Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Your Chat</ModalHeader>
          <ModalBody>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Create a new chat room. You'll be the only member initially, 
              then you can generate a code to invite others to join.
            </Text>
            <Input
              placeholder="Enter chat name (e.g., 'Study Group', 'Gaming Squad')"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' ? handleCreateNewChat() : null}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCreateNewChat}
              isDisabled={!newChatName.trim()}
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