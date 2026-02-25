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
  IconBriefcase, 
  IconX,
  IconFilter,
  IconArrowRight,
  IconWorld
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
              <Stack gap="lg">
                {jobs.map((job) => {
                  return (
                  <Paper
                    key={job.id}
                    p={0}
                    withBorder
                    radius="lg"
                    bg="white"
                    style={{
                      transition: 'box-shadow 0.2s ease',
                      borderColor: '#e9ecef',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <Box p={{ base: 'md', md: 'lg' }}>
                      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
                        <Group gap="md" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                          <ThemeIcon size={44} radius="md" variant="light" color="blue" style={{ flexShrink: 0 }}>
                            <IconBriefcase size={22} />
                          </ThemeIcon>
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Title order={3} fz={{ base: '1rem', md: '1.15rem' }} fw={600} c="gray.9" lineClamp={2} lh={1.3}>
                              {job.role || job.title}
                            </Title>
                            <Text size="sm" c="dimmed" mt={2}>
                              {job.admin?.companyName || job.clientName || 'Company'}
                            </Text>
                            <Group gap="md" wrap="wrap" mt="xs">
                              <Text size="xs"><Text component="span" c="dimmed">Country: </Text><Text component="span" c="gray.8" fw={500}>{job.country}</Text></Text>
                              <Text size="xs"><Text component="span" c="dimmed">Work type: </Text><Text component="span" c="gray.8" fw={500}>{job.workType || '—'}</Text></Text>
                              <Text size="xs"><Text component="span" c="dimmed">Posted: </Text><Text component="span" c="gray.8">{formatDistanceToNow(new Date(job.createdAt))} ago</Text></Text>
                            </Group>
                          </Box>
                        </Group>
                        <Button
                          component={Link}
                          to={`/jobs/${job.id}`}
                          state={{ job }}
                          size="sm"
                          variant="light"
                          color="blue"
                          rightSection={<IconArrowRight size={16} />}
                          radius="md"
                          fw={500}
                          style={{ flexShrink: 0 }}
                        >
                          View Details
                        </Button>
                      </Group>
                    </Box>
                  </Paper>
                  );
                })}
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
