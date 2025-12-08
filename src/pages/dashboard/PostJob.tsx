import React, { useState } from 'react';
import { Card, Text, TextInput, Textarea, Select, MultiSelect, Button, Stack, Group, Badge } from '@mantine/core';
import { IconBriefcase, IconCheck } from '@tabler/icons-react';
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
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([
    'Full Name',
    'Email Address',
    'Phone Number',
  ]);
  const [daysActive, setDaysActive] = useState<string>('5');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const dayOptions = Object.entries(PRICING).map(([days, price]) => ({
    value: days,
    label: `${days} days - ₹${price}`,
  }));

  const amount = PRICING[parseInt(daysActive) as keyof typeof PRICING] || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !title || !description || !location || selectedQuestions.length === 0) {
      return;
    }

    const jobId = addJobPosting({
      recruiterId: user.id,
      recruiterName: user.name,
      recruiterCompany: user.company || 'Unknown Company',
      title,
      description,
      requirements,
      location,
      salary,
      selectedQuestions,
      daysActive: parseInt(daysActive),
      isActive: false,
      isPaid: false,
      isApproved: false,
    });

    setPendingJobId(jobId);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (user && pendingJobId) {
      addPaymentRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'job_posting',
        jobId: pendingJobId,
        amount,
      });
    }
    
    // Reset form
    setTitle('');
    setDescription('');
    setRequirements('');
    setLocation('');
    setSalary('');
    setSelectedQuestions(['Full Name', 'Email Address', 'Phone Number']);
    setDaysActive('5');
    setPendingJobId(null);
    setPaymentModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Text size="2xl" fw={700} className="text-foreground">Post a Job Requirement</Text>
        <Text c="dimmed">Fill in the details to create a new job posting</Text>
      </div>

      <form onSubmit={handleSubmit}>
        <Card shadow="sm" padding="xl" className="bg-card border border-border mb-6">
          <Stack gap="lg">
            <TextInput
              label="Job Title"
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              classNames={{
                input: 'bg-background border-input focus:border-primary',
                label: 'text-foreground'
              }}
            />

            <Textarea
              label="Job Description"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              minRows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              classNames={{
                input: 'bg-background border-input focus:border-primary',
                label: 'text-foreground'
              }}
            />

            <Textarea
              label="Requirements"
              placeholder="List the required skills, experience, and qualifications..."
              minRows={4}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              classNames={{
                input: 'bg-background border-input focus:border-primary',
                label: 'text-foreground'
              }}
            />

            <Group grow>
              <TextInput
                label="Location"
                placeholder="e.g., Bangalore, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                classNames={{
                  input: 'bg-background border-input focus:border-primary',
                  label: 'text-foreground'
                }}
              />

              <TextInput
                label="Salary Range (Optional)"
                placeholder="e.g., ₹15L - ₹25L per annum"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                classNames={{
                  input: 'bg-background border-input focus:border-primary',
                  label: 'text-foreground'
                }}
              />
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" padding="xl" className="bg-card border border-border mb-6">
          <Text fw={600} size="lg" mb="md" className="text-foreground">
            Application Questions
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Select the questions you want applicants to answer (max 20)
          </Text>

          <MultiSelect
            data={AVAILABLE_QUESTIONS}
            value={selectedQuestions}
            onChange={setSelectedQuestions}
            placeholder="Select questions..."
            searchable
            maxValues={20}
            classNames={{
              input: 'bg-background border-input focus:border-primary min-h-[100px]',
              pill: 'bg-primary text-primary-foreground'
            }}
          />

          <Group gap="xs" mt="sm">
            <Text size="sm" c="dimmed">Selected:</Text>
            <Badge color="blue">{selectedQuestions.length} / 20</Badge>
          </Group>
        </Card>

        <Card shadow="sm" padding="xl" className="bg-card border border-border mb-6">
          <Text fw={600} size="lg" mb="md" className="text-foreground">
            Posting Duration
          </Text>

          <Select
            label="How long should this job be active?"
            data={dayOptions}
            value={daysActive}
            onChange={(value) => setDaysActive(value || '5')}
            classNames={{
              input: 'bg-background border-input focus:border-primary',
              label: 'text-foreground'
            }}
          />

          <div className="bg-primary/10 p-4 rounded-lg mt-4 text-center">
            <Text size="sm" c="dimmed">Amount to Pay</Text>
            <Text size="2xl" fw={700} className="text-primary">
              ₹{amount.toLocaleString()}
            </Text>
          </div>
        </Card>

        <Button
          type="submit"
          size="lg"
          fullWidth
          leftSection={<IconBriefcase size={18} />}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Submit & Proceed to Payment
        </Button>
      </form>

      <PaymentModal
        opened={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        amount={amount}
        description={`Job Posting: ${title} (${daysActive} days)`}
        onPaymentSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default PostJob;
