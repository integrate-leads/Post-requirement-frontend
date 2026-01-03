import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Title, 
  Text, 
  Button, 
  Card, 
  SimpleGrid, 
  Group,
  Stack,
  ThemeIcon,
  Divider,
  Paper
} from '@mantine/core';
import { 
  IconBriefcase, 
  IconMail, 
  IconSearch, 
  IconArrowRight,
  IconUsers,
  IconBuilding,
  IconWorld,
  IconShieldCheck,
  IconHeartHandshake,
  IconTargetArrow,
  IconCheck,
  IconPhone,
  IconMapPin,
  IconClock
} from '@tabler/icons-react';

const Index: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: IconBriefcase,
      title: 'Post Requirement',
      description: 'Create detailed job postings with custom screening questions. Reach qualified candidates instantly.',
      action: () => navigate('/recruiter/login'),
      color: 'blue'
    },
    {
      icon: IconMail,
      title: 'Broadcast Email',
      description: 'Send Email to your contacts.',
      action: () => navigate('/recruiter/login'),
      color: 'teal'
    },
    {
      icon: IconSearch,
      title: 'Search Jobs',
      description: 'Applicants can search for jobs only in the USA and India.',
      action: () => navigate('/jobs'),
      color: 'indigo'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Jobs', icon: IconBriefcase },
    { value: '5K+', label: 'Recruiters', icon: IconUsers },
    { value: '500+', label: 'Companies', icon: IconBuilding },
    { value: '2', label: 'Countries', icon: IconWorld }
  ];

  const features = [
    {
      icon: IconShieldCheck,
      title: 'Trusted Platform',
      description: 'Verified recruiters and secure job postings ensure a safe hiring environment.'
    },
    {
      icon: IconHeartHandshake,
      title: 'Industry Expertise',
      description: 'Specialized solutions for IT, Non-IT, and Healthcare sectors.'
    },
    {
      icon: IconTargetArrow,
      title: 'Results Driven',
      description: 'Connecting the right talent with the right opportunities efficiently.'
    }
  ];

  const whyChooseUs = [
    'Streamlined recruitment process',
    'Access to qualified candidates',
    'Custom screening questions',
    'Multi-country job posting',
    'Bulk email capabilities',
    'Dedicated support team'
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        py={{ base: 60, md: 100 }} 
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
        }}
      >
        <Container size="lg">
          <Stack gap="xl" maw={800} mx="auto" ta="center">
            <Box>
              <Text size="sm" fw={600} c="blue.6" tt="uppercase" mb="xs" style={{ letterSpacing: '0.1em' }}>
                Trusted Recruitment Partner
              </Text>
              <Title order={1} fz={{ base: 28, md: 44 }} lh={1.2} c="gray.9" fw={700}>
                Why Integrate Leads
              </Title>
            </Box>
            <Text size="lg" c="gray.6" lh={1.8}>
              Integrate Leads has been a trusted partner for all types of businesses across various industries. 
              We specialize in bridging the gap between businesses and customers, delivering innovative and 
              results-driven solutions.
            </Text>
            <Text size="md" c="gray.5" lh={1.8}>
              Presently we are offering reliable recruitment solutions for IT, Non IT and Health Care including 
              job posting, job search, and bulk email services, helping organizations connect with the right 
              talent and job seekers discover meaningful opportunities.
            </Text>
            <Group gap="md" justify="center">
              <Button 
                size="lg" 
                onClick={() => navigate('/jobs')}
                rightSection={<IconArrowRight size={18} />}
              >
                Browse Jobs
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box py={{ base: 40, md: 60 }} bg="white">
        <Container size="lg">
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  cursor: 'default',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e9ecef'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#228be6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = '#e9ecef';
                }}
              >
                <Stack gap="sm" align="center">
                  <ThemeIcon size={48} radius="xl" variant="light" color="blue">
                    <stat.icon size={24} />
                  </ThemeIcon>
                  <Text fz={32} fw={700} c="gray.9">{stat.value}</Text>
                  <Text size="sm" c="dimmed" ta="center">{stat.label}</Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Services Section */}
      <Box id="services" py={{ base: 60, md: 80 }} bg="white">
        <Container size="lg">
          <Stack align="center" gap="sm" mb={50}>
            <Text size="sm" fw={600} c="blue.6" tt="uppercase" style={{ letterSpacing: '0.1em' }}>
              Our Services
            </Text>
            <Title order={2} ta="center" fz={{ base: 24, md: 36 }} fw={700}>
              What We Offer
            </Title>
            <Text c="dimmed" ta="center" maw={600}>
              Comprehensive recruitment solutions tailored to your business needs
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {services.map((service) => (
              <Card 
                key={service.title}
                padding="xl" 
                radius="lg" 
                withBorder
                onClick={service.action}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e9ecef'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#228be6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = '#e9ecef';
                }}
              >
                <Stack gap="lg" align="center" ta="center">
                  <ThemeIcon size={72} radius="xl" variant="light" color={service.color}>
                    <service.icon size={36} stroke={1.5} />
                  </ThemeIcon>
                  <Text fw={600} size="xl">{service.title}</Text>
                  <Text size="sm" c="dimmed" lh={1.7}>
                    {service.description}
                  </Text>
                  <Button 
                    variant="subtle" 
                    color={service.color}
                    rightSection={<IconArrowRight size={16} />}
                    mt="xs"
                  >
                    Learn More
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 60, md: 80 }} bg="gray.0">
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} style={{ alignItems: 'center' }}>
            <Box>
              <Text size="sm" fw={600} c="blue.6" tt="uppercase" mb="xs">
                Why Choose Us
              </Text>
              <Title order={2} fz={{ base: 24, md: 36 }} fw={700} mb="lg">
                Built for Modern Recruitment
              </Title>
              <Text c="dimmed" lh={1.8} mb="xl">
                Our platform is designed to simplify the hiring process while maintaining 
                the highest standards of quality and security.
              </Text>
              
              <SimpleGrid cols={2} spacing="sm">
                {whyChooseUs.map((item) => (
                  <Group key={item} gap="sm" wrap="nowrap">
                    <ThemeIcon size={24} radius="xl" color="green" variant="light">
                      <IconCheck size={14} />
                    </ThemeIcon>
                    <Text size="sm" c="gray.7">{item}</Text>
                  </Group>
                ))}
              </SimpleGrid>
            </Box>

            <Stack gap="lg">
              {features.map((feature) => (
                <Paper 
                  key={feature.title}
                  p="lg" 
                  radius="md" 
                  withBorder
                  bg="white"
                  style={{
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <Group gap="md" wrap="nowrap">
                    <ThemeIcon size={48} radius="md" variant="light" color="blue">
                      <feature.icon size={24} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={600} size="md" mb={4}>{feature.title}</Text>
                      <Text size="sm" c="dimmed" lh={1.6}>{feature.description}</Text>
                    </Box>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 60, md: 80 }} bg="blue.6">
        <Container size="md">
          <Stack gap="lg" className="items-start text-left md:items-center md:text-center">
            <Title order={2} fz={{ base: 24, md: 36 }} fw={700} c="white">
              Ready to Transform Your Hiring?
            </Title>
            <Text c="blue.1" size="lg" maw={500}>
              Join thousands of recruiters and job seekers who trust Integrate Leads
            </Text>
            <Group gap="md" mt="md">
              <Button 
                size="lg"
                variant="white"
                c="blue.6"
                onClick={() => navigate('/recruiter/login')}
                w={{ base: '100%', sm: 200 }}
              >
                Start Posting Jobs
              </Button>
              <Button 
                size="lg"
                variant="outline"
                w={{ base: '100%', sm: 200 }}
                styles={{
                  root: {
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }
                }}
                onClick={() => navigate('/jobs')}
              >
                Find Opportunities
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box id="contact" py={{ base: 60, md: 80 }} bg="white">
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60}>
            <Box>
              <Text size="sm" fw={600} c="blue.6" tt="uppercase" mb="xs">
                Get In Touch
              </Text>
              <Title order={2} fz={{ base: 24, md: 36 }} fw={700} mb="lg">
                Contact Us
              </Title>
              <Text c="dimmed" lh={1.8} mb="xl">
                Have questions about our services? We're here to help you find 
                the right recruitment solutions for your business.
              </Text>
              
              <Stack gap="md">
                <Group gap="md">
                  <ThemeIcon size={40} radius="md" variant="light" color="blue">
                    <IconMail size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="sm" c="dimmed">Email</Text>
                    <Text fw={500}>support@integrateleads.com</Text>
                  </Box>
                </Group>
                <Group gap="md">
                  <ThemeIcon size={40} radius="md" variant="light" color="blue">
                    <IconPhone size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="sm" c="dimmed">Phone</Text>
                    <Text fw={500}>+1 (555) 123-4567</Text>
                  </Box>
                </Group>
                <Group gap="md">
                  <ThemeIcon size={40} radius="md" variant="light" color="blue">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="sm" c="dimmed">Business Hours</Text>
                    <Text fw={500}>Mon - Fri, 9AM - 6PM EST</Text>
                  </Box>
                </Group>
              </Stack>
            </Box>

            <Paper p="xl" radius="lg" withBorder bg="gray.0">
              <Stack gap="lg" align="center" ta="center">
                <ThemeIcon size={64} radius="xl" variant="light" color="blue">
                  <IconHeartHandshake size={32} />
                </ThemeIcon>
                <Title order={3} fw={600}>We'd Love to Hear From You</Title>
                <Text c="dimmed" lh={1.7}>
                  Whether you're a recruiter looking to post jobs or a candidate searching 
                  for opportunities, we're here to assist.
                </Text>
                <Button 
                  component="a" 
                  href="mailto:support@integrateleads.com" 
                  size="md"
                  leftSection={<IconMail size={18} />}
                  mt="md"
                >
                  Email Us
                </Button>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;
