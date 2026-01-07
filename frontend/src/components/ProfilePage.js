import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Avatar,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Divider,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { ArrowBackIcon, EditIcon } from '@chakra-ui/icons';

const ProfilePage = ({ user, onUpdate, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
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
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate({ name: name.trim() });
      toast({
        title: 'Profile updated!',
        description: 'Your name has been changed successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
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

  return (
    <Box
      width="full"
      height="100vh"
      bg="white"
      p={{ base: 4, md: 6 }}
      overflowY="auto"
    >
      {/* Header */}
      <HStack spacing={3} mb={6}>
        <IconButton
          icon={<ArrowBackIcon />}
          variant="ghost"
          onClick={onBack}
          size={{ base: 'sm', md: 'md' }}
        />
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
          My Profile
        </Text>
      </HStack>

      {/* Profile Content */}
      <VStack
        spacing={{ base: 4, md: 6 }}
        align={{ base: 'stretch', md: 'center' }}
        maxW={{ base: 'full', md: '600px' }}
        mx={{ base: 0, md: 'auto' }}
      >
        {/* Avatar Section */}
        <VStack spacing={3} align="center">
          <Avatar
            name={name || user?.name}
            size={{ base: 'xl', md: '2xl' }}
            bg="blue.500"
          />
          <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">
            Avatar generated from your name
          </Text>
        </VStack>

        <Divider />

        {/* Profile Fields */}
        <VStack spacing={4} width="full" align="stretch">
          {/* Display Name */}
          <FormControl>
            <HStack justify="space-between" mb={2}>
              <FormLabel margin={0} fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                Display Name
              </FormLabel>
              {!isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </HStack>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                size={{ base: 'md', md: 'lg' }}
                fontSize={{ base: '16px', md: 'md' }}
                autoFocus
              />
            ) : (
              <Box
                p={3}
                bg="gray.50"
                rounded="md"
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight="medium"
                color="gray.800"
              >
                {user?.name}
              </Box>
            )}
          </FormControl>

          {/* Email (Read-only) */}
          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
              Email Address
            </FormLabel>
            <Box
              p={3}
              bg="gray.50"
              rounded="md"
              fontSize={{ base: 'sm', md: 'md' }}
              color="gray.600"
            >
              {user?.email}
            </Box>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Email cannot be changed
            </Text>
          </FormControl>

          {/* Account Info */}
          <VStack align="stretch" spacing={2}>
            <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="gray.700">
              Account Information
            </Text>
            <HStack justify="space-between">
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600">
                Member Since
              </Text>
              <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </HStack>
          </VStack>
        </VStack>

        <Divider />

        {/* Action Buttons */}
        {isEditing && (
          <HStack spacing={3} width="full" justify="flex-end">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setName(user?.name || '');
              }}
              size={{ base: 'sm', md: 'md' }}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={isLoading}
              loadingText="Saving..."
              size={{ base: 'sm', md: 'md' }}
              isDisabled={!name.trim() || name.trim() === user?.name}
            >
              Save Changes
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default ProfilePage;
