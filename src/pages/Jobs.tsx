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
import { IconSearch, IconMapPin, IconBriefcase, IconClock } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { formatDistanceToNow } from 'date-fns';

const Jobs: React.FC = () => {
  const { jobPostings } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  const activeJobs = jobPostings.filter(
    job => job.isActive && job.isApproved && job.isPaid && new Date(job.expiresAt) > new Date()
  );

  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || job.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const uniqueLocations = [...new Set(activeJobs.map(job => job.location))];

  return (
    <Box mih="100vh" bg="gray.0">
      {/* Search Header */}
      <Box py={{ base: 'xl', md: 48 }} bg="blue.6">
        <Container size="lg">
          <Title order={1} c="white" ta="center" mb="xl">
            Find Your Dream Job
          </Title>
          
          <Box maw={700} mx="auto">
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  placeholder="Search jobs by title or keyword..."
                  leftSection={<IconSearch size={18} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="md"
                />
                <Select
                  placeholder="Location"
                  leftSection={<IconMapPin size={18} />}
                  data={uniqueLocations}
                  value={locationFilter}
                  onChange={setLocationFilter}
                  clearable
                  size="md"
                />
              </SimpleGrid>
            </Stack>
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
              {searchQuery || locationFilter 
                ? 'Try adjusting your search filters'
                : 'Check back later for new opportunities'}
            </Text>
          </Card>
        ) : (
          <>
            <Group justify="space-between" mb="lg">
              <Text c="dimmed">{filteredJobs.length} jobs found</Text>
            </Group>

            <Stack gap="md">
              {filteredJobs.map((job) => (
                <Card key={job.id} shadow="sm" padding="lg" withBorder>
                  <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                    <Box style={{ flex: 1, minWidth: 200 }}>
                      <Group gap="sm" mb="xs">
                        <Text size="lg" fw={600}>{job.title}</Text>
                        <Badge color="blue" variant="light">
                          {job.daysActive} days left
                        </Badge>
                      </Group>

                      <Group gap="lg" mb="sm" wrap="wrap">
                        <Group gap="xs">
                          <IconBriefcase size={16} color="#868e96" />
                          <Text size="sm" c="dimmed">{job.recruiterCompany}</Text>
                        </Group>
                        <Group gap="xs">
                          <IconMapPin size={16} color="#868e96" />
                          <Text size="sm" c="dimmed">{job.location}</Text>
                        </Group>
                        <Group gap="xs">
                          <IconClock size={16} color="#868e96" />
                          <Text size="sm" c="dimmed">
                            Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                          </Text>
                        </Group>
                      </Group>

                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {job.description}
                      </Text>
                    </Box>

                    <Stack gap="sm" align="flex-end">
                      {job.salary && (
                        <Badge size="lg" variant="light" color="green">
                          {job.salary}
                        </Badge>
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