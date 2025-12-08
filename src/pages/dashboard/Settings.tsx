import React from 'react';
import { Card, Text, TextInput, Button, Stack, Group, Badge, Box, Title, Divider } from '@mantine/core';
import { IconUser, IconMail, IconBuilding } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box maw={600} mx="auto">
      <Box mb="xl"><Title order={2}>Account Settings</Title><Text c="dimmed">Manage your account information</Text></Box>

      <Card shadow="sm" padding="xl" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" mb="md">
            <Text fw={600} size="lg">Profile Information</Text>
            <Badge color={user?.role === 'super_admin' ? 'red' : 'blue'} variant="light" size="lg">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Recruiter'}
            </Badge>
          </Group>

          <TextInput label="Full Name" value={user?.name || ''} leftSection={<IconUser size={16} />} readOnly styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }} />
          <TextInput label="Email Address" value={user?.email || ''} leftSection={<IconMail size={16} />} readOnly styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }} />
          {user?.company && <TextInput label="Company" value={user.company} leftSection={<IconBuilding size={16} />} readOnly styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }} />}

          <Divider my="md" />

          <Box>
            <Text size="sm" c="dimmed" mb="md">To update your profile information, please contact support.</Text>
            <Button variant="outline">Contact Support</Button>
          </Box>
        </Stack>
      </Card>
    </Box>
  );
};

export default Settings;