import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Code,
  Box,
  useClipboard,
  useToast,
} from '@chakra-ui/react';

const ChartCodeGenerator = ({ isOpen, onClose }) => {
  const toast = useToast();
  
  const sampleChartCode = `// React Chart.js Example
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Sample Chart',
    },
  },
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

const data = {
  labels,
  datasets: [
    {
      label: 'Dataset 1',
      data: [65, 59, 80, 81, 56, 55, 40],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
    },
    {
      label: 'Dataset 2',
      data: [28, 48, 40, 19, 86, 27, 90],
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.2)',
    },
  ],
};

export function LineChart() {
  return <Line options={options} data={data} />;
}`;

  const { hasCopied, onCopy } = useClipboard(sampleChartCode);

  const handleCopy = () => {
    onCopy();
    toast({
      title: "Code copied!",
      description: "Chart code has been copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Chart Code Generator</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Here's a sample React Chart.js component you can use in your project:
            </Text>
            
            <Box
              bg="gray.50"
              p={4}
              rounded="md"
              overflowX="auto"
              maxHeight="400px"
              overflowY="auto"
            >
              <Code
                display="block"
                whiteSpace="pre-wrap"
                fontSize="sm"
                p={0}
                bg="transparent"
              >
                {sampleChartCode}
              </Code>
            </Box>
            
            <Text fontSize="sm" color="gray.600">
              To use this code, install the required dependencies:
            </Text>
            
            <Box bg="gray.100" p={3} rounded="md">
              <Code fontSize="sm" bg="transparent">
                npm install react-chartjs-2 chart.js
              </Code>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleCopy}>
            {hasCopied ? 'Copied!' : 'Copy Code'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChartCodeGenerator;