import React from 'react';
import { Box, Button, Card, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconLock } from '@tabler/icons-react';

/** Shown when a recruiter opens a route for a feature not included in their plan */
const FeatureAccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box maw={520} w="100%" mx="auto" mt="xl" px="md">
      <Card withBorder shadow="sm" p="xl" radius="md">
        <Stack align="center" gap="md">
          <IconLock size={48} stroke={1.25} color="var(--mantine-color-red-6)" />
          <Title order={3} ta="center">Access denied</Title>
          <Text c="dimmed" ta="center" size="sm">
            Acess denied and you dont have a plan to acess these feature.
          </Text>
          <Button onClick={() => navigate('/recruiter/dashboard')} mt="xs">
            Back to dashboard
          </Button>
        </Stack>
      </Card>
    </Box>
  );
};

export default FeatureAccessDenied;
