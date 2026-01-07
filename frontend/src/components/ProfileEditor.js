import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Avatar,
  Text,
  useToast,
  Box,
  Divider,
} from '@chakra-ui/react';

const ProfileEditor = ({ isOpen, onClose, user, onUpdateProfile }) => {
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name is required',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (name.trim() === user?.name) {
      toast({
        title: 'No changes made',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateProfile({ name: name.trim() });
      toast({
        title: 'Profile updated!',
        description: 'Your name has been changed successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: error.message || 'Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset name when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setName(user?.name || '');
    }
  }, [isOpen, user?.name]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={{ base: "xs", md: "md" }} 
      isCentered
    >
      <ModalOverlay />
      <ModalContent mx={{ base: 4, md: 0 }}>
        <ModalHeader fontSize={{ base: "lg", md: "xl" }}>
          Edit Profile
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="center">
            {/* Avatar Preview */}
            <Avatar 
              name={name || user?.name} 
              size={{ base: "xl", md: "2xl" }}
              bg="blue.500"
            />
            
            <Text 
              fontSize={{ base: "xs", md: "sm" }} 
              color="gray.500"
              textAlign="center"
            >
              Your avatar is generated from your name
            </Text>
            
            <Divider />
            
            {/* Name Field */}
            <FormControl>
              <FormLabel fontSize={{ base: "sm", md: "md" }}>
                Display Name
              </FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                size={{ base: "md", md: "lg" }}
                fontSize={{ base: "16px", md: "md" }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </FormControl>
            
            {/* Email (Read-only) */}
            <FormControl>
              <FormLabel fontSize={{ base: "sm", md: "md" }}>
                Email
              </FormLabel>
              <Box
                p={3}
                bg="gray.100"
                rounded="md"
                fontSize={{ base: "sm", md: "md" }}
                color="gray.600"
              >
                {user?.email}
              </Box>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Email cannot be changed
              </Text>
            </FormControl>
          </VStack>
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
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Saving..."
            size={{ base: "sm", md: "md" }}
            isDisabled={!name.trim()}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProfileEditor;
