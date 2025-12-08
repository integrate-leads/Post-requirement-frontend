import React from 'react';
import { Card, Text, TextInput, Button, Stack, Group, Badge } from '@mantine/core';
import { IconUser, IconMail, IconBuilding } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Text size="2xl" fw={700} className="text-foreground">Account Settings</Text>
        <Text c="dimmed">Manage your account information</Text>
      </div>

      <Card shadow="sm" padding="xl" className="bg-card border border-border">
        <Stack gap="lg">
          <Group justify="space-between" mb="md">
            <Text fw={600} size="lg" className="text-foreground">Profile Information</Text>
            <Badge color={user?.role === 'super_admin' ? 'red' : 'blue'} variant="light" size="lg">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Recruiter'}
            </Badge>
          </Group>

          <TextInput
            label="Full Name"
            value={user?.name || ''}
            leftSection={<IconUser size={16} />}
            readOnly
            classNames={{
              input: 'bg-secondary border-input cursor-not-allowed',
              label: 'text-foreground'
            }}
          />

          <TextInput
            label="Email Address"
            value={user?.email || ''}
            leftSection={<IconMail size={16} />}
            readOnly
            classNames={{
              input: 'bg-secondary border-input cursor-not-allowed',
              label: 'text-foreground'
            }}
          />

          {user?.company && (
            <TextInput
              label="Company"
              value={user.company}
              leftSection={<IconBuilding size={16} />}
              readOnly
              classNames={{
                input: 'bg-secondary border-input cursor-not-allowed',
                label: 'text-foreground'
              }}
            />
          )}

          <div className="border-t border-border pt-4 mt-4">
            <Text size="sm" c="dimmed" mb="md">
              To update your profile information, please contact support.
            </Text>
            <Button
              variant="outline"
              className="border-primary text-primary"
            >
              Contact Support
            </Button>
          </div>
        </Stack>
      </Card>
    </div>
  );
};

export default Settings;
