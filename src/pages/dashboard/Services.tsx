import React, { useState } from 'react';
import { Card, Text, Checkbox, Button, Badge, Stack, Group, Box, Title, Paper } from '@mantine/core';
import { IconBriefcase, IconSearch, IconUsers, IconCheck } from '@tabler/icons-react';
import PaymentModal from '@/components/payment/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useMediaQuery } from '@mantine/hooks';

interface ServiceOption { id: string; name: string; description: string; price: number; icon: React.ReactNode; available: boolean; }

const services: ServiceOption[] = [
  { id: 'post_requirements', name: 'Post Requirements', description: 'Post job descriptions and receive applications from qualified candidates', price: 499, icon: <IconBriefcase size={24} />, available: true },
  { id: 'resume_database', name: 'Resume Database Access', description: 'Access our extensive database of pre-screened candidates', price: 999, icon: <IconSearch size={24} />, available: false },
  { id: 'candidate_screening', name: 'Candidate Screening', description: 'AI-powered candidate screening and shortlisting service', price: 1499, icon: <IconUsers size={24} />, available: false },
];

const Services: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { user } = useAuth();
  const { addPaymentRequest } = useAppData();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };

  const totalAmount = selectedServices.reduce((sum, id) => sum + (services.find(s => s.id === id)?.price || 0), 0);

  const handleProceed = () => { if (selectedServices.length > 0) setPaymentModalOpen(true); };

  const handlePaymentSubmit = () => {
    if (user) {
      selectedServices.forEach(serviceId => {
        addPaymentRequest({ userId: user.id, userName: user.name, userEmail: user.email, type: 'service', serviceId, amount: services.find(s => s.id === serviceId)?.price || 0 });
      });
    }
    setSelectedServices([]);
    setPaymentModalOpen(false);
  };

  return (
    <Box maw={800} mx="auto">
      <Box mb="xl">
        <Title order={2}>Services</Title>
        <Text c="dimmed" size="sm">Select the services you need for your recruitment</Text>
      </Box>

      <Stack gap="md" mb="xl">
        {services.map((service) => (
          <Card 
            key={service.id} 
            shadow="sm" 
            padding={isMobile ? 'md' : 'lg'} 
            withBorder 
            style={{ 
              opacity: service.available ? 1 : 0.6, 
              borderColor: selectedServices.includes(service.id) ? '#0078D4' : undefined 
            }}
          >
            <Stack gap="sm">
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Group gap="md" wrap="nowrap">
                  <Checkbox 
                    checked={selectedServices.includes(service.id)} 
                    onChange={() => service.available && handleServiceToggle(service.id)} 
                    disabled={!service.available} 
                  />
                  <Box 
                    w={isMobile ? 40 : 48} 
                    h={isMobile ? 40 : 48} 
                    style={{ 
                      backgroundColor: service.available ? '#e5f3ff' : '#f1f3f4', 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: service.available ? '#0078D4' : '#868e96',
                      flexShrink: 0
                    }}
                  >
                    {service.icon}
                  </Box>
                </Group>
                <Text fw={700} size={isMobile ? 'md' : 'lg'} c={service.available ? 'blue' : 'dimmed'}>
                  ₹{service.price.toLocaleString()}
                </Text>
              </Group>
              
              <Box>
                <Group gap="sm" mb="xs" wrap="wrap">
                  <Text fw={600} size={isMobile ? 'sm' : 'md'}>{service.name}</Text>
                  <Badge color={service.available ? 'green' : 'gray'} variant="light" size="sm">
                    {service.available ? 'Available' : 'Coming Soon'}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">{service.description}</Text>
              </Box>
            </Stack>
          </Card>
        ))}
      </Stack>

      {selectedServices.length > 0 && (
        <Paper 
          shadow="md" 
          p={isMobile ? 'md' : 'lg'} 
          withBorder 
          style={{ 
            position: 'sticky', 
            bottom: 16,
            background: 'white'
          }}
        >
          <Group justify="space-between" wrap="wrap" gap="md">
            <Box>
              <Text size="sm" c="dimmed">Selected: {selectedServices.length} service(s)</Text>
              <Text size={isMobile ? 'lg' : 'xl'} fw={700}>Total: ₹{totalAmount.toLocaleString()}</Text>
            </Box>
            <Button 
              size={isMobile ? 'md' : 'lg'} 
              onClick={handleProceed} 
              leftSection={<IconCheck size={18} />}
              fullWidth={isMobile}
            >
              Proceed to Payment
            </Button>
          </Group>
        </Paper>
      )}

      <PaymentModal 
        opened={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        amount={totalAmount} 
        description={selectedServices.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'Services'} 
        onPaymentSubmit={handlePaymentSubmit} 
      />
    </Box>
  );
};

export default Services;