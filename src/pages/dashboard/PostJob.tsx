import React, { useState } from 'react';
import { 
  Card, 
  Text, 
  TextInput, 
  Textarea, 
  Select, 
  Button, 
  Stack, 
  Group, 
  Badge, 
  Box, 
  Title,
  Accordion,
  Checkbox,
  SimpleGrid,
  Divider
} from '@mantine/core';
import { IconBriefcase, IconChevronDown } from '@tabler/icons-react';
import PaymentModal from '@/components/payment/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useAppData, 
  APPLICATION_QUESTIONS, 
  JOB_TYPES, 
  PAYMENT_TYPES, 
  WORK_COUNTRIES,
  PRICING 
} from '@/contexts/AppDataContext';
import { useMediaQuery } from '@mantine/hooks';

const PostJob: React.FC = () => {
  const { user } = useAuth();
  const { addJobPosting, addPaymentRequest } = useAppData();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Job fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workLocationCountry, setWorkLocationCountry] = useState<string | null>('India');
  const [workLocation, setWorkLocation] = useState('');
  const [jobType, setJobType] = useState<string | null>('Full Time');
  const [paymentType, setPaymentType] = useState<string | null>('Net 45 Days');
  const [payRate, setPayRate] = useState('');
  const [domainKnowledge, setDomainKnowledge] = useState('');
  const [mustHaveSkills, setMustHaveSkills] = useState('');
  const [primarySkills, setPrimarySkills] = useState('');
  const [niceToHaveSkills, setNiceToHaveSkills] = useState('');
  const [rolesResponsibilities, setRolesResponsibilities] = useState('');
  
  // Application questions
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([
    'Full Name',
    'Contact Number',
    'Email ID',
    'Updated Resume (Mandatory)',
  ]);
  
  // Duration and payment
  const [daysActive, setDaysActive] = useState<string>('5');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const dayOptions = Object.entries(PRICING).map(([days, price]) => ({ 
    value: days, 
    label: `${days} days - ₹${price}` 
  }));
  const amount = PRICING[parseInt(daysActive) as keyof typeof PRICING] || 0;

  const toggleQuestion = (question: string) => {
    setSelectedQuestions(prev => 
      prev.includes(question) 
        ? prev.filter(q => q !== question)
        : [...prev, question]
    );
  };

  const selectAllInCategory = (questions: string[]) => {
    const allSelected = questions.every(q => selectedQuestions.includes(q));
    if (allSelected) {
      setSelectedQuestions(prev => prev.filter(q => !questions.includes(q)));
    } else {
      setSelectedQuestions(prev => [...new Set([...prev, ...questions])]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !description || !workLocation || !workLocationCountry || !jobType || selectedQuestions.length === 0) return;
    
    const jobId = addJobPosting({ 
      recruiterId: user.id, 
      recruiterName: user.name, 
      recruiterCompany: user.company || 'Unknown Company', 
      title, 
      description,
      workLocationCountry: workLocationCountry as 'USA' | 'India',
      workLocation,
      jobType,
      paymentType: paymentType || '',
      payRate,
      domainKnowledge,
      mustHaveSkills,
      primarySkills,
      niceToHaveSkills,
      rolesResponsibilities,
      selectedQuestions, 
      daysActive: parseInt(daysActive), 
      isActive: false, 
      isPaid: false, 
      isApproved: false 
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
        amount 
      });
    }
    // Reset form
    setTitle(''); 
    setDescription(''); 
    setWorkLocation('');
    setPayRate('');
    setDomainKnowledge('');
    setMustHaveSkills('');
    setPrimarySkills('');
    setNiceToHaveSkills('');
    setRolesResponsibilities('');
    setSelectedQuestions(['Full Name', 'Contact Number', 'Email ID', 'Updated Resume (Mandatory)']); 
    setDaysActive('5'); 
    setPendingJobId(null); 
    setPaymentModalOpen(false);
  };

  return (
    <Box maw={900} mx="auto">
      <Box mb="xl">
        <Title order={2}>Post a Job Requirement</Title>
        <Text c="dimmed" size="sm">Fill in the details to create a new job posting</Text>
      </Box>

      <form onSubmit={handleSubmit}>
        {/* Job Details Card */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Text fw={600} size="lg" mb="md">Job Details</Text>
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Select
                label="Work Location Country"
                placeholder="Select country"
                data={WORK_COUNTRIES}
                value={workLocationCountry}
                onChange={setWorkLocationCountry}
                required
                comboboxProps={{ withinPortal: true, zIndex: 1000 }}
              />
              <TextInput
                label="Work Location"
                placeholder="e.g., San Francisco, CA or Bangalore"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                required
              />
            </SimpleGrid>

            <TextInput
              label="Job Title"
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              label="Job Description"
              placeholder="Describe the role, company, and opportunity..."
              minRows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Select
                label="Job Type"
                placeholder="Select job type"
                data={JOB_TYPES}
                value={jobType}
                onChange={setJobType}
                required
                comboboxProps={{ withinPortal: true, zIndex: 1000 }}
              />
              <Select
                label="Payment Type"
                placeholder="Select payment type"
                data={PAYMENT_TYPES}
                value={paymentType}
                onChange={setPaymentType}
                comboboxProps={{ withinPortal: true, zIndex: 1000 }}
              />
            </SimpleGrid>

            <TextInput
              label="Pay Rate"
              placeholder="e.g., $80-100/hour or ₹15L-25L per annum"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
            />
          </Stack>
        </Card>

        {/* Skills & Requirements Card */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Text fw={600} size="lg" mb="md">Skills & Requirements</Text>
          <Stack gap="md">
            <TextInput
              label="Domain Knowledge Required"
              placeholder="e.g., FinTech, Healthcare, Banking, E-commerce"
              value={domainKnowledge}
              onChange={(e) => setDomainKnowledge(e.target.value)}
            />

            <Textarea
              label="Must Have Skills"
              placeholder="List critical skills that are mandatory..."
              minRows={2}
              value={mustHaveSkills}
              onChange={(e) => setMustHaveSkills(e.target.value)}
            />

            <Textarea
              label="Primary Skills Required"
              placeholder="List primary technical skills..."
              minRows={2}
              value={primarySkills}
              onChange={(e) => setPrimarySkills(e.target.value)}
            />

            <Textarea
              label="Nice to Have Skills"
              placeholder="List additional preferred skills..."
              minRows={2}
              value={niceToHaveSkills}
              onChange={(e) => setNiceToHaveSkills(e.target.value)}
            />

            <Textarea
              label="Roles & Responsibilities"
              placeholder="Describe key responsibilities and expectations..."
              minRows={4}
              value={rolesResponsibilities}
              onChange={(e) => setRolesResponsibilities(e.target.value)}
            />
          </Stack>
        </Card>

        {/* Application Questions Card */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Box>
              <Text fw={600} size="lg">Application Questions</Text>
              <Text size="sm" c="dimmed">Select questions applicants must answer</Text>
            </Box>
            <Badge color="blue" size="lg">{selectedQuestions.length} selected</Badge>
          </Group>

          <Accordion variant="separated" chevron={<IconChevronDown size={16} />}>
            {Object.entries(APPLICATION_QUESTIONS).map(([key, category]) => {
              const selectedCount = category.questions.filter(q => selectedQuestions.includes(q)).length;
              const allSelected = selectedCount === category.questions.length;
              
              return (
                <Accordion.Item key={key} value={key}>
                  <Accordion.Control>
                    <Group justify="space-between" w="100%" pr="md" wrap="wrap" gap="xs">
                      <Text fw={500} size={isMobile ? 'sm' : 'md'}>{category.label}</Text>
                      <Badge 
                        color={selectedCount > 0 ? 'blue' : 'gray'} 
                        variant="light"
                        size="sm"
                      >
                        {selectedCount}/{category.questions.length}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      <Checkbox
                        label="Select All"
                        checked={allSelected}
                        indeterminate={selectedCount > 0 && !allSelected}
                        onChange={() => selectAllInCategory(category.questions)}
                        fw={500}
                      />
                      <Divider my="xs" />
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                        {category.questions.map((question) => (
                          <Checkbox
                            key={question}
                            label={question}
                            checked={selectedQuestions.includes(question)}
                            onChange={() => toggleQuestion(question)}
                            size={isMobile ? 'sm' : 'md'}
                          />
                        ))}
                      </SimpleGrid>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </Card>

        {/* Posting Duration Card */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Text fw={600} size="lg" mb="md">Posting Duration</Text>
          <Select
            label="How long should this job be active?"
            data={dayOptions}
            value={daysActive}
            onChange={(value) => setDaysActive(value || '5')}
            comboboxProps={{ withinPortal: true, zIndex: 1000 }}
          />
          <Box 
            bg="blue.0" 
            p="md" 
            style={{ borderRadius: 8 }} 
            mt="md" 
            ta="center"
          >
            <Text size="sm" c="dimmed">Amount to Pay</Text>
            <Text size="xl" fw={700} c="blue">₹{amount.toLocaleString()}</Text>
          </Box>
        </Card>

        <Button 
          type="submit" 
          size="lg" 
          fullWidth 
          leftSection={<IconBriefcase size={18} />}
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
    </Box>
  );
};

export default PostJob;