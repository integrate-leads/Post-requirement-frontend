import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Group, 
  Button, 
  Text, 
  Burger, 
  Drawer, 
  Stack,
  Divider,
  UnstyledButton,
  Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUser, IconLogout } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import Logo from '@/components/Logo';

interface AdminProfile {
  name: string;
}

const Header: React.FC = () => {
  const { isAuthenticated, user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, { open, close }] = useDisclosure(false);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Fetch profile name for recruiters
  useEffect(() => {
    const fetchProfileName = async () => {
      if (isAuthenticated && !isSuperAdmin) {
        try {
          const response = await api.get<{ success: boolean; data: AdminProfile }>(
            API_ENDPOINTS.ADMIN.GET_PROFILE
          );
          if (response.data?.success) {
            setProfileName(response.data.data.name);
          }
        } catch (error) {
          console.error('Failed to fetch profile name:', error);
        }
      }
    };

    fetchProfileName();
  }, [isAuthenticated, isSuperAdmin]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    close();
  };

  const displayName = profileName || user?.name || 'User';

  const navLinks = [
    { label: 'Services', to: '/#services' },
    { label: 'Contact Us', to: '/#contact' },
  ];

  // Determine login route based on current path
  const getLoginRoute = () => {
    if (location.pathname.includes('/super-admin')) {
      return '/super-admin/login';
    }
    return '/recruiter/login';
  };

  return (
    <>
      <Box 
        component="header" 
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          backgroundColor: 'white',
          borderBottom: '1px solid #e9ecef'
        }}
      >
        <Group h={60} px={{ base: 'md', md: 'xl' }} justify="space-between">
          {/* Logo */}
          <Logo size="md" showText />

          {/* Desktop Navigation */}
          <Group gap="xl" visibleFrom="md">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                <Text c="gray.7" size="sm" fw={500} style={{ cursor: 'pointer' }}>
                  {link.label}
                </Text>
              </Link>
            ))}
          </Group>

          {/* Desktop Auth Buttons */}
          <Group gap="sm" visibleFrom="md">
            {isAuthenticated ? (
              <>
                <Button
                  component={Link}
                  to={isSuperAdmin ? '/super-admin/dashboard' : '/recruiter/dashboard'}
                  variant="light"
                  leftSection={<IconUser size={16} />}
                >
                  {displayName}
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={handleLogout}
                  leftSection={<IconLogout size={16} />}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button component={Link} to={getLoginRoute()}>
                Login
              </Button>
            )}
          </Group>

          {/* Mobile Menu Button */}
          <Burger opened={opened} onClick={open} hiddenFrom="md" size="sm" />
        </Group>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title={<Logo size="sm" showText linkTo="" />}
        size="xs"
        padding="md"
      >
        <Stack gap="sm">
          {navLinks.map((link) => (
            <UnstyledButton
              key={link.to}
              component={Link}
              to={link.to}
              onClick={close}
              py="sm"
              px="md"
              style={{ borderRadius: 8 }}
            >
              <Text size="sm" fw={500}>{link.label}</Text>
            </UnstyledButton>
          ))}
          
          <Divider my="sm" />
          
          {isAuthenticated ? (
            <>
              <Button
                component={Link}
                to={isSuperAdmin ? '/super-admin/dashboard' : '/recruiter/dashboard'}
                variant="light"
                fullWidth
                leftSection={<IconUser size={16} />}
                onClick={close}
              >
                {displayName}
              </Button>
              <Button
                variant="subtle"
                color="gray"
                fullWidth
                onClick={handleLogout}
                leftSection={<IconLogout size={16} />}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button component={Link} to={getLoginRoute()} fullWidth onClick={close}>
              Login
            </Button>
          )}
        </Stack>
      </Drawer>
    </>
  );
};

export default Header;