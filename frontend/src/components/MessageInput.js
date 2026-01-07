import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Input,
  HStack,
  IconButton,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  Icon,
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
  onTyping,
}) => {
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioError, setAudioError] = useState('');

  const MicIcon = (props) => (
    <Icon viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7.002 7.002 0 0 1-6 6.93V21a1 1 0 1 1-2 0v-2.07A7.002 7.002 0 0 1 5 12a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"
      />
    </Icon>
  );

  const StopIcon = (props) => (
    <Icon viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M6 6h12v12H6z" />
    </Icon>
  );
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const stopActiveRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Stop recording error:', err);
      }
    }
  };

  const handleStartRecording = async () => {
    setAudioError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        recordedChunksRef.current = [];

        const fileName = `voice-${Date.now()}.webm`;
        const voiceFile = new File([blob], fileName, { type: 'audio/webm' });
        setFile(voiceFile);

        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      setAudioError(err?.message || 'Unable to access microphone. Please allow mic permissions.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    stopActiveRecording();
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (onTyping) {
      onTyping();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  useEffect(() => {
    return () => {
      stopActiveRecording();
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <VStack 
      spacing={{ base: 1, md: 2 }} 
      p={{ base: 2, md: 4 }} 
      borderTopWidth="1px" 
      bg="white" 
      width="100%"
      pb={{ base: "calc(env(safe-area-inset-bottom, 0px) + 8px)", md: 4 }}
    >
      {audioError && (
        <Alert status="error" size="sm" rounded="md" py={{ base: 1, md: 2 }}>
          <AlertIcon boxSize={{ base: "14px", md: "16px" }} />
          <Text fontSize={{ base: "xs", md: "sm" }} flex="1">
            {audioError}
          </Text>
        </Alert>
      )}

      {file && (
        <Alert status="info" size="sm" rounded="md" py={{ base: 1, md: 2 }}>
          <AlertIcon boxSize={{ base: "14px", md: "16px" }} />
          <Text fontSize={{ base: "xs", md: "sm" }} flex="1" isTruncated>
            📎 {file.name}
          </Text>
          <Button size="xs" ml={2} onClick={() => setFile(null)}>
            Remove
          </Button>
        </Alert>
      )}

      <HStack spacing={{ base: 1, md: 2 }} width="full">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isUploading}
          flex="1"
          bg="gray.50"
          size={{ base: "md", md: "lg" }}
          fontSize={{ base: "16px", md: "md" }}
          _focus={{ bg: 'white', borderColor: 'blue.400' }}
          borderRadius={{ base: "lg", md: "md" }}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
        />

        <IconButton
          aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
          icon={isRecording ? <StopIcon boxSize={{ base: 5, md: 6 }} /> : <MicIcon boxSize={{ base: 5, md: 6 }} />}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isLoading || isUploading}
          variant={isRecording ? 'solid' : 'outline'}
          colorScheme={isRecording ? 'red' : 'blue'}
          size={{ base: "md", md: "lg" }}
          minW={{ base: "40px", md: "48px" }}
        />

        <IconButton
          aria-label="Attach file"
          icon={<AttachmentIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isUploading}
          variant="outline"
          size={{ base: "md", md: "lg" }}
          minW={{ base: "40px", md: "48px" }}
        />
        
        <Button
          onClick={onSendMessage}
          colorScheme="blue"
          disabled={isLoading || isUploading || (!newMessage.trim() && !file)}
          isLoading={isLoading || isUploading}
          loadingText=""
          size={{ base: "md", md: "lg" }}
          px={{ base: 4, md: 6 }}
          minW={{ base: "auto", md: "80px" }}
        >
          <Box display={{ base: "none", sm: "block" }}>Send</Box>
          <Box display={{ base: "block", sm: "none" }}>➤</Box>
        </Button>
      </HStack>
    </VStack>
  );
};

export default MessageInput;