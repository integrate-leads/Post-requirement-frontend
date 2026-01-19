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
import { IconBriefcase, IconEye, IconX, IconCalendar } from '@tabler/icons-react';
import PaymentModal from '@/components/payment/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { 
  USA_JOB_TYPES,
  INDIA_JOB_TYPES,
  WORK_TYPES,
  USA_DOCUMENT_OPTIONS
} from '@/data/locationData';
import { USA_STATES_NEW, INDIA_STATES_NEW, USA_CITIES_LIST, INDIA_CITIES_LIST } from '@/data/statesAndCities';
import { format } from 'date-fns';
import DatePicker from '@/components/ui/DatePicker';
import { validateJobTitle, validateDescription, validatePayRate } from '@/lib/validations';
import FormattedText from '@/components/FormattedText';

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

// India Document Options
const INDIA_DOCUMENT_OPTIONS = [
  'Upload Updated Resume',
  'Upload Cover Letter',
  'Upload Aadhar Card',
  'Upload PAN Card',
  'Upload Educational Certificates'
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
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>(undefined);
  const [projectEndDate, setProjectEndDate] = useState<Date | undefined>(undefined);
  const [primarySkills, setPrimarySkills] = useState('');
  const [niceToHaveSkills, setNiceToHaveSkills] = useState('');
  
  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [payRateError, setPayRateError] = useState('');
  const [countryError, setCountryError] = useState(false);
  const [statesError, setStatesError] = useState(false);
  const [workTypeError, setWorkTypeError] = useState(false);
  const [jobTypesError, setJobTypesError] = useState(false);
  const [planError, setPlanError] = useState(false);
  
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

  // Available cities based on country (full list, user can search)
  const availableCities = useMemo(() => {
    return country === 'USA' ? USA_CITIES_LIST : INDIA_CITIES_LIST;
  }, [country]);

  const selectedPlan = billingPlans.find(p => p.id.toString() === selectedPlanId);
  const amount = selectedPlan ? parseInt(selectedPlan.amount) : 0;

  const currencySymbol = country === 'India' ? '₹' : '$';
  const dayOptions = billingPlans.map((plan) => ({ 
    value: plan.id.toString(), 
    label: `${plan.timePeriod} - ${currencySymbol}${plan.amount}` 
  }));

  const jobTypeOptions = country === 'USA' ? USA_JOB_TYPES : INDIA_JOB_TYPES;
  const stateOptions = country === 'USA' ? USA_STATES_NEW : INDIA_STATES_NEW;
  const documentOptions = country === 'USA' ? USA_DOCUMENT_OPTIONS : INDIA_DOCUMENT_OPTIONS;

  // Date format based on country
  const dateDisplayFormat = country === 'USA' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';

  const handleCountryChange = (value: string | null) => {
    setCountry(value);
    if (value) setCountryError(false);
    setSelectedStates([]);
    setSelectedCities([]);
    setJobTypes([]);
    setSelectedQuestions([]);
    // Auto-select resume for India
    setSelectedDocuments(['Upload Updated Resume']);
  };

  // Clear errors dynamically when fields are filled
  const handleStatesChange = (values: string[]) => {
    setSelectedStates(values);
    if (values.length > 0) setStatesError(false);
  };

  const handleWorkTypeChange = (value: string | null) => {
    setWorkType(value);
    if (value) setWorkTypeError(false);
  };

  const handleJobTypesChange = (values: string[]) => {
    setJobTypes(values);
    if (values.length > 0) setJobTypesError(false);
  };

  const handlePlanChange = (value: string | null) => {
    setSelectedPlanId(value);
    if (value) setPlanError(false);
  };

  // Real-time validation handlers
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value) {
      const result = validateJobTitle(value);
      setTitleError(result.isValid ? '' : result.error);
    } else {
      setTitleError('');
    }
  };

  const handlePayRateChange = (value: string) => {
    setPayRate(value);
    if (value) {
      const result = validatePayRate(value);
      setPayRateError(result.isValid ? '' : result.error);
    } else {
      setPayRateError('');
    }
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

  const handleSelectAllDocuments = () => {
    if (selectedDocuments.length === documentOptions.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments([...documentOptions]);
    }
  };

  const handleSaveAndPreview = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    let hasError = false;
    const errorFields: string[] = [];
    
    const titleResult = validateJobTitle(title);
    if (!titleResult.isValid) {
      setTitleError(titleResult.error);
      errorFields.push('Job Title');
      hasError = true;
    }
    
    if (!country) {
      setCountryError(true);
      errorFields.push('Country');
      hasError = true;
    }
    
    if (selectedStates.length === 0) {
      setStatesError(true);
      errorFields.push('Work Location - State(s)');
      hasError = true;
    }
    
    if (!workType) {
      setWorkTypeError(true);
      errorFields.push('Work Type');
      hasError = true;
    }
    
    if (jobTypes.length === 0) {
      setJobTypesError(true);
      errorFields.push('Job Type');
      hasError = true;
    }
    
    if (!selectedPlanId) {
      setPlanError(true);
      errorFields.push('Posting Duration');
      hasError = true;
    }
    
    if (hasError) {
      notifications.show({
        title: 'Validation Error',
        message: `Please fill in: ${errorFields.join(', ')}`,
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
      city: selectedCities
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
      requiredDocuments: selectedDocuments.map(d => d.toLowerCase()),
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
        setProjectStartDate(undefined);
        setProjectEndDate(undefined);
        setPrimarySkills('');
        setNiceToHaveSkills('');
        setSelectedQuestions([]);
        setTitleError('');
        setPayRateError('');
        setCountryError(false);
        setStatesError(false);
        setWorkTypeError(false);
        setJobTypesError(false);
        setPlanError(false);
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
              error={countryError ? 'Country is required' : undefined}
              comboboxProps={{ withinPortal: true, zIndex: 1000 }}
            />
          </Group>
          
          <Stack gap="md">
            <TextInput
              label="Job Title / Role"
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              error={titleError}
              required
            />

            {/* Work Location - Multi Select with clear all button */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Box style={{ position: 'relative' }}>
                <MultiSelect
                  label="Work Location - State(s)"
                  placeholder="Select state(s)"
                  data={stateOptions}
                  value={selectedStates}
                  onChange={handleStatesChange}
                  searchable
                  required
                  error={statesError ? 'At least one state is required' : undefined}
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  styles={{
                    pillsList: { flexWrap: 'wrap', paddingRight: 30 },
                    pill: { margin: 2 },
                    input: statesError ? { borderColor: 'var(--mantine-color-red-6)' } : {}
                  }}
                />
                {selectedStates.length > 0 && (
                  <IconX 
                    size={16} 
                    style={{ 
                      cursor: 'pointer', 
                      position: 'absolute', 
                      right: 12, 
                      top: 38, 
                      color: '#868e96',
                      zIndex: 10
                    }} 
                    onClick={() => setSelectedStates([])}
                  />
                )}
              </Box>
              <Box style={{ position: 'relative' }}>
                <MultiSelect
                  label="Work Location - City/Cities"
                  placeholder="Select city/cities"
                  data={availableCities}
                  value={selectedCities}
                  onChange={setSelectedCities}
                  searchable
                  disabled={selectedStates.length === 0}
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  styles={{
                    pillsList: { flexWrap: 'wrap', paddingRight: 30 },
                    pill: { margin: 2 }
                  }}
                />
                {selectedCities.length > 0 && (
                  <IconX 
                    size={16} 
                    style={{ 
                      cursor: 'pointer', 
                      position: 'absolute', 
                      right: 12, 
                      top: 38, 
                      color: '#868e96',
                      zIndex: 10
                    }} 
                    onClick={() => setSelectedCities([])}
                  />
                )}
              </Box>
            </SimpleGrid>

            {/* Work Type */}
            <Select
              label="Work Type"
              placeholder="Select work type"
              data={WORK_TYPES}
              value={workType}
              onChange={handleWorkTypeChange}
              required
              error={workTypeError ? 'Work type is required' : undefined}
              comboboxProps={{ withinPortal: true, zIndex: 1000 }}
            />

            {/* Job Type - Multi Select */}
            <MultiSelect
              label="Job Type"
              placeholder="Select job type(s)"
              data={jobTypeOptions}
              value={jobTypes}
              onChange={handleJobTypesChange}
              required
              error={jobTypesError ? 'At least one job type is required' : undefined}
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
              onChange={(e) => handlePayRateChange(e.target.value)}
              error={payRateError}
            />

            <TextInput
              label="Client"
              placeholder="Client name"
              value={client}
              onChange={(e) => setClient(e.target.value.slice(0, 100))}
              maxLength={100}
              description={client.length > 0 ? `${client.length}/100 characters` : undefined}
            />

            {/* Date Pickers using Custom DatePicker */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <DatePicker
                label="Project Start Date"
                placeholder="Select date"
                value={projectStartDate}
                onChange={setProjectStartDate}
                country={country || 'USA'}
                clearable
              />
              <DatePicker
                label="Project End Date"
                placeholder="Select date"
                value={projectEndDate}
                onChange={setProjectEndDate}
                country={country || 'USA'}
                clearable
              />
            </SimpleGrid>

            <Box>
              <Text size="sm" fw={500} mb={4}>Primary Skills Required</Text>
              <Textarea
                placeholder="Enter skills separated by comma or new line (e.g., React, TypeScript, Node.js). You can use • or - for bullet points."
                value={primarySkills}
                onChange={(e) => setPrimarySkills(e.target.value.slice(0, 2000))}
                minRows={4}
                autosize
                maxLength={2000}
                styles={{
                  input: {
                    whiteSpace: 'pre-wrap',
                  }
                }}
              />
              <Text size="xs" c={primarySkills.length > 1800 ? 'red' : 'dimmed'} ta="right" mt={4}>
                {primarySkills.length}/2000 characters
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={500} mb={4}>Nice to Have Skills</Text>
              <Textarea
                placeholder="Enter skills separated by comma or new line (e.g., AWS, Docker, GraphQL). You can use • or - for bullet points."
                value={niceToHaveSkills}
                onChange={(e) => setNiceToHaveSkills(e.target.value.slice(0, 2000))}
                minRows={4}
                autosize
                maxLength={2000}
                styles={{
                  input: {
                    whiteSpace: 'pre-wrap',
                  }
                }}
              />
              <Text size="xs" c={niceToHaveSkills.length > 1800 ? 'red' : 'dimmed'} ta="right" mt={4}>
                {niceToHaveSkills.length}/2000 characters
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={500} mb={4}>Job Description & Responsibilities</Text>
              <Textarea
                placeholder="Enter a detailed description of the job including key responsibilities... (Supports bullet points using • or -, numbered lists, and formatted text)"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                minRows={8}
                autosize
                maxLength={5000}
                styles={{
                  input: {
                    whiteSpace: 'pre-wrap',
                  }
                }}
              />
              <Text size="xs" c={description.length > 4500 ? 'red' : 'dimmed'} ta="right" mt={4}>
                {description.length}/5000 characters
              </Text>
            </Box>
          </Stack>
        </Card>

        {/* Application Questions - Checkbox based */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Box>
              <Text fw={600} size="lg">Details Required at the Time of Submission</Text>
              <Text size="sm" c="dimmed">Select the fields applicants must fill</Text>
            </Box>
            <Badge color="blue" size="lg">{country}</Badge>
          </Group>

          {/* Select All Checkbox */}
          <Checkbox
            label="Select All"
            checked={selectedQuestions.length === applicationFields.length}
            indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < applicationFields.length}
            onChange={handleSelectAllQuestions}
            mb="md"
            fw={600}
          />

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

          <Divider my="md" />
          <Box>
            <Text fw={500} mb="sm">Documents Required</Text>
            <Text size="xs" c="dimmed" mb="sm">
              {country === 'India' 
                ? 'Select documents required from applicants (Resume auto-selected)' 
                : 'Select which documents applicant should upload'}
            </Text>
            
            <Checkbox
              label="Select All Documents"
              checked={selectedDocuments.length === documentOptions.length}
              indeterminate={selectedDocuments.length > 0 && selectedDocuments.length < documentOptions.length}
              onChange={handleSelectAllDocuments}
              mb="sm"
              fw={600}
            />
            
            <Stack gap="xs">
              {documentOptions.map((doc) => (
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
                onChange={handlePlanChange}
                required
                error={planError ? 'Posting duration is required' : undefined}
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
                <Text size="xl" fw={700} c="blue">{currencySymbol}{amount}</Text>
              </Box>
            </>
          )}
        </Card>

        <Group justify="flex-end">
          <Button 
            type="submit" 
            size="lg" 
            leftSection={<IconEye size={18} />}
            disabled={loadingPlans}
            style={{ minWidth: 200 }}
          >
            Save & Preview
          </Button>
        </Group>
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
                <Badge color="blue" size="lg">{currencySymbol}{amount}</Badge>
              </Group>
            </Paper>

            {/* Quick Info - Text based instead of all badges */}
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

            {/* Primary Skills - preserve formatting */}
            {primarySkills && (
              <Box>
                <Text fw={600} mb="xs">Primary Skills</Text>
                <FormattedText text={primarySkills} c="blue.7" />
              </Box>
            )}

            {/* Nice to Have Skills - preserve formatting */}
            {niceToHaveSkills && (
              <Box>
                <Text fw={600} mb="xs">Nice to Have Skills</Text>
                <FormattedText text={niceToHaveSkills} c="gray.7" />
              </Box>
            )}

            {/* Description - preserve formatting */}
            {description && (
              <Box>
                <Text fw={600} mb="xs">Description & Responsibilities</Text>
                <FormattedText text={description} />
              </Box>
            )}

            {/* Application Questions - Text format */}
            {selectedQuestions.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Required Application Fields</Text>
                <Group gap="xs" wrap="wrap">
                  {selectedQuestions.map((id) => {
                    const field = applicationFields.find(f => f.id === id);
                    return field ? (
                      <Badge key={id} color="green" variant="light" tt="uppercase">{field.label}</Badge>
                    ) : null;
                  })}
                </Group>
              </Box>
            )}

            {/* Work Locations - Separate states and cities */}
            <Box>
              <Text fw={600} mb="xs">Work Locations</Text>
              <Group gap="xs" wrap="wrap" mb="xs">
                {selectedStates.map((state, i) => (
                  <Badge key={`state-${i}`} color="gray" variant="filled" tt="uppercase">{state}</Badge>
                ))}
              </Group>
              {selectedCities.length > 0 && (
                <Group gap="xs" wrap="wrap">
                  {selectedCities.map((city, i) => (
                    <Badge key={`city-${i}`} color="blue" variant="filled" tt="uppercase">{city}</Badge>
                  ))}
                </Group>
              )}
            </Box>

            {/* Dates */}
            <SimpleGrid cols={{ base: 2 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Project Start Date</Text>
                <Text fw={500}>
                  {projectStartDate 
                    ? format(projectStartDate, dateDisplayFormat)
                    : 'Not specified'}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Project End Date</Text>
                <Text fw={500}>
                  {projectEndDate 
                    ? format(projectEndDate, dateDisplayFormat)
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
        country={country || 'USA'}
      />
    </Box>
  );
};

export default PostJob;
