import React, { useState } from 'react';
import { Modal, Button, Text, Stack, Alert, LoadingOverlay } from '@mantine/core';
import { IconQrcode, IconCheck, IconClock } from '@tabler/icons-react';

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  onPaymentSubmit: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  opened,
  onClose,
  amount,
  description,
  onPaymentSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      onPaymentSubmit();
    }, 1500);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={600} size="lg">Complete Payment</Text>}
      size="md"
      centered
    >
      <LoadingOverlay visible={isSubmitting} />
      
      {isSubmitted ? (
        <Stack align="center" gap="md" py="xl">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center">
            <IconClock size={32} className="text-warning" />
          </div>
          <Text fw={600} size="lg" ta="center">Payment Submitted</Text>
          <Alert color="blue" icon={<IconCheck size={16} />} className="w-full">
            Please wait for Super Admin to verify the payment and approve it. You will be notified once approved.
          </Alert>
          <Button
            fullWidth
            variant="light"
            color="blue"
            onClick={handleClose}
            className="bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
          >
            Close
          </Button>
        </Stack>
      ) : (
        <Stack gap="lg">
          <div className="bg-secondary p-4 rounded-lg">
            <Text size="sm" c="dimmed" mb="xs">Payment for:</Text>
            <Text fw={500}>{description}</Text>
          </div>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-48 h-48 bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <IconQrcode size={120} className="text-muted-foreground" />
            </div>
            <Text size="sm" c="dimmed">Scan QR code to pay</Text>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <Text size="sm" c="dimmed">Amount to Pay</Text>
            <Text size="xl" fw={700} className="text-primary">
              ₹{amount.toLocaleString()}
            </Text>
          </div>

          <Button
            fullWidth
            size="md"
            onClick={handleSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Submit if Payment Done
          </Button>
        </Stack>
      )}
    </Modal>
  );
};

export default PaymentModal;
