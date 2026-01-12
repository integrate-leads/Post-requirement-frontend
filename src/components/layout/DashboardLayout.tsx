import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Box, Drawer, Burger, Group, Text, Stack, UnstyledButton, Badge, Collapse, Center, Loader } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { NavLink } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconBriefcase, 
  IconUsers, 
  IconFileText, 
  IconBell, 
  IconSettings,
  IconPlus,
  IconLogout,
  IconFileInvoice,
  IconChevronDown,
  IconChevronRight
} from '@tabler/icons-react';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { API_ENDPOINTS, api } from '@/hooks/useApi';

interface AdminProfile {
  companyName: string;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  children?: MenuItem[];
}

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isAuthLoading, user, logout } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpened, { open: openMobile, close: closeMobile }] = useDisclosure(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>(['Post Requirement']);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();

  // Determine if we're on super-admin or recruiter routes
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  const baseRoute = isSuperAdminRoute ? '/super-admin' : '/recruiter';

  // Fetch profile for recruiters
  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated && !isSuperAdminRoute) {
        try {
          const response = await api.get<{ success: boolean; data: AdminProfile }>(
            API_ENDPOINTS.ADMIN.GET_PROFILE
          );
          if (response.data?.success && response.data?.data?.companyName) {
            setCompanyName(response.data.data.companyName);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      }
    };

    fetchProfile();
  }, [isAuthenticated, isSuperAdminRoute]);

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login based on current route
    const loginPath = isSuperAdminRoute ? '/super-admin/login' : '/recruiter/login';
    return <Navigate to={loginPath} replace />;
  }

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  // Define menu items based on route type
  const superAdminMenuItems: MenuItem[] = [
    { icon: <IconLayoutDashboard size={20} />, label: 'Dashboard', path: `${baseRoute}/dashboard` },
    { icon: <IconUsers size={20} />, label: 'Recruiters', path: `${baseRoute}/recruiters` },
    { icon: <IconBell size={20} />, label: 'Alerts', path: `${baseRoute}/alerts` },
    { icon: <IconFileInvoice size={20} />, label: 'Invoice', path: `${baseRoute}/invoice` },
    { icon: <IconSettings size={20} />, label: 'Settings', path: `${baseRoute}/settings` },
  ];

  const recruiterMenuItems: MenuItem[] = [
    { icon: <IconLayoutDashboard size={20} />, label: 'Dashboard', path: `${baseRoute}/dashboard` },
    { 
      icon: <IconPlus size={20} />, 
      label: 'Post Requirement', 
      path: '',
      children: [
        { icon: <IconPlus size={18} />, label: 'Post Job', path: `${baseRoute}/post-job` },
        { icon: <IconBriefcase size={18} />, label: 'My Job Postings', path: `${baseRoute}/my-jobs` },
        { icon: <IconFileText size={18} />, label: 'Applications', path: `${baseRoute}/applications` },
      ]
    },
    { icon: <IconSettings size={20} />, label: 'Settings', path: `${baseRoute}/settings` },
  ];

  const menuItems = isSuperAdminRoute ? superAdminMenuItems : recruiterMenuItems;
  const displayName = companyName || user?.name || 'User';

  const renderMobileMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus.includes(item.label);
    const isActive = item.path ? location.pathname === item.path : item.children?.some(child => location.pathname === child.path);

    if (hasChildren) {
      return (
        <Box key={item.label}>
          <UnstyledButton
            onClick={() => toggleMenu(item.label)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px',
              borderRadius: 8,
              backgroundColor: isActive ? 'rgba(0, 120, 212, 0.1)' : 'transparent',
              color: isActive ? '#0078D4' : '#495057',
              textDecoration: 'none',
              width: '100%',
            }}
          >
            {item.icon}
            <Text size="sm" fw={500} style={{ flex: 1 }}>{item.label}</Text>
            {isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </UnstyledButton>
          <Collapse in={isOpen}>
            <Stack gap={4} pl="md" mt={4}>
              {item.children?.map(child => {
                const childActive = location.pathname === child.path;
                return (
                  <UnstyledButton
                    key={child.path}
                    component={NavLink}
                    to={child.path}
                    onClick={closeMobile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 8,
                      backgroundColor: childActive ? '#0078D4' : 'transparent',
                      color: childActive ? 'white' : '#495057',
                      textDecoration: 'none',
                    }}
                  >
                    {child.icon}
                    <Text size="xs" fw={500}>{child.label}</Text>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Collapse>
        </Box>
      );
    }

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
  };

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
            <Badge variant="light" color="blue" size="lg" visibleFrom="sm">
              {displayName}
            </Badge>
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
          {menuItems.map((item) => renderMobileMenuItem(item))}
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
