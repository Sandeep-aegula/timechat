import React, { useState } from 'react';
import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Text,
  VStack,
  Spinner,
} from '@chakra-ui/react';

const LoginForm = ({ onLogin, onRegister }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = form.get('loginEmail');
    const password = form.get('loginPassword');
    setIsLoggingIn(true);
    try {
      await onLogin({ email, password });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get('regName');
    const email = form.get('regEmail');
    const password = form.get('regPassword');
    setIsRegistering(true);
    try {
      await onRegister({ name, email, password });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Center className="app-shell" px={{ base: 4, md: 6 }}>
      <Box 
        bg="white" 
        p={{ base: 5, md: 8 }} 
        rounded="xl" 
        shadow="2xl" 
        width={{ base: "100%", sm: "400px", md: "480px", lg: "520px" }}
        maxW="100%"
      >
        <VStack spacing={{ base: 4, md: 6 }} mb={{ base: 4, md: 6 }}>
          <Text fontSize={{ base: "3xl", md: "4xl" }}>💬</Text>
          <Heading size={{ base: "lg", md: "xl" }} textAlign="center" color="gray.800">
            TimeChat
          </Heading>
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            color="gray.600" 
            textAlign="center"
          >
            Secure, temporary chat rooms for everyone
          </Text>
        </VStack>
        
        <Tabs variant="enclosed" colorScheme="teal" defaultIndex={0} isFitted>
          <TabList mb={{ base: 3, md: 4 }}>
            <Tab 
              fontSize={{ base: "sm", md: "md" }}
              py={{ base: 2, md: 3 }}
              _selected={{ bg: "teal.50", color: "teal.600", fontWeight: "semibold" }}
            >
              Login
            </Tab>
            <Tab 
              fontSize={{ base: "sm", md: "md" }}
              py={{ base: 2, md: 3 }}
              _selected={{ bg: "teal.50", color: "teal.600", fontWeight: "semibold" }}
            >
              Register
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={{ base: 0, md: 2 }}>
              <form onSubmit={handleLogin}>
                <Stack spacing={{ base: 3, md: 4 }}>
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Email</FormLabel>
                    <Input 
                      name="loginEmail" 
                      type="email" 
                      placeholder="you@example.com" 
                      required 
                      size={{ base: "md", md: "lg" }}
                      fontSize={{ base: "16px", md: "md" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Password</FormLabel>
                    <Input 
                      name="loginPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      size={{ base: "md", md: "lg" }}
                      fontSize={{ base: "16px", md: "md" }}
                    />
                  </FormControl>
                  <Button 
                    colorScheme="teal" 
                    type="submit" 
                    size={{ base: "md", md: "lg" }}
                    fontSize={{ base: "sm", md: "md" }}
                    mt={2}
                    isLoading={isLoggingIn}
                    loadingText="Logging in..."
                    spinner={<Spinner size="sm" />}
                  >
                    Login
                  </Button>
                </Stack>
              </form>
            </TabPanel>
            <TabPanel px={{ base: 0, md: 2 }}>
              <form onSubmit={handleRegister}>
                <Stack spacing={{ base: 3, md: 4 }}>
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Name</FormLabel>
                    <Input 
                      name="regName" 
                      placeholder="Your name" 
                      required 
                      size={{ base: "md", md: "lg" }}
                      fontSize={{ base: "16px", md: "md" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Email</FormLabel>
                    <Input 
                      name="regEmail" 
                      type="email" 
                      placeholder="you@example.com" 
                      required 
                      size={{ base: "md", md: "lg" }}
                      fontSize={{ base: "16px", md: "md" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Password</FormLabel>
                    <Input 
                      name="regPassword" 
                      type="password" 
                      placeholder="Create a password" 
                      required 
                      size={{ base: "md", md: "lg" }}
                      fontSize={{ base: "16px", md: "md" }}
                    />
                  </FormControl>
                  <Button 
                    colorScheme="teal" 
                    type="submit" 
                    size={{ base: "md", md: "lg" }}
                    fontSize={{ base: "sm", md: "md" }}
                    mt={2}
                    isLoading={isRegistering}
                    loadingText="Creating account..."
                    spinner={<Spinner size="sm" />}
                  >
                    Create account
                  </Button>
                </Stack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Center>
  );
};

export default LoginForm;