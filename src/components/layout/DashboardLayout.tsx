import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Box, Drawer, Burger, Group, Text, Stack, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { NavLink } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconBriefcase, 
  IconUsers, 
  IconFileText, 
  IconBell, 
  IconSettings,
  IconCreditCard,
  IconPlus,
  IconLogout,
  IconFileInvoice
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

  // Determine if we're on super-admin or recruiter routes
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  const baseRoute = isSuperAdminRoute ? '/super-admin' : '/recruiter';

  if (!isAuthenticated) {
    // Redirect to appropriate login based on current route
    const loginPath = isSuperAdminRoute ? '/super-admin/login' : '/recruiter/login';
    return <Navigate to={loginPath} replace />;
  }

  // Define menu items based on route type
  const superAdminMenuItems = [
    { icon: <IconLayoutDashboard size={20} />, label: 'Dashboard', path: `${baseRoute}/dashboard` },
    { icon: <IconUsers size={20} />, label: 'Recruiters', path: `${baseRoute}/recruiters` },
    { icon: <IconBell size={20} />, label: 'Alerts', path: `${baseRoute}/alerts` },
    { icon: <IconFileInvoice size={20} />, label: 'Invoice', path: `${baseRoute}/invoice` },
    { icon: <IconSettings size={20} />, label: 'Settings', path: `${baseRoute}/settings` },
  ];

  const recruiterMenuItems = [
    { icon: <IconLayoutDashboard size={20} />, label: 'Dashboard', path: `${baseRoute}/dashboard` },
    { icon: <IconCreditCard size={20} />, label: 'Services', path: `${baseRoute}/services` },
    { icon: <IconPlus size={20} />, label: 'Post Requirement', path: `${baseRoute}/post-job` },
    { icon: <IconBriefcase size={20} />, label: 'My Job Postings', path: `${baseRoute}/my-jobs` },
    { icon: <IconFileText size={20} />, label: 'Applications', path: `${baseRoute}/applications` },
    { icon: <IconSettings size={20} />, label: 'Settings', path: `${baseRoute}/settings` },
  ];

  const menuItems = isSuperAdminRoute ? superAdminMenuItems : recruiterMenuItems;

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
          {menuItems.map((item) => {
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
            menuItems={menuItems}
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
