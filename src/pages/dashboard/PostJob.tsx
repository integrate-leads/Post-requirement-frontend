import React, { useState, useMemo, useEffect } from 'react';
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
  Checkbox,
  SimpleGrid,
  Divider,
  MultiSelect,
  Loader,
  Modal,
  Paper,
  ScrollArea
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconBriefcase, IconEye, IconX } from '@tabler/icons-react';
import PaymentModal from '@/components/payment/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { 
  USA_STATES, 
  USA_CITIES, 
  INDIA_STATES, 
  INDIA_CITIES,
  USA_JOB_TYPES,
  INDIA_JOB_TYPES,
  WORK_TYPES,
  USA_DOCUMENT_OPTIONS
} from '@/data/locationData';
import { format } from 'date-fns';

interface BillingPlan {
  id: number;
  amount: string;
  timePeriod: string;
}

// All application question fields
const USA_APPLICATION_FIELDS = [
  { id: 'fullName', label: 'Full Name' },
  { id: 'email', label: 'E-Mail ID' },
  { id: 'contactNumber', label: 'Contact Number' },
  { id: 'linkedinId', label: 'LinkedIn ID' },
  { id: 'last4SSN', label: 'Last 4 Digit SSN' },
  { id: 'currentLocation', label: 'Current Location' },
  { id: 'areaZipCode', label: 'Area – Zip Code' },
  { id: 'currentVisaStatus', label: 'Current Visa Status' },
  { id: 'comfortablePassport', label: 'Comfortable sharing Passport Number?' },
  { id: 'dateOfBirth', label: 'Date of Birth' },
  { id: 'fineWithRelocation', label: 'Fine with Relocation?' },
  { id: 'noticePeriod', label: 'Notice Period Required to Join' },
  { id: 'bestTimeToCall', label: 'Best Time to Answer Recruiter/Vendor Call' },
  { id: 'fineWithFaceToFace', label: 'Fine with Face to Face Interview?' },
  { id: 'twoInterviewSlots', label: 'Two Interview Time Slots (Date/Time/Timezone)' },
  { id: 'canProvideReferences', label: 'Can you Provide Work References?' },
  { id: 'refName', label: 'Reference Name' },
  { id: 'refTitle', label: 'Reference Title' },
  { id: 'refEmail', label: 'Reference E-Mail ID' },
  { id: 'refPhone', label: 'Reference Phone No' },
  { id: 'hasEmployer', label: 'Do you have Employer?' },
  { id: 'employerCompanyName', label: 'Employer Company Name' },
  { id: 'employerManagerName', label: 'Manager/HR/Recruiter Name' },
  { id: 'employerContactNo', label: 'Employer Contact No' },
  { id: 'employerEmail', label: 'Employer E-Mail ID' },
];

const INDIA_APPLICATION_FIELDS = [
  { id: 'fullName', label: 'Full Name' },
  { id: 'email', label: 'E-Mail ID' },
  { id: 'linkedinId', label: 'LinkedIn ID' },
  { id: 'contactNumber', label: 'Contact Number' },
  { id: 'currentLocation', label: 'Current Location' },
  { id: 'fineWithRelocation', label: 'Fine with Relocation?' },
  { id: 'bestTimeToCall', label: 'Best Time to Answer Phone Calls' },
  { id: 'currentCTC', label: 'Current CTC' },
  { id: 'expectingCTC', label: 'Expecting CTC' },
  { id: 'currentlyInProject', label: 'Currently in Project?' },
  { id: 'noticePeriod', label: 'Notice Period Required to Join' },
  { id: 'fineWithFaceToFace', label: 'Fine with Face to Face Interview?' },
];

const PostJob: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Country selection
  const [country, setCountry] = useState<string | null>('USA');
  
  // Common fields - Combined job title and role
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [workType, setWorkType] = useState<string | null>(null);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [otherJobType, setOtherJobType] = useState('');
  const [payRate, setPayRate] = useState('');
  const [client, setClient] = useState('');
  const [projectStartDate, setProjectStartDate] = useState<Date | null>(null);
  const [projectEndDate, setProjectEndDate] = useState<Date | null>(null);
  const [primarySkills, setPrimarySkills] = useState('');
  const [niceToHaveSkills, setNiceToHaveSkills] = useState('');
  
  // Application questions - checkbox based
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>(['Upload Updated Resume']);
  
  // Billing plans and duration
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  // Preview and Payment modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get application fields based on country
  const applicationFields = country === 'USA' ? USA_APPLICATION_FIELDS : INDIA_APPLICATION_FIELDS;

  // Fetch billing plans
  useEffect(() => {
    const fetchBillingPlans = async () => {
      try {
        const response = await api.get<{
          success: boolean;
          data: { plans: BillingPlan[] };
        }>(API_ENDPOINTS.ADMIN.BILLING_PLANS);
        
        if (response.data?.success) {
          setBillingPlans(response.data.data.plans);
          // Select first plan by default
          if (response.data.data.plans.length > 0) {
            setSelectedPlanId(response.data.data.plans[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch billing plans:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load billing plans',
          color: 'red',
        });
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchBillingPlans();
  }, []);

  // Available cities based on selected states
  const availableCities = useMemo(() => {
    const citiesMap = country === 'USA' ? USA_CITIES : INDIA_CITIES;
    const cities: string[] = [];
    selectedStates.forEach(state => {
      if (citiesMap[state]) {
        cities.push(...citiesMap[state]);
      }
    });
    return [...new Set(cities)];
  }, [selectedStates, country]);

  const selectedPlan = billingPlans.find(p => p.id.toString() === selectedPlanId);
  const amount = selectedPlan ? parseInt(selectedPlan.amount) : 0;

  const dayOptions = billingPlans.map((plan) => ({ 
    value: plan.id.toString(), 
    label: `${plan.timePeriod} - $${plan.amount}` 
  }));

  const jobTypeOptions = country === 'USA' ? USA_JOB_TYPES : INDIA_JOB_TYPES;
  const stateOptions = country === 'USA' ? USA_STATES : INDIA_STATES;

  // Date format based on country
  const dateFormat = country === 'USA' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';

  const handleCountryChange = (value: string | null) => {
    setCountry(value);
    setSelectedStates([]);
    setSelectedCities([]);
    setJobTypes([]);
    setSelectedQuestions([]);
  };

  const handleSelectAllQuestions = () => {
    if (selectedQuestions.length === applicationFields.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(applicationFields.map(f => f.id));
    }
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSaveAndPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !country || selectedStates.length === 0 || !selectedPlanId) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fill in all required fields',
        color: 'red',
      });
      return;
    }
    setPreviewModalOpen(true);
  };

  const handleProceedToPayment = () => {
    setPreviewModalOpen(false);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!user || !selectedPlan) return;
    
    setSubmitting(true);

    // Build work locations
    const workLocations = selectedStates.map(state => ({
      state,
      city: selectedCities.filter(city => {
        const citiesMap = country === 'USA' ? USA_CITIES : INDIA_CITIES;
        return citiesMap[state]?.includes(city);
      })
    }));

    // Build final job types
    const finalJobTypes = jobTypes.includes('Others') && otherJobType 
      ? [...jobTypes.filter(j => j !== 'Others'), otherJobType]
      : jobTypes;

    // Build application questions from selected checkboxes
    const applicationQuestions = selectedQuestions.map(id => {
      const field = applicationFields.find(f => f.id === id);
      return {
        question: field?.label || id,
        type: 'yes'
      };
    });

    // Parse skills from textarea (comma or newline separated)
    const parsePrimarySkills = primarySkills.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const parseNiceToHaveSkills = niceToHaveSkills.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

    const jobData = {
      title,
      description,
      country,
      role: title, // Using title as role since they're combined
      client,
      workLocations,
      workType: workType || 'Remote',
      jobType: finalJobTypes,
      payRate,
      projectStartDate: projectStartDate ? format(projectStartDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      projectEndDate: projectEndDate ? format(projectEndDate, 'yyyy-MM-dd') : format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      primarySkills: parsePrimarySkills,
      niceToHaveSkills: parseNiceToHaveSkills,
      responsibilities: description, // Combined with description
      applicationQuestions,
      requiredDocuments: country === 'USA' ? selectedDocuments.map(d => d.toLowerCase()) : ['resume'],
      planAmount: selectedPlan.amount,
    };

    try {
      const response = await api.post<{ success: boolean; message: string }>(
        API_ENDPOINTS.ADMIN.CREATE_JOB,
        jobData
      );

      if (response.data?.success) {
        notifications.show({
          title: 'Success',
          message: 'Job posted successfully!',
          color: 'green',
        });

        // Reset form
        setTitle('');
        setDescription('');
        setSelectedStates([]);
        setSelectedCities([]);
        setWorkType(null);
        setJobTypes([]);
        setPayRate('');
        setClient('');
        setProjectStartDate(null);
        setProjectEndDate(null);
        setPrimarySkills('');
        setNiceToHaveSkills('');
        setSelectedQuestions([]);
        if (billingPlans.length > 0) {
          setSelectedPlanId(billingPlans[0].id.toString());
        }
        setPaymentModalOpen(false);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: 'Error',
        message: axiosError.response?.data?.message || 'Failed to create job posting',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maw={900} mx="auto">
      <Box mb="xl">
        <Title order={2}>Recruiter Post the Job Description</Title>
        <Text c="dimmed" size="sm">Fill in the details to create a new job posting</Text>
      </Box>

      <form onSubmit={handleSaveAndPreview}>
        {/* Country Selection */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Group justify="space-between" align="center" mb="md">
            <Text fw={600} size="lg">Job Details</Text>
            <Select
              placeholder="Select Country"
              data={['USA', 'India']}
              value={country}
              onChange={handleCountryChange}
              required
              w={150}
              comboboxProps={{ withinPortal: true, zIndex: 1000 }}
            />
          </Group>
          
          <Stack gap="md">
            <TextInput
              label="Job Title / Role"
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              label="Job Description & Responsibilities"
              placeholder="Enter a detailed description of the job including key responsibilities..."
              minRows={8}
              autosize
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Work Location - Multi Select with fixed close button */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <MultiSelect
                label="Work Location - State(s)"
                placeholder="Select state(s)"
                data={stateOptions}
                value={selectedStates}
                onChange={setSelectedStates}
                searchable
                clearable
                required
                comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                styles={{
                  pillsList: { flexWrap: 'wrap' },
                  pill: { margin: 2 }
                }}
                rightSection={
                  selectedStates.length > 0 ? (
                    <IconX 
                      size={14} 
                      style={{ cursor: 'pointer', position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} 
                      onClick={() => setSelectedStates([])}
                    />
                  ) : null
                }
              />
              <MultiSelect
                label="Work Location - City/Cities"
                placeholder="Select city/cities"
                data={availableCities}
                value={selectedCities}
                onChange={setSelectedCities}
                searchable
                clearable
                disabled={selectedStates.length === 0}
                comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                styles={{
                  pillsList: { flexWrap: 'wrap' },
                  pill: { margin: 2 }
                }}
                rightSection={
                  selectedCities.length > 0 ? (
                    <IconX 
                      size={14} 
                      style={{ cursor: 'pointer', position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} 
                      onClick={() => setSelectedCities([])}
                    />
                  ) : null
                }
              />
            </SimpleGrid>

            {/* Work Type */}
            <Select
              label="Work Type"
              placeholder="Select work type"
              data={WORK_TYPES}
              value={workType}
              onChange={setWorkType}
              required
              comboboxProps={{ withinPortal: true, zIndex: 1000 }}
            />

            {/* Job Type - Multi Select */}
            <MultiSelect
              label="Job Type"
              placeholder="Select job type(s)"
              data={jobTypeOptions}
              value={jobTypes}
              onChange={setJobTypes}
              required
              comboboxProps={{ withinPortal: true, zIndex: 1000 }}
            />
            {jobTypes.includes('Others') && (
              <TextInput
                label="Please specify job type"
                placeholder="Enter job type"
                value={otherJobType}
                onChange={(e) => setOtherJobType(e.target.value)}
              />
            )}

            {/* Pay Rate */}
            <TextInput
              label={`Pay Rate ${country === 'USA' ? '($ / DOE)' : '(₹ / DOE)'}`}
              placeholder={country === 'USA' ? 'e.g., $80-100/hour or DOE' : 'e.g., ₹15L-25L per annum or DOE'}
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
            />

            <TextInput
              label="Client"
              placeholder="Client name"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <DateInput
                label="Project Start Date"
                placeholder={dateFormat}
                value={projectStartDate}
                onChange={setProjectStartDate}
                valueFormat={country === 'USA' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
                popoverProps={{ withinPortal: true, zIndex: 1000 }}
                clearable
              />
              <DateInput
                label="Project End Date"
                placeholder={dateFormat}
                value={projectEndDate}
                onChange={setProjectEndDate}
                valueFormat={country === 'USA' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
                popoverProps={{ withinPortal: true, zIndex: 1000 }}
                clearable
              />
            </SimpleGrid>

            <Textarea
              label="Primary Skills Required"
              placeholder="Enter skills separated by comma or new line (e.g., React, TypeScript, Node.js)"
              minRows={3}
              autosize
              value={primarySkills}
              onChange={(e) => setPrimarySkills(e.target.value)}
            />

            <Textarea
              label="Nice to Have Skills"
              placeholder="Enter skills separated by comma or new line (e.g., AWS, Docker, GraphQL)"
              minRows={3}
              autosize
              value={niceToHaveSkills}
              onChange={(e) => setNiceToHaveSkills(e.target.value)}
            />
          </Stack>
        </Card>

        {/* Application Questions - Checkbox based */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Box>
              <Text fw={600} size="lg">Details Required at the Time of Submission</Text>
              <Text size="sm" c="dimmed">Select the fields applicants must fill</Text>
            </Box>
            <Group gap="sm">
              <Badge color="blue" size="lg">{country}</Badge>
              <Button 
                variant="light" 
                size="xs" 
                onClick={handleSelectAllQuestions}
              >
                {selectedQuestions.length === applicationFields.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {applicationFields.map((field) => (
              <Checkbox
                key={field.id}
                label={field.label}
                checked={selectedQuestions.includes(field.id)}
                onChange={() => handleQuestionToggle(field.id)}
              />
            ))}
          </SimpleGrid>

          {country === 'USA' && (
            <>
              <Divider my="md" />
              <Box>
                <Text fw={500} mb="sm">Documents Required</Text>
                <Text size="xs" c="dimmed" mb="sm">Select which documents applicant should upload</Text>
                <Stack gap="xs">
                  {USA_DOCUMENT_OPTIONS.map((doc) => (
                    <Checkbox
                      key={doc}
                      label={doc}
                      checked={selectedDocuments.includes(doc)}
                      onChange={(e) => {
                        setSelectedDocuments(prev => 
                          e.target.checked
                            ? [...prev, doc]
                            : prev.filter(d => d !== doc)
                        );
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Card>

        {/* Posting Duration Card */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Text fw={600} size="lg" mb="md">Posting Duration</Text>
          {loadingPlans ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : (
            <>
              <Select
                label="How long should this job be active?"
                data={dayOptions}
                value={selectedPlanId}
                onChange={(value) => setSelectedPlanId(value)}
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
                <Text size="xl" fw={700} c="blue">${amount}</Text>
              </Box>
            </>
          )}
        </Card>

        <Button 
          type="submit" 
          size="lg" 
          fullWidth 
          leftSection={<IconEye size={18} />}
          disabled={loadingPlans}
        >
          Save & Preview
        </Button>
      </form>

      {/* Preview Modal - Wider */}
      <Modal
        opened={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={<Text fw={600} size="lg">Job Description Preview</Text>}
        size="xl"
        fullScreen={isMobile}
      >
        <ScrollArea h={isMobile ? undefined : 500}>
          <Stack gap="md">
            {/* Job Title and Details */}
            <Paper p="md" bg="gray.0" radius="md">
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Box>
                  <Text size="xl" fw={600}>{title || 'Job Title'}</Text>
                  <Group gap="xs" mt={4} wrap="wrap">
                    <Badge>{country}</Badge>
                    <Text size="sm" c="dimmed">{selectedStates.join(', ')}</Text>
                  </Group>
                </Box>
                <Badge color="blue" size="lg">${amount}</Badge>
              </Group>
            </Paper>

            {/* Quick Info */}
            <SimpleGrid cols={{ base: 2 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Work Type</Text>
                <Text fw={500}>{workType || 'Not specified'}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Job Type</Text>
                <Text fw={500}>{jobTypes.join(', ') || 'Not specified'}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Pay Rate</Text>
                <Text fw={500}>{payRate || 'Not specified'}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Client</Text>
                <Text fw={500}>{client || 'Not specified'}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Duration</Text>
                <Text fw={500}>{selectedPlan?.timePeriod || 'Not specified'}</Text>
              </Box>
            </SimpleGrid>

            <Divider />

            {/* Description */}
            {description && (
              <Box>
                <Text fw={600} mb="xs">Description & Responsibilities</Text>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{description}</Text>
              </Box>
            )}

            {/* Skills */}
            {primarySkills && (
              <Box>
                <Text fw={600} mb="xs">Primary Skills</Text>
                <Group gap="xs" wrap="wrap">
                  {primarySkills.split(/[,\n]/).map((skill, i) => skill.trim() && (
                    <Badge key={i} variant="light">{skill.trim()}</Badge>
                  ))}
                </Group>
              </Box>
            )}

            {niceToHaveSkills && (
              <Box>
                <Text fw={600} mb="xs">Nice to Have Skills</Text>
                <Group gap="xs" wrap="wrap">
                  {niceToHaveSkills.split(/[,\n]/).map((skill, i) => skill.trim() && (
                    <Badge key={i} variant="outline">{skill.trim()}</Badge>
                  ))}
                </Group>
              </Box>
            )}

            {/* Application Questions */}
            {selectedQuestions.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Required Application Fields</Text>
                <Group gap="xs" wrap="wrap">
                  {selectedQuestions.map((id) => {
                    const field = applicationFields.find(f => f.id === id);
                    return field ? (
                      <Badge key={id} color="green" variant="light">{field.label}</Badge>
                    ) : null;
                  })}
                </Group>
              </Box>
            )}

            {/* Locations */}
            <Box>
              <Text fw={600} mb="xs">Work Locations</Text>
              <Group gap="xs" wrap="wrap">
                {selectedStates.map((state, i) => (
                  <Badge key={i} color="gray" variant="light">{state}</Badge>
                ))}
                {selectedCities.map((city, i) => (
                  <Badge key={i} color="blue" variant="light">{city}</Badge>
                ))}
              </Group>
            </Box>

            {/* Dates */}
            <SimpleGrid cols={{ base: 2 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Project Start Date</Text>
                <Text fw={500}>
                  {projectStartDate 
                    ? format(projectStartDate, country === 'USA' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')
                    : 'Not specified'}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Project End Date</Text>
                <Text fw={500}>
                  {projectEndDate 
                    ? format(projectEndDate, country === 'USA' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')
                    : 'Not specified'}
                </Text>
              </Box>
            </SimpleGrid>
          </Stack>
        </ScrollArea>

        <Divider my="md" />
        
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
            Edit
          </Button>
          <Button leftSection={<IconBriefcase size={16} />} onClick={handleProceedToPayment}>
            Proceed to Payment
          </Button>
        </Group>
      </Modal>

      <PaymentModal 
        opened={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        amount={amount} 
        description={`Job Posting: ${title} (${selectedPlan?.timePeriod || ''})`} 
        onPaymentSubmit={handlePaymentSubmit}
        isSubmitting={submitting}
      />
    </Box>
  );
};

export default PostJob;