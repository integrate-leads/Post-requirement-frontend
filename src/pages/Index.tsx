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
  Paper,
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
  IconWorld,
  IconTargetArrow
} from '@tabler/icons-react';
import logoFull from '@/assets/logo-full.png';

const Index: React.FC = () => {
  const stats = [
    { value: '10K+', label: 'Active Job Seekers' },
    { value: '500+', label: 'Companies Hiring' },
    { value: '95%', label: 'Success Rate' },
    { value: '24/7', label: 'Support Available' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        py={{ base: 80, md: 120 }}
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
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing={60}>
            <Stack gap="xl" justify="center">
              <Badge variant="light" color="cyan" size="lg" radius="xl">
                🚀 #1 Recruitment Platform
              </Badge>
              <Title order={1} c="white" fz={{ base: 32, md: 48 }} lh={1.2}>
                Find Your Perfect
                <Text span c="cyan.4" inherit> Talent </Text>
                Faster Than Ever
              </Title>
              <Text size="lg" c="gray.4" maw={500}>
                Connect with top talent effortlessly. Post job requirements, screen candidates, 
                and manage applications all in one powerful platform.
              </Text>
              <Group gap="md">
                <Button 
                  component={Link} 
                  to="/login" 
                  size="lg"
                  rightSection={<IconArrowRight size={18} />}
                  variant="gradient"
                  gradient={{ from: 'cyan', to: 'blue' }}
                >
                  Get Started Free
                </Button>
                <Button 
                  component={Link} 
                  to="/jobs" 
                  size="lg" 
                  variant="outline"
                  color="gray.4"
                >
                  Browse Jobs
                </Button>
              </Group>
            </Stack>
            
            <Box visibleFrom="md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                src={logoFull} 
                alt="Integrate Leads" 
                maw={400}
                style={{ 
                  filter: 'drop-shadow(0 20px 40px rgba(0, 120, 212, 0.3))',
                }}
              />
            </Box>
          </SimpleGrid>

          {/* Stats */}
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg" mt={80}>
            {stats.map((stat) => (
              <Paper key={stat.label} p="lg" radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Text fz={32} fw={700} c="cyan.4">{stat.value}</Text>
                <Text size="sm" c="gray.5">{stat.label}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Services Section */}
      <Box id="services" py={{ base: 60, md: 100 }} bg="gray.0">
        <Container size="lg">
          <Stack align="center" gap="lg" mb={60}>
            <Badge variant="light" color="blue" size="lg">Our Services</Badge>
            <Title order={2} ta="center" maw={500}>
              Comprehensive Recruitment Solutions
            </Title>
            <Text c="dimmed" ta="center" maw={600}>
              Everything you need to find, screen, and hire the best candidates for your organization
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            <Card shadow="md" padding="xl" radius="lg" withBorder style={{ borderColor: '#e5f3ff' }}>
              <ThemeIcon size={56} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} mb="lg">
                <IconBriefcase size={28} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="sm">Post Requirements</Text>
              <Text size="sm" c="dimmed" mb="md">
                Create detailed job postings with custom screening questions. 
                Reach qualified candidates instantly.
              </Text>
              <Badge color="green" variant="light" size="lg">Available Now</Badge>
            </Card>

            <Card shadow="md" padding="xl" radius="lg" withBorder style={{ borderColor: '#e5f3ff', opacity: 0.8 }}>
              <ThemeIcon size={56} radius="xl" variant="light" color="gray" mb="lg">
                <IconSearch size={28} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="sm">Resume Database</Text>
              <Text size="sm" c="dimmed" mb="md">
                Access our extensive database of pre-screened candidates 
                matching your requirements.
              </Text>
              <Badge color="gray" variant="light" size="lg">Coming Soon</Badge>
            </Card>

            <Card shadow="md" padding="xl" radius="lg" withBorder style={{ borderColor: '#e5f3ff', opacity: 0.8 }}>
              <ThemeIcon size={56} radius="xl" variant="light" color="gray" mb="lg">
                <IconUsers size={28} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="sm">AI Screening</Text>
              <Text size="sm" c="dimmed" mb="md">
                AI-powered screening to shortlist the best candidates 
                based on your criteria.
              </Text>
              <Badge color="gray" variant="light" size="lg">Coming Soon</Badge>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 60, md: 100 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60}>
            <Stack gap="xl" justify="center">
              <Badge variant="light" color="blue" size="lg">Why Choose Us</Badge>
              <Title order={2}>
                Everything You Need to
                <Text span c="blue" inherit> Hire Smarter</Text>
              </Title>
              <Text c="dimmed">
                Our platform provides all the tools and features you need to streamline 
                your recruitment process and find the perfect candidates.
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

            <SimpleGrid cols={2} spacing="lg">
              {[
                { value: 'USA & India', label: 'Coverage', icon: IconWorld },
                { value: '1-30 Days', label: 'Posting Duration', icon: IconClock },
                { value: 'Custom', label: 'Screening Questions', icon: IconTargetArrow },
                { value: 'Instant', label: 'Notifications', icon: IconCheck },
              ].map((item) => (
                <Paper key={item.label} p="xl" radius="lg" withBorder ta="center">
                  <ThemeIcon size={48} radius="xl" variant="light" color="blue" mx="auto" mb="md">
                    <item.icon size={24} />
                  </ThemeIcon>
                  <Text fz={20} fw={700} c="blue">{item.value}</Text>
                  <Text size="sm" c="dimmed">{item.label}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </SimpleGrid>
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about" py={{ base: 60, md: 100 }} bg="gray.0">
        <Container size="md">
          <Stack align="center" ta="center" gap="xl">
            <Badge variant="light" color="blue" size="lg">About Us</Badge>
            <Title order={2}>Simplifying Recruitment</Title>
            <Text c="dimmed" size="lg" maw={700}>
              Integrate Leads is a modern recruitment platform designed to bridge the gap between 
              talented job seekers and forward-thinking employers. We understand the challenges 
              of hiring in today's competitive market, and we've built a solution that makes 
              the process seamless for everyone involved.
            </Text>
            <Text c="dimmed" maw={700}>
              Our mission is to simplify recruitment by providing powerful tools that help 
              recruiters find the right candidates quickly, while giving job seekers access 
              to opportunities that match their skills and aspirations.
            </Text>
            <Button component={Link} to="/login" size="lg" mt="md">
              Start Recruiting Today
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        py={{ base: 48, md: 80 }} 
        style={{ 
          background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0, 120, 212, 0.2) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing={32}>
            <Stack gap="md" justify="center">
              <Title order={2} c="white" fz={{ base: 24, md: 32 }}>
                Start Hiring Smarter Today
              </Title>
              <Text c="gray.4" size="md">
                Join recruiters who've simplified their hiring process with Integrate Leads. 
                Post your first job in minutes.
              </Text>
            </Stack>
            <Stack gap="sm" justify="center">
              <Button 
                component={Link} 
                to="/login" 
                size="lg" 
                variant="gradient"
                gradient={{ from: 'cyan', to: 'blue' }}
                rightSection={<IconArrowRight size={18} />}
              >
                Get Started Free
              </Button>
              <Button 
                component={Link} 
                to="/jobs" 
                size="md" 
                variant="outline"
                color="gray.4"
              >
                Browse Open Positions
              </Button>
            </Stack>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;
