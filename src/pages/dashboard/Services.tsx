import React, { useState } from 'react';
import { Card, Text, Checkbox, Button, Badge, Stack, Group } from '@mantine/core';
import { IconBriefcase, IconSearch, IconUsers, IconCheck } from '@tabler/icons-react';
import PaymentModal from '@/components/payment/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  available: boolean;
}

const services: ServiceOption[] = [
  {
    id: 'post_requirements',
    name: 'Post Requirements',
    description: 'Post job descriptions and receive applications from qualified candidates',
    price: 499,
    icon: <IconBriefcase size={24} />,
    available: true,
  },
  {
    id: 'resume_database',
    name: 'Resume Database Access',
    description: 'Access our extensive database of pre-screened candidates',
    price: 999,
    icon: <IconSearch size={24} />,
    available: false,
  },
  {
    id: 'candidate_screening',
    name: 'Candidate Screening',
    description: 'AI-powered candidate screening and shortlisting service',
    price: 1499,
    icon: <IconUsers size={24} />,
    available: false,
  },
];

const Services: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { user } = useAuth();
  const { addPaymentRequest } = useAppData();

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const totalAmount = selectedServices.reduce((sum, id) => {
    const service = services.find(s => s.id === id);
    return sum + (service?.price || 0);
  }, 0);

  const handleProceed = () => {
    if (selectedServices.length > 0) {
      setPaymentModalOpen(true);
    }
  };

  const handlePaymentSubmit = () => {
    if (user) {
      selectedServices.forEach(serviceId => {
        addPaymentRequest({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          type: 'service',
          serviceId,
          amount: services.find(s => s.id === serviceId)?.price || 0,
        });
      });
    }
    setSelectedServices([]);
    setPaymentModalOpen(false);
  };

  const selectedServiceNames = selectedServices
    .map(id => services.find(s => s.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Text size="2xl" fw={700} className="text-foreground">Services</Text>
        <Text c="dimmed">Select the services you need for your recruitment</Text>
      </div>

      <Stack gap="md" mb="xl">
        {services.map((service) => (
          <Card 
            key={service.id} 
            shadow="sm" 
            padding="lg" 
            className={`bg-card border ${
              selectedServices.includes(service.id) 
                ? 'border-primary' 
                : 'border-border'
            } ${!service.available ? 'opacity-60' : ''}`}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="md" wrap="nowrap">
                <Checkbox
                  checked={selectedServices.includes(service.id)}
                  onChange={() => service.available && handleServiceToggle(service.id)}
                  disabled={!service.available}
                  classNames={{
                    input: 'border-input checked:bg-primary checked:border-primary'
                  }}
                />
                <div 
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    service.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {service.icon}
                </div>
                <div>
                  <Group gap="sm" mb="xs">
                    <Text fw={600} className="text-foreground">{service.name}</Text>
                    {service.available ? (
                      <Badge color="green" variant="light" size="sm">Available</Badge>
                    ) : (
                      <Badge color="gray" variant="light" size="sm">Coming Soon</Badge>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">{service.description}</Text>
                </div>
              </Group>
              <Text fw={700} size="lg" className={service.available ? 'text-primary' : 'text-muted-foreground'}>
                ₹{service.price.toLocaleString()}
              </Text>
            </Group>
          </Card>
        ))}
      </Stack>

      {selectedServices.length > 0 && (
        <Card shadow="sm" padding="lg" className="bg-card border border-border sticky bottom-4">
          <Group justify="space-between" align="center">
            <div>
              <Text size="sm" c="dimmed">Selected: {selectedServices.length} service(s)</Text>
              <Text size="xl" fw={700} className="text-foreground">
                Total: ₹{totalAmount.toLocaleString()}
              </Text>
            </div>
            <Button
              size="lg"
              onClick={handleProceed}
              leftSection={<IconCheck size={18} />}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Proceed to Payment
            </Button>
          </Group>
        </Card>
      )}

      <PaymentModal
        opened={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        amount={totalAmount}
        description={selectedServiceNames || 'Services'}
        onPaymentSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default Services;
