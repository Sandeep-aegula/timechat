import React from 'react';
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
} from '@chakra-ui/react';

const LoginForm = ({ onLogin, onRegister }) => {
  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = form.get('loginEmail');
    const password = form.get('loginPassword');
    onLogin({ email, password });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get('regName');
    const email = form.get('regEmail');
    const password = form.get('regPassword');
    onRegister({ name, email, password });
  };

  return (
    <Center className="app-shell">
      <Box bg="white" p={8} rounded="md" shadow="xl" width="560px">
        <Heading size="lg" mb={6}>MERN Chat</Heading>
        <Tabs variant="enclosed" colorScheme="teal" defaultIndex={0}>
          <TabList>
            <Tab>Login</Tab>
            <Tab>Register</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <form onSubmit={handleLogin}>
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input name="loginEmail" type="email" placeholder="you@example.com" required />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input name="loginPassword" type="password" placeholder="••••••••" required />
                  </FormControl>
                  <Button colorScheme="teal" type="submit">Login</Button>
                </Stack>
              </form>
            </TabPanel>
            <TabPanel>
              <form onSubmit={handleRegister}>
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel>Name</FormLabel>
                    <Input name="regName" placeholder="Your name" required />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input name="regEmail" type="email" placeholder="you@example.com" required />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input name="regPassword" type="password" placeholder="Create a password" required />
                  </FormControl>
                  <Button colorScheme="teal" type="submit">Create account</Button>
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