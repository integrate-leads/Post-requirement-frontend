import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Text, 
  Stack, 
  SimpleGrid,
  Anchor,
  Group
} from '@mantine/core';
import { IconBrandLinkedin, IconPhone, IconMapPin } from '@tabler/icons-react';
import Logo from '@/components/Logo';

const Footer: React.FC = () => {
  return (
    <Box component="footer" bg="dark.8" py="xl">
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
          {/* Brand */}
          <Stack gap="md">
            <Logo size="md" showText={false} linkTo="" />
            <Text c="dimmed" size="sm">Integrate Leads</Text>
            <Text size="sm" c="gray.5">
              Simplifying recruitment with smart solutions for recruiters and job seekers.
            </Text>
            <Group gap="sm">
              <Anchor href="#" c="gray.5">
                <IconBrandLinkedin size={20} />
              </Anchor>
            </Group>
          </Stack>

          {/* Quick Links */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="white" mb="xs">Quick Links</Text>
            <Anchor component={Link} to="/" size="sm" c="gray.5" underline="hover">
              Home
            </Anchor>
            <Anchor component={Link} to="/jobs" size="sm" c="gray.5" underline="hover">
              Browse Jobs
            </Anchor>
            <Anchor component={Link} to="/login" size="sm" c="gray.5" underline="hover">
              Recruiter Login
            </Anchor>
          </Stack>

          {/* Services */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="white" mb="xs">Services</Text>
            <Text size="sm" c="gray.5">Post Requirements</Text>
            <Text size="sm" c="gray.5">Broadcast Email</Text>
          </Stack>

          {/* Contact */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="white" mb="xs">Contact</Text>
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <IconPhone size={16} color="#868e96" style={{ marginTop: 4, flexShrink: 0 }} />
              <Box>
                <Text size="sm" c="gray.5">+91 – 9491489066</Text>
                <Text size="sm" c="gray.5">+1 (555) 123-4567</Text>
              </Box>
            </Group>
            <Group gap="xs">
              <IconMapPin size={16} color="#868e96" />
              <Text size="sm" c="gray.5">123 Business Street, Tech City</Text>
            </Group>
          </Stack>
        </SimpleGrid>

        <Box mt="xl" pt="xl" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Text ta="center" size="sm" c="gray.6">
            © {new Date().getFullYear()} Integrate Leads. All rights reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
