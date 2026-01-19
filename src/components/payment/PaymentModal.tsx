import React, { useState } from 'react';
import { Modal, Button, Text, Stack, Alert, LoadingOverlay, Box, ThemeIcon } from '@mantine/core';
import { IconQrcode, IconCheck, IconClock } from '@tabler/icons-react';

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  onPaymentSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  country?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  opened, 
  onClose, 
  amount, 
  description, 
  onPaymentSubmit,
  isSubmitting: externalSubmitting,
  country = 'USA'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isLoading = externalSubmitting !== undefined ? externalSubmitting : isSubmitting;
  const currencySymbol = country === 'India' ? '₹' : '$';

  const handleSubmit = async () => {
    if (externalSubmitting !== undefined) {
      // External control - just call the handler
      await onPaymentSubmit();
    } else {
      // Internal control
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        onPaymentSubmit();
      }, 1500);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={<Text fw={600} size="lg">Complete Payment</Text>} size="md" centered>
      <LoadingOverlay visible={isLoading} />
      {isSubmitted ? (
        <Stack align="center" gap="md" py="xl">
          <ThemeIcon size={64} radius="xl" color="yellow" variant="light"><IconClock size={32} /></ThemeIcon>
          <Text fw={600} size="lg" ta="center">Payment Submitted</Text>
          <Alert color="blue" icon={<IconCheck size={16} />} w="100%">Please wait for Super Admin to verify the payment. You will be notified once approved.</Alert>
          <Button fullWidth variant="light" onClick={handleClose}>Close</Button>
        </Stack>
      ) : (
        <Stack gap="lg">
          <Box bg="gray.0" p="md" style={{ borderRadius: 8 }}><Text size="sm" c="dimmed" mb="xs">Payment for:</Text><Text fw={500}>{description}</Text></Box>
          <Stack align="center" gap="md" py="md">
            <Box w={192} h={192} bg="gray.1" style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #dee2e6' }}><IconQrcode size={120} color="#868e96" /></Box>
            <Text size="sm" c="dimmed">Scan QR code to pay</Text>
          </Stack>
          <Box bg="blue.0" p="md" style={{ borderRadius: 8 }} ta="center"><Text size="sm" c="dimmed">Amount to Pay</Text><Text size="xl" fw={700} c="blue">{currencySymbol}{amount.toLocaleString()}</Text></Box>
          <Button fullWidth size="md" onClick={handleSubmit} loading={isLoading}>Submit if Payment Done</Button>
        </Stack>
      )}
    </Modal>
  );
};

export default PaymentModal;