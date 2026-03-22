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
  Checkbox,
  SimpleGrid,
  Modal,
  ScrollArea,
  Divider
} from '@mantine/core';
import { IconBriefcase, IconEye } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { DashboardPageHeader } from '@/components/dashboard';
import {
  USA_JOB_TYPES,
  INDIA_JOB_TYPES,
  WORK_TYPES,
  USA_DOCUMENT_OPTIONS
} from '@/data/locationData';
import { USA_STATES_NEW, INDIA_STATES_NEW, USA_CITIES_LIST, INDIA_CITIES_LIST } from '@/data/statesAndCities';
import { format } from 'date-fns';
import { SmartDatetimeInput } from '@/components/ui/datetime-input';
import { MultiSelector } from '@/components/ui/multi-selector';
import { validateJobTitle, validateDescription, validatePayRate } from '@/lib/validations';
import FormattedText from '@/components/FormattedText';

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

// India Document Options (Cover Letter & Educational Certificates removed per UX)
const INDIA_DOCUMENT_OPTIONS = [
  'Upload Updated Resume',
  'Upload Aadhar Card',
  'Upload PAN Card',
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

  // Application questions - checkbox based
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>(['Upload Updated Resume']);

  // Preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Description tab: 'edit' | 'preview'
  const [descTab, setDescTab] = useState<'edit' | 'preview'>('edit');

  // Get application fields based on country
  const applicationFields = country === 'USA' ? USA_APPLICATION_FIELDS : INDIA_APPLICATION_FIELDS;

  // Available cities based on country (full list, user can search)
  const availableCities = useMemo(() => {
    return country === 'USA' ? USA_CITIES_LIST : INDIA_CITIES_LIST;
  }, [country]);

  const jobTypeOptions = country === 'USA' ? USA_JOB_TYPES : INDIA_JOB_TYPES;
  const stateOptions = country === 'USA' ? USA_STATES_NEW : INDIA_STATES_NEW;
  const documentOptions = country === 'USA' ? USA_DOCUMENT_OPTIONS : INDIA_DOCUMENT_OPTIONS;

  const stateSelectorOptions = useMemo(
    () => stateOptions.map((s) => ({ label: s, value: s })),
    [stateOptions]
  );
  const citySelectorOptions = useMemo(
    () => availableCities.map((c) => ({ label: c, value: c })),
    [availableCities]
  );
  const jobTypeSelectorOptions = useMemo(
    () => jobTypeOptions.map((j) => ({ label: j, value: j })),
    [jobTypeOptions]
  );

  // Date format based on country
  const dateDisplayFormat = country === 'USA' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';

  // Clamp end date when start date changes: end cannot be before start or today
  useEffect(() => {
    if (!projectStartDate || !projectEndDate) return;
    const start = new Date(projectStartDate);
    const end = new Date(projectEndDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < start || end < today) {
      setProjectEndDate(start >= today ? new Date(start) : new Date(today));
    }
  }, [projectStartDate]);

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

  const normalizeRequiredDocument = (doc: string) => {
    const normalized = doc.toLowerCase();
    if (normalized.includes('resume')) return 'resume';
    if (normalized.includes('aadhar')) return 'aadhar';
    if (normalized.includes('pan')) return 'pan';
    if (normalized.includes('cover')) return 'coverLetter';
    return normalized.replace(/\s+/g, '');
  };

  const handleSubmitJob = async () => {
    if (!user) return;

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
          type: 'boolean'
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
      // Only include project dates when recruiter has explicitly selected them
      projectStartDate: projectStartDate ? format(projectStartDate, 'yyyy-MM-dd') : undefined,
      projectEndDate: projectEndDate ? format(projectEndDate, 'yyyy-MM-dd') : undefined,
      primarySkills: parsePrimarySkills,
      niceToHaveSkills: parseNiceToHaveSkills,
      responsibilities: description, // Combined with description
      applicationQuestions,
      requiredDocuments: selectedDocuments.map(normalizeRequiredDocument),
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
        setPreviewModalOpen(false);
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
    <Box maw={1200} mx="auto" px={{ base: 'xs', sm: 0 }}>
      <DashboardPageHeader
        icon={<IconBriefcase size={24} stroke={1.75} />}
        title="Post a job"
        description="Fill in the details to create a new job posting for your chosen country and work model."
      />

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

            {/* Work Location - Multi-selector (States & Cities) */}
            <Box>
              <Text size="sm" fw={600} mb="sm">Work Location</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Box>
                  <Text size="sm" fw={500} mb={4}>State(s) *</Text>
                  <MultiSelector
                    options={stateSelectorOptions}
                    value={selectedStates}
                    onValueChange={handleStatesChange}
                    placeholder="Select state(s)"
                    maxCount={5}
                    showall={false}
                    className={statesError ? 'border-red-500' : undefined}
                  />
                  {statesError && (
                    <Text size="xs" c="red" mt={4}>At least one state is required</Text>
                  )}
                </Box>
                <Box>
                  <Text size="sm" fw={500} mb={4}>City/Cities</Text>
                  <MultiSelector
                    options={citySelectorOptions}
                    value={selectedCities}
                    onValueChange={setSelectedCities}
                    placeholder="Select city/cities"
                    maxCount={5}
                    showall={false}
                    disabled={selectedStates.length === 0}
                  />
                </Box>
              </SimpleGrid>
            </Box>

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

            {/* Job Type - Multi-selector */}
            <Box>
              <Text size="sm" fw={500} mb={4}>Job Type *</Text>
              <MultiSelector
                options={jobTypeSelectorOptions}
                value={jobTypes}
                onValueChange={handleJobTypesChange}
                placeholder="Select job type(s)"
                maxCount={5}
                showall={false}
                className={jobTypesError ? 'border-red-500' : undefined}
              />
              {jobTypesError && (
                <Text size="xs" c="red" mt={4}>At least one job type is required</Text>
              )}
            </Box>
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

            {/* Project Dates - end date cannot be before start date or today */}
            <Box>
              <Text size="sm" fw={600} mb="sm">Project Dates</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <SmartDatetimeInput
                  label="Project Start Date"
                  placeholder="Select start date"
                  value={projectStartDate ?? undefined}
                  onValueChange={setProjectStartDate}
                  showCalendar={true}
                  showTimePicker={false}
                  country={country || 'USA'}
                  clearable
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                />
                <SmartDatetimeInput
                  label="Project End Date"
                  placeholder="Select end date"
                  value={projectEndDate ?? undefined}
                  onValueChange={(date) => setProjectEndDate(date)}
                  showCalendar={true}
                  showTimePicker={false}
                  country={country || 'USA'}
                  clearable
                  minDate={(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (projectStartDate) {
                      const start = new Date(projectStartDate);
                      start.setHours(0, 0, 0, 0);
                      return start > today ? start : today;
                    }
                    return today;
                  })()}
                />
              </SimpleGrid>
            </Box>

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
              <Group justify="space-between" align="center" mb={4}>
                <Text size="sm" fw={500}>Job Description &amp; Responsibilities</Text>
                <Group gap={4}>
                  <Button
                    size="xs"
                    variant={descTab === 'edit' ? 'filled' : 'subtle'}
                    color="blue"
                    onClick={() => setDescTab('edit')}
                    style={{ minWidth: 60 }}
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    size="xs"
                    variant={descTab === 'preview' ? 'filled' : 'subtle'}
                    color="blue"
                    onClick={() => setDescTab('preview')}
                    style={{ minWidth: 70 }}
                  >
                    👁 Preview
                  </Button>
                </Group>
              </Group>

              {descTab === 'edit' ? (
                <>
                  <Textarea
                    placeholder={`Enter a detailed description...\n\nFormatting supported:\n• Bullet points (use -, •, or *)\n1. Numbered lists\n## Headings\n**bold**, *italic*, ==highlight==\n| Table | Columns |`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                    minRows={10}
                    autosize
                    maxLength={5000}
                    styles={{
                      input: {
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: 1.7,
                      }
                    }}
                  />
                  <Group justify="space-between" mt={4}>
                    <Text size="xs" c="dimmed">
                      Tip: use <code style={{ background: 'var(--mantine-color-gray-1)', padding: '0 3px', borderRadius: 3 }}>**bold**</code>{' '}
                      <code style={{ background: 'var(--mantine-color-gray-1)', padding: '0 3px', borderRadius: 3 }}>## Heading</code>{' '}
                      <code style={{ background: 'var(--mantine-color-gray-1)', padding: '0 3px', borderRadius: 3 }}>- bullet</code>{' '}
                      <code style={{ background: 'var(--mantine-color-gray-1)', padding: '0 3px', borderRadius: 3 }}>==highlight==</code>{' '}
                      · switch to Preview to see it rendered
                    </Text>
                    <Text size="xs" c={description.length > 4500 ? 'red' : 'dimmed'}>
                      {description.length}/5000
                    </Text>
                  </Group>
                </>
              ) : (
                <Box
                  style={{
                    border: '1px solid var(--mantine-color-gray-3)',
                    borderRadius: 8,
                    minHeight: 200,
                    padding: '14px 16px',
                    background: '#fff',
                  }}
                >
                  {description ? (
                    <FormattedText text={description} size="sm" />
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">
                      Nothing to preview yet — switch to Edit and start typing.
                    </Text>
                  )}
                </Box>
              )}
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

        <Group justify="flex-end">
          <Button
            type="submit"
            size="lg"
            leftSection={<IconEye size={18} />}
            style={{ minWidth: 200 }}
          >
            Save & Preview
          </Button>
        </Group>
      </form>

      {/* Preview Modal - Redesigned */}
      <Modal
        opened={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={
          <Group gap="xs" align="center">
            <IconBriefcase size={20} />
            <Text fw={700} size="lg">Job Description Preview</Text>
          </Group>
        }
        size={isMobile ? 'full' : '900px'}
        fullScreen={isMobile}
        styles={{
          header: {
            borderBottom: '1px solid var(--mantine-color-gray-2)',
            paddingBottom: 12,
            marginBottom: 0,
          },
          body: { padding: 0 },
        }}
      >
        <ScrollArea h={isMobile ? undefined : 'calc(100vh - 220px)'} style={{ maxHeight: isMobile ? undefined : 580 }}>
          <Stack gap={0}>

            {/* Hero header — gradient and title only (no country/state pills; those show once in Overview) */}
            <Box
              style={{
                background: 'linear-gradient(135deg, #1971c2 0%, #0c8599 100%)',
                padding: isMobile ? '20px 16px 20px' : '28px 32px 24px',
              }}
            >
              <Text
                size={isMobile ? 'xl' : '1.6rem'}
                fw={700}
                c="white"
                style={{ letterSpacing: '-0.02em', lineHeight: 1.2, wordBreak: 'break-word' }}
              >
                {title || 'Job Title'}
              </Text>
            </Box>

            {/* Overview — same keys in both columns, same row count, aligned */}
            <Box
              p={isMobile ? 'md' : 'xl'}
              style={{
                borderBottom: '1px solid var(--mantine-color-gray-2)',
                background: 'white',
              }}
            >
              <Text fw={700} size="md" c="dark.6" mb="md">Overview</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={{ base: 'md', sm: 48 }} style={{ maxWidth: 800 }}>
                <Stack gap={8}>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Country:</Text>
                    <Text size="sm" fw={700} c="dark.8">{country || '—'}</Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Work type:</Text>
                    <Text size="sm" fw={700} c="dark.8">{workType || '—'}</Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Pay rate:</Text>
                    <Text size="sm" fw={700} c="green.7">{payRate || '—'}</Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Job type:</Text>
                    <Text size="sm" fw={700} c="dark.8">{jobTypes.length ? jobTypes.join(', ') : '—'}</Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Start date:</Text>
                    <Text size="sm" fw={700} c="dark.8">
                      {projectStartDate ? format(projectStartDate, 'MMM d, yyyy') : '—'}
                    </Text>
                  </Group>
                </Stack>
                <Stack gap={8}>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Status:</Text>
                    <Text size="sm" fw={700} c="green.7">Active</Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Location(s):</Text>
                    <Text size="sm" fw={700} c="dark.8">
                      {selectedStates.length
                        ? selectedCities.length
                          ? `${selectedStates.join(', ')} – ${selectedCities.slice(0, 3).join(', ')}${selectedCities.length > 3 ? '…' : ''}`
                          : selectedStates.join(', ')
                        : '—'}
                    </Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Engagement type:</Text>
                    <Text size="sm" fw={700} c="dark.8">{jobTypes.length ? jobTypes.join(', ') : '—'}</Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Client:</Text>
                    <Text size="sm" fw={700} c="dark.8">{client || '—'}</Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>End date:</Text>
                    <Text size="sm" fw={700} c="dark.8">
                      {projectEndDate ? format(projectEndDate, 'MMM d, yyyy') : '—'}
                    </Text>
                  </Group>
                  <Group wrap="nowrap" align="baseline" gap="md">
                    <Text size="sm" c="dimmed" fw={400} style={{ minWidth: 115 }}>Posted:</Text>
                    <Text size="sm" fw={700} c="dark.8">—</Text>
                  </Group>
                </Stack>
              </SimpleGrid>
            </Box>

            {/* Body content */}
            <Stack gap="lg" p={isMobile ? 'md' : 'xl'} style={{ background: 'var(--mantine-color-gray-0)' }}>

              {/* Description & Responsibilities */}
              {description && (
                <Box>
                  <Text fw={700} size="md" mb={10} style={{ borderLeft: '4px solid var(--mantine-color-blue-6)', paddingLeft: 10 }}>
                    Description &amp; Responsibilities
                  </Text>
                  <Box
                    style={{
                      background: 'var(--mantine-color-gray-0)',
                      border: '1px solid var(--mantine-color-gray-2)',
                      borderRadius: 8,
                      padding: '14px 16px',
                    }}
                  >
                    <FormattedText text={description} />
                  </Box>
                </Box>
              )}

              {/* Primary Skills */}
              {primarySkills && (
                <Box>
                  <Text fw={700} size="md" mb={10} style={{ borderLeft: '4px solid var(--mantine-color-teal-6)', paddingLeft: 10 }}>
                    Primary Skills
                  </Text>
                  <Box
                    style={{
                      background: 'var(--mantine-color-blue-0)',
                      border: '1px solid var(--mantine-color-blue-2)',
                      borderRadius: 8,
                      padding: '14px 16px',
                    }}
                  >
                    <FormattedText text={primarySkills} c="blue.8" />
                  </Box>
                </Box>
              )}

              {/* Nice to Have Skills */}
              {niceToHaveSkills && (
                <Box>
                  <Text fw={700} size="md" mb={10} style={{ borderLeft: '4px solid var(--mantine-color-gray-5)', paddingLeft: 10 }}>
                    Nice to Have Skills
                  </Text>
                  <Box
                    style={{
                      background: 'var(--mantine-color-gray-0)',
                      border: '1px solid var(--mantine-color-gray-2)',
                      borderRadius: 8,
                      padding: '14px 16px',
                    }}
                  >
                    <FormattedText text={niceToHaveSkills} c="gray.7" />
                  </Box>
                </Box>
              )}

              {/* Required Application Fields */}
              {selectedQuestions.length > 0 && (
                <Box>
                  <Text fw={700} size="md" mb={10} style={{ borderLeft: '4px solid var(--mantine-color-green-6)', paddingLeft: 10 }}>
                    Required Application Fields
                  </Text>
                  <Group gap="xs" wrap="wrap">
                    {selectedQuestions.map((id) => {
                      const field = applicationFields.find(f => f.id === id);
                      return field ? (
                        <Badge key={id} color="green" variant="light" size="md">{field.label}</Badge>
                      ) : null;
                    })}
                  </Group>
                </Box>
              )}

              {/* Required Documents */}
              {selectedDocuments.length > 0 && (
                <Box>
                  <Text fw={700} size="md" mb={10} style={{ borderLeft: '4px solid var(--mantine-color-orange-6)', paddingLeft: 10 }}>
                    Required Documents
                  </Text>
                  <Group gap="xs" wrap="wrap">
                    {selectedDocuments.map((doc, i) => (
                      <Badge key={i} color="orange" variant="light" size="md">{doc}</Badge>
                    ))}
                  </Group>
                </Box>
              )}

            </Stack>
          </Stack>
        </ScrollArea>

        <Box
          style={{
            borderTop: '1px solid var(--mantine-color-gray-2)',
            padding: '14px 20px',
            background: 'var(--mantine-color-gray-0)',
          }}
        >
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setPreviewModalOpen(false)}>
              ← Edit
            </Button>
            <Button
              leftSection={<IconBriefcase size={16} />}
              onClick={handleSubmitJob}
              loading={submitting}
              style={{
                background: 'linear-gradient(135deg, #1971c2 0%, #0c8599 100%)',
              }}
            >
              Submit
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};

export default PostJob;
