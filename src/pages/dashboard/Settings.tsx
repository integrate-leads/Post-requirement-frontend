import React from 'react';
import { Card, Text, TextInput, Button, Stack, Group, Badge, Box, Title, Divider, Paper, ThemeIcon } from '@mantine/core';
import { IconUser, IconMail, IconBuilding, IconLogout, IconPhone, IconWorld, IconMapPin } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'super_admin':
        return <Badge color="red" variant="light" size="lg">Super Admin</Badge>;
      case 'recruiter':
        return <Badge color="blue" variant="light" size="lg">IT Recruiter</Badge>;
      case 'freelancer':
        return <Badge color="green" variant="light" size="lg">Freelancer</Badge>;
      default:
        return <Badge color="gray" variant="light" size="lg">User</Badge>;
    }
  };

  return (
    <Box maw={600} mx="auto">
      <Box mb="xl">
        <Title order={2}>Account Settings</Title>
        <Text c="dimmed">Manage your account information</Text>
      </Box>

      <Card shadow="sm" padding="xl" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" mb="md">
            <Text fw={600} size="lg">Profile Information</Text>
            {getRoleBadge()}
          </Group>

          <TextInput
            label="Full Name"
            value={user?.name || ''}
            leftSection={<IconUser size={16} />}
            readOnly
            styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
          />

          <TextInput
            label="Email Address"
            value={user?.email || ''}
            leftSection={<IconMail size={16} />}
            readOnly
            styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
          />

          {user?.phone && (
            <TextInput
              label="Phone Number"
              value={user.phone}
              leftSection={<IconPhone size={16} />}
              readOnly
              styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
            />
          )}

          {user?.company && (
            <TextInput
              label="Company"
              value={user.company}
              leftSection={<IconBuilding size={16} />}
              readOnly
              styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
            />
          )}

          {user?.companyWebsite && (
            <TextInput
              label="Company Website"
              value={user.companyWebsite}
              leftSection={<IconWorld size={16} />}
              readOnly
              styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
            />
          )}

          {user?.postalAddress && (
            <TextInput
              label="Postal Address"
              value={user.postalAddress}
              leftSection={<IconMapPin size={16} />}
              readOnly
              styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
            />
          )}

          <Divider my="md" />

          <Box>
            <Text size="sm" c="dimmed" mb="md">
              To update your profile information, please contact support.
            </Text>
            <Button variant="outline">Contact Support</Button>
          </Box>

          <Divider my="md" />

          <Paper p="md" bg="red.0" radius="md">
            <Group justify="space-between">
              <Box>
                <Text fw={500} c="red.7">Sign Out</Text>
                <Text size="sm" c="dimmed">Sign out of your account on this device</Text>
              </Box>
              <Button 
                color="red" 
                variant="outline" 
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Group>
          </Paper>
        </Stack>
      </Card>
    </Box>
  );
};

export default Settings;
