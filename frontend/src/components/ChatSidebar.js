import React from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  VStack,
  Divider,
  Avatar,
  Flex,
  Badge,
} from '@chakra-ui/react';
import UserSearch from './UserSearch';
import TempCodeManager from './TempCodeManager';

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
}) => {
  return (
    <Box 
      height="100vh" 
      overflowY="auto"
      p={{ base: 3, md: 4 }}
      bg="gray.50"
      borderRightWidth={{ lg: "1px" }}
    >
      <VStack align="stretch" spacing={{ base: 3, md: 4 }} height="full">
        {/* User info */}
        <HStack justify="space-between" flexShrink={0}>
          <HStack spacing={{ base: 2, md: 3 }}>
            <Avatar name={user.name} size={{ base: "sm", md: "md" }} />
            <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} isTruncated>
              {user.name}
            </Text>
          </HStack>
          <Text 
            fontSize={{ base: "xs", md: "sm" }} 
            color="blue.500" 
            cursor="pointer" 
            onClick={onLogout}
            flexShrink={0}
          >
            Logout
          </Text>
        </HStack>

        <Divider />

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

        {/* Temporary Code Manager */}
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

        <Divider />

        {/* Chat List */}
        <VStack align="stretch" spacing={2} flex="1" minHeight={0}>
          <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>My Chats</Text>
          <Box flex="1" overflowY="auto" minHeight={0}>
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
                    <VStack align="start" spacing={1}>
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
                  </Box>
                );
              })
            )}
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
};

export default ChatSidebar;