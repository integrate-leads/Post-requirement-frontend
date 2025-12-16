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
import { IconSearch, IconMapPin, IconBriefcase, IconClock, IconCurrencyDollar, IconWorld, IconRocket } from '@tabler/icons-react';
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

  const stats = [
    { value: `${filteredJobs.length}+`, label: 'Open Positions' },
    { value: '500+', label: 'Companies' },
    { value: '95%', label: 'Placement Rate' },
  ];

  return (
    <Box mih="100vh" bg="gray.0">
      {/* Hero Section - Similar to Homepage */}
      <Box 
        py={{ base: 60, md: 80 }}
        style={{ 
          background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(0, 120, 212, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(56, 189, 248, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
          <Stack gap="lg" align="center" ta="center" mb="xl">
            <Badge variant="light" color="cyan" size="lg" radius="xl" leftSection={<IconRocket size={14} />}>
              Your Career Awaits
            </Badge>
            <Title order={1} c="white" fz={{ base: 28, md: 42 }} lh={1.2}>
              Find Your
              <Text span c="cyan.4" inherit> Dream Job </Text>
              Today
            </Title>
            <Text size={isMobile ? 'sm' : 'lg'} c="gray.4" maw={600}>
              Browse through opportunities from top recruiters and take the next step in your career journey
            </Text>
          </Stack>

          {/* Stats */}
          <SimpleGrid cols={3} spacing={{ base: 'sm', md: 'lg' }} mb="xl">
            {stats.map((stat) => (
              <Paper 
                key={stat.label} 
                p={{ base: 'sm', md: 'md' }} 
                radius="md" 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Text fz={{ base: 20, md: 28 }} fw={700} c="cyan.4" ta="center">{stat.value}</Text>
                <Text size="xs" c="gray.5" ta="center">{stat.label}</Text>
              </Paper>
            ))}
          </SimpleGrid>
          
          {/* Search Card */}
          <Box maw={900} mx="auto">
            <Card shadow="xl" padding={isMobile ? 'md' : 'lg'} radius="lg" style={{ backgroundColor: 'rgba(255,255,255,0.98)' }}>
              <Stack gap="md">
                <TextInput
                  placeholder="Search by title, skills, keywords..."
                  leftSection={<IconSearch size={18} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size={isMobile ? 'sm' : 'md'}
                  styles={{
                    input: { borderColor: '#e2e8f0' }
                  }}
                />
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                  <Select
                    placeholder="Select Country"
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
          <Card shadow="sm" padding="xl" ta="center" radius="lg">
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
              <Text fw={500} c="dimmed">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</Text>
            </Group>

            <Stack gap="md">
              {filteredJobs.map((job) => (
                <Card 
                  key={job.id} 
                  shadow="sm" 
                  padding={isMobile ? 'md' : 'lg'} 
                  withBorder 
                  radius="lg"
                  style={{ 
                    transition: 'all 0.2s ease',
                    borderColor: '#e2e8f0',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
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
                        <Badge size={isMobile ? 'md' : 'lg'} variant="gradient" gradient={{ from: 'green', to: 'teal' }} leftSection={<IconCurrencyDollar size={14} />}>
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
                      <Button 
                        component={Link} 
                        to={`/jobs/${job.id}`} 
                        size={isMobile ? 'sm' : 'md'}
                        variant="gradient"
                        gradient={{ from: 'cyan', to: 'blue' }}
                      >
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