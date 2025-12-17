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
import { IconSearch, IconMapPin, IconBriefcase, IconClock, IconCurrencyDollar, IconWorld, IconFilter, IconX } from '@tabler/icons-react';
import { useAppData, WORK_COUNTRIES, JOB_TYPES } from '@/contexts/AppDataContext';
import { formatDistanceToNow } from 'date-fns';
import { useMediaQuery } from '@mantine/hooks';

const Jobs: React.FC = () => {
  const { jobPostings } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const activeJobs = jobPostings.filter(
    job => job.isActive && job.isApproved && job.isPaid && new Date(job.expiresAt) > new Date()
  );

  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.primarySkills?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || job.workLocation.includes(locationFilter);
    const matchesCountry = !countryFilter || job.workLocationCountry === countryFilter;
    const matchesJobType = !jobTypeFilter || job.jobType === jobTypeFilter;
    return matchesSearch && matchesLocation && matchesCountry && matchesJobType;
  });

  const uniqueLocations = [...new Set(activeJobs.map(job => job.workLocation))];

  const hasActiveFilters = searchQuery || locationFilter || countryFilter || jobTypeFilter;

  const clearAllFilters = () => {
    setSearchQuery('');
    setLocationFilter(null);
    setCountryFilter(null);
    setJobTypeFilter(null);
  };

  return (
    <Box mih="100vh" bg="white">
      {/* Hero Section - Clean Corporate Style */}
      <Box py={{ base: 48, md: 64 }} bg="gray.0" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Container size="lg">
          <Stack gap="lg" align="center" ta="center" mb="xl">
            <Badge color="blue" variant="light" size="lg">
              {filteredJobs.length} Open Positions
            </Badge>
            <Title order={1} fz={{ base: 26, md: 38 }} c="gray.9">
              Find Your Next Opportunity
            </Title>
            <Text size="md" c="gray.6" maw={500}>
              Browse through opportunities from top recruiters and take the next step in your career
            </Text>
          </Stack>
          
          {/* Search & Filters */}
          <Card shadow="sm" padding={isMobile ? 'md' : 'lg'} radius="md" withBorder maw={900} mx="auto">
            <Stack gap="md">
              <TextInput
                placeholder="Search jobs by title, skills, or keywords..."
                leftSection={<IconSearch size={18} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size={isMobile ? 'sm' : 'md'}
              />
              
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                <Select
                  placeholder="Country"
                  leftSection={<IconWorld size={16} />}
                  data={WORK_COUNTRIES}
                  value={countryFilter}
                  onChange={setCountryFilter}
                  clearable
                  size="sm"
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                />
                <Select
                  placeholder="Job Type"
                  leftSection={<IconBriefcase size={16} />}
                  data={JOB_TYPES}
                  value={jobTypeFilter}
                  onChange={setJobTypeFilter}
                  clearable
                  size="sm"
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                />
                <Select
                  placeholder="Location"
                  leftSection={<IconMapPin size={16} />}
                  data={uniqueLocations}
                  value={locationFilter}
                  onChange={setLocationFilter}
                  clearable
                  searchable
                  size="sm"
                  comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                />
              </SimpleGrid>

              {hasActiveFilters && (
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconFilter size={14} />
                    <Text size="xs" c="dimmed">Active filters</Text>
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
          </Card>
        </Container>
      </Box>

      {/* Job Listings */}
      <Container size="lg" py="xl">
        {filteredJobs.length === 0 ? (
          <Card padding="xl" ta="center" radius="md" withBorder>
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
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
              </Text>
            </Group>

            {filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                padding={isMobile ? 'md' : 'lg'} 
                withBorder 
                radius="md"
                style={{ 
                  transition: 'box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
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
                  <Group justify="space-between" wrap="wrap" gap="sm" mt="xs">
                    {job.paymentType && (
                      <Text size="xs" c="dimmed">{job.paymentType}</Text>
                    )}
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
  );
};

export default Jobs;
