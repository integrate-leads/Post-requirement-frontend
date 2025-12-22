import React, { useState, useMemo } from 'react';
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
  MultiSelect
} from '@mantine/core';
import { IconBriefcase } from '@tabler/icons-react';
import PaymentModal from '@/components/payment/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData, PRICING } from '@/contexts/AppDataContext';
import { useMediaQuery } from '@mantine/hooks';
import { 
  USA_STATES, 
  USA_CITIES, 
  INDIA_STATES, 
  INDIA_CITIES,
  USA_JOB_TYPES,
  INDIA_JOB_TYPES,
  WORK_TYPES,
  USA_VISA_STATUS,
  USA_DOCUMENT_OPTIONS
} from '@/data/locationData';

const PostJob: React.FC = () => {
  const { user } = useAuth();
  const { addJobPosting, addPaymentRequest } = useAppData();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Country selection
  const [country, setCountry] = useState<string | null>('USA');
  
  // Common fields
  const [title, setTitle] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [workType, setWorkType] = useState<string | null>(null);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [otherJobType, setOtherJobType] = useState('');
  const [payRate, setPayRate] = useState('');
  const [client, setClient] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [role, setRole] = useState('');
  const [primarySkills, setPrimarySkills] = useState('');
  const [niceToHaveSkills, setNiceToHaveSkills] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  
  // USA specific application questions
  const [usaQuestions, setUsaQuestions] = useState({
    fullName: true,
    email: true,
    contactNumber: true,
    linkedinId: true,
    last4SSN: true,
    currentLocation: true,
    areaZipCode: true,
    currentVisaStatus: true,
    comfortablePassport: null as boolean | null,
    dateOfBirth: true,
    fineWithRelocation: null as boolean | null,
    noticePeriod: true,
    bestTimeToCall: true,
    fineWithFaceToFace: null as boolean | null,
    twoInterviewSlots: true,
    // Work Reference
    canProvideReferences: null as boolean | null,
    refName: true,
    refTitle: true,
    refEmail: true,
    refPhone: true,
    // Employer
    hasEmployer: null as boolean | null,
    employerCompanyName: true,
    employerManagerName: true,
    employerContactNo: true,
    employerEmail: true,
    // Documents
    selectedDocuments: [] as string[]
  });

  // India specific application questions
  const [indiaQuestions, setIndiaQuestions] = useState({
    fullName: true,
    email: true,
    linkedinId: true,
    contactNumber: true,
    currentLocation: true,
    fineWithRelocation: null as boolean | null,
    bestTimeToCall: true,
    currentCTC: true,
    expectingCTC: true,
    currentlyInProject: null as boolean | null,
    noticePeriod: true,
    fineWithFaceToFace: null as boolean | null
  });
  
  // Duration and payment
  const [daysActive, setDaysActive] = useState<string>('5');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

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

  const dayOptions = Object.entries(PRICING).map(([days, price]) => ({ 
    value: days, 
    label: `${days} days - ₹${price}` 
  }));
  const amount = PRICING[parseInt(daysActive) as keyof typeof PRICING] || 0;

  const jobTypeOptions = country === 'USA' ? USA_JOB_TYPES : INDIA_JOB_TYPES;
  const stateOptions = country === 'USA' ? USA_STATES : INDIA_STATES;

  const handleCountryChange = (value: string | null) => {
    setCountry(value);
    setSelectedStates([]);
    setSelectedCities([]);
    setJobTypes([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !country || selectedStates.length === 0) return;
    
    const selectedQuestions = country === 'USA' 
      ? Object.entries(usaQuestions)
          .filter(([_, v]) => v === true || (Array.isArray(v) && v.length > 0))
          .map(([k]) => k)
      : Object.entries(indiaQuestions)
          .filter(([_, v]) => v === true)
          .map(([k]) => k);
    
    const workLocation = `${selectedCities.join(', ')} (${selectedStates.join(', ')})`;
    const finalJobTypes = jobTypes.includes('Others') && otherJobType 
      ? [...jobTypes.filter(j => j !== 'Others'), otherJobType]
      : jobTypes;
    
    const jobId = addJobPosting({ 
      recruiterId: user.id, 
      recruiterName: user.name, 
      recruiterCompany: user.company || 'Unknown Company', 
      title, 
      description: responsibilities,
      workLocationCountry: country as 'USA' | 'India',
      workLocation,
      jobType: finalJobTypes.join(', '),
      paymentType: '',
      payRate,
      domainKnowledge: '',
      mustHaveSkills: '',
      primarySkills,
      niceToHaveSkills,
      rolesResponsibilities: responsibilities,
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
    setSelectedStates([]);
    setSelectedCities([]);
    setWorkType(null);
    setJobTypes([]);
    setPayRate('');
    setClient('');
    setProjectStartDate('');
    setProjectEndDate('');
    setRole('');
    setPrimarySkills('');
    setNiceToHaveSkills('');
    setResponsibilities('');
    setDaysActive('5'); 
    setPendingJobId(null); 
    setPaymentModalOpen(false);
  };

  return (
    <Box maw={900} mx="auto">
      <Box mb="xl">
        <Title order={2}>Recruiter Post the Job Description</Title>
        <Text c="dimmed" size="sm">Fill in the details to create a new job posting</Text>
      </Box>

      <form onSubmit={handleSubmit}>
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
              label="Job Title"
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Work Location - Multi Select */}
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
              <TextInput
                label="Project Start Date"
                placeholder="MM/DD/YYYY"
                value={projectStartDate}
                onChange={(e) => setProjectStartDate(e.target.value)}
              />
              <TextInput
                label="Project End Date"
                placeholder="MM/DD/YYYY"
                value={projectEndDate}
                onChange={(e) => setProjectEndDate(e.target.value)}
              />
            </SimpleGrid>

            <TextInput
              label="Role"
              placeholder="Job role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
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
              label="Responsibilities"
              placeholder="Recruiter copy/paste or enter the responsibilities in detail..."
              minRows={4}
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
            />
          </Stack>
        </Card>

        {/* Application Questions - Country Specific */}
        <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} withBorder mb="lg">
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Box>
              <Text fw={600} size="lg">
                {country === 'USA' 
                  ? 'Details Required for Client Submission (USA)' 
                  : 'Details Required at the Time of Submission (India)'}
              </Text>
              <Text size="sm" c="dimmed">All fields are mandatory for applicants</Text>
            </Box>
            <Badge color="blue" size="lg">{country}</Badge>
          </Group>

          {country === 'USA' ? (
            <Stack gap="lg">
              {/* Personal Details */}
              <Box>
                <Text fw={500} mb="sm">Personal Details</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                  <Checkbox label="Full Name" checked disabled />
                  <Checkbox label="E-Mail ID" checked disabled />
                  <Checkbox label="Contact Number" checked disabled />
                  <Checkbox label="LinkedIn ID" checked disabled />
                  <Checkbox label="Last 4 Digit SSN" checked disabled />
                  <Checkbox label="Current Location" checked disabled />
                  <Checkbox label="Area – Zip Code" checked disabled />
                  <Checkbox label="Current Visa Status" checked disabled />
                </SimpleGrid>
                
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="md">
                  <Select
                    label="Comfortable sharing Passport Number?"
                    data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                    placeholder="Select"
                    value={usaQuestions.comfortablePassport === true ? 'yes' : usaQuestions.comfortablePassport === false ? 'no' : null}
                    onChange={(v) => setUsaQuestions(prev => ({ ...prev, comfortablePassport: v === 'yes' ? true : v === 'no' ? false : null }))}
                    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  />
                  <Checkbox label="Date of Birth (MM/DD/YY)" checked mt="xl" disabled />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="md">
                  <Select
                    label="Fine with Relocation?"
                    data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                    placeholder="Select"
                    value={usaQuestions.fineWithRelocation === true ? 'yes' : usaQuestions.fineWithRelocation === false ? 'no' : null}
                    onChange={(v) => setUsaQuestions(prev => ({ ...prev, fineWithRelocation: v === 'yes' ? true : v === 'no' ? false : null }))}
                    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  />
                  <Checkbox label="Notice Period Required to Join" checked mt="xl" disabled />
                </SimpleGrid>

                <Checkbox label="Best Time to Answer Recruiter/Vendor Call" checked mt="md" disabled />
                
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="md">
                  <Select
                    label="Fine with Face to Face Interview?"
                    data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                    placeholder="Select"
                    value={usaQuestions.fineWithFaceToFace === true ? 'yes' : usaQuestions.fineWithFaceToFace === false ? 'no' : null}
                    onChange={(v) => setUsaQuestions(prev => ({ ...prev, fineWithFaceToFace: v === 'yes' ? true : v === 'no' ? false : null }))}
                    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  />
                  <Checkbox label="Two Interview Time Slots (Date/Time/Timezone)" checked mt="xl" disabled />
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Work Reference */}
              <Box>
                <Text fw={500} mb="sm">Work Reference</Text>
                <Text size="xs" c="dimmed" mb="sm">If applicant does not provide references, recruiter will not receive their resume</Text>
                <Select
                  label="Can you Provide Work References?"
                  data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                  placeholder="Select"
                  value={usaQuestions.canProvideReferences === true ? 'yes' : usaQuestions.canProvideReferences === false ? 'no' : null}
                  onChange={(v) => setUsaQuestions(prev => ({ ...prev, canProvideReferences: v === 'yes' ? true : v === 'no' ? false : null }))}
                  mb="md"
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                />
                {usaQuestions.canProvideReferences && (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                    <Checkbox label="Reference Name" checked disabled />
                    <Checkbox label="Reference Title" checked disabled />
                    <Checkbox label="Reference E-Mail ID" checked disabled />
                    <Checkbox label="Reference Phone No" checked disabled />
                  </SimpleGrid>
                )}
              </Box>

              <Divider />

              {/* Employer Details */}
              <Box>
                <Text fw={500} mb="sm">Employer Details</Text>
                <Select
                  label="Do you have Employer?"
                  data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                  placeholder="Select"
                  value={usaQuestions.hasEmployer === true ? 'yes' : usaQuestions.hasEmployer === false ? 'no' : null}
                  onChange={(v) => setUsaQuestions(prev => ({ ...prev, hasEmployer: v === 'yes' ? true : v === 'no' ? false : null }))}
                  mb="md"
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                />
                {usaQuestions.hasEmployer && (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                    <Checkbox label="Employer Company Name" checked disabled />
                    <Checkbox label="Manager/HR/Recruiter Name" checked disabled />
                    <Checkbox label="Contact No" checked disabled />
                    <Checkbox label="E-Mail ID" checked disabled />
                  </SimpleGrid>
                )}
              </Box>

              <Divider />

              {/* Documents Required */}
              <Box>
                <Text fw={500} mb="sm">Documents Required</Text>
                <Text size="xs" c="dimmed" mb="sm">Select which documents applicant should upload</Text>
                <Stack gap="xs">
                  {USA_DOCUMENT_OPTIONS.map((doc) => (
                    <Checkbox
                      key={doc}
                      label={doc}
                      checked={usaQuestions.selectedDocuments.includes(doc)}
                      onChange={(e) => {
                        setUsaQuestions(prev => ({
                          ...prev,
                          selectedDocuments: e.target.checked
                            ? [...prev.selectedDocuments, doc]
                            : prev.selectedDocuments.filter(d => d !== doc)
                        }));
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Checkbox label="Full Name" checked disabled />
                <Checkbox label="E-Mail ID" checked disabled />
                <Checkbox label="LinkedIn ID" checked disabled />
                <Checkbox label="Contact Number" checked disabled />
                <Checkbox label="Current Location" checked disabled />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="sm">
                <Select
                  label="Fine with Relocation?"
                  data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                  placeholder="Select"
                  value={indiaQuestions.fineWithRelocation === true ? 'yes' : indiaQuestions.fineWithRelocation === false ? 'no' : null}
                  onChange={(v) => setIndiaQuestions(prev => ({ ...prev, fineWithRelocation: v === 'yes' ? true : v === 'no' ? false : null }))}
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Checkbox label="Best Time to Answer Phone Calls" checked disabled />
                <Checkbox label="Current CTC" checked disabled />
                <Checkbox label="Expecting CTC" checked disabled />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="sm">
                <Select
                  label="Currently in Project?"
                  data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                  placeholder="Select"
                  value={indiaQuestions.currentlyInProject === true ? 'yes' : indiaQuestions.currentlyInProject === false ? 'no' : null}
                  onChange={(v) => setIndiaQuestions(prev => ({ ...prev, currentlyInProject: v === 'yes' ? true : v === 'no' ? false : null }))}
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Checkbox label="Notice Period Required to Join" checked disabled />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="sm">
                <Select
                  label="Fine with Face to Face Interview?"
                  data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                  placeholder="Select"
                  value={indiaQuestions.fineWithFaceToFace === true ? 'yes' : indiaQuestions.fineWithFaceToFace === false ? 'no' : null}
                  onChange={(v) => setIndiaQuestions(prev => ({ ...prev, fineWithFaceToFace: v === 'yes' ? true : v === 'no' ? false : null }))}
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                />
              </SimpleGrid>
            </Stack>
          )}
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
