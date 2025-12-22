import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Card, 
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
  Divider
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
  IconArrowRight,
  IconSparkles
} from '@tabler/icons-react';
import { useAppData, WORK_COUNTRIES, JOB_TYPES } from '@/contexts/AppDataContext';
import { formatDistanceToNow } from 'date-fns';
import { useMediaQuery } from '@mantine/hooks';

const Jobs: React.FC = () => {
  const { jobPostings } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);
  const [titleFilter, setTitleFilter] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const activeJobs = jobPostings.filter(
    job => job.isActive && job.isApproved && job.isPaid && new Date(job.expiresAt) > new Date()
  );

  const uniqueTitles = [...new Set(activeJobs.map(job => job.title))];

  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.primarySkills?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = !countryFilter || job.workLocationCountry === countryFilter;
    const matchesJobType = !jobTypeFilter || job.jobType === jobTypeFilter;
    const matchesTitle = !titleFilter || job.title === titleFilter;
    return matchesSearch && matchesCountry && matchesJobType && matchesTitle;
  });

  const hasActiveFilters = searchQuery || countryFilter || jobTypeFilter || titleFilter;

  const clearAllFilters = () => {
    setSearchQuery('');
    setCountryFilter(null);
    setJobTypeFilter(null);
    setTitleFilter(null);
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
                onChange={(e) => setSearchQuery(e.target.value)}
                size="lg"
                radius="md"
                styles={{
                  input: {
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e9ecef',
                    '&:focus': {
                      borderColor: '#228be6'
                    }
                  }
                }}
              />
              
              {/* Filters */}
              <Box>
                <Group gap="xs" mb="md">
                  <IconFilter size={16} color="#868e96" />
                  <Text size="sm" fw={500} c="gray.7">Filter by</Text>
                </Group>
                
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                  <Select
                    placeholder="All Countries"
                    leftSection={<IconWorld size={18} color="#228be6" />}
                    data={WORK_COUNTRIES}
                    value={countryFilter}
                    onChange={setCountryFilter}
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
                    placeholder="All Job Types"
                    leftSection={<IconBriefcase size={18} color="#228be6" />}
                    data={JOB_TYPES}
                    value={jobTypeFilter}
                    onChange={setJobTypeFilter}
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
                    placeholder="All Titles"
                    leftSection={<IconSparkles size={18} color="#228be6" />}
                    data={uniqueTitles}
                    value={titleFilter}
                    onChange={setTitleFilter}
                    clearable
                    searchable
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
                    {titleFilter && (
                      <Badge 
                        variant="light" 
                        color="indigo" 
                        size="lg"
                        rightSection={
                          <IconX 
                            size={12} 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => setTitleFilter(null)} 
                          />
                        }
                      >
                        {titleFilter}
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
                {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
              </Text>
              {hasActiveFilters && (
                <Badge variant="light" color="blue" size="sm">Filtered</Badge>
              )}
            </Group>
          </Group>

          {filteredJobs.length === 0 ? (
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
            <Stack gap="md">
              {filteredJobs.map((job) => (
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
                  <Group justify="space-between" wrap="wrap" gap="md">
                    {/* Job Info */}
                    <Box style={{ flex: 1, minWidth: 280 }}>
                      <Group gap="sm" mb="sm">
                        <ThemeIcon size={44} radius="md" variant="light" color="blue">
                          <IconBriefcase size={22} />
                        </ThemeIcon>
                        <Box>
                          <Text size={isMobile ? 'md' : 'lg'} fw={600} c="gray.9">{job.title}</Text>
                          <Text size="sm" c="dimmed">{job.recruiterCompany}</Text>
                        </Box>
                      </Group>

                      {/* Tags */}
                      <Group gap="xs" mb="md">
                        <Badge color="blue" variant="light" size="md">{job.workLocationCountry}</Badge>
                        <Badge color="teal" variant="light" size="md">{job.jobType}</Badge>
                      </Group>

                      {/* Meta Info */}
                      <Group gap="lg" wrap="wrap" mb="md">
                        <Group gap={6}>
                          <IconMapPin size={16} color="#868e96" />
                          <Text size="sm" c="dimmed">{job.workLocation}</Text>
                        </Group>
                        <Group gap={6}>
                          <IconClock size={16} color="#868e96" />
                          <Text size="sm" c="dimmed">
                            {formatDistanceToNow(new Date(job.createdAt))} ago
                          </Text>
                        </Group>
                        {job.payRate && (
                          <Group gap={6}>
                            <IconCurrencyDollar size={16} color="#12b886" />
                            <Text size="sm" c="teal.7" fw={500}>{job.payRate}</Text>
                          </Group>
                        )}
                      </Group>

                      {/* Skills */}
                      {job.primarySkills && (
                        <Group gap={6} wrap="wrap">
                          {job.primarySkills.split(',').slice(0, isMobile ? 3 : 5).map((skill, idx) => (
                            <Badge key={idx} variant="outline" color="gray" size="sm" radius="sm">
                              {skill.trim()}
                            </Badge>
                          ))}
                          {job.primarySkills.split(',').length > (isMobile ? 3 : 5) && (
                            <Badge variant="outline" color="blue" size="sm" radius="sm">
                              +{job.primarySkills.split(',').length - (isMobile ? 3 : 5)} more
                            </Badge>
                          )}
                        </Group>
                      )}
                    </Box>

                    {/* Action */}
                    <Stack gap="sm" align={isMobile ? 'stretch' : 'flex-end'} style={{ minWidth: isMobile ? '100%' : 140 }}>
                      <Button 
                        component={Link} 
                        to={`/jobs/${job.id}`} 
                        size="md"
                        variant="filled"
                        rightSection={<IconArrowRight size={16} />}
                        fullWidth={isMobile}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Jobs;
