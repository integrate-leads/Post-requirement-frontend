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
  MultiSelect,
  Loader,
  ScrollArea
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';
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
import DatePicker from '@/components/ui/DatePicker';
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
  projectStartDate: string;
  projectEndDate: string;
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

          {/* Work Location - Multi Select */}
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

          {/* Date Pickers */}
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
