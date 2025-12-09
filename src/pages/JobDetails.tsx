import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Card, 
  Text, 
  Badge, 
  Button, 
  TextInput, 
  Textarea, 
  FileInput,
  Select, 
  Stack, 
  Group,
  Title,
  SimpleGrid,
  ThemeIcon,
  Anchor,
  Divider,
  ScrollArea
} from '@mantine/core';
import { 
  IconMapPin, 
  IconBriefcase, 
  IconClock, 
  IconArrowLeft, 
  IconCheck, 
  IconUpload,
  IconCurrencyDollar,
  IconWorld,
  IconFileText
} from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { formatDistanceToNow, format } from 'date-fns';

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getJobById, addApplication } = useAppData();
  const job = getJobById(id || '');

  const [isApplying, setIsApplying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [resume, setResume] = useState<File | null>(null);

  if (!job) {
    return (
      <Box mih="100vh" bg="gray.0" py="xl">
        <Container size="sm">
          <Card shadow="sm" padding="xl" ta="center">
            <Text size="lg" fw={600} mb="md">Job not found</Text>
            <Button 
              component={Link} 
              to="/jobs" 
              variant="light" 
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to Jobs
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  const handleInputChange = (question: string, value: string) => {
    setFormData(prev => ({ ...prev, [question]: value }));
  };

  const handleSubmit = () => {
    addApplication({
      jobId: job.id,
      applicantName: formData['Full Name'] || 'Unknown',
      applicantEmail: formData['Email ID'] || '',
      applicantPhone: formData['Contact Number'] || '',
      answers: formData,
      resumeUrl: resume ? URL.createObjectURL(resume) : undefined,
    });
    setIsSubmitted(true);
  };

  const getInputComponent = (question: string) => {
    const lowerQuestion = question.toLowerCase();
    
    // Yes/No questions
    if (lowerQuestion.includes('yes/no') || 
        lowerQuestion.includes('yes / no') ||
        lowerQuestion.startsWith('are you') ||
        lowerQuestion.startsWith('do you') ||
        lowerQuestion.includes('willingness') ||
        lowerQuestion.includes('open to') ||
        lowerQuestion.includes('possible?') ||
        lowerQuestion.includes('comfortable')) {
      return (
        <Select
          label={question}
          placeholder="Select"
          data={['Yes', 'No']}
          value={formData[question] || ''}
          onChange={(value) => handleInputChange(question, value || '')}
          required
        />
      );
    }
    
    // Work mode
    if (lowerQuestion.includes('work mode') || lowerQuestion.includes('preferred work')) {
      return (
        <Select
          label={question}
          placeholder="Select work mode"
          data={['Work From Home', 'Hybrid', 'Onsite']}
          value={formData[question] || ''}
          onChange={(value) => handleInputChange(question, value || '')}
          required
        />
      );
    }
    
    // Shift preference
    if (lowerQuestion.includes('shift')) {
      return (
        <Select
          label={question}
          placeholder="Select shift preference"
          data={['Day Shift', 'Night Shift', 'Rotational']}
          value={formData[question] || ''}
          onChange={(value) => handleInputChange(question, value || '')}
          required
        />
      );
    }
    
    // Job type
    if (lowerQuestion.includes('current job type')) {
      return (
        <Select
          label={question}
          placeholder="Select job type"
          data={['Permanent', 'Contract', 'Contract-to-Hire (C2H)']}
          value={formData[question] || ''}
          onChange={(value) => handleInputChange(question, value || '')}
          required
        />
      );
    }
    
    // Availability for interview
    if (lowerQuestion.includes('availability for interview')) {
      return (
        <Select
          label={question}
          placeholder="Select availability"
          data={['Weekdays', 'Weekends', 'Both Weekdays and Weekends']}
          value={formData[question] || ''}
          onChange={(value) => handleInputChange(question, value || '')}
          required
        />
      );
    }
    
    // Long text fields
    if (lowerQuestion.includes('details') || 
        lowerQuestion.includes('responsibilities') || 
        lowerQuestion.includes('gaps') ||
        lowerQuestion.includes('address') ||
        lowerQuestion.includes('project')) {
      return (
        <Textarea
          label={question}
          placeholder={`Enter ${question.toLowerCase()}`}
          value={formData[question] || ''}
          onChange={(e) => handleInputChange(question, e.target.value)}
          required
          minRows={2}
        />
      );
    }
    
    // Default text input
    return (
      <TextInput
        label={question}
        placeholder={`Enter ${question.toLowerCase()}`}
        value={formData[question] || ''}
        onChange={(e) => handleInputChange(question, e.target.value)}
        required
      />
    );
  };

  if (isSubmitted) {
    return (
      <Box mih="100vh" bg="gray.0" py="xl">
        <Container size="sm">
          <Card shadow="sm" padding="xl" ta="center">
            <ThemeIcon size={64} radius="xl" color="green" variant="light" mx="auto" mb="md">
              <IconCheck size={32} />
            </ThemeIcon>
            <Title order={2} mb="sm">Application Submitted!</Title>
            <Text c="dimmed" mb="lg">
              Thank you for applying to <strong>{job.title}</strong> at <strong>{job.recruiterCompany}</strong>. 
              The recruiter will review your application and get back to you soon.
            </Text>
            <Button component={Link} to="/jobs">
              Browse More Jobs
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box mih="100vh" bg="gray.0" py="xl">
      <Container size="xl">
        <Anchor component={Link} to="/jobs" mb="lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <IconArrowLeft size={18} />
          Back to Jobs
        </Anchor>

        <SimpleGrid cols={{ base: 1, lg: isApplying ? 2 : 3 }} spacing="lg" mt="md">
          {/* Job Details */}
          <Box style={{ gridColumn: isApplying ? 'span 1' : 'span 2' }}>
            <Card shadow="sm" padding="xl">
              <Group justify="space-between" mb="md" wrap="wrap" gap="md">
                <Box>
                  <Title order={2} mb="xs">{job.title}</Title>
                  <Text size="lg" c="dimmed">{job.recruiterCompany}</Text>
                </Box>
                <Stack gap="xs" align="flex-end">
                  {job.payRate && (
                    <Badge size="lg" color="green" variant="light">
                      {job.payRate}
                    </Badge>
                  )}
                  <Badge color="blue" variant="light">{job.jobType}</Badge>
                </Stack>
              </Group>

              <Group gap="lg" mb="lg" wrap="wrap">
                <Group gap="xs">
                  <IconWorld size={18} color="#868e96" />
                  <Text size="sm">{job.workLocationCountry}</Text>
                </Group>
                <Group gap="xs">
                  <IconMapPin size={18} color="#868e96" />
                  <Text size="sm">{job.workLocation}</Text>
                </Group>
                <Group gap="xs">
                  <IconClock size={18} color="#868e96" />
                  <Text size="sm">
                    Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconBriefcase size={18} color="#868e96" />
                  <Text size="sm">
                    Expires {format(new Date(job.expiresAt), 'MMM dd, yyyy')}
                  </Text>
                </Group>
              </Group>

              {job.paymentType && (
                <Badge variant="outline" color="gray" mb="md">{job.paymentType}</Badge>
              )}

              <Divider my="md" />

              <Box py="md">
                <Text fw={600} size="lg" mb="sm">Job Description</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{job.description}</Text>
              </Box>

              {job.rolesResponsibilities && (
                <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="sm">Roles & Responsibilities</Text>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{job.rolesResponsibilities}</Text>
                </Box>
              )}

              {(job.mustHaveSkills || job.primarySkills || job.niceToHaveSkills) && (
                <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="md">Skills Required</Text>
                  
                  {job.mustHaveSkills && (
                    <Box mb="md">
                      <Text fw={500} size="sm" c="red.6" mb="xs">Must Have:</Text>
                      <Group gap="xs" wrap="wrap">
                        {job.mustHaveSkills.split(',').map((skill, idx) => (
                          <Badge key={idx} color="red" variant="light">{skill.trim()}</Badge>
                        ))}
                      </Group>
                    </Box>
                  )}
                  
                  {job.primarySkills && (
                    <Box mb="md">
                      <Text fw={500} size="sm" c="blue.6" mb="xs">Primary Skills:</Text>
                      <Group gap="xs" wrap="wrap">
                        {job.primarySkills.split(',').map((skill, idx) => (
                          <Badge key={idx} color="blue" variant="light">{skill.trim()}</Badge>
                        ))}
                      </Group>
                    </Box>
                  )}
                  
                  {job.niceToHaveSkills && (
                    <Box>
                      <Text fw={500} size="sm" c="gray.6" mb="xs">Nice to Have:</Text>
                      <Group gap="xs" wrap="wrap">
                        {job.niceToHaveSkills.split(',').map((skill, idx) => (
                          <Badge key={idx} variant="outline" color="gray">{skill.trim()}</Badge>
                        ))}
                      </Group>
                    </Box>
                  )}
                </Box>
              )}

              {job.domainKnowledge && (
                <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="sm">Domain Knowledge</Text>
                  <Text>{job.domainKnowledge}</Text>
                </Box>
              )}
            </Card>
          </Box>

          {/* Apply Form */}
          <Box>
            <Card shadow="sm" padding="lg" style={{ position: 'sticky', top: 80 }}>
              {!isApplying ? (
                <Stack align="center" ta="center">
                  <ThemeIcon size={48} radius="xl" color="blue" variant="light">
                    <IconFileText size={24} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">Interested in this role?</Text>
                  <Text size="sm" c="dimmed" mb="md">
                    You will need to fill {job.selectedQuestions.length} question{job.selectedQuestions.length !== 1 ? 's' : ''}
                  </Text>
                  <Button fullWidth size="lg" onClick={() => setIsApplying(true)}>
                    Apply Now
                  </Button>
                </Stack>
              ) : (
                <>
                  <Group justify="space-between" mb="md">
                    <Text fw={600} size="lg">Application Form</Text>
                    <Badge>{job.selectedQuestions.length} questions</Badge>
                  </Group>
                  
                  <ScrollArea h={500} offsetScrollbars>
                    <Stack gap="md" pr="md">
                      {job.selectedQuestions.map((question) => (
                        <Box key={question}>
                          {question.toLowerCase().includes('resume') ? (
                            <FileInput
                              label={question}
                              placeholder="Upload your resume"
                              leftSection={<IconUpload size={16} />}
                              value={resume}
                              onChange={setResume}
                              accept=".pdf,.doc,.docx"
                              required
                            />
                          ) : (
                            getInputComponent(question)
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </ScrollArea>

                  <Divider my="md" />

                  <Stack gap="sm">
                    <Button fullWidth onClick={handleSubmit} size="md">
                      Submit Application
                    </Button>
                    <Button 
                      fullWidth 
                      variant="subtle" 
                      color="gray"
                      onClick={() => setIsApplying(false)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </>
              )}
            </Card>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default JobDetails;
