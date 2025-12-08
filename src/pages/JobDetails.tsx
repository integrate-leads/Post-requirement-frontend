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
  Stack, 
  Group,
  Title,
  SimpleGrid,
  ThemeIcon,
  Anchor
} from '@mantine/core';
import { IconMapPin, IconBriefcase, IconClock, IconArrowLeft, IconCheck, IconUpload } from '@tabler/icons-react';
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
      applicantName: formData['Full Name'] || formData['Name'] || 'Unknown',
      applicantEmail: formData['Email Address'] || formData['Email'] || '',
      applicantPhone: formData['Phone Number'] || formData['Phone'] || '',
      answers: formData,
      resumeUrl: resume ? URL.createObjectURL(resume) : undefined,
    });
    setIsSubmitted(true);
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
              Thank you for applying. The recruiter will review your application and get back to you soon.
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
      <Container size="lg">
        <Anchor component={Link} to="/jobs" mb="lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <IconArrowLeft size={18} />
          Back to Jobs
        </Anchor>

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg" mt="md">
          {/* Job Details */}
          <Box style={{ gridColumn: 'span 2' }}>
            <Card shadow="sm" padding="xl">
              <Group justify="space-between" mb="md" wrap="wrap" gap="md">
                <Box>
                  <Title order={2} mb="xs">{job.title}</Title>
                  <Text size="lg" c="dimmed">{job.recruiterCompany}</Text>
                </Box>
                {job.salary && (
                  <Badge size="lg" color="green" variant="light">
                    {job.salary}
                  </Badge>
                )}
              </Group>

              <Group gap="lg" mb="lg" wrap="wrap">
                <Group gap="xs">
                  <IconMapPin size={18} color="#868e96" />
                  <Text size="sm">{job.location}</Text>
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

              <Box py="lg" style={{ borderTop: '1px solid #e9ecef' }}>
                <Text fw={600} size="lg" mb="md">Job Description</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{job.description}</Text>
              </Box>

              {job.requirements && (
                <Box py="lg" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="md">Requirements</Text>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{job.requirements}</Text>
                </Box>
              )}
            </Card>
          </Box>

          {/* Apply Form */}
          <Box>
            <Card shadow="sm" padding="lg" style={{ position: 'sticky', top: 80 }}>
              {!isApplying ? (
                <Stack align="center" ta="center">
                  <Text fw={600} size="lg">Interested in this role?</Text>
                  <Button fullWidth size="lg" onClick={() => setIsApplying(true)}>
                    Apply Now
                  </Button>
                </Stack>
              ) : (
                <>
                  <Text fw={600} size="lg" mb="md">Apply for this position</Text>
                  <Stack gap="md">
                    {job.selectedQuestions.map((question) => (
                      <Box key={question}>
                        {question.includes('?') || question.length > 40 ? (
                          <Textarea
                            label={question}
                            placeholder={`Enter ${question.toLowerCase()}`}
                            value={formData[question] || ''}
                            onChange={(e) => handleInputChange(question, e.target.value)}
                            required
                          />
                        ) : (
                          <TextInput
                            label={question}
                            placeholder={`Enter ${question.toLowerCase()}`}
                            value={formData[question] || ''}
                            onChange={(e) => handleInputChange(question, e.target.value)}
                            required
                          />
                        )}
                      </Box>
                    ))}

                    <FileInput
                      label="Upload Resume/CV"
                      placeholder="Click to upload"
                      leftSection={<IconUpload size={16} />}
                      value={resume}
                      onChange={setResume}
                      accept=".pdf,.doc,.docx"
                    />

                    <Button fullWidth onClick={handleSubmit}>
                      Submit Application
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