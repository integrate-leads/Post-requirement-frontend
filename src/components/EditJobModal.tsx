import React, { useState, useMemo, useEffect } from 'react';
import { 
  Modal,
  Text, 
  TextInput, 
  Textarea, 
  Select, 
  Button, 
  Stack, 
  Group, 
  Box, 
  SimpleGrid,
  Loader,
  ScrollArea
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { api } from '@/hooks/useApi';
import { 
  USA_STATES, 
  USA_CITIES, 
  INDIA_STATES, 
  INDIA_CITIES,
  USA_JOB_TYPES,
  INDIA_JOB_TYPES,
  WORK_TYPES
} from '@/data/locationData';
import { format, parseISO } from 'date-fns';
import { SmartDatetimeInput } from '@/components/ui/datetime-input';
import { MultiSelector } from '@/components/ui/multi-selector';
import { validateJobTitle, validatePayRate } from '@/lib/validations';

interface JobPost {
  id: number;
  title: string;
  description: string;
  country: string;
  clientName: string;
  role: string;
  workLocations: Array<{ state: string; city: string[] }>;
  workType: string;
  jobType: string[];
  payRate: string;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  primarySkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string;
}

interface EditJobModalProps {
  job: JobPost | null;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditJobModal: React.FC<EditJobModalProps> = ({ job, opened, onClose, onSuccess }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Form state
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState<string | null>('USA');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [workType, setWorkType] = useState<string | null>(null);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
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

  // Initialize form when job changes
  useEffect(() => {
    if (job && opened) {
      setCountry(job.country || 'USA');
      setTitle(job.title || '');
      setDescription(job.description || '');
      setWorkType(job.workType || null);
      setJobTypes(job.jobType || []);
      setPayRate(job.payRate || '');
      setClient(job.clientName || '');
      setPrimarySkills(job.primarySkills?.join(', ') || '');
      setNiceToHaveSkills(job.niceToHaveSkills?.join(', ') || '');
      
      // Parse work locations
      if (job.workLocations?.length > 0) {
        const states = job.workLocations.map(loc => loc.state);
        const cities = job.workLocations.flatMap(loc => loc.city || []);
        setSelectedStates(states);
        setSelectedCities(cities);
      } else {
        setSelectedStates([]);
        setSelectedCities([]);
      }
      
      // Parse dates
      if (job.projectStartDate) {
        try {
          setProjectStartDate(parseISO(job.projectStartDate));
        } catch {
          setProjectStartDate(undefined);
        }
      }
      if (job.projectEndDate) {
        try {
          setProjectEndDate(parseISO(job.projectEndDate));
        } catch {
          setProjectEndDate(undefined);
        }
      }
      
      // Reset errors
      setTitleError('');
      setPayRateError('');
      setCountryError(false);
      setStatesError(false);
      setWorkTypeError(false);
      setJobTypesError(false);
    }
  }, [job, opened]);

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

  const jobTypeOptions = country === 'USA' ? USA_JOB_TYPES : INDIA_JOB_TYPES;
  const stateOptions = country === 'USA' ? USA_STATES : INDIA_STATES;

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

  // Clamp end date when start date changes (end cannot be before start or today)
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
  };

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

  const handleSave = async () => {
    if (!job) return;
    
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
    
    setLoading(true);

    // Build work locations
    const workLocations = selectedStates.map(state => ({
      state,
      city: selectedCities.filter(city => {
        const citiesMap = country === 'USA' ? USA_CITIES : INDIA_CITIES;
        return citiesMap[state]?.includes(city);
      })
    }));

    // Parse skills from textarea (comma or newline separated)
    const parsePrimarySkills = primarySkills.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const parseNiceToHaveSkills = niceToHaveSkills.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

    const jobData = {
      title,
      description,
      country,
      role: title,
      client,
      workLocations,
      workType: workType || 'Remote',
      jobType: jobTypes,
      payRate,
      projectStartDate: projectStartDate ? format(projectStartDate, 'yyyy-MM-dd') : undefined,
      projectEndDate: projectEndDate ? format(projectEndDate, 'yyyy-MM-dd') : undefined,
      primarySkills: parsePrimarySkills,
      niceToHaveSkills: parseNiceToHaveSkills,
      responsibilities: description,
    };

    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/admin/job-post/${job.id}`,
        jobData
      );

      if (response.data?.success) {
        notifications.show({
          title: 'Success',
          message: 'Job updated successfully!',
          color: 'green',
        });
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: 'Error',
        message: axiosError.response?.data?.message || 'Failed to update job',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Text fw={600} size="lg">Edit Job</Text>}
      size="xl"
      fullScreen={isMobile}
    >
      <ScrollArea h={isMobile ? 'calc(100vh - 120px)' : 600} offsetScrollbars>
        <Stack gap="md" p="xs">
          {/* Country Selection */}
          <Group justify="flex-end">
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
          
          <TextInput
            label="Job Title / Role"
            placeholder="e.g., Senior Software Engineer"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            error={titleError}
            required
          />

          {/* Work Location - Multi-selector */}
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

          {/* Project Dates - end cannot be before start or today */}
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
              placeholder="Enter skills separated by comma or new line"
              value={primarySkills}
              onChange={(e) => setPrimarySkills(e.target.value.slice(0, 2000))}
              minRows={3}
              autosize
              maxLength={2000}
            />
            <Text size="xs" c={primarySkills.length > 1800 ? 'red' : 'dimmed'} ta="right" mt={4}>
              {primarySkills.length}/2000 characters
            </Text>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={4}>Nice to Have Skills</Text>
            <Textarea
              placeholder="Enter skills separated by comma or new line"
              value={niceToHaveSkills}
              onChange={(e) => setNiceToHaveSkills(e.target.value.slice(0, 2000))}
              minRows={3}
              autosize
              maxLength={2000}
            />
            <Text size="xs" c={niceToHaveSkills.length > 1800 ? 'red' : 'dimmed'} ta="right" mt={4}>
              {niceToHaveSkills.length}/2000 characters
            </Text>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={4}>Job Description & Responsibilities</Text>
            <Textarea
              placeholder="Enter a detailed description of the job..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
              minRows={6}
              autosize
              maxLength={5000}
            />
            <Text size="xs" c={description.length > 4500 ? 'red' : 'dimmed'} ta="right" mt={4}>
              {description.length}/5000 characters
            </Text>
          </Box>

          <Group justify="flex-end" mt="md" gap="sm">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} loading={loading}>
              {loading ? <Loader size="sm" /> : 'Save Changes'}
            </Button>
          </Group>
        </Stack>
      </ScrollArea>
    </Modal>
  );
};

export default EditJobModal;
