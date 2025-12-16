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
  Paper
} from '@mantine/core';
import { IconSearch, IconMapPin, IconBriefcase, IconClock, IconCurrencyDollar, IconWorld } from '@tabler/icons-react';
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

  return (
    <Box mih="100vh" bg="gray.0">
      {/* Search Header */}
      <Box py={{ base: 'xl', md: 48 }} bg="blue.6">
        <Container size="lg">
          <Title order={1} c="white" ta="center" mb="md" fz={{ base: 24, md: 32 }}>
            Find Your Dream Job
          </Title>
          <Text c="white" ta="center" mb="xl" opacity={0.9} size={isMobile ? 'sm' : 'md'}>
            Browse through opportunities from top recruiters
          </Text>
          
          <Box maw={900} mx="auto">
            <Card shadow="md" padding={isMobile ? 'md' : 'lg'} radius="md">
              <Stack gap="md">
                <TextInput
                  placeholder="Search by title, skills..."
                  leftSection={<IconSearch size={18} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size={isMobile ? 'sm' : 'md'}
                />
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                  <Select
                    placeholder="Country"
                    leftSection={<IconWorld size={18} />}
                    data={WORK_COUNTRIES}
                    value={countryFilter}
                    onChange={setCountryFilter}
                    clearable
                    size={isMobile ? 'sm' : 'md'}
                    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  />
                  <Select
                    placeholder="Job Type"
                    leftSection={<IconBriefcase size={18} />}
                    data={JOB_TYPES}
                    value={jobTypeFilter}
                    onChange={setJobTypeFilter}
                    clearable
                    size={isMobile ? 'sm' : 'md'}
                    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  />
                  <Select
                    placeholder="Location"
                    leftSection={<IconMapPin size={18} />}
                    data={uniqueLocations}
                    value={locationFilter}
                    onChange={setLocationFilter}
                    clearable
                    searchable
                    size={isMobile ? 'sm' : 'md'}
                    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
                  />
                </SimpleGrid>
              </Stack>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* Job Listings */}
      <Container size="lg" py="xl">
        {filteredJobs.length === 0 ? (
          <Card shadow="sm" padding="xl" ta="center">
            <IconBriefcase size={48} color="#868e96" style={{ margin: '0 auto 16px' }} />
            <Text size="lg" fw={600} mb="sm">
              No jobs available
            </Text>
            <Text c="dimmed">
              {searchQuery || locationFilter || countryFilter || jobTypeFilter
                ? 'Try adjusting your search filters'
                : 'Check back later for new opportunities'}
            </Text>
          </Card>
        ) : (
          <>
            <Group justify="space-between" mb="lg">
              <Text fw={500}>{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</Text>
            </Group>

            <Stack gap="md">
              {filteredJobs.map((job) => (
                <Card key={job.id} shadow="sm" padding={isMobile ? 'md' : 'lg'} withBorder>
                  <Stack gap="sm">
                    {/* Title and Badges */}
                    <Group justify="space-between" wrap="wrap" gap="sm">
                      <Box style={{ flex: 1, minWidth: 200 }}>
                        <Group gap="sm" mb="xs" wrap="wrap">
                          <Text size={isMobile ? 'md' : 'lg'} fw={600}>{job.title}</Text>
                        </Group>
                        <Group gap="xs" wrap="wrap">
                          <Badge color="blue" variant="light" size="sm">
                            {job.workLocationCountry}
                          </Badge>
                          <Badge color="teal" variant="light" size="sm">
                            {job.jobType}
                          </Badge>
                        </Group>
                      </Box>
                      {job.payRate && (
                        <Badge size={isMobile ? 'md' : 'lg'} variant="light" color="green" leftSection={<IconCurrencyDollar size={14} />}>
                          {job.payRate}
                        </Badge>
                      )}
                    </Group>

                    {/* Company and Location Info */}
                    <Group gap={isMobile ? 'sm' : 'lg'} wrap="wrap">
                      <Group gap="xs">
                        <IconBriefcase size={16} color="#868e96" />
                        <Text size="sm" c="dimmed">{job.recruiterCompany}</Text>
                      </Group>
                      <Group gap="xs">
                        <IconMapPin size={16} color="#868e96" />
                        <Text size="sm" c="dimmed">{job.workLocation}</Text>
                      </Group>
                      <Group gap="xs">
                        <IconClock size={16} color="#868e96" />
                        <Text size="sm" c="dimmed">
                          {formatDistanceToNow(new Date(job.createdAt))} ago
                        </Text>
                      </Group>
                    </Group>

                    {/* Skills */}
                    {job.primarySkills && (
                      <Group gap="xs" wrap="wrap">
                        {job.primarySkills.split(',').slice(0, isMobile ? 3 : 4).map((skill, idx) => (
                          <Badge key={idx} variant="outline" color="gray" size="sm">
                            {skill.trim()}
                          </Badge>
                        ))}
                        {job.primarySkills.split(',').length > (isMobile ? 3 : 4) && (
                          <Badge variant="outline" color="gray" size="sm">
                            +{job.primarySkills.split(',').length - (isMobile ? 3 : 4)} more
                          </Badge>
                        )}
                      </Group>
                    )}

                    {/* Description */}
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {job.description}
                    </Text>

                    {/* Action Button */}
                    <Group justify="space-between" wrap="wrap" gap="sm">
                      {job.paymentType && (
                        <Text size="xs" c="dimmed">{job.paymentType}</Text>
                      )}
                      <Button component={Link} to={`/jobs/${job.id}`} size={isMobile ? 'sm' : 'md'}>
                        View & Apply
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Jobs;