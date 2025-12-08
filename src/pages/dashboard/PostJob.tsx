import React, { useState } from 'react';
import { Card, Text, TextInput, Textarea, Select, MultiSelect, Button, Stack, Group, Badge, Box, Title } from '@mantine/core';
import { IconBriefcase } from '@tabler/icons-react';
import PaymentModal from '@/components/payment/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData, AVAILABLE_QUESTIONS, PRICING } from '@/contexts/AppDataContext';

const PostJob: React.FC = () => {
  const { user } = useAuth();
  const { addJobPosting, addPaymentRequest } = useAppData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(['Full Name', 'Email Address', 'Phone Number']);
  const [daysActive, setDaysActive] = useState<string>('5');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const dayOptions = Object.entries(PRICING).map(([days, price]) => ({ value: days, label: `${days} days - ₹${price}` }));
  const amount = PRICING[parseInt(daysActive) as keyof typeof PRICING] || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !description || !location || selectedQuestions.length === 0) return;
    const jobId = addJobPosting({ recruiterId: user.id, recruiterName: user.name, recruiterCompany: user.company || 'Unknown Company', title, description, requirements, location, salary, selectedQuestions, daysActive: parseInt(daysActive), isActive: false, isPaid: false, isApproved: false });
    setPendingJobId(jobId);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (user && pendingJobId) addPaymentRequest({ userId: user.id, userName: user.name, userEmail: user.email, type: 'job_posting', jobId: pendingJobId, amount });
    setTitle(''); setDescription(''); setRequirements(''); setLocation(''); setSalary('');
    setSelectedQuestions(['Full Name', 'Email Address', 'Phone Number']); setDaysActive('5'); setPendingJobId(null); setPaymentModalOpen(false);
  };

  return (
    <Box maw={800} mx="auto">
      <Box mb="xl"><Title order={2}>Post a Job Requirement</Title><Text c="dimmed">Fill in the details to create a new job posting</Text></Box>

      <form onSubmit={handleSubmit}>
        <Card shadow="sm" padding="xl" withBorder mb="lg">
          <Stack gap="md">
            <TextInput label="Job Title" placeholder="e.g., Senior Software Engineer" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea label="Job Description" placeholder="Describe the role..." minRows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
            <Textarea label="Requirements" placeholder="List required skills..." minRows={4} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
            <Group grow><TextInput label="Location" placeholder="e.g., Bangalore" value={location} onChange={(e) => setLocation(e.target.value)} required /><TextInput label="Salary Range (Optional)" placeholder="e.g., ₹15L - ₹25L" value={salary} onChange={(e) => setSalary(e.target.value)} /></Group>
          </Stack>
        </Card>

        <Card shadow="sm" padding="xl" withBorder mb="lg">
          <Text fw={600} size="lg" mb="md">Application Questions</Text>
          <MultiSelect data={AVAILABLE_QUESTIONS} value={selectedQuestions} onChange={setSelectedQuestions} placeholder="Select questions..." searchable maxValues={20} />
          <Group gap="xs" mt="sm"><Text size="sm" c="dimmed">Selected:</Text><Badge color="blue">{selectedQuestions.length} / 20</Badge></Group>
        </Card>

        <Card shadow="sm" padding="xl" withBorder mb="lg">
          <Text fw={600} size="lg" mb="md">Posting Duration</Text>
          <Select label="How long should this job be active?" data={dayOptions} value={daysActive} onChange={(value) => setDaysActive(value || '5')} />
          <Box bg="blue.0" p="md" style={{ borderRadius: 8 }} mt="md" ta="center"><Text size="sm" c="dimmed">Amount to Pay</Text><Text size="xl" fw={700} c="blue">₹{amount.toLocaleString()}</Text></Box>
        </Card>

        <Button type="submit" size="lg" fullWidth leftSection={<IconBriefcase size={18} />}>Submit & Proceed to Payment</Button>
      </form>

      <PaymentModal opened={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} amount={amount} description={`Job Posting: ${title} (${daysActive} days)`} onPaymentSubmit={handlePaymentSubmit} />
    </Box>
  );
};

export default PostJob;