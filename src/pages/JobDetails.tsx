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
  fullName: string;
  contactNumber: string;
  email: string;
  currentLocation: string;
  zipCode: string;
  area: string;
  DOB: string;
  linkedInUrl: string;
  SSN: string;
  visaStatus: string;
  applicationAnswer: Array<{ question: string; answer: boolean | string }>;
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
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [area, setArea] = useState('');
  const [dob, setDob] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [ssn, setSsn] = useState('');
  const [visaStatus, setVisaStatus] = useState<string | null>(null);
  const [applicationAnswers, setApplicationAnswers] = useState<Record<string, boolean | string>>({});
  
  // Work Reference
  const [workRefName, setWorkRefName] = useState('');
  const [workRefTitle, setWorkRefTitle] = useState('');
  const [workRefEmail, setWorkRefEmail] = useState('');
  const [workRefPhone, setWorkRefPhone] = useState('');
  
  // Employer Details
  const [empCompanyName, setEmpCompanyName] = useState('');
  const [empContactName, setEmpContactName] = useState('');
  const [empContactEmail, setEmpContactEmail] = useState('');
  const [empContactNumber, setEmpContactNumber] = useState('');

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

  const handleSubmit = async () => {
    if (!job || !resumeUrl) {
      notifications.show({
        title: 'Error',
        message: 'Please upload your resume',
        color: 'red',
      });
      return;
    }

    setSubmitting(true);

    try {
      const applicationData: ApplicationFormData = {
        fullName,
        contactNumber,
        email,
        currentLocation,
        zipCode,
        area,
        DOB: dob,
        linkedInUrl,
        SSN: ssn,
        visaStatus: visaStatus || '',
        applicationAnswer: Object.entries(applicationAnswers).map(([question, answer]) => ({
          question,
          answer
        })),
        workRefDetails: [{
          name: workRefName,
          title: workRefTitle,
          email: workRefEmail,
          phone: workRefPhone,
        }],
        EmployerDetails: {
          companyName: empCompanyName,
          contactName: empContactName,
          contactEmail: empContactEmail,
          contactNumber: empContactNumber,
        },
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
              Thank you for applying to <strong>{job.title}</strong> at <strong>{job.admin.companyName}</strong>. 
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
                  <Text size="lg" c="dimmed">{job.admin.companyName}</Text>
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
                <Text fw={600} size="lg" mb="sm">Job Description</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{job.description}</Text>
              </Box>

              {job.responsibilities && (
                <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="sm">Responsibilities</Text>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{job.responsibilities}</Text>
                </Box>
              )}

              {(job.primarySkills?.length > 0 || job.niceToHaveSkills?.length > 0) && (
                <Box py="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text fw={600} size="lg" mb="md">Skills Required</Text>
                  
                  {job.primarySkills?.length > 0 && (
                    <Box mb="md">
                      <Text fw={500} size="sm" c="blue.6" mb="xs">Primary Skills:</Text>
                      <Group gap="xs" wrap="wrap">
                        {job.primarySkills.map((skill, idx) => (
                          <Badge key={idx} color="blue" variant="light">{skill}</Badge>
                        ))}
                      </Group>
                    </Box>
                  )}
                  
                  {job.niceToHaveSkills?.length > 0 && (
                    <Box>
                      <Text fw={500} size="sm" c="gray.6" mb="xs">Nice to Have:</Text>
                      <Group gap="xs" wrap="wrap">
                        {job.niceToHaveSkills.map((skill, idx) => (
                          <Badge key={idx} variant="outline" color="gray">{skill}</Badge>
                        ))}
                      </Group>
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
                    <Text fw={600} size="lg">Application Form</Text>
                  </Group>
                  
                  <ScrollArea h={600} offsetScrollbars>
                    <Stack gap="md" pr="md">
                      {/* Personal Information */}
                      <Text fw={600} size="sm" c="blue.6">Personal Information</Text>
                      
                      <TextInput
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                      
                      <TextInput
                        label="Email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      
                      <TextInput
                        label="Contact Number"
                        placeholder="+1-XXX-XXX-XXXX"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        required
                      />
                      
                      <TextInput
                        label="Current Location"
                        placeholder="City, State"
                        value={currentLocation}
                        onChange={(e) => setCurrentLocation(e.target.value)}
                        required
                      />
                      
                      <SimpleGrid cols={2}>
                        <TextInput
                          label="Zip Code"
                          placeholder="10001"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                        />
                        <TextInput
                          label="Area"
                          placeholder="Manhattan"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                        />
                      </SimpleGrid>
                      
                      <TextInput
                        label="Date of Birth"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                      />
                      
                      <TextInput
                        label="LinkedIn URL"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={linkedInUrl}
                        onChange={(e) => setLinkedInUrl(e.target.value)}
                      />
                      
                      <TextInput
                        label="SSN (Last 4 digits visible)"
                        placeholder="XXX-XX-6789"
                        value={ssn}
                        onChange={(e) => setSsn(e.target.value)}
                      />
                      
                      <Select
                        label="Visa Status"
                        placeholder="Select visa status"
                        data={VISA_STATUS_OPTIONS}
                        value={visaStatus}
                        onChange={setVisaStatus}
                        required
                      />

                      <Divider my="sm" />
                      
                      {/* Application Questions */}
                      {job.applicationQuestions && job.applicationQuestions.length > 0 && (
                        <>
                          <Text fw={600} size="sm" c="blue.6">Application Questions</Text>
                          {job.applicationQuestions.map((q, idx) => (
                            <Box key={idx}>
                              {q.type === 'boolean' ? (
                                <Box>
                                  <Text size="sm" fw={500} mb="xs">{q.question}</Text>
                                  <Radio.Group
                                    value={applicationAnswers[q.question]?.toString() || ''}
                                    onChange={(value) => setApplicationAnswers(prev => ({
                                      ...prev,
                                      [q.question]: value === 'true'
                                    }))}
                                  >
                                    <Group>
                                      <Radio value="true" label="Yes" />
                                      <Radio value="false" label="No" />
                                    </Group>
                                  </Radio.Group>
                                </Box>
                              ) : (
                                <TextInput
                                  label={q.question}
                                  value={applicationAnswers[q.question]?.toString() || ''}
                                  onChange={(e) => setApplicationAnswers(prev => ({
                                    ...prev,
                                    [q.question]: e.target.value
                                  }))}
                                />
                              )}
                            </Box>
                          ))}
                          <Divider my="sm" />
                        </>
                      )}

                      {/* Work Reference */}
                      <Text fw={600} size="sm" c="blue.6">Work Reference</Text>
                      
                      <TextInput
                        label="Company/Reference Name"
                        placeholder="Tech Solutions Inc"
                        value={workRefName}
                        onChange={(e) => setWorkRefName(e.target.value)}
                      />
                      
                      <TextInput
                        label="Title"
                        placeholder="Senior Developer"
                        value={workRefTitle}
                        onChange={(e) => setWorkRefTitle(e.target.value)}
                      />
                      
                      <TextInput
                        label="Email"
                        placeholder="reference@company.com"
                        value={workRefEmail}
                        onChange={(e) => setWorkRefEmail(e.target.value)}
                      />
                      
                      <TextInput
                        label="Phone"
                        placeholder="Phone number"
                        value={workRefPhone}
                        onChange={(e) => setWorkRefPhone(e.target.value)}
                      />

                      <Divider my="sm" />
                      
                      {/* Employer Details */}
                      <Text fw={600} size="sm" c="blue.6">Current Employer Details</Text>
                      
                      <TextInput
                        label="Company Name"
                        placeholder="Current company"
                        value={empCompanyName}
                        onChange={(e) => setEmpCompanyName(e.target.value)}
                      />
                      
                      <TextInput
                        label="Contact Name"
                        placeholder="HR contact name"
                        value={empContactName}
                        onChange={(e) => setEmpContactName(e.target.value)}
                      />
                      
                      <TextInput
                        label="Contact Email"
                        placeholder="hr@company.com"
                        value={empContactEmail}
                        onChange={(e) => setEmpContactEmail(e.target.value)}
                      />
                      
                      <TextInput
                        label="Contact Number"
                        placeholder="Phone number"
                        value={empContactNumber}
                        onChange={(e) => setEmpContactNumber(e.target.value)}
                      />

                      <Divider my="sm" />
                      
                      {/* Resume Upload */}
                      <Text fw={600} size="sm" c="blue.6">Documents</Text>
                      
                      <FileInput
                        label="Upload Resume"
                        placeholder="Upload your resume"
                        leftSection={<IconUpload size={16} />}
                        value={resume}
                        onChange={handleResumeUpload}
                        accept=".pdf,.doc,.docx"
                        required
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