import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Text, 
  Badge, 
  Button, 
  TextInput, 
  Select, 
  Group, 
  Title,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Paper,
  Loader,
  Pagination
} from '@mantine/core';
import { 
  IconSearch, 
  IconMapPin, 
  IconBriefcase, 
  IconClock, 
  IconCurrencyDollar, 
  IconWorld, 
  IconX,
  IconFilter,
  IconArrowRight
} from '@tabler/icons-react';
import { WORK_COUNTRIES, JOB_TYPES } from '@/contexts/AppDataContext';
import { formatDistanceToNow } from 'date-fns';
import { useMediaQuery, useDebouncedValue } from '@mantine/hooks';
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

interface JobsResponse {
  success: boolean;
  message: string;
  data: {
    jobPosts: JobPost[];
    pagination: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await api.get<JobsResponse>(
          API_ENDPOINTS.CANDIDATE.JOB_POSTS(
            currentPage,
            10,
            debouncedSearch || undefined,
            countryFilter || undefined,
            jobTypeFilter || undefined
          )
        );
        
        if (response.data?.success) {
          setJobs(response.data.data.jobPosts);
          setTotalPages(response.data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, debouncedSearch, countryFilter, jobTypeFilter]);

  const hasActiveFilters = searchQuery || countryFilter || jobTypeFilter;

  const clearAllFilters = () => {
    setSearchQuery('');
    setCountryFilter(null);
    setJobTypeFilter(null);
    setCurrentPage(1);
  };

  const getLocationString = (workLocations: JobPost['workLocations']) => {
    if (!workLocations || workLocations.length === 0) return 'Remote';
    const firstLocation = workLocations[0];
    return `${firstLocation.city[0] || ''}, ${firstLocation.state}`;
  };

  return (
    <Box mih="100vh" bg="gray.0">
      {/* Hero Section */}
      <Box 
        py={{ base: 48, md: 72 }} 
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
        }}
      >
        <Container size="lg">
          <Stack gap="lg" maw={700} mx="auto" ta="center" mb={40}>
            <Box>
              <Text size="sm" fw={600} c="blue.6" tt="uppercase" mb="xs" style={{ letterSpacing: '0.1em' }}>
                Find Your Next Opportunity
              </Text>
              <Title order={1} fz={{ base: 28, md: 42 }} lh={1.2} c="gray.9" fw={700}>
                Search Jobs
              </Title>
            </Box>
            <Text size="lg" c="gray.6" lh={1.8}>
              Applicants can search for jobs only in the USA and India. 
              Find your next opportunity from top recruiters and leading companies.
            </Text>
          </Stack>
          
          {/* Search & Filters Card */}
          <Paper 
            shadow="md" 
            p={{ base: 'md', md: 'xl' }} 
            radius="lg" 
            withBorder 
            maw={1000} 
            mx="auto"
            style={{
              borderColor: '#e9ecef'
            }}
          >
            <Stack gap="lg">
              {/* Search Bar */}
              <TextInput
                placeholder="Search jobs by title, skills, or keywords..."
                leftSection={<IconSearch size={20} color="#228be6" />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                size="lg"
                radius="md"
                styles={{
                  input: {
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e9ecef',
                  }
                }}
              />
              
              {/* Filters */}
              <Box>
                <Group gap="xs" mb="md">
                  <IconFilter size={16} color="#868e96" />
                  <Text size="sm" fw={500} c="gray.7">Filter by</Text>
                </Group>
                
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Select
                    placeholder="All Job Types"
                    leftSection={<IconBriefcase size={18} color="#228be6" />}
                    data={JOB_TYPES}
                    value={jobTypeFilter}
                    onChange={(val) => {
                      setJobTypeFilter(val);
                      setCurrentPage(1);
                    }}
                    clearable
                    size="md"
                    radius="md"
                    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                    styles={{
                      input: { 
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e9ecef'
                      }
                    }}
                  />
                  <Select
                    placeholder="All Countries"
                    leftSection={<IconWorld size={18} color="#228be6" />}
                    data={WORK_COUNTRIES}
                    value={countryFilter}
                    onChange={(val) => {
                      setCountryFilter(val);
                      setCurrentPage(1);
                    }}
                    clearable
                    size="md"
                    radius="md"
                    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                    styles={{
                      input: { 
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e9ecef'
                      }
                    }}
                  />
                </SimpleGrid>
              </Box>

              {hasActiveFilters && (
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    {countryFilter && (
                      <Badge 
                        variant="light" 
                        color="blue" 
                        size="lg"
                        rightSection={
                          <IconX 
                            size={12} 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => setCountryFilter(null)} 
                          />
                        }
                      >
                        {countryFilter}
                      </Badge>
                    )}
                    {jobTypeFilter && (
                      <Badge 
                        variant="light" 
                        color="teal" 
                        size="lg"
                        rightSection={
                          <IconX 
                            size={12} 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => setJobTypeFilter(null)} 
                          />
                        }
                      >
                        {jobTypeFilter}
                      </Badge>
                    )}
                  </Group>
                  <Button 
                    variant="subtle" 
                    size="xs" 
                    color="gray"
                    leftSection={<IconX size={14} />}
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </Button>
                </Group>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Job Listings */}
      <Box py={{ base: 40, md: 60 }}>
        <Container size="lg">
          {/* Results Header */}
          <Group justify="space-between" mb="xl">
            <Group gap="xs">
              <Text size="lg" fw={600} c="gray.8">
                {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Found
              </Text>
              {hasActiveFilters && (
                <Badge variant="light" color="blue" size="sm">Filtered</Badge>
              )}
            </Group>
          </Group>

          {loading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : jobs.length === 0 ? (
            <Paper p={60} ta="center" radius="lg" withBorder bg="white">
              <ThemeIcon size={80} radius="xl" variant="light" color="gray" mb="lg" mx="auto">
                <IconBriefcase size={40} />
              </ThemeIcon>
              <Title order={3} fw={600} mb="xs">No jobs found</Title>
              <Text c="dimmed" size="md" maw={400} mx="auto" mb="lg">
                {hasActiveFilters
                  ? "We couldn't find any jobs matching your filters. Try adjusting your search criteria."
                  : 'Check back later for new opportunities from top recruiters.'}
              </Text>
              {hasActiveFilters && (
                <Button 
                  variant="light" 
                  onClick={clearAllFilters}
                  leftSection={<IconX size={16} />}
                >
                  Clear All Filters
                </Button>
              )}
            </Paper>
          ) : (
            <>
              <Stack gap="md">
                {jobs.map((job) => (
                  <Paper 
                    key={job.id} 
                    p={{ base: 'md', md: 'xl' }}
                    withBorder 
                    radius="lg"
                    bg="white"
                    style={{ 
                      transition: 'all 0.2s ease',
                      borderColor: '#e9ecef'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = '#228be6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.borderColor = '#e9ecef';
                    }}
                  >
                    {/* Country Badge at top right */}
                    <Box style={{ position: 'relative' }}>
                      <Badge 
                        color="blue" 
                        variant="filled" 
                        size="lg" 
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0 
                        }}
                      >
                        {job.country}
                      </Badge>
                    </Box>

                    {/* Job Info */}
                    <Box pr={isMobile ? 0 : 120}>
                      <Group gap="sm" mb="sm" wrap="nowrap">
                        <ThemeIcon size={isMobile ? 40 : 44} radius="md" variant="light" color="blue" style={{ flexShrink: 0 }}>
                          <IconBriefcase size={isMobile ? 18 : 22} />
                        </ThemeIcon>
                        <Box style={{ minWidth: 0, flex: 1 }}>
                          <Text size={isMobile ? 'sm' : 'lg'} fw={600} c="gray.9" lineClamp={2}>{job.title}</Text>
                          <Text size="xs" c="dimmed">{job.admin?.companyName || 'Unknown Company'}</Text>
                        </Box>
                      </Group>

                      {/* Tags */}
                      <Group gap={6} mb="sm" wrap="wrap">
                        {job.jobType.slice(0, isMobile ? 1 : 2).map((type, idx) => (
                          <Badge key={idx} color="teal" variant="light" size="sm">{type}</Badge>
                        ))}
                        {job.workType && (
                          <Badge color="violet" variant="light" size="sm">{job.workType}</Badge>
                        )}
                      </Group>

                      {/* Meta Info */}
                      <Group gap={isMobile ? 'sm' : 'lg'} wrap="wrap" mb="sm">
                        <Group gap={4} wrap="nowrap">
                          <IconMapPin size={14} color="#868e96" />
                          <Text size="xs" c="dimmed" lineClamp={1}>{getLocationString(job.workLocations)}</Text>
                        </Group>
                        <Group gap={4} wrap="nowrap">
                          <IconClock size={14} color="#868e96" />
                          <Text size="xs" c="dimmed">
                            {formatDistanceToNow(new Date(job.createdAt))} ago
                          </Text>
                        </Group>
                        {job.payRate && (
                          <Group gap={4} wrap="nowrap">
                            <IconCurrencyDollar size={14} color="#12b886" />
                            <Text size="xs" c="teal.7" fw={500}>{job.payRate}</Text>
                          </Group>
                        )}
                      </Group>

                      {/* Skills - Text format */}
                      {job.primarySkills && job.primarySkills.length > 0 && (
                        <Box mb="md">
                          <Text size="xs" c="gray.7">
                            <Text component="span" fw={600} c="gray.8">Skills: </Text>
                            {job.primarySkills.slice(0, isMobile ? 3 : 6).map(s => s.trim()).join(', ')}
                            {job.primarySkills.length > (isMobile ? 3 : 6) && (
                              <Text component="span" c="blue.6" fw={500}> +{job.primarySkills.length - (isMobile ? 3 : 6)} more</Text>
                            )}
                          </Text>
                        </Box>
                      )}
                    </Box>

                    {/* View Details Button - Bottom Right */}
                    <Group justify="flex-end" mt="md">
                      <Button 
                        component={Link} 
                        to={`/jobs/${job.id}`}
                        state={{ job }}
                        size={isMobile ? 'sm' : 'md'}
                        variant="filled"
                        rightSection={<IconArrowRight size={16} />}
                      >
                        View Details
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>

              {/* Pagination */}
              {totalPages > 1 && (
                <Group justify="center" mt="xl">
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={setCurrentPage}
                  />
                </Group>
              )}
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Jobs;
