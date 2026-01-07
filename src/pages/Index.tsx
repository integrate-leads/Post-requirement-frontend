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
  IconLock,
  IconCode,
  IconBuildingSkyscraper,
  IconHome,
  IconSchoolBell
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { validateEmail, validateName, validatePhone } from '@/lib/validations';
import axios from 'axios';

const COUNTRY_CODES = [
  { value: '+1', label: '+1' },
  { value: '+91', label: '+91' },
];

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Contact Form State
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
  const [subjectError, setSubjectError] = useState('');
  const [messageError, setMessageError] = useState('');

  const hiringTypes = [
    { icon: IconCode, label: 'IT & Non-IT hiring', color: 'blue' },
    { icon: IconBuildingSkyscraper, label: 'Startups, SMEs & Enterprise', color: 'teal' },
    { icon: IconHome, label: 'Remote, Hybrid & Onsite', color: 'violet' },
    { icon: IconSchoolBell, label: 'Campus & Lateral hiring', color: 'orange' },
  ];

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

  const handleSubjectChange = (value: string) => {
    setContactSubject(value);
    if (value && value.trim().length < 3) {
      setSubjectError('Subject must be at least 3 characters');
    } else {
      setSubjectError('');
    }
  };

  const handleMessageChange = (value: string) => {
    setContactMessage(value);
    if (value && value.trim().length < 10) {
      setMessageError('Message must be at least 10 characters');
    } else {
      setMessageError('');
    }
  };

  const handleContactSubmit = async () => {
    // Validate all fields
    let hasError = false;
    
    if (!contactName.trim()) {
      setNameError('Name is required');
      hasError = true;
    } else {
      const nameResult = validateName(contactName);
      if (!nameResult.isValid) {
        setNameError(nameResult.error);
        hasError = true;
      }
    }
    
    if (!contactEmail.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else {
      const emailResult = validateEmail(contactEmail);
      if (!emailResult.isValid) {
        setEmailError(emailResult.error);
        hasError = true;
      }
    }
    
    if (!contactPhone.trim()) {
      setPhoneError('Phone number is required');
      hasError = true;
    } else {
      const phoneResult = validatePhone(contactPhone, contactCountryCode);
      if (!phoneResult.isValid) {
        setPhoneError(phoneResult.error);
        hasError = true;
      }
    }
    
    if (!contactSubject.trim()) {
      setSubjectError('Subject is required');
      hasError = true;
    } else if (contactSubject.trim().length < 3) {
      setSubjectError('Subject must be at least 3 characters');
      hasError = true;
    }
    
    if (!contactMessage.trim()) {
      setMessageError('Message is required');
      hasError = true;
    } else if (contactMessage.trim().length < 10) {
      setMessageError('Message must be at least 10 characters');
      hasError = true;
    }
    
    if (hasError) return;
    
    setContactSubmitting(true);
    
    try {
      const response = await axios.post('https://devapi.integrateleads.com/email/enquiry', {
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: `${contactCountryCode}-${contactPhone}`,
        subject: contactSubject.trim(),
        message: contactMessage.trim()
      });
      
      if (response.data?.success) {
        // Reset form
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactPhone('');
        setContactMessage('');
        setNameError('');
        setEmailError('');
        setPhoneError('');
        setSubjectError('');
        setMessageError('');
        
        notifications.show({
          title: 'Message Sent!',
          message: 'Our team will reach out to you shortly.',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: response.data?.message || 'Failed to send message. Please try again.',
          color: 'red',
        });
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to send message. Please try again.',
        color: 'red',
      });
    } finally {
      setContactSubmitting(false);
    }
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
            
            {/* Hiring Types with Icons */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" px={{ base: 0, sm: 'xl' }}>
              {hiringTypes.map((type) => (
                <Card 
                  key={type.label}
                  padding="md" 
                  radius="lg" 
                  withBorder
                  style={cardHoverStyles}
                  onMouseEnter={(e) => handleCardHover(e, true)}
                  onMouseLeave={(e) => handleCardHover(e, false)}
                >
                  <Stack gap="sm" align="center" ta="center">
                    <ThemeIcon size={48} radius="xl" variant="light" color={type.color}>
                      <type.icon size={24} stroke={1.5} />
                    </ThemeIcon>
                    <Text size="sm" fw={600} lh={1.4}>
                      {type.label}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
            
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

      {/* CTA Section - Removed */}

      {/* Contact Section - Compact Form */}
      <Box id="contact" py={{ base: 40, md: 60 }} bg="gray.0">
        <Container size="md">
          <Card
            padding="xl"
            radius="lg"
            withBorder
            bg="white"
            style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            }}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'lg', md: 'xl' }}>
              {/* Left Side - Contact Info */}
              <Stack gap="md">
                <Box>
                  <Text size="sm" fw={600} c="blue.6" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                    Get In Touch
                  </Text>
                  <Title order={3} fz={{ base: 20, md: 24 }} fw={700} mt={4}>
                    Contact Us
                  </Title>
                </Box>
                
                <Text size="sm" c="dimmed" lh={1.7}>
                  Have questions? We're here to help you find the right recruitment solutions.
                </Text>
                
                <Stack gap="sm">
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={32} radius="md" variant="light" color="blue">
                      <IconMail size={16} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" c="dimmed">E-Mail</Text>
                      <Text size="sm" fw={500}>Support@Integrateleads.com</Text>
                    </Box>
                  </Group>
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={32} radius="md" variant="light" color="blue">
                      <IconPhone size={16} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" c="dimmed">Mobile</Text>
                      <Text size="sm" fw={500}>+91 – 9491489066, +1 (555) 123-4567</Text>
                    </Box>
                  </Group>
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={32} radius="md" variant="light" color="blue">
                      <IconClock size={16} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" c="dimmed">Business Hours</Text>
                      <Text size="sm" fw={500}>Mon - Fri, 9AM - 6PM EST</Text>
                    </Box>
                  </Group>
                </Stack>
              </Stack>

              {/* Right Side - Form */}
              <Box
                style={{
                  borderLeft: '1px solid #eee',
                  paddingLeft: 24,
                }}
                visibleFrom="md"
              >
                <Stack gap="md">
                  <Box>
                    <Title order={4} fw={600} c="gray.8" fz={16}>We'd Love to Hear From You</Title>
                    <Text size="xs" c="dimmed">Fill out the form and we'll get back to you shortly.</Text>
                  </Box>
                  
                  <SimpleGrid cols={2} spacing="sm">
                    <TextInput
                      placeholder="Your name"
                      value={contactName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      error={nameError}
                      required
                      size="sm"
                      radius="md"
                    />
                    <TextInput
                      placeholder="Email address"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      error={emailError}
                      required
                      size="sm"
                      radius="md"
                    />
                  </SimpleGrid>
                  
                  <SimpleGrid cols={2} spacing="sm">
                    <TextInput
                      placeholder="Subject"
                      value={contactSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      error={subjectError}
                      required
                      size="sm"
                      radius="md"
                    />
                    <Group gap={4} wrap="nowrap">
                      <Select
                        data={COUNTRY_CODES}
                        value={contactCountryCode}
                        onChange={(v) => setContactCountryCode(v || '+1')}
                        w={70}
                        size="sm"
                        radius="md"
                        styles={{ input: { textAlign: 'center', fontWeight: 500, paddingLeft: 8, paddingRight: 8 } }}
                      />
                      <TextInput
                        placeholder="Phone"
                        value={contactPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        error={phoneError ? true : undefined}
                        style={{ flex: 1 }}
                        size="sm"
                        radius="md"
                      />
                    </Group>
                  </SimpleGrid>
                  {phoneError && <Text size="xs" c="red" mt={-8}>{phoneError}</Text>}
                  
                  <Textarea
                    placeholder="Your message..."
                    minRows={3}
                    value={contactMessage}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    error={messageError}
                    required
                    size="sm"
                    radius="md"
                  />
                  
                  <Button 
                    onClick={handleContactSubmit}
                    loading={contactSubmitting}
                    fullWidth
                    radius="md"
                    style={{ 
                      background: 'linear-gradient(135deg, #228be6 0%, #1c7ed6 100%)',
                    }}
                  >
                    Send Message
                  </Button>
                </Stack>
              </Box>

              {/* Mobile Form */}
              <Box hiddenFrom="md">
                <Stack gap="md">
                  <Box>
                    <Title order={4} fw={600} c="gray.8" fz={16}>We'd Love to Hear From You</Title>
                    <Text size="xs" c="dimmed">Fill out the form and we'll get back to you shortly.</Text>
                  </Box>
                  
                  <TextInput
                    placeholder="Your name"
                    value={contactName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    error={nameError}
                    required
                    size="sm"
                    radius="md"
                  />
                  <TextInput
                    placeholder="Email address"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    error={emailError}
                    required
                    size="sm"
                    radius="md"
                  />
                  <TextInput
                    placeholder="Subject"
                    value={contactSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    error={subjectError}
                    required
                    size="sm"
                    radius="md"
                  />
                  <Group gap={4} wrap="nowrap">
                    <Select
                      data={COUNTRY_CODES}
                      value={contactCountryCode}
                      onChange={(v) => setContactCountryCode(v || '+1')}
                      w={70}
                      size="sm"
                      radius="md"
                      styles={{ input: { textAlign: 'center', fontWeight: 500, paddingLeft: 8, paddingRight: 8 } }}
                    />
                    <TextInput
                      placeholder="Phone"
                      value={contactPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      error={phoneError ? true : undefined}
                      style={{ flex: 1 }}
                      size="sm"
                      radius="md"
                    />
                  </Group>
                  {phoneError && <Text size="xs" c="red" mt={-8}>{phoneError}</Text>}
                  
                  <Textarea
                    placeholder="Your message..."
                    minRows={3}
                    value={contactMessage}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    error={messageError}
                    required
                    size="sm"
                    radius="md"
                  />
                  
                  <Button 
                    onClick={handleContactSubmit}
                    loading={contactSubmitting}
                    fullWidth
                    radius="md"
                    style={{ 
                      background: 'linear-gradient(135deg, #228be6 0%, #1c7ed6 100%)',
                    }}
                  >
                    Send Message
                  </Button>
                </Stack>
              </Box>
            </SimpleGrid>
          </Card>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;
