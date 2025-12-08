import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppShell, 
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
import { IconUser, IconLogout, IconMenu2 } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    close();
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/#services' },
    { label: 'About Us', to: '/#about' },
    { label: 'Browse Jobs', to: '/jobs' },
  ];

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
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Group gap="xs">
              <Box
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: '#0078D4',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text c="white" fw={700} size="lg">IL</Text>
              </Box>
              <Text fw={600} size="lg" c="dark" visibleFrom="xs">Integrate Leads</Text>
            </Group>
          </Link>

          {/* Desktop Navigation */}
          <Group gap="xl" visibleFrom="md">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                <Text c="dimmed" size="sm" fw={500} style={{ cursor: 'pointer' }}>
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
                  to="/dashboard"
                  variant="light"
                  leftSection={<IconUser size={16} />}
                >
                  {user?.name}
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
              <Button component={Link} to="/login">
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
        title={
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
        }
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
                to="/dashboard"
                variant="light"
                fullWidth
                leftSection={<IconUser size={16} />}
                onClick={close}
              >
                Dashboard
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
            <Button component={Link} to="/login" fullWidth onClick={close}>
              Login
            </Button>
          )}
        </Stack>
      </Drawer>
    </>
  );
};

export default Header;