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
  SimpleGrid
} from '@mantine/core';
import { IconSearch, IconMapPin, IconBriefcase, IconClock, IconCurrencyDollar, IconWorld, IconX } from '@tabler/icons-react';
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
    <Box mih="100vh" bg="white">
      {/* Hero Section - Matching Homepage Style */}
      <Box py={{ base: 48, md: 72 }} bg="white">
        <Container size="lg">
          <Stack gap="xl" align="center" ta="center" maw={700} mx="auto" mb="xl">
            <Title order={1} fz={{ base: 26, md: 40 }} lh={1.3} c="gray.9" fw={600}>
              Search Jobs
            </Title>
            <Text size="lg" c="gray.6" lh={1.7}>
              Applicants can search for jobs only in the USA and India. 
              Find your next opportunity from top recruiters.
            </Text>
          </Stack>
          
          {/* Filters Card */}
          <Card shadow="sm" padding={isMobile ? 'md' : 'xl'} radius="md" withBorder maw={900} mx="auto" bg="gray.0">
            <Stack gap="md">
              <TextInput
                placeholder="Search jobs by title, skills, or keywords..."
                leftSection={<IconSearch size={18} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="md"
                styles={{
                  input: {
                    backgroundColor: 'white'
                  }
                }}
              />
              
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <Select
                  label="Country"
                  placeholder="Select country"
                  leftSection={<IconWorld size={16} />}
                  data={WORK_COUNTRIES}
                  value={countryFilter}
                  onChange={setCountryFilter}
                  clearable
                  size="sm"
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  styles={{
                    input: { backgroundColor: 'white' }
                  }}
                />
                <Select
                  label="Job Type"
                  placeholder="Select job type"
                  leftSection={<IconBriefcase size={16} />}
                  data={JOB_TYPES}
                  value={jobTypeFilter}
                  onChange={setJobTypeFilter}
                  clearable
                  size="sm"
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  styles={{
                    input: { backgroundColor: 'white' }
                  }}
                />
                <Select
                  label="Job Title"
                  placeholder="Select title"
                  leftSection={<IconBriefcase size={16} />}
                  data={uniqueTitles}
                  value={titleFilter}
                  onChange={setTitleFilter}
                  clearable
                  searchable
                  size="sm"
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  styles={{
                    input: { backgroundColor: 'white' }
                  }}
                />
              </SimpleGrid>

              {hasActiveFilters && (
                <Group justify="flex-end">
                  <Button 
                    variant="subtle" 
                    size="xs" 
                    color="gray"
                    leftSection={<IconX size={14} />}
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                </Group>
              )}
            </Stack>
          </Card>
        </Container>
      </Box>

      {/* Job Listings */}
      <Box py="xl" bg="gray.0">
        <Container size="lg">
          {filteredJobs.length === 0 ? (
            <Card padding="xl" ta="center" radius="md" withBorder bg="white">
              <IconBriefcase size={48} color="#adb5bd" style={{ margin: '0 auto 16px' }} />
              <Text size="lg" fw={600} mb="xs">No jobs found</Text>
              <Text c="dimmed" size="sm">
                {hasActiveFilters
                  ? 'Try adjusting your search filters'
                  : 'Check back later for new opportunities'}
              </Text>
              {hasActiveFilters && (
                <Button variant="light" mt="md" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )}
            </Card>
          ) : (
            <Stack gap="md">
              <Text size="sm" c="dimmed" mb="xs">
                Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
              </Text>

              {filteredJobs.map((job) => (
                <Card 
                  key={job.id} 
                  padding={isMobile ? 'md' : 'lg'} 
                  withBorder 
                  radius="md"
                  bg="white"
                  style={{ 
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <Stack gap="sm">
                    {/* Header */}
                    <Group justify="space-between" wrap="wrap" gap="sm">
                      <Box style={{ flex: 1, minWidth: 200 }}>
                        <Text size={isMobile ? 'md' : 'lg'} fw={600} mb={4}>{job.title}</Text>
                        <Group gap="xs">
                          <Badge color="blue" variant="light" size="sm">{job.workLocationCountry}</Badge>
                          <Badge color="teal" variant="light" size="sm">{job.jobType}</Badge>
                        </Group>
                      </Box>
                      {job.payRate && (
                        <Badge size="lg" color="green" variant="light" leftSection={<IconCurrencyDollar size={14} />}>
                          {job.payRate}
                        </Badge>
                      )}
                    </Group>

                    {/* Meta Info */}
                    <Group gap={isMobile ? 'sm' : 'md'} wrap="wrap">
                      <Group gap={4}>
                        <IconBriefcase size={14} color="#868e96" />
                        <Text size="xs" c="dimmed">{job.recruiterCompany}</Text>
                      </Group>
                      <Group gap={4}>
                        <IconMapPin size={14} color="#868e96" />
                        <Text size="xs" c="dimmed">{job.workLocation}</Text>
                      </Group>
                      <Group gap={4}>
                        <IconClock size={14} color="#868e96" />
                        <Text size="xs" c="dimmed">
                          {formatDistanceToNow(new Date(job.createdAt))} ago
                        </Text>
                      </Group>
                    </Group>

                    {/* Skills */}
                    {job.primarySkills && (
                      <Group gap={4} wrap="wrap">
                        {job.primarySkills.split(',').slice(0, isMobile ? 3 : 5).map((skill, idx) => (
                          <Badge key={idx} variant="outline" color="gray" size="xs">
                            {skill.trim()}
                          </Badge>
                        ))}
                        {job.primarySkills.split(',').length > (isMobile ? 3 : 5) && (
                          <Badge variant="outline" color="gray" size="xs">
                            +{job.primarySkills.split(',').length - (isMobile ? 3 : 5)} more
                          </Badge>
                        )}
                      </Group>
                    )}

                    {/* Description */}
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {job.description}
                    </Text>

                    {/* Action */}
                    <Group justify="flex-end" mt="xs">
                      <Button 
                        component={Link} 
                        to={`/jobs/${job.id}`} 
                        size={isMobile ? 'sm' : 'sm'}
                        variant="filled"
                      >
                        View Details
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Jobs;
