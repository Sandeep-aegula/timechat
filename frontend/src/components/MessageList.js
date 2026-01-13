import React, { useEffect, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Link,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const MessageList = ({ messages, currentUser, isLoading, typingUsers = [] }) => {
  const messagesEndRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [preview, setPreview] = React.useState(null);

  const isMyMessage = (message) => {
    const senderId = message.sender?._id || message.sender;
    const userId = currentUser?._id || currentUser?.id;
    return senderId === userId;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Ensure messages is always an array to prevent runtime errors
  const safeMessages = Array.isArray(messages) ? messages : (messages?.messages || []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages.length]);

  if (isLoading) {
    return (
      <Box 
        flex="1" 
        p={{ base: 3, md: 4 }} 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <Text fontSize={{ base: "sm", md: "md" }}>Loading messages...</Text>
      </Box>
    );
  }

  return (
    <Box flex="1" p={{ base: 2, md: 4 }} bg="gray.50" position="relative">
      <VStack spacing={{ base: 2, md: 3 }} align="stretch">
        {safeMessages.map((message) => {
          const isMine = isMyMessage(message);
          let fileUrl = message.fileUrl || message.file;
          // Use fileUrl as-is if it's an absolute URL (e.g., Cloudinary), otherwise prepend API_BASE
          if (fileUrl && !/^https?:\/\//i.test(fileUrl)) {
            fileUrl = `${API_BASE}${fileUrl}`;
          }
          const isImage = fileUrl && (
            /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl) ||
            message.fileType?.startsWith('image/')
          );
          const isVideo = fileUrl && (
            /\.(mp4|webm|ogg|3gp|mkv)$/i.test(fileUrl) ||
            message.fileType?.startsWith('video/')
          );
          const isAudio = fileUrl && (
            /\.(webm|wav|mp3|ogg)$/i.test(fileUrl) ||
            message.fileType?.startsWith('audio/')
          );
          return (
            <HStack
              key={message._id}
              justify={isMine ? 'flex-end' : 'flex-start'}
              align="flex-start"
              px={{ base: 1, md: 0 }}
            >
              {!isMine && (
                <Avatar
                  name={message.sender?.name || 'User'}
                  src={message.sender?.avatar}
                  size={{ base: "xs", md: "sm" }}
                  display={{ base: "none", sm: "block" }}
                />
              )}
              <Box
                maxW={{ base: "90%", sm: "85%", md: "80%" }}
                bg={isMine ? 'blue.500' : 'white'}
                color={isMine ? 'white' : 'gray.800'}
                rounded="lg"
                p={{ base: 2, md: 3 }}
                shadow="sm"
                borderWidth={isMine ? 0 : 1}
                borderColor="gray.200"
                className="animate-fade-in"
              >
                {!isMine && message.sender?.name && (
                  <Text
                    fontSize={{ base: "2xs", md: "xs" }}
                    fontWeight="semibold"
                    mb={1}
                    color="blue.600"
                  >
                    {message.sender.name}
                  </Text>
                )}
                {message.content && (
                  <Text
                    wordBreak="break-word"
                    fontSize={{ base: "sm", md: "md" }}
                    className="message-content"
                  >
                    {message.content}
                  </Text>
                )}
                {fileUrl && (
                  <Box mt={message.content ? 2 : 0}>
                    {isImage ? (
                      <Image
                        src={fileUrl}
                        alt={message.fileName || 'Shared image'}
                        maxW={{ base: "150px", md: "200px" }}
                        maxH={{ base: "200px", md: "300px" }}
                        rounded="md"
                        cursor="pointer"
                        onClick={() => {
                          setPreview({ type: 'image', src: fileUrl });
                          onOpen();
                        }}
                        objectFit="cover"
                      />
                    ) : isVideo ? (
                      // Video controller: renders video player for video messages (e.g., mp4, webm, etc.)
                      <Box>
                        <video
                          src={fileUrl}
                          style={{ maxWidth: '200px', maxHeight: '250px', borderRadius: '8px', background: '#000', cursor: 'pointer' }}
                          controls
                          preload="metadata"
                          onClick={() => {
                            setPreview({ type: 'video', src: fileUrl });
                            onOpen();
                          }}
                        />
                        <Text fontSize="xs" mt={1} opacity={0.7}>
                          {message.fileName || 'Video'}
                        </Text>
                      </Box>
                    ) : isAudio ? (
                      <Box>
                        <audio
                          controls
                          style={{
                            maxWidth: '100%',
                            borderRadius: '6px',
                            backgroundColor: isMine ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            padding: '4px',
                            outline: 'none'
                          }}
                          preload="metadata"
                        >
                          <source src={`${API_BASE}${fileUrl}`} type={message.fileType || 'audio/webm'} />
                          Your browser does not support the audio element.
                        </audio>
                        <Text fontSize="xs" mt={1} opacity={0.7}>
                          {message.fileName || 'Voice message'}
                        </Text>
                      </Box>
                    ) : (
                      <Link
                        href={`${API_BASE}${fileUrl}`}
                        isExternal
                        color={isMine ? 'white' : 'blue.500'}
                        textDecoration="underline"
                        fontWeight="medium"
                        fontSize={{ base: "sm", md: "md" }}
                      >
                        📎 {message.fileName || 'Download file'}
                      </Link>
                    )}
                  </Box>
                )}
                <Text
                  fontSize={{ base: "2xs", md: "xs" }}
                  mt={{ base: 1, md: 2 }}
                  opacity={0.7}
                  textAlign="right"
                >
                  {formatTime(message.createdAt)}
                </Text>
              </Box>
              {isMine && (
                <Avatar
                  name={message.sender?.name || currentUser?.name || 'Me'}
                  src={message.sender?.avatar || currentUser?.avatar}
                  size={{ base: "xs", md: "sm" }}
                  display={{ base: "none", sm: "block" }}
                />
              )}
            </HStack>
          );
        })}
        {typingUsers.length > 0 && (
          <HStack align="flex-start" py={2} px={{ base: 1, md: 0 }}>
            <Box
              bg="gray.200"
              rounded="lg"
              px={{ base: 3, md: 4 }}
              py={2}
            >
              <HStack spacing={1}>
                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  color="gray.600"
                  fontStyle="italic"
                >
                  {typingUsers.length === 1
                    ? `${typingUsers[0].userName} is typing`
                    : `${typingUsers.map(u => u.userName).join(', ')} are typing`
                  }
                </Text>
                <Box display="flex" alignItems="center" gap="2px" ml={1}>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </Box>
              </HStack>
            </Box>
          </HStack>
        )}
        <div ref={messagesEndRef} />
      </VStack>
      {/* Preview Modal for images and videos */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.900">
          <ModalCloseButton color="white" />
          <ModalBody p={0} display="flex" alignItems="center" justifyContent="center">
            {preview?.type === 'image' && (
              <Image src={preview.src} alt="Preview" maxW="100%" maxH="80vh" objectFit="contain" />
            )}
            {preview?.type === 'video' && (
              <video src={preview.src} controls style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', background: '#000' }} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MessageList;