import React from 'react';
import { Box, Loader, Text, Stack } from '@mantine/core';
import Logo from './Logo';

interface AutoLoginScreenProps {
  message?: string;
}

const AutoLoginScreen: React.FC<AutoLoginScreenProps> = ({ message = 'Signing you in...' }) => {
  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--mantine-color-gray-0)',
        zIndex: 9999,
      }}
    >
      <Stack align="center" gap="xl">
        <Logo size="xl" showText={true} linkTo="" />
        <Loader size="lg" color="blue" />
        <Text size="lg" fw={500} c="dimmed">
          {message}
        </Text>
      </Stack>
    </Box>
  );
};

export default AutoLoginScreen;
