import React from 'react';
import { Group, Text, Box } from '@mantine/core';
import { Link } from 'react-router-dom';
import integrateIcon from '@/assets/integrate_icon.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  linkTo?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, linkTo = '/' }) => {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const textSizes = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  } as const;

  const content = (
    <Group gap="xs" wrap="nowrap">
      <Box
        style={{
          width: iconSizes[size],
          height: iconSizes[size],
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #228be6 0%, #1c7ed6 100%)',
        }}
      >
        <img 
          src={integrateIcon} 
          alt="Integrate Leads" 
          style={{ 
            width: iconSizes[size],
            height: iconSizes[size],
            objectFit: 'cover',
          }} 
        />
      </Box>
      {showText && (
        <Text fw={600} size={textSizes[size]} c="dark" style={{ whiteSpace: 'nowrap' }}>
          Integrate Leads
        </Text>
      )}
    </Group>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
