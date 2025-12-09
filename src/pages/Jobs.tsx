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
  Divider
} from '@mantine/core';
import { IconSearch, IconMapPin, IconBriefcase, IconClock, IconCurrencyDollar, IconWorld } from '@tabler/icons-react';
import { useAppData, WORK_COUNTRIES, JOB_TYPES } from '@/contexts/AppDataContext';
import { formatDistanceToNow } from 'date-fns';

const Jobs: React.FC = () => {
  const { jobPostings } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);

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
          <Title order={1} c="white" ta="center" mb="lg">
            Find Your Dream Job
          </Title>
          <Text c="white" ta="center" mb="xl" opacity={0.9}>
            Browse through opportunities from top recruiters
          </Text>
          
          <Box maw={900} mx="auto">
            <Card shadow="md" padding="lg" radius="md">
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                <TextInput
                  placeholder="Search by title, skills..."
                  leftSection={<IconSearch size={18} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select
                  placeholder="Country"
                  leftSection={<IconWorld size={18} />}
                  data={WORK_COUNTRIES}
                  value={countryFilter}
                  onChange={setCountryFilter}
                  clearable
                />
                <Select
                  placeholder="Job Type"
                  leftSection={<IconBriefcase size={18} />}
                  data={JOB_TYPES}
                  value={jobTypeFilter}
                  onChange={setJobTypeFilter}
                  clearable
                />
                <Select
                  placeholder="Location"
                  leftSection={<IconMapPin size={18} />}
                  data={uniqueLocations}
                  value={locationFilter}
                  onChange={setLocationFilter}
                  clearable
                  searchable
                />
              </SimpleGrid>
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
                <Card key={job.id} shadow="sm" padding="lg" withBorder>
                  <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                    <Box style={{ flex: 1, minWidth: 280 }}>
                      <Group gap="sm" mb="xs" wrap="wrap">
                        <Text size="lg" fw={600}>{job.title}</Text>
                        <Badge color="blue" variant="light">
                          {job.workLocationCountry}
                        </Badge>
                        <Badge color="teal" variant="light">
                          {job.jobType}
                        </Badge>
                      </Group>

                      <Group gap="lg" mb="sm" wrap="wrap">
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
                            Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                          </Text>
                        </Group>
                      </Group>

                      {job.primarySkills && (
                        <Group gap="xs" mb="sm" wrap="wrap">
                          {job.primarySkills.split(',').slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="outline" color="gray" size="sm">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </Group>
                      )}

                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {job.description}
                      </Text>
                    </Box>

                    <Stack gap="sm" align="flex-end" style={{ minWidth: 150 }}>
                      {job.payRate && (
                        <Badge size="lg" variant="light" color="green" leftSection={<IconCurrencyDollar size={14} />}>
                          {job.payRate}
                        </Badge>
                      )}
                      {job.paymentType && (
                        <Text size="xs" c="dimmed">{job.paymentType}</Text>
                      )}
                      <Button component={Link} to={`/jobs/${job.id}`}>
                        View & Apply
                      </Button>
                    </Stack>
                  </Group>
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
