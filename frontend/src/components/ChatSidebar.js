import React from 'react';
import {
  Box,
  HStack,
  Text,
  VStack,
  Divider,
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Icon,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { EditIcon, ChevronDownIcon } from '@chakra-ui/icons';
import axios from 'axios';
import UserSearch from './UserSearch';
import TempCodeManager from './TempCodeManager';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const ChatSidebar = ({
  user,
  chats,
  selectedChat,
  searchTerm,
  setSearchTerm,
  searchResults,
  tempCodeInput,
  setTempCodeInput,
  generatedCode,
  onLogout,
  onSearchUsers,
  onStartChat,
  onCreateNewChat,
  onSelectChat,
  onGenerateTempCode,
  onJoinWithTempCode,
  onOpenProfileModal,
}) => {
  const toast = useToast();

  const handleGenerateCodeForChat = async (e, chat) => {
    e.stopPropagation(); // Prevent selecting the chat
    
    try {
      const token = localStorage.getItem('chat_token');
      const { data } = await axios.post(
        `${API_BASE}/api/temp-code/generate`,
        { chatId: chat._id, expiryMinutes: 60 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(data.code);
        toast({
          title: '🔗 Code Copied!',
          description: `Invite code for "${chat.chatName}": ${data.code}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: '🔗 Code Generated!',
          description: `Invite code: ${data.code}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to generate code',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box 
      height="100%" 
      display="flex"
      flexDirection="column"
      overflow="hidden"
      p={{ base: 3, md: 4 }}
      bg="gray.50"
      borderRightWidth={{ lg: "1px" }}
      width="100%"
    >
      {/* Fixed User Header */}
      <HStack justify="space-between" flexShrink={0} mb={{ base: 2, md: 3 }}>
        <HStack spacing={{ base: 2, md: 3 }} flex="1">
          <Avatar name={user.name} size={{ base: "sm", md: "md" }} />
          <VStack align="start" spacing={0} flex="1" minW={0}>
            <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} isTruncated>
              {user.name}
            </Text>
            <Text fontSize="xs" color="gray.500" isTruncated>
              {user.email}
            </Text>
          </VStack>
        </HStack>

        {/* Menu for profile and logout */}
        <Menu>
          <MenuButton as={Button} size="sm" variant="ghost" rightIcon={<ChevronDownIcon />}>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<EditIcon />} onClick={onOpenProfileModal}>
              Edit Profile
            </MenuItem>
            <MenuItem onClick={onLogout}>
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      <Divider mb={{ base: 2, md: 3 }} />

      {/* Scrollable Content Area */}
      <Box 
        flex="1" 
        overflowY="auto" 
        overflowX="hidden"
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '2px' },
        }}
      >
        <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
          {/* User Search */}
          <UserSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchResults={searchResults}
            onSearchUsers={onSearchUsers}
            onStartChat={onStartChat}
            onCreateNewChat={onCreateNewChat}
          />

          <Divider />

          {/* Temporary Code Manager - Now scrollable */}
          <Box bg="white" p={{ base: 2, md: 3 }} rounded="md" borderWidth="1px">
            <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} mb={2} color="blue.600">
              🔗 Invite Codes
            </Text>
            <TempCodeManager
              tempCodeInput={tempCodeInput}
              setTempCodeInput={setTempCodeInput}
              generatedCode={generatedCode}
              chatMembers={selectedChat?.users}
              selectedChat={selectedChat}
              chats={chats}
              onGenerateTempCode={onGenerateTempCode}
              onJoinWithTempCode={onJoinWithTempCode}
            />
          </Box>

          <Divider />

          {/* Chat List */}
          <VStack align="stretch" spacing={2}>
            <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>My Chats</Text>
            {chats.length === 0 ? (
              <Box 
                p={{ base: 4, md: 6 }} 
                textAlign="center" 
                borderWidth="1px" 
                borderStyle="dashed"
                rounded="md" 
                bg="gray.100"
              >
                <Text fontSize="sm" color="gray.600" mb={2}>
                  No chats yet! 🚀
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Create your first chat above to get started
                </Text>
              </Box>
            ) : (
              chats.map((chat) => {
                const getTimeRemaining = (expiresAt) => {
                  if (!expiresAt) return null;
                  const now = new Date();
                  const expiryTime = new Date(expiresAt);
                  const diff = expiryTime - now;
                  
                  if (diff <= 0) return 'Expired';
                  
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  
                  if (hours > 0) return `${hours}h ${minutes}m left`;
                  return `${minutes}m left`;
                };
                
                const timeRemaining = getTimeRemaining(chat.expiresAt);
                const isExpiring = timeRemaining && (timeRemaining.includes('m left') || timeRemaining === 'Expired');
                
                return (
                  <Box
                    key={chat._id}
                    p={{ base: 2, md: 3 }}
                    borderWidth="1px"
                    rounded="md"
                    bg={selectedChat?._id === chat._id ? 'blue.50' : 'white'}
                    borderColor={
                      timeRemaining === 'Expired' ? 'red.300' :
                      isExpiring ? 'orange.300' :
                      selectedChat?._id === chat._id ? 'blue.200' : 'gray.200'
                    }
                    cursor="pointer"
                    onClick={() => onSelectChat(chat)}
                    _hover={{ bg: selectedChat?._id === chat._id ? 'blue.100' : 'gray.50' }}
                    transition="all 0.2s"
                    opacity={timeRemaining === 'Expired' ? 0.6 : 1}
                  >
                    <HStack justify="space-between" align="start" width="full">
                      <VStack align="start" spacing={1} flex={1} minW={0}>
                        <HStack justify="space-between" width="full">
                          <Text 
                            fontWeight={selectedChat?._id === chat._id ? "bold" : "medium"} 
                            isTruncated
                            fontSize={{ base: "sm", md: "md" }}
                            color={selectedChat?._id === chat._id ? "blue.700" : "gray.800"}
                            flex={1}
                          >
                            {chat.chatName}
                          </Text>
                          {timeRemaining && (
                            <Text 
                              fontSize="xs" 
                              color={
                                timeRemaining === 'Expired' ? 'red.500' : 
                                isExpiring ? 'orange.500' : 'gray.500'
                              }
                              fontWeight={timeRemaining === 'Expired' ? 'bold' : 'normal'}
                              flexShrink={0}
                            >
                              {timeRemaining}
                            </Text>
                          )}
                        </HStack>
                        {chat.latestMessage && (
                          <Text 
                            fontSize="xs" 
                            color="gray.600" 
                            isTruncated 
                          >
                            {chat.latestMessage.content}
                          </Text>
                        )}
                        <Text fontSize="xs" color="gray.500">
                          {chat.users?.length || 1} member(s)
                        </Text>
                      </VStack>
                      
                      {/* Generate Code Button */}
                      <Tooltip label="Generate Invite Code" placement="top" hasArrow>
                        <IconButton
                          icon={
                            <Icon viewBox="0 0 24 24" boxSize={{ base: 4, md: 5 }}>
                              <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                            </Icon>
                          }
                          size="sm"
                          colorScheme="green"
                          variant="solid"
                          aria-label="Generate invite code"
                          onClick={(e) => handleGenerateCodeForChat(e, chat)}
                          flexShrink={0}
                          ml={2}
                        />
                      </Tooltip>
                    </HStack>
                  </Box>
                );
              })
            )}
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default ChatSidebar;