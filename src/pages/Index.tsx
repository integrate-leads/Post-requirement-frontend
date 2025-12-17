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
  ThemeIcon,
  Image
} from '@mantine/core';
import { 
  IconBriefcase, 
  IconUsers, 
  IconSearch, 
  IconShieldCheck, 
  IconRocket,
  IconClock,
  IconArrowRight,
  IconCheck,
  IconWorld
} from '@tabler/icons-react';
import logoFull from '@/assets/logo-full.png';

const Index: React.FC = () => {
  return (
    <Box>
      {/* Hero Section - Clean Corporate */}
      <Box py={{ base: 60, md: 100 }} bg="white">
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} verticalSpacing={40}>
            <Stack gap="lg" justify="center">
              <Badge color="blue" variant="light" size="lg" w="fit-content">
                Trusted Recruitment Platform
              </Badge>
              <Title order={1} fz={{ base: 28, md: 44 }} lh={1.2} c="gray.9">
                Find the Right Talent,{' '}
                <Text span c="blue.6" inherit>Faster</Text>
              </Title>
              <Text size="lg" c="gray.6" maw={480}>
                Connect with qualified candidates effortlessly. Post requirements, 
                screen applicants, and hire the best talent for your organization.
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
            
            <Box visibleFrom="md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                src={logoFull} 
                alt="Integrate Leads" 
                maw={320}
              />
            </Box>
          </SimpleGrid>

          {/* Stats Row */}
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg" mt={60}>
            {[
              { value: '10K+', label: 'Active Candidates' },
              { value: '500+', label: 'Partner Companies' },
              { value: '95%', label: 'Success Rate' },
              { value: '24/7', label: 'Support' },
            ].map((stat) => (
              <Box key={stat.label} ta="center" py="md">
                <Text fz={{ base: 28, md: 36 }} fw={700} c="blue.6">{stat.value}</Text>
                <Text size="sm" c="gray.6">{stat.label}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Services Section */}
      <Box py={{ base: 60, md: 80 }} bg="gray.0">
        <Container size="lg">
          <Stack align="center" gap="sm" mb={50}>
            <Text size="sm" fw={600} c="blue.6" tt="uppercase">Our Services</Text>
            <Title order={2} ta="center" fz={{ base: 24, md: 32 }}>
              Comprehensive Recruitment Solutions
            </Title>
            <Text c="dimmed" ta="center" maw={500}>
              Everything you need to find and hire the best candidates
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            <Card padding="xl" radius="md" withBorder>
              <ThemeIcon size={48} radius="md" variant="light" color="blue" mb="md">
                <IconBriefcase size={24} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="xs">Post Requirements</Text>
              <Text size="sm" c="dimmed" mb="md">
                Create detailed job postings with custom screening questions 
                to attract qualified candidates.
              </Text>
              <Badge color="green" variant="light">Available Now</Badge>
            </Card>

            <Card padding="xl" radius="md" withBorder style={{ opacity: 0.7 }}>
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

            <Card padding="xl" radius="md" withBorder style={{ opacity: 0.7 }}>
              <ThemeIcon size={48} radius="md" variant="light" color="gray" mb="md">
                <IconUsers size={24} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="xs">AI Screening</Text>
              <Text size="sm" c="dimmed" mb="md">
                AI-powered screening to shortlist the best candidates 
                based on your specific criteria.
              </Text>
              <Badge color="gray" variant="light">Coming Soon</Badge>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 60, md: 80 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60}>
            <Stack gap="xl" justify="center">
              <Box>
                <Text size="sm" fw={600} c="blue.6" tt="uppercase" mb="xs">Why Choose Us</Text>
                <Title order={2} fz={{ base: 24, md: 32 }}>
                  Hire Smarter, Not Harder
                </Title>
              </Box>
              <Text c="dimmed">
                Our platform streamlines your recruitment process with powerful 
                tools designed to help you find the perfect candidates quickly.
              </Text>
              
              <Stack gap="md">
                {[
                  { icon: IconRocket, title: 'Fast & Efficient', desc: 'Post jobs and receive applications within minutes' },
                  { icon: IconShieldCheck, title: 'Verified Candidates', desc: 'All applicants are screened and verified' },
                  { icon: IconClock, title: 'Flexible Posting', desc: 'Choose posting duration from 1 to 30 days' },
                  { icon: IconWorld, title: 'Global Reach', desc: 'Access candidates from USA and India' },
                ].map((feature) => (
                  <Group key={feature.title} gap="md" wrap="nowrap">
                    <ThemeIcon size={40} radius="md" variant="light" color="blue">
                      <feature.icon size={20} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={600} size="sm">{feature.title}</Text>
                      <Text size="xs" c="dimmed">{feature.desc}</Text>
                    </Box>
                  </Group>
                ))}
              </Stack>
            </Stack>

            <SimpleGrid cols={2} spacing="md">
              {[
                { value: 'USA & India', label: 'Coverage', icon: IconWorld },
                { value: '1-30 Days', label: 'Posting Duration', icon: IconClock },
                { value: 'Custom', label: 'Screening', icon: IconShieldCheck },
                { value: 'Instant', label: 'Notifications', icon: IconCheck },
              ].map((item) => (
                <Card key={item.label} padding="lg" radius="md" withBorder ta="center">
                  <ThemeIcon size={40} radius="md" variant="light" color="blue" mx="auto" mb="sm">
                    <item.icon size={20} />
                  </ThemeIcon>
                  <Text fw={700} c="blue.6">{item.value}</Text>
                  <Text size="xs" c="dimmed">{item.label}</Text>
                </Card>
              ))}
            </SimpleGrid>
          </SimpleGrid>
        </Container>
      </Box>

      {/* About Section */}
      <Box py={{ base: 60, md: 80 }} bg="gray.0">
        <Container size="md">
          <Stack align="center" ta="center" gap="lg">
            <Text size="sm" fw={600} c="blue.6" tt="uppercase">About Us</Text>
            <Title order={2} fz={{ base: 24, md: 32 }}>Simplifying Recruitment</Title>
            <Text c="dimmed" maw={600}>
              Integrate Leads bridges the gap between talented job seekers and 
              forward-thinking employers. We provide powerful tools that make 
              the hiring process seamless for everyone involved.
            </Text>
            <Button component={Link} to="/login" size="md" mt="sm">
              Start Recruiting
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 48, md: 64 }} bg="blue.6">
        <Container size="lg">
          <Group justify="space-between" wrap="wrap" gap="lg">
            <Box maw={500}>
              <Title order={3} c="white" fz={{ base: 20, md: 26 }} mb="xs">
                Ready to Start Hiring?
              </Title>
              <Text c="blue.1" size="sm">
                Join recruiters who've simplified their hiring process with Integrate Leads.
              </Text>
            </Box>
            <Group gap="sm">
              <Button 
                component={Link} 
                to="/login" 
                size="md" 
                variant="white"
                color="blue"
              >
                Get Started Free
              </Button>
              <Button 
                component={Link} 
                to="/jobs" 
                size="md" 
                variant="outline"
                color="white"
              >
                Browse Jobs
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;
