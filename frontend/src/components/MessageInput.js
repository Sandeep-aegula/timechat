import React from 'react';
import {
  Box,
  Button,
  Input,
  HStack,
  IconButton,
  VStack,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';

const MessageInput = ({
  newMessage,
  setNewMessage,
  file,
  setFile,
  isLoading,
  isUploading,
  onSendMessage,
  onGenerateChartCode,
}) => {
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <VStack spacing={3} p={4} borderTopWidth="1px">
      {file && (
        <Alert status="info" size="sm">
          <AlertIcon />
          <Text fontSize="sm">File selected: {file.name}</Text>
          <Button size="xs" ml="auto" onClick={() => setFile(null)}>
            Remove
          </Button>
        </Alert>
      )}

      <HStack spacing={2} width="full">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isUploading}
          flex="1"
        />
        
        <input
          type="file"
          id="file-upload"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        
        <IconButton
          aria-label="Attach file"
          icon={<AttachmentIcon />}
          onClick={() => document.getElementById('file-upload').click()}
          disabled={isLoading || isUploading}
        />
        
        <Button
          onClick={onGenerateChartCode}
          colorScheme="green"
          size="sm"
          disabled={isLoading || isUploading}
        >
          Chart Code
        </Button>
        
        <Button
          onClick={onSendMessage}
          colorScheme="blue"
          disabled={isLoading || isUploading || (!newMessage.trim() && !file)}
          isLoading={isLoading || isUploading}
        >
          Send
        </Button>
      </HStack>
    </VStack>
  );
};

export default MessageInput;