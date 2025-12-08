import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Group, 
  Text, 
  Stack, 
  SimpleGrid,
  Anchor,
  Divider
} from '@mantine/core';

const Footer: React.FC = () => {
  return (
    <Box component="footer" bg="gray.0" py="xl">
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
          {/* Brand */}
          <Stack gap="sm">
            <Group gap="xs">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#0078D4',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text c="white" fw={700} size="sm">IL</Text>
              </Box>
              <Text fw={600}>Integrate Leads</Text>
            </Group>
            <Text size="sm" c="dimmed">
              Simplifying recruitment with smart solutions for recruiters and job seekers.
            </Text>
          </Stack>

          {/* Quick Links */}
          <Stack gap="xs">
            <Text fw={600} size="sm">Quick Links</Text>
            <Anchor component={Link} to="/" size="sm" c="dimmed" underline="hover">
              Home
            </Anchor>
            <Anchor component={Link} to="/jobs" size="sm" c="dimmed" underline="hover">
              Browse Jobs
            </Anchor>
            <Anchor component={Link} to="/login" size="sm" c="dimmed" underline="hover">
              Recruiter Login
            </Anchor>
          </Stack>

          {/* Services */}
          <Stack gap="xs">
            <Text fw={600} size="sm">Services</Text>
            <Text size="sm" c="dimmed">Post Requirements</Text>
            <Text size="sm" c="dimmed">Resume Database</Text>
            <Text size="sm" c="dimmed">Candidate Screening</Text>
          </Stack>

          {/* Contact */}
          <Stack gap="xs">
            <Text fw={600} size="sm">Contact</Text>
            <Text size="sm" c="dimmed">support@integrateleads.com</Text>
            <Text size="sm" c="dimmed">+1 (555) 123-4567</Text>
            <Text size="sm" c="dimmed">123 Business Street, Tech City</Text>
          </Stack>
        </SimpleGrid>

        <Divider my="xl" />

        <Text ta="center" size="sm" c="dimmed">
          © {new Date().getFullYear()} Integrate Leads. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
};

export default Footer;