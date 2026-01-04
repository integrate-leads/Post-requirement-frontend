import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Paper,
  Modal,
  TextInput,
  Textarea,
  Select
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
  IconClock,
  IconBroadcast,
  IconCloud,
  IconDatabase,
  IconDeviceDesktop,
  IconSchool,
  IconRocket,
  IconLock
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { validateEmail, validateName, validatePhone } from '@/lib/validations';

const COUNTRY_CODES = [
  { value: '+1', label: 'USA (+1)' },
  { value: '+91', label: 'India (+91)' },
];

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactCountryCode, setContactCountryCode] = useState('+1');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  
  // Validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

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

  const highlights = [
    { icon: IconRocket, text: 'A single powerful platform for all your recruitment communications' },
    { icon: IconBroadcast, text: 'Instantly broadcast your requirement to thousands of verified candidates' },
    { icon: IconBriefcase, text: 'Post and manage job requirements in minutes — no manual emailing' },
    { icon: IconDeviceDesktop, text: 'Centralized recruiter dashboard for complete hiring visibility' },
    { icon: IconDatabase, text: 'Maintain your own candidate database and re-engage anytime' },
    { icon: IconCloud, text: 'Cloud-based platform — access from anywhere' },
    { icon: IconLock, text: 'Enterprise-grade security and data privacy controls' },
    { icon: IconSchool, text: 'Easy-to-use interface — minimal training required' },
  ];

  // Validation handlers
  const handleNameChange = (value: string) => {
    setContactName(value);
    if (value) {
      const result = validateName(value);
      setNameError(result.isValid ? '' : result.error);
    } else {
      setNameError('');
    }
  };

  const handleEmailChange = (value: string) => {
    setContactEmail(value);
    if (value) {
      const result = validateEmail(value);
      setEmailError(result.isValid ? '' : result.error);
    } else {
      setEmailError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setContactPhone(digitsOnly);
    if (digitsOnly) {
      const result = validatePhone(digitsOnly, contactCountryCode);
      setPhoneError(result.isValid ? '' : result.error);
    } else {
      setPhoneError('');
    }
  };

  const handleContactSubmit = async () => {
    // Validate fields
    let hasError = false;
    
    const nameResult = validateName(contactName);
    if (!nameResult.isValid) {
      setNameError(nameResult.error);
      hasError = true;
    }
    
    const emailResult = validateEmail(contactEmail);
    if (!emailResult.isValid) {
      setEmailError(emailResult.error);
      hasError = true;
    }
    
    if (contactPhone) {
      const phoneResult = validatePhone(contactPhone, contactCountryCode);
      if (!phoneResult.isValid) {
        setPhoneError(phoneResult.error);
        hasError = true;
      }
    }
    
    if (!contactSubject.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a subject',
        color: 'red',
      });
      hasError = true;
    }
    
    if (!contactMessage.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter your message',
        color: 'red',
      });
      hasError = true;
    }
    
    if (hasError) return;
    
    setContactSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setContactSubmitting(false);
    setContactModalOpen(false);
    
    // Reset form
    setContactName('');
    setContactEmail('');
    setContactSubject('');
    setContactPhone('');
    setContactMessage('');
    setNameError('');
    setEmailError('');
    setPhoneError('');
    
    notifications.show({
      title: 'Message Sent!',
      message: 'Our team will reach out to you shortly.',
      color: 'green',
    });
  };

  const cardHoverStyles = {
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid #e9ecef'
  };

  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>, isEnter: boolean) => {
    if (isEnter) {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
      e.currentTarget.style.borderColor = '#228be6';
    } else {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
      e.currentTarget.style.borderColor = '#e9ecef';
    }
  };

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
          <Stack gap="xl" maw={900} mx="auto" ta="center">
            <Box>
              <Text size="sm" fw={600} c="blue.6" tt="uppercase" mb="xs" style={{ letterSpacing: '0.1em' }}>
                Trusted Recruitment Partner
              </Text>
              <Title order={1} fz={{ base: 28, md: 44 }} lh={1.2} c="gray.9" fw={700}>
                Why Integrate Leads
              </Title>
            </Box>
            <Text size="lg" c="gray.6" lh={1.8}>
              We bridge the gap between employers who are hiring and professionals seeking career growth across India and the United States. Our platform focuses on speed, transparency, and smart automation, helping organizations reduce hiring time while improving candidate engagement.
            </Text>
            <Text size="md" c="gray.5" lh={1.8}>
              With a strong understanding of both India's high-volume hiring ecosystem and the US skill-driven employment market, we deliver solutions that support:
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" px={{ base: 0, sm: 'xl' }}>
              <Paper p="sm" radius="md" withBorder ta="center">
                <Text size="sm" fw={500}>IT & Non-IT hiring</Text>
              </Paper>
              <Paper p="sm" radius="md" withBorder ta="center">
                <Text size="sm" fw={500}>Startups, SMEs & Enterprise</Text>
              </Paper>
              <Paper p="sm" radius="md" withBorder ta="center">
                <Text size="sm" fw={500}>Remote, Hybrid & Onsite</Text>
              </Paper>
              <Paper p="sm" radius="md" withBorder ta="center">
                <Text size="sm" fw={500}>Campus & Lateral hiring</Text>
              </Paper>
            </SimpleGrid>
            <Group gap="md" justify="center" mt="md">
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
                style={cardHoverStyles}
                onMouseEnter={(e) => handleCardHover(e, true)}
                onMouseLeave={(e) => handleCardHover(e, false)}
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
                style={cardHoverStyles}
                onMouseEnter={(e) => handleCardHover(e, true)}
                onMouseLeave={(e) => handleCardHover(e, false)}
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

      {/* Highlights Section */}
      <Box py={{ base: 60, md: 80 }} bg="gray.0">
        <Container size="lg">
          <Stack align="center" gap="sm" mb={50}>
            <Text size="sm" fw={600} c="blue.6" tt="uppercase" style={{ letterSpacing: '0.1em' }}>
              Platform Highlights
            </Text>
            <Title order={2} ta="center" fz={{ base: 24, md: 36 }} fw={700}>
              Everything You Need in One Platform
            </Title>
            <Text c="dimmed" ta="center" maw={600}>
              A powerful platform designed for modern recruitment across industries
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
            {highlights.map((highlight, index) => (
              <Card 
                key={index}
                padding="lg" 
                radius="lg" 
                withBorder
                bg="white"
                style={cardHoverStyles}
                onMouseEnter={(e) => handleCardHover(e, true)}
                onMouseLeave={(e) => handleCardHover(e, false)}
              >
                <Stack gap="md" align="center" ta="center">
                  <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                    <highlight.icon size={28} stroke={1.5} />
                  </ThemeIcon>
                  <Text size="sm" fw={500} lh={1.6}>
                    {highlight.text}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section - Why Choose Us */}
      <Box py={{ base: 60, md: 80 }} bg="white">
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

            <SimpleGrid cols={1} spacing="lg">
              {features.map((feature) => (
                <Card 
                  key={feature.title}
                  padding="lg" 
                  radius="lg" 
                  withBorder
                  bg="white"
                  style={cardHoverStyles}
                  onMouseEnter={(e) => handleCardHover(e, true)}
                  onMouseLeave={(e) => handleCardHover(e, false)}
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
                </Card>
              ))}
            </SimpleGrid>
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
      <Box id="contact" py={{ base: 60, md: 80 }} bg="gray.0">
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
                    <Text size="sm" c="dimmed">E-Mail</Text>
                    <Text fw={500}>Support@Integrateleads.com</Text>
                  </Box>
                </Group>
                <Group gap="md">
                  <ThemeIcon size={40} radius="md" variant="light" color="blue">
                    <IconPhone size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="sm" c="dimmed">Mobile</Text>
                    <Text fw={500}>+91 – 9491489066</Text>
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

            <Paper p="xl" radius="lg" withBorder bg="white">
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
                  size="md"
                  leftSection={<IconMail size={18} />}
                  mt="md"
                  onClick={() => setContactModalOpen(true)}
                >
                  Email Us
                </Button>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Contact Modal */}
      <Modal
        opened={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={<Text fw={600} size="lg" c="blue.7">Drop us A Message</Text>}
        size="lg"
        centered
      >
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Name"
              placeholder="Your name"
              value={contactName}
              onChange={(e) => handleNameChange(e.target.value)}
              error={nameError}
              required
            />
            <TextInput
              label="Email"
              placeholder="Your email"
              type="email"
              value={contactEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              error={emailError}
              required
            />
          </SimpleGrid>
          
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Subject"
              placeholder="Message subject"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              required
            />
            <Box>
              <Text size="sm" fw={500} mb={5}>Phone</Text>
              <Group gap="xs" wrap="nowrap">
                <Select
                  data={COUNTRY_CODES}
                  value={contactCountryCode}
                  onChange={(v) => setContactCountryCode(v || '+1')}
                  w={130}
                  styles={{ input: { paddingLeft: 12 } }}
                />
                <TextInput
                  placeholder="Phone number"
                  value={contactPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  error={phoneError}
                  style={{ flex: 1 }}
                />
              </Group>
            </Box>
          </SimpleGrid>
          
          <Textarea
            label="Your Comment"
            placeholder="Write your message here..."
            minRows={4}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            required
          />
          
          <Group justify="center" mt="md">
            <Button 
              size="md" 
              onClick={handleContactSubmit}
              loading={contactSubmitting}
              style={{ 
                minWidth: 120,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #1e9898 0%, #2d8f8f 100%)'
              }}
            >
              SEND
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Index;
