import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
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
  ScrollArea,
  Loader,
  Radio
} from '@mantine/core';
import DatePicker from '@/components/ui/DatePicker';
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
import { formatDistanceToNow, format } from 'date-fns';
import { notifications } from '@mantine/notifications';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import FormattedText from '@/components/FormattedText';

interface JobPost {
  id: number;
  title: string;
  description: string;
  adminId: number;
  country: string;
  clientName: string | null;
  role: string;
  workLocations: Array<{
    state: string;
    city: string[];
  }>;
  workType: string;
  jobType: string[];
  payRate: string;
  projectStartDate: string;
  projectEndDate: string;
  primarySkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string;
  applicationQuestions: Array<{
    question: string;
    type: string;
  }>;
  requiredDocuments: string[];
  paymentStatus: string;
  planAmount: string;
  isVerified: string;
  status: string;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    email: string;
    companyName: string;
    companyWebsite: string;
  };
}

interface ApplicationFormData {
  applicationAnswer: Array<{ question: string; answer: string }>;
  workRefDetails: Array<{
    name: string;
    title: string;
    email: string;
    phone: string;
  }>;
  EmployerDetails: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactNumber: string;
  };
  documents: {
    resume?: string;
  };
}

const VISA_STATUS_OPTIONS = [
  'US Citizen',
  'Green Card',
  'H1B',
  'L1',
  'OPT',
  'CPT',
  'H4 EAD',
  'TN Visa',
  'Other'
];

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const jobFromState = location.state?.job as JobPost | undefined;

  const [job, setJob] = useState<JobPost | null>(jobFromState || null);
  const [loading, setLoading] = useState(!jobFromState);
  const [isApplying, setIsApplying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  
  // Application answers for applicationQuestions
  const [applicationAnswers, setApplicationAnswers] = useState<Record<string, string>>({});

  // Fetch job if not passed via state
  useEffect(() => {
    if (!jobFromState && id) {
      const fetchJob = async () => {
        setLoading(true);
        try {
          const response = await api.get<{ success: boolean; data: { jobPosts: JobPost[] } }>(
            API_ENDPOINTS.CANDIDATE.JOB_POSTS(1, 100)
          );
          if (response.data?.success) {
            const foundJob = response.data.data.jobPosts.find(j => j.id === parseInt(id));
            if (foundJob) {
              setJob(foundJob);
            }
          }
        } catch (error) {
          console.error('Failed to fetch job:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchJob();
    }
  }, [id, jobFromState]);

  const handleResumeUpload = async (file: File | null) => {
    if (!file) {
      setResume(null);
      setResumeUrl('');
      return;
    }

    setResume(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await api.post<{
        success: boolean;
        data: {
          files: Array<{ url: string }>;
        };
      }>(API_ENDPOINTS.CANDIDATE.UPLOAD_DOCUMENTS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success && response.data.data.files.length > 0) {
        setResumeUrl(response.data.data.files[0].url);
        notifications.show({
          title: 'Success',
          message: 'Resume uploaded successfully',
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Failed to upload resume:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to upload resume',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    if (!job) return false;
    
    // Check resume
    if (!resumeUrl) {
      notifications.show({
        title: 'Error',
        message: 'Please upload your resume',
        color: 'red',
      });
      return false;
    }

    // Check all application questions are answered
    const requiredQuestions = job.applicationQuestions || [];
    for (const q of requiredQuestions) {
      const answer = applicationAnswers[q.question];
      if (!answer || answer.trim() === '') {
        notifications.show({
          title: 'Error',
          message: `Please answer: ${q.question}`,
          color: 'red',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!job || !validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Build workRefDetails from application answers
      const workRefDetails = [{
        name: applicationAnswers['Reference Name'] || '',
        title: applicationAnswers['Reference Title'] || '',
        email: applicationAnswers['Reference E-Mail ID'] || '',
        phone: applicationAnswers['Reference Phone No'] || '',
      }];

      // Build EmployerDetails from application answers
      const EmployerDetails = {
        companyName: applicationAnswers['Employer Company Name'] || '',
        contactName: applicationAnswers['Manager/HR/Recruiter Name'] || '',
        contactEmail: applicationAnswers['Employer E-Mail ID'] || '',
        contactNumber: applicationAnswers['Employer Contact No'] || '',
      };

      // Only include applicationAnswer array - no separate fields
      const applicationData: ApplicationFormData = {
        applicationAnswer: Object.entries(applicationAnswers).map(([question, answer]) => ({
          question,
          answer
        })),
        workRefDetails,
        EmployerDetails,
        documents: {
          resume: resumeUrl
        }
      };

      const response = await api.post(
        API_ENDPOINTS.CANDIDATE.APPLY_JOB(job.id),
        applicationData
      );

      if (response.data?.success) {
        setIsSubmitted(true);
        notifications.show({
          title: 'Success',
          message: 'Application submitted successfully!',
          color: 'green',
        });
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: 'Error',
        message: axiosError.response?.data?.message || 'Failed to submit application',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getLocationString = (workLocations: JobPost['workLocations']) => {
    if (!workLocations || workLocations.length === 0) return 'Remote';
    return workLocations.map(loc => 
      `${loc.city.join(', ')}, ${loc.state}`
    ).join(' | ');
  };

  if (loading) {
    return (
      <Box mih="100vh" bg="gray.0" py="xl">
        <Container size="sm">
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        </Container>
      </Box>
    );
  }

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
              Thank you for applying to <strong>{job.title}</strong> at <strong>{job.admin?.companyName || 'the company'}</strong>. 
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

  // Get application questions from job
  const applicationQuestions = job.applicationQuestions || [];

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
                  <Text size="lg" c="dimmed">{job.admin?.companyName || 'Unknown Company'}</Text>
                </Box>
                <Stack gap="xs" align="flex-end">
                  {job.payRate && (
                    <Badge size="lg" color="green" variant="light">
                      {job.payRate}
                    </Badge>
                  )}
                  <Group gap="xs">
                    {job.jobType.map((type, idx) => (
                      <Badge key={idx} color="blue" variant="light">{type}</Badge>
                    ))}
                  </Group>
                </Stack>
              </Group>

              <Group gap="lg" mb="lg" wrap="wrap">
                <Group gap="xs">
                  <IconWorld size={18} color="#868e96" />
                  <Text size="sm">{job.country}</Text>
                </Group>
                <Group gap="xs">
                  <IconMapPin size={18} color="#868e96" />
                  <Text size="sm">{getLocationString(job.workLocations)}</Text>
                </Group>
                <Group gap="xs">
                  <IconClock size={18} color="#868e96" />
                  <Text size="sm">
                    Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconBriefcase size={18} color="#868e96" />
                  <Text size="sm">{job.workType}</Text>
                </Group>
              </Group>

              <Divider my="md" />

              <Box py="md">
                <Text fw={600} size="lg" mb="sm">Job Description & Responsibilities</Text>
                <FormattedText text={job.description} />
              </Box>

              {(job.primarySkills?.length > 0 || job.niceToHaveSkills?.length > 0) && (
                <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="md">Skills Required</Text>
                  
                  {job.primarySkills?.length > 0 && (
                    <Box mb="md">
                      <Text fw={600} size="sm" c="blue.7" mb="xs">Primary Skills:</Text>
                      <FormattedText text={job.primarySkills.join(', ')} c="gray.7" />
                    </Box>
                  )}
                  
                  {job.niceToHaveSkills?.length > 0 && (
                    <Box>
                      <Text fw={600} size="sm" c="gray.6" mb="xs">Nice to Have:</Text>
                      <FormattedText text={job.niceToHaveSkills.join(', ')} c="gray.6" />
                    </Box>
                  )}
                </Box>
              )}

              {/* Project Dates */}
              <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                <Text fw={600} size="lg" mb="sm">Project Timeline</Text>
                <Group gap="xl">
                  <Box>
                    <Text size="sm" c="dimmed">Start Date</Text>
                    <Text fw={500}>{format(new Date(job.projectStartDate), 'MMM dd, yyyy')}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">End Date</Text>
                    <Text fw={500}>{format(new Date(job.projectEndDate), 'MMM dd, yyyy')}</Text>
                  </Box>
                </Group>
              </Box>
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
                    Fill out the application form to apply
                  </Text>
                  <Button fullWidth size="lg" onClick={() => setIsApplying(true)}>
                    Apply Now
                  </Button>
                </Stack>
              ) : (
                <>
                  <Group justify="space-between" mb="md">
                    <Text fw={600} size="lg">Details Required</Text>
                  </Group>
                  
                  <ScrollArea h={600} offsetScrollbars>
                    <Stack gap="md" pr="md">
                      {/* Dynamic Application Questions from API */}
                      {applicationQuestions.length > 0 && (
                        <>
                          <Box bg="blue.0" p="sm" style={{ borderRadius: 8 }}>
                            <Text fw={600} size="sm" c="blue.7">Required Information</Text>
                            <Text size="xs" c="dimmed">All fields are mandatory</Text>
                          </Box>
                          
                          {applicationQuestions.map((q, idx) => {
                            const questionLower = q.question.toLowerCase();
                            
                            // Yes/No dropdown questions
                            const isYesNoQuestion = 
                              questionLower.includes('fine with relocation') ||
                              questionLower.includes('relocation?') ||
                              questionLower.includes('face to face interview') ||
                              questionLower.includes('fine with face') ||
                              questionLower.includes('willing to') ||
                              questionLower.includes('available for');
                            
                            // Date questions - use custom DatePicker
                            const isDateQuestion = 
                              questionLower.includes('date of birth') ||
                              questionLower.includes('dob') ||
                              questionLower.includes('birth date') ||
                              questionLower.includes('available date') ||
                              questionLower.includes('start date');
                            
                            // Phone/Mobile number fields
                            const isPhoneField = 
                              questionLower.includes('phone') ||
                              questionLower.includes('mobile') ||
                              questionLower.includes('contact no') ||
                              questionLower.includes('contact number');
                            
                            // Email fields
                            const isEmailField = 
                              questionLower.includes('email') ||
                              questionLower.includes('e-mail');
                            
                            // Experience fields (years)
                            const isExperienceField = 
                              questionLower.includes('experience') ||
                              questionLower.includes('years of');
                            
                            // Name fields
                            const isNameField = 
                              questionLower.includes('name') && 
                              !questionLower.includes('company') &&
                              !questionLower.includes('employer');
                            
                            // Salary/Rate fields
                            const isSalaryField = 
                              questionLower.includes('salary') ||
                              questionLower.includes('rate') ||
                              questionLower.includes('pay') ||
                              questionLower.includes('compensation') ||
                              questionLower.includes('ctc');
                            
                            // Visa status field
                            const isVisaField = 
                              questionLower.includes('visa') ||
                              questionLower.includes('work authorization');
                            
                            // SSN field
                            const isSSNField = 
                              questionLower.includes('ssn') ||
                              questionLower.includes('social security');
                            
                            // Zip/Postal code field
                            const isZipField = 
                              questionLower.includes('zip') ||
                              questionLower.includes('postal code') ||
                              questionLower.includes('pincode');
                            
                            // LinkedIn field
                            const isLinkedInField = 
                              questionLower.includes('linkedin');
                            
                            // Get field validation errors
                            const getFieldError = () => {
                              const value = applicationAnswers[q.question];
                              if (!value || value.length === 0) return undefined;
                              
                              if (isPhoneField && value.length !== 10) {
                                return 'Phone number must be exactly 10 digits';
                              }
                              if (isEmailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                return 'Invalid email format';
                              }
                              if (isNameField && value.length < 2) {
                                return 'Name must be at least 2 characters';
                              }
                              if (isNameField && !/^[a-zA-Z\s]+$/.test(value)) {
                                return 'Name should only contain letters';
                              }
                              if (isExperienceField && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 50)) {
                                return 'Experience must be between 0 and 50 years';
                              }
                              if (isSalaryField && (isNaN(Number(value.replace(/[,$]/g, ''))) || Number(value.replace(/[,$]/g, '')) < 0)) {
                                return 'Enter a valid amount';
                              }
                              if (isSSNField && !/^\d{4}$/.test(value) && !/^\d{9}$/.test(value)) {
                                return 'Enter last 4 digits or full 9 digits';
                              }
                              if (isZipField && !/^\d{5,6}$/.test(value)) {
                                return 'Enter a valid zip/postal code (5-6 digits)';
                              }
                              if (isLinkedInField && !value.includes('linkedin.com')) {
                                return 'Enter a valid LinkedIn URL';
                              }
                              return undefined;
                            };
                            
                            if (isYesNoQuestion) {
                              return (
                                <Select
                                  key={idx}
                                  label={q.question}
                                  placeholder="Select an option"
                                  data={[
                                    { value: 'Yes', label: 'Yes' },
                                    { value: 'No', label: 'No' }
                                  ]}
                                  value={applicationAnswers[q.question] || null}
                                  onChange={(value) => setApplicationAnswers(prev => ({
                                    ...prev,
                                    [q.question]: value || ''
                                  }))}
                                  required
                                  withAsterisk
                                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                                />
                              );
                            }
                            
                            if (isDateQuestion) {
                              return (
                                <Box key={idx}>
                                  <DatePicker
                                    label={`${q.question} *`}
                                    placeholder="Select date"
                                    value={applicationAnswers[q.question] ? new Date(applicationAnswers[q.question]) : undefined}
                                    onChange={(date) => setApplicationAnswers(prev => ({
                                      ...prev,
                                      [q.question]: date ? format(date, 'yyyy-MM-dd') : ''
                                    }))}
                                    country="USA"
                                    clearable
                                  />
                                </Box>
                              );
                            }
                            
                            if (isVisaField) {
                              return (
                                <Select
                                  key={idx}
                                  label={q.question}
                                  placeholder="Select visa status"
                                  data={VISA_STATUS_OPTIONS}
                                  value={applicationAnswers[q.question] || null}
                                  onChange={(value) => setApplicationAnswers(prev => ({
                                    ...prev,
                                    [q.question]: value || ''
                                  }))}
                                  required
                                  withAsterisk
                                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                                />
                              );
                            }
                            
                            if (isPhoneField) {
                              return (
                                <TextInput
                                  key={idx}
                                  label={q.question}
                                  placeholder="Enter 10 digit phone number"
                                  value={applicationAnswers[q.question] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setApplicationAnswers(prev => ({
                                      ...prev,
                                      [q.question]: value
                                    }));
                                  }}
                                  required
                                  withAsterisk
                                  maxLength={10}
                                  error={getFieldError()}
                                />
                              );
                            }
                            
                            if (isEmailField) {
                              return (
                                <TextInput
                                  key={idx}
                                  label={q.question}
                                  placeholder="Enter email address"
                                  type="email"
                                  value={applicationAnswers[q.question] || ''}
                                  onChange={(e) => setApplicationAnswers(prev => ({
                                    ...prev,
                                    [q.question]: e.target.value
                                  }))}
                                  required
                                  withAsterisk
                                  error={getFieldError()}
                                />
                              );
                            }
                            
                            if (isExperienceField) {
                              return (
                                <TextInput
                                  key={idx}
                                  label={q.question}
                                  placeholder="Enter years of experience (0-50)"
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={applicationAnswers[q.question] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || (Number(value) >= 0 && Number(value) <= 50)) {
                                      setApplicationAnswers(prev => ({
                                        ...prev,
                                        [q.question]: value
                                      }));
                                    }
                                  }}
                                  required
                                  withAsterisk
                                  error={getFieldError()}
                                />
                              );
                            }
                            
                            if (isNameField) {
                              return (
                                <TextInput
                                  key={idx}
                                  label={q.question}
                                  placeholder="Enter name"
                                  value={applicationAnswers[q.question] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                    setApplicationAnswers(prev => ({
                                      ...prev,
                                      [q.question]: value
                                    }));
                                  }}
                                  required
                                  withAsterisk
                                  error={getFieldError()}
                                />
                              );
                            }
                            
                            if (isSalaryField) {
                              return (
                                <TextInput
                                  key={idx}
                                  label={q.question}
                                  placeholder="Enter amount"
                                  value={applicationAnswers[q.question] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9.,]/g, '');
                                    setApplicationAnswers(prev => ({
                                      ...prev,
                                      [q.question]: value
                                    }));
                                  }}
                                  required
                                  withAsterisk
                                  error={getFieldError()}
                                />
                              );
                            }
                            
                            if (isSSNField) {
                              return (
                                <TextInput
                                  key={idx}
                                  label={q.question}
                                  placeholder="Enter last 4 digits of SSN"
                                  value={applicationAnswers[q.question] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                                    setApplicationAnswers(prev => ({
                                      ...prev,
                                      [q.question]: value
                                    }));
                                  }}
                                  required
                                  withAsterisk
                                  maxLength={9}
                                  error={getFieldError()}
                                />
                              );
                            }
                            
                            if (isZipField) {
                              return (
                                <TextInput
                                  key={idx}
                                  label={q.question}
                                  placeholder="Enter zip/postal code"
                                  value={applicationAnswers[q.question] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setApplicationAnswers(prev => ({
                                      ...prev,
                                      [q.question]: value
                                    }));
                                  }}
                                  required
                                  withAsterisk
                                  maxLength={6}
                                  error={getFieldError()}
                                />
                              );
                            }
                            
                            if (isLinkedInField) {
                              return (
                                <TextInput
                                  key={idx}
                                  label={q.question}
                                  placeholder="Enter LinkedIn profile URL"
                                  value={applicationAnswers[q.question] || ''}
                                  onChange={(e) => setApplicationAnswers(prev => ({
                                    ...prev,
                                    [q.question]: e.target.value
                                  }))}
                                  required
                                  withAsterisk
                                  error={getFieldError()}
                                />
                              );
                            }
                            
                            // Default text input for other fields
                            return (
                              <TextInput
                                key={idx}
                                label={q.question}
                                placeholder={`Enter ${q.question.toLowerCase().replace('*', '').trim()}`}
                                value={applicationAnswers[q.question] || ''}
                                onChange={(e) => setApplicationAnswers(prev => ({
                                  ...prev,
                                  [q.question]: e.target.value
                                }))}
                                required
                                withAsterisk
                                error={applicationAnswers[q.question] && applicationAnswers[q.question].length < 1 ? 'This field is required' : undefined}
                              />
                            );
                          })}
                          
                          <Divider my="sm" />
                        </>
                      )}

                      {/* Resume Upload */}
                      <Box bg="gray.0" p="sm" style={{ borderRadius: 8 }}>
                        <Text fw={600} size="sm" c="gray.7">Documents</Text>
                      </Box>
                      
                      <FileInput
                        label="Upload Resume"
                        placeholder="Upload your resume"
                        leftSection={<IconUpload size={16} />}
                        value={resume}
                        onChange={handleResumeUpload}
                        accept=".pdf,.doc,.docx"
                        required
                        withAsterisk
                        disabled={uploading}
                        description={uploading ? 'Uploading...' : resumeUrl ? 'Resume uploaded!' : ''}
                      />
                    </Stack>
                  </ScrollArea>

                  <Divider my="md" />

                  <Stack gap="sm">
                    <Button 
                      fullWidth 
                      onClick={handleSubmit} 
                      size="md"
                      loading={submitting}
                      disabled={!resumeUrl || uploading}
                    >
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
