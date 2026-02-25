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
  IconArrowLeft, 
  IconCheck, 
  IconUpload,
  IconFileText
} from '@tabler/icons-react';
import { formatDistanceToNow, format } from 'date-fns';
import { notifications } from '@mantine/notifications';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import FormattedText from '@/components/FormattedText';
import { DocumentUploadBlock } from '@/components/ui/file-upload';

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
  projectStartDate?: string | null;
  projectEndDate?: string | null;
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
  documents: Record<string, string>;
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
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [resume, setResume] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  
  // Additional document files and URLs
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({});
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  
  // Application answers for applicationQuestions
  const [applicationAnswers, setApplicationAnswers] = useState<Record<string, string>>({});
  
  // Track touched fields for error display
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false);

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
    setUploading(prev => ({ ...prev, resume: true }));

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
      setUploading(prev => ({ ...prev, resume: false }));
    }
  };

  // Handle document upload for other required documents
  const handleDocumentUpload = async (docName: string, file: File | null) => {
    if (!file) {
      setDocumentFiles(prev => ({ ...prev, [docName]: null }));
      setDocumentUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[docName];
        return newUrls;
      });
      return;
    }

    setDocumentFiles(prev => ({ ...prev, [docName]: file }));
    setUploading(prev => ({ ...prev, [docName]: true }));

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
        setDocumentUrls(prev => ({ ...prev, [docName]: response.data.data.files[0].url }));
        notifications.show({
          title: 'Success',
          message: `${docName} uploaded successfully`,
          color: 'green',
        });
      }
    } catch (error) {
      console.error(`Failed to upload ${docName}:`, error);
      notifications.show({
        title: 'Error',
        message: `Failed to upload ${docName}`,
        color: 'red',
      });
    } finally {
      setUploading(prev => ({ ...prev, [docName]: false }));
    }
  };

  // Mark field as touched
  const markFieldTouched = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  // Check if field should show error (touched or form submitted + empty/invalid)
  const shouldShowFieldError = (fieldName: string) => {
    return touchedFields[fieldName] || formSubmitAttempted;
  };

  // Get required field error (empty check)
  const getRequiredError = (fieldName: string, value: string | undefined) => {
    if (!shouldShowFieldError(fieldName)) return undefined;
    if (!value || value.trim() === '') return 'This field is required';
    return undefined;
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    if (!job) return false;
    
    setFormSubmitAttempted(true);
    
    const missingFields: string[] = [];
    
    // Check resume
    if (!resumeUrl) {
      missingFields.push('Resume');
    }

    // Check all application questions are answered
    const requiredQuestions = job.applicationQuestions || [];
    for (const q of requiredQuestions) {
      const answer = applicationAnswers[q.question];
      if (!answer || answer.trim() === '') {
        missingFields.push(q.question);
      }
    }

    if (missingFields.length > 0) {
      notifications.show({
        title: 'Please fill in all required fields',
        message: `Missing: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : ''}`,
        color: 'red',
      });
      return false;
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

      // Build documents object with all uploaded documents
      const documents: Record<string, string> = {
        resume: resumeUrl,
        ...documentUrls
      };

      // Only include applicationAnswer array - no separate fields
      const applicationData: ApplicationFormData = {
        applicationAnswer: Object.entries(applicationAnswers).map(([question, answer]) => ({
          question,
          answer
        })),
        workRefDetails,
        EmployerDetails,
        documents
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

  const formatProjectDate = (value?: string | null) => {
    if (!value) return 'Not specified';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Not specified';
    return format(parsed, 'MMM dd, yyyy');
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
            <Card shadow="sm" padding="xl" radius="md">
              {/* Title block */}
              <Box mb="xl">
                <Group gap="xs" mb="xs">
                  <Title order={2} style={{ wordBreak: 'break-word' }}>
                    {job.role || job.title}
                  </Title>
                  {job.isVerified === 'Approved' && (
                    <Badge size="sm" color="green" variant="light">Verified</Badge>
                  )}
                </Group>
                <Text size="lg" c="dimmed">
                  {job.admin?.companyName || job.clientName || 'Company'}
                </Text>
              </Box>

              {/* Key details - 2 columns, equal-width keys */}
              <Box mb="xl">
                <Text fw={600} size="md" c="gray.8" mb="md">Overview</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" verticalSpacing="sm">
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Country:</Text>
                    <Text size="sm" fw={500}>{job.country}</Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Location(s):</Text>
                    <Text size="sm" fw={500}>{getLocationString(job.workLocations)}</Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Work type:</Text>
                    <Text size="sm" fw={500}>{job.workType || '—'}</Text>
                  </Group>
                  {job.jobType?.length > 0 ? (
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Engagement type:</Text>
                      <Text size="sm" fw={500}>{job.jobType.join(', ')}</Text>
                    </Group>
                  ) : null}
                  {job.payRate ? (
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Pay rate:</Text>
                      <Text size="sm" fw={600} c="teal.7">{job.payRate}</Text>
                    </Group>
                  ) : null}
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Posted:</Text>
                    <Text size="sm" fw={500}>{formatDistanceToNow(new Date(job.createdAt))} ago</Text>
                  </Group>
                  {job.clientName && job.clientName !== 'Confidential' ? (
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Client:</Text>
                      <Text size="sm" fw={500}>{job.clientName}</Text>
                    </Group>
                  ) : null}
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Start date:</Text>
                    <Text size="sm" fw={500}>{formatProjectDate(job.projectStartDate)}</Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>End date:</Text>
                    <Text size="sm" fw={500}>{formatProjectDate(job.projectEndDate)}</Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>Status:</Text>
                    <Text size="sm" fw={500}>{job.status || '—'}</Text>
                  </Group>
                </SimpleGrid>
              </Box>

              {/* Project timeline */}
              <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                <Text fw={600} size="md" c="gray.8" mb="sm">Project timeline</Text>
                <Group gap="xl">
                  <Box>
                    <Text size="xs" c="dimmed">Start date</Text>
                    <Text size="sm" fw={500}>{formatProjectDate(job.projectStartDate)}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">End date</Text>
                    <Text size="sm" fw={500}>{formatProjectDate(job.projectEndDate)}</Text>
                  </Box>
                </Group>
              </Box>

              <Divider my="md" />

              <Box py="md">
                <Text fw={600} size="lg" mb="sm" c="gray.9">Description</Text>
                <FormattedText text={job.description} />
              </Box>

              {(job.primarySkills?.length > 0 || job.niceToHaveSkills?.length > 0) && (
                <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="md" c="gray.9">Skills required</Text>
                  {job.primarySkills?.length > 0 && (
                    <Box mb="sm">
                      <Text size="sm" fw={600} c="blue.7" mb="xs">Primary</Text>
                      <FormattedText text={job.primarySkills.join(', ')} c="gray.7" />
                    </Box>
                  )}
                  {job.niceToHaveSkills?.length > 0 && (
                    <Box>
                      <Text size="sm" fw={600} c="gray.6" mb="xs">Nice to have</Text>
                      <FormattedText text={job.niceToHaveSkills.join(', ')} c="gray.6" />
                    </Box>
                  )}
                </Box>
              )}

              {job.responsibilities && job.responsibilities.trim() !== job.description?.trim() && (
                <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="sm" c="gray.9">Responsibilities</Text>
                  <FormattedText text={job.responsibilities} />
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
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  error={requiredError}
                                  styles={requiredError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
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
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  error={requiredError}
                                  styles={requiredError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                                />
                              );
                            }
                            
                            if (isPhoneField) {
                              const fieldError = getFieldError();
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
                              const displayError = fieldError || requiredError;
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  maxLength={10}
                                  error={displayError}
                                  styles={displayError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                />
                              );
                            }
                            
                            if (isEmailField) {
                              const fieldError = getFieldError();
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
                              const displayError = fieldError || requiredError;
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  error={displayError}
                                  styles={displayError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                />
                              );
                            }
                            
                            if (isExperienceField) {
                              const fieldError = getFieldError();
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
                              const displayError = fieldError || requiredError;
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  error={displayError}
                                  styles={displayError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                />
                              );
                            }
                            
                            if (isNameField) {
                              const fieldError = getFieldError();
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
                              const displayError = fieldError || requiredError;
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  error={displayError}
                                  styles={displayError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                />
                              );
                            }
                            
                            if (isSalaryField) {
                              const fieldError = getFieldError();
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
                              const displayError = fieldError || requiredError;
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  error={displayError}
                                  styles={displayError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                />
                              );
                            }
                            
                            if (isSSNField) {
                              const fieldError = getFieldError();
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
                              const displayError = fieldError || requiredError;
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  maxLength={9}
                                  error={displayError}
                                  styles={displayError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                />
                              );
                            }
                            
                            if (isZipField) {
                              const fieldError = getFieldError();
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
                              const displayError = fieldError || requiredError;
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  maxLength={6}
                                  error={displayError}
                                  styles={displayError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                />
                              );
                            }
                            
                            if (isLinkedInField) {
                              const fieldError = getFieldError();
                              const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
                              const displayError = fieldError || requiredError;
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
                                  onBlur={() => markFieldTouched(q.question)}
                                  required
                                  withAsterisk
                                  error={displayError}
                                  styles={displayError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                                />
                              );
                            }
                            
                            // Default text input for other fields
                            const requiredError = getRequiredError(q.question, applicationAnswers[q.question]);
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
                                onBlur={() => markFieldTouched(q.question)}
                                required
                                withAsterisk
                                error={requiredError}
                                styles={requiredError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                              />
                            );
                          })}
                          
                          <Divider my="sm" />
                        </>
                      )}

                      {/* Document Uploads - India uses FileUploader-style UI */}
                      <Box bg="gray.0" p="sm" style={{ borderRadius: 8 }}>
                        <Text fw={600} size="sm" c="gray.7">Documents</Text>
                      </Box>
                      
                      {job.country === 'India' ? (
                        <>
                          {/* Resume - India UI */}
                          <DocumentUploadBlock
                            label="Upload Resume"
                            value={resume}
                            onChange={(file) => {
                              markFieldTouched('resume');
                              handleResumeUpload(file);
                            }}
                            accept=".pdf,.doc,.docx"
                            required
                            uploading={uploading['resume']}
                            description={uploading['resume'] ? 'Uploading...' : resumeUrl ? 'Resume uploaded!' : ''}
                            error={(touchedFields['resume'] || formSubmitAttempted) && !resumeUrl ? 'Resume is required' : undefined}
                            onTouch={() => markFieldTouched('resume')}
                          />
                          {job.requiredDocuments?.filter(doc => !doc.toLowerCase().includes('resume')).map((doc, idx) => {
                            const docKey = doc.toLowerCase().replace(/\s+/g, '_');
                            return (
                              <DocumentUploadBlock
                                key={idx}
                                label={doc.charAt(0).toUpperCase() + doc.slice(1)}
                                value={documentFiles[docKey] ?? null}
                                onChange={(file) => handleDocumentUpload(docKey, file)}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                required
                                uploading={uploading[docKey]}
                                description={uploading[docKey] ? 'Uploading...' : documentUrls[docKey] ? 'Uploaded!' : 'Required document'}
                              />
                            );
                          })}
                        </>
                      ) : (
                        <>
                          {/* Resume - default UI */}
                          {(() => {
                            const resumeError = (touchedFields['resume'] || formSubmitAttempted) && !resumeUrl ? 'Resume is required' : undefined;
                            return (
                              <FileInput
                                label="Upload Resume"
                                placeholder="Upload your resume"
                                leftSection={<IconUpload size={16} />}
                                value={resume}
                                onChange={(file) => {
                                  markFieldTouched('resume');
                                  handleResumeUpload(file);
                                }}
                                accept=".pdf,.doc,.docx"
                                required
                                withAsterisk
                                disabled={uploading['resume']}
                                description={uploading['resume'] ? 'Uploading...' : resumeUrl ? 'Resume uploaded!' : ''}
                                error={resumeError}
                                styles={resumeError ? { input: { borderColor: 'var(--mantine-color-red-6)' } } : undefined}
                              />
                            );
                          })()}
                          {job.requiredDocuments && job.requiredDocuments.filter(doc => !doc.toLowerCase().includes('resume')).map((doc, idx) => {
                            const docKey = doc.toLowerCase().replace(/\s+/g, '_');
                            const isUploading = uploading[docKey];
                            const docUrl = documentUrls[docKey];
                            return (
                              <FileInput
                                key={idx}
                                label={doc.charAt(0).toUpperCase() + doc.slice(1)}
                                placeholder={`Upload ${doc}`}
                                leftSection={<IconUpload size={16} />}
                                value={documentFiles[docKey] || null}
                                onChange={(file) => handleDocumentUpload(docKey, file)}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                disabled={isUploading}
                                description={isUploading ? 'Uploading...' : docUrl ? 'Uploaded!' : 'Required document'}
                                required
                                withAsterisk
                              />
                            );
                          })}
                        </>
                      )}
                    </Stack>
                  </ScrollArea>

                  <Divider my="md" />

                  <Stack gap="sm">
                    <Button 
                      fullWidth 
                      onClick={handleSubmit} 
                      size="md"
                      loading={submitting}
                      disabled={!resumeUrl || Object.values(uploading).some(v => v)}
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
