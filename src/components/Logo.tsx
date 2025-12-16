import React from 'react';
import { Group, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import logoIcon from '@/assets/logo-icon.png';

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
      <img 
        src={logoIcon} 
        alt="Integrate Leads" 
        style={{ 
          width: iconSizes[size], 
          height: iconSizes[size],
          borderRadius: 6,
        }} 
      />
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
