import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Title, 
  Text, 
  Button, 
  Card, 
  Badge, 
  SimpleGrid, 
  Group,
  Stack,
  ThemeIcon
} from '@mantine/core';
import { 
  IconBriefcase, 
  IconUsers, 
  IconSearch, 
  IconShieldCheck, 
  IconRocket,
  IconClock,
  IconArrowRight
} from '@tabler/icons-react';

const Index: React.FC = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box 
        py={{ base: 60, md: 100 }}
        style={{ 
          background: 'linear-gradient(180deg, #e5f3ff 0%, #ffffff 100%)'
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="lg" ta="center">
            <Badge variant="light" color="blue" size="lg">
              #1 Recruitment Platform
            </Badge>
            <Title order={1} size="h1" ta="center" maw={700}>
              Streamline Your <Text span c="blue" inherit>Hiring Process</Text>
            </Title>
            <Text size="lg" c="dimmed" maw={600} ta="center">
              Connect with top talent effortlessly. Post job requirements, screen candidates, 
              and manage applications all in one powerful platform.
            </Text>
            <Group gap="md" mt="md">
              <Button 
                component={Link} 
                to="/login" 
                size="lg"
                rightSection={<IconArrowRight size={18} />}
              >
                Get Started
              </Button>
              <Button 
                component={Link} 
                to="/jobs" 
                size="lg" 
                variant="outline"
              >
                Browse Jobs
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Services Section */}
      <Box id="services" py={{ base: 60, md: 80 }}>
        <Container size="lg">
          <Stack align="center" gap="lg" mb="xl">
            <Title order={2} ta="center">Our Services</Title>
            <Text c="dimmed" ta="center" maw={500}>
              Comprehensive recruitment solutions tailored for modern businesses
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            <Card shadow="sm" padding="lg" withBorder>
              <ThemeIcon size={48} radius="md" variant="light" color="blue" mb="md">
                <IconBriefcase size={24} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="xs">Post Requirements</Text>
              <Text size="sm" c="dimmed" mb="md">
                Create detailed job postings with custom screening questions. 
                Reach qualified candidates instantly.
              </Text>
              <Badge color="green" variant="light">Available Now</Badge>
            </Card>

            <Card shadow="sm" padding="lg" withBorder opacity={0.7}>
              <ThemeIcon size={48} radius="md" variant="light" color="gray" mb="md">
                <IconSearch size={24} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="xs">Resume Database</Text>
              <Text size="sm" c="dimmed" mb="md">
                Access our extensive database of pre-screened candidates 
                matching your requirements.
              </Text>
              <Badge color="gray" variant="light">Coming Soon</Badge>
            </Card>

            <Card shadow="sm" padding="lg" withBorder opacity={0.7}>
              <ThemeIcon size={48} radius="md" variant="light" color="gray" mb="md">
                <IconUsers size={24} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="xs">Candidate Screening</Text>
              <Text size="sm" c="dimmed" mb="md">
                AI-powered screening to shortlist the best candidates 
                based on your criteria.
              </Text>
              <Badge color="gray" variant="light">Coming Soon</Badge>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 60, md: 80 }} bg="gray.0">
        <Container size="lg">
          <Title order={2} ta="center" mb="xl">Why Choose Integrate Leads?</Title>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
            <Stack align="center" ta="center" gap="sm">
              <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                <IconRocket size={28} />
              </ThemeIcon>
              <Text fw={600}>Fast & Efficient</Text>
              <Text size="sm" c="dimmed">Post jobs and receive applications within minutes</Text>
            </Stack>

            <Stack align="center" ta="center" gap="sm">
              <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                <IconShieldCheck size={28} />
              </ThemeIcon>
              <Text fw={600}>Verified Candidates</Text>
              <Text size="sm" c="dimmed">All applicants are screened and verified</Text>
            </Stack>

            <Stack align="center" ta="center" gap="sm">
              <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                <IconClock size={28} />
              </ThemeIcon>
              <Text fw={600}>Flexible Posting</Text>
              <Text size="sm" c="dimmed">Choose posting duration from 1 to 30 days</Text>
            </Stack>

            <Stack align="center" ta="center" gap="sm">
              <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                <IconUsers size={28} />
              </ThemeIcon>
              <Text fw={600}>Wide Reach</Text>
              <Text size="sm" c="dimmed">Access thousands of job seekers daily</Text>
            </Stack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about" py={{ base: 60, md: 80 }}>
        <Container size="sm">
          <Stack align="center" ta="center" gap="lg">
            <Title order={2}>About Us</Title>
            <Text c="dimmed">
              Integrate Leads is a modern recruitment platform designed to bridge the gap between 
              talented job seekers and forward-thinking employers. We understand the challenges 
              of hiring in today's competitive market, and we've built a solution that makes 
              the process seamless for everyone involved.
            </Text>
            <Text c="dimmed">
              Our mission is to simplify recruitment by providing powerful tools that help 
              recruiters find the right candidates quickly, while giving job seekers access 
              to opportunities that match their skills and aspirations.
            </Text>
            <Button component={Link} to="/login" mt="md">
              Start Recruiting Today
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 60, md: 80 }} bg="blue.6">
        <Container size="lg">
          <Stack align="center" ta="center" gap="lg">
            <Title order={2} c="white">Ready to Find Your Next Great Hire?</Title>
            <Text c="blue.1" maw={500}>
              Join thousands of recruiters who trust Integrate Leads for their hiring needs.
            </Text>
            <Group gap="md" mt="md">
              <Button 
                component={Link} 
                to="/login" 
                size="lg" 
                variant="white" 
                color="blue"
              >
                Get Started Free
              </Button>
              <Button 
                component={Link} 
                to="/jobs" 
                size="lg" 
                variant="outline"
                color="white"
              >
                View Open Positions
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;