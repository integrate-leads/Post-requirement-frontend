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
  ThemeIcon
} from '@mantine/core';
import { 
  IconBriefcase, 
  IconMail, 
  IconSearch, 
  IconArrowRight
} from '@tabler/icons-react';
import Logo from '@/components/Logo';

const Index: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: IconBriefcase,
      title: 'Post Requirement',
      description: 'Create detailed job postings with custom screening questions. Reach qualified candidates instantly.',
      action: () => navigate('/login'),
      color: 'blue'
    },
    {
      icon: IconMail,
      title: 'Broadcast Email',
      description: 'Send Email to your contacts.',
      action: () => navigate('/login'),
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

  return (
    <Box>
      {/* Hero Section - Clean Corporate */}
      <Box py={{ base: 60, md: 100 }} bg="white">
        <Container size="lg">
          <Stack gap="xl" align="center" ta="center" maw={800} mx="auto">
            <Title order={1} fz={{ base: 26, md: 42 }} lh={1.3} c="gray.9" fw={600}>
              Why Integrate Leads
            </Title>
          <Text size="lg" c="gray.6" lh={1.7}>
            Integrate Leads has been a trusted partner for all types of businesses across various industries. 
            We specialize in bridging the gap between businesses and customers, delivering innovative and 
            results-driven solutions.
          </Text>
          <Text size="lg" c="gray.6" lh={1.7}>
            Presently we are offering reliable recruitment solutions for IT, Non IT and Health Care including 
            job posting, job search, and bulk email services, helping organizations connect with the right 
            talent and job seekers discover meaningful opportunities.
          </Text>
          </Stack>
        </Container>
      </Box>

      {/* Services Section */}
      <Box id="services" py={{ base: 60, md: 80 }} bg="gray.0">
        <Container size="lg">
          <Stack align="center" gap="sm" mb={50}>
            <Text size="sm" fw={600} c="blue.6" tt="uppercase">Our Services</Text>
            <Title order={2} ta="center" fz={{ base: 24, md: 32 }} fw={600}>
              What We Offer
            </Title>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {services.map((service) => (
              <Card 
                key={service.title}
                padding="xl" 
                radius="md" 
                withBorder
                onClick={service.action}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <Stack gap="md" align="center" ta="center">
                  <ThemeIcon size={64} radius="xl" variant="light" color={service.color}>
                    <service.icon size={32} />
                  </ThemeIcon>
                  <Text fw={600} size="xl">{service.title}</Text>
                  <Text size="sm" c="dimmed" lh={1.6}>
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

      {/* Contact Section */}
      <Box id="contact" py={{ base: 60, md: 80 }} bg="white">
        <Container size="md">
          <Stack align="center" ta="center" gap="lg">
            <Text size="sm" fw={600} c="blue.6" tt="uppercase">Get In Touch</Text>
            <Title order={2} fz={{ base: 24, md: 32 }} fw={600}>Contact Us</Title>
            <Text c="dimmed" maw={500} lh={1.7}>
              Have questions about our services? We're here to help you find 
              the right recruitment solutions for your business.
            </Text>
            <Group gap="md" mt="md">
              <Button 
                component="a" 
                href="mailto:support@integrateleads.com" 
                size="md"
                leftSection={<IconMail size={18} />}
              >
                Email Us
              </Button>
              <Button 
                component={Link} 
                to="/login" 
                size="md" 
                variant="outline"
              >
                Recruiter Login
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;
