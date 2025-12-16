import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, Drawer, Burger, Group, Text, Stack, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconBriefcase, 
  IconUsers, 
  IconFileText, 
  IconBell, 
  IconSettings,
  IconCreditCard,
  IconPlus,
  IconLogout
} from '@tabler/icons-react';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpened, { open: openMobile, close: closeMobile }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { icon: <IconLayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <IconCreditCard size={20} />, label: 'Services', path: '/dashboard/services', recruiterOnly: true },
    { icon: <IconPlus size={20} />, label: 'Post Requirement', path: '/dashboard/post-job', recruiterOnly: true },
    { icon: <IconBriefcase size={20} />, label: 'My Job Postings', path: '/dashboard/my-jobs', recruiterOnly: true },
    { icon: <IconFileText size={20} />, label: 'Applications', path: '/dashboard/applications', recruiterOnly: true },
    { icon: <IconUsers size={20} />, label: 'Recruiters', path: '/dashboard/recruiters', adminOnly: true },
    { icon: <IconBell size={20} />, label: 'Alerts', path: '/dashboard/alerts', adminOnly: true },
    { icon: <IconSettings size={20} />, label: 'Settings', path: '/dashboard/settings' },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.adminOnly && user?.role !== 'super_admin') return false;
    if (item.recruiterOnly && user?.role !== 'recruiter') return false;
    return true;
  });

  return (
    <Box mih="100vh" bg="gray.0">
      {/* Custom Dashboard Header */}
      <Box 
        component="header" 
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          backgroundColor: 'white',
          borderBottom: '1px solid #e9ecef',
          height: 60,
        }}
      >
        <Group h={60} px={{ base: 'md', md: 'xl' }} justify="space-between">
          <Group gap="md">
            {isMobile && (
              <Burger opened={mobileOpened} onClick={openMobile} size="sm" />
            )}
            <Logo size="md" showText />
          </Group>

          <Group gap="sm">
            <Text size="sm" c="dimmed" visibleFrom="sm">{user?.name}</Text>
            <UnstyledButton onClick={logout}>
              <IconLogout size={20} color="#868e96" />
            </UnstyledButton>
          </Group>
        </Group>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        opened={mobileOpened}
        onClose={closeMobile}
        title={<Text fw={600}>Menu</Text>}
        size="xs"
        padding="md"
      >
        <Stack gap="xs">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <UnstyledButton
                key={item.path}
                component={NavLink}
                to={item.path}
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px',
                  borderRadius: 8,
                  backgroundColor: isActive ? '#0078D4' : 'transparent',
                  color: isActive ? 'white' : '#495057',
                  textDecoration: 'none',
                }}
              >
                {item.icon}
                <Text size="sm" fw={500}>{item.label}</Text>
              </UnstyledButton>
            );
          })}
        </Stack>
      </Drawer>

      <Box style={{ display: 'flex' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DashboardSidebar 
            expanded={sidebarExpanded} 
            onExpandChange={setSidebarExpanded} 
          />
        )}
        
        {/* Main Content */}
        <Box
          component="main"
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : 60,
            padding: isMobile ? 16 : 24,
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;