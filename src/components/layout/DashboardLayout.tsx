import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  Burger,
  Group,
  Text,
  Stack,
  UnstyledButton,
  Badge,
  Collapse,
  Center,
  Loader,
  Button,
  ActionIcon,
  Paper,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { NavLink } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconUsers, 
  IconBell, 
  IconSettings,
  IconPlus,
  IconLogout,
  IconFileInvoice,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
  IconLogin,
  IconMail,
  IconSparkles,
  IconCreditCard,
} from '@tabler/icons-react';
import DashboardSidebar from './DashboardSidebar';
import './sidebarSubmenu.css';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { usePurchasedFeatures } from '@/contexts/PurchasedFeaturesContext';

interface AdminProfile {
  companyName: string;
}

interface MenuItem {
  icon?: React.ReactNode;
  label: string;
  path: string;
  children?: MenuItem[];
}

interface DashboardNotification {
  id: number;
  type?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
}

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isAuthLoading, user, logout } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpened, { open: openMobile, close: closeMobile }] = useDisclosure(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [alertPendingCount, setAlertPendingCount] = useState<number>(0);
  const [notifOpened, setNotifOpened] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifLoadingMore, setNotifLoadingMore] = useState(false);
  const [notifs, setNotifs] = useState<DashboardNotification[]>([]);
  const [notifPage, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(false);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();
  const navigate = useNavigate();
  const { showPostRequirementNav, showEmailBroadcastNav, showDashboardSettingsNav } = usePurchasedFeatures();

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

  // Fetch alert (payment requests) pending count for super-admin sidebar badge — same API as Alerts page
  useEffect(() => {
    const fetchAlertCount = async () => {
      if (!isAuthenticated || !isSuperAdminRoute) return;
      try {
        const response = await api.get<{ success: boolean; totalRecords?: number }>(
          API_ENDPOINTS.SUPER_ADMIN.LIST_PENDING_PURCHASE_REQUESTS,
          { params: { page: 1, limit: 10 } }
        );
        if (response.data?.success && typeof response.data?.totalRecords === 'number') {
          setAlertPendingCount(response.data.totalRecords);
        }
      } catch (error) {
        console.error('Failed to fetch alert count:', error);
      }
    };
    fetchAlertCount();
    const onVisible = () => { fetchAlertCount(); };
    const onAlertsUpdated = () => { fetchAlertCount(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('alerts-updated', onAlertsUpdated);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('alerts-updated', onAlertsUpdated);
    };
  }, [isAuthenticated, isSuperAdminRoute, location.pathname]);

  // Set a timeout for loading state - show fallback UI after 10 seconds
  useEffect(() => {
    if (isAuthLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isAuthLoading]);

  const loadNotifications = async (pageToLoad = 1, append = false) => {
    if (!isAuthenticated || isSuperAdminRoute) return;
    if (append) setNotifLoadingMore(true);
    else setNotifLoading(true);
    try {
      const response = await api.get<{
        success?: boolean;
        data?: {
          notifications?: DashboardNotification[];
          unreadCount?: number;
          pagination?: { totalPages?: number; currentPage?: number };
        };
      }>(API_ENDPOINTS.ADMIN.NOTIFICATIONS(pageToLoad, 10, 'subscription_expiry', false));
      const payload = response.data?.data;
      const rows = Array.isArray(payload?.notifications) ? payload?.notifications : [];
      const currentPage = Number(payload?.pagination?.currentPage ?? pageToLoad) || pageToLoad;
      const totalPages = Number(payload?.pagination?.totalPages ?? currentPage) || currentPage;
      setNotifUnreadCount(Number(payload?.unreadCount ?? 0) || 0);
      setNotifPage(currentPage);
      setNotifHasMore(currentPage < totalPages);
      setNotifs((prev) => {
        const next = append ? [...prev, ...rows] : rows;
        const seen = new Set<number>();
        return next.filter((n) => {
          if (!n || typeof n.id !== 'number') return false;
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (!append) {
        setNotifs([]);
        setNotifUnreadCount(0);
      }
    } finally {
      setNotifLoading(false);
      setNotifLoadingMore(false);
    }
  };

  const handleOpenNotifications = () => {
    const next = !notifOpened;
    setNotifOpened(next);
    if (next) {
      loadNotifications(1, false);
    }
  };

  const handleNotificationScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!notifHasMore || notifLoading || notifLoadingMore) return;
    const el = event.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) {
      loadNotifications(notifPage + 1, true);
    }
  };

  const markNotificationRead = async (notificationId: number) => {
    try {
      await api.patch(API_ENDPOINTS.ADMIN.NOTIFICATION_MARK_READ(notificationId));
      setNotifs((prev) => prev.filter((n) => n.id !== notificationId));
      setNotifUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllNotificationsRead = async () => {
    if (markingAllRead || notifs.length === 0) return;
    setMarkingAllRead(true);
    try {
      await api.patch(API_ENDPOINTS.ADMIN.NOTIFICATION_MARK_ALL_READ);
      setNotifs([]);
      setNotifUnreadCount(0);
      setNotifHasMore(false);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || isSuperAdminRoute) return;
    loadNotifications(1, false);
    const timer = setInterval(() => {
      loadNotifications(1, false);
    }, 30000);
    return () => clearInterval(timer);
  }, [isAuthenticated, isSuperAdminRoute]);

  // Mobile drawer: expand parent groups when the active route is a sub-item (must run before any early return — Rules of Hooks)
  useEffect(() => {
    if (!isAuthenticated || isAuthLoading) return;

    const labels: string[] = [];
    if (!isSuperAdminRoute) {
      const p = location.pathname;
      if (p.includes('/post-job') || p.includes('/my-jobs') || p.includes('/applications')) {
        labels.push('Post Requirement');
      }
      if (p.includes('/email-broadcast')) {
        labels.push('Email Broadcast');
      }
    }
    if (!labels.length) return;
    setOpenMenus((prev) => [...new Set([...prev, ...labels])]);
  }, [location.pathname, isAuthenticated, isAuthLoading, isSuperAdminRoute]);

  const recruiterMenuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];
    if (showDashboardSettingsNav) {
      items.push({ icon: <IconLayoutDashboard size={20} />, label: 'Dashboard', path: `${baseRoute}/dashboard` });
    }
    if (showPostRequirementNav) {
      items.push({
        icon: <IconPlus size={20} />,
        label: 'Post Requirement',
        path: '',
        children: [
          { label: 'Post Job', path: `${baseRoute}/post-job` },
          { label: 'My Job Postings', path: `${baseRoute}/my-jobs` },
          { label: 'Applications', path: `${baseRoute}/applications` },
        ],
      });
    }
    if (showEmailBroadcastNav) {
      items.push({
        icon: <IconMail size={20} />,
        label: 'Email Broadcast',
        path: '',
        children: [
          { label: 'Upload Email', path: `${baseRoute}/email-broadcast/upload` },
          { label: 'Campaign activity', path: `${baseRoute}/email-broadcast/campaigns/list` },
          { label: 'Send campaign', path: `${baseRoute}/email-broadcast/campaigns` },
          { label: 'Templates', path: `${baseRoute}/email-broadcast/templates` },
        ],
      });
    }
    items.push({ icon: <IconCreditCard size={20} />, label: 'Pricing', path: `${baseRoute}/pricing` });
    if (showDashboardSettingsNav) {
      items.push({ icon: <IconSettings size={20} />, label: 'Settings', path: `${baseRoute}/settings` });
    }
    return items;
  }, [baseRoute, showPostRequirementNav, showEmailBroadcastNav, showDashboardSettingsNav]);

  // Handle refresh button click
  const handleRefresh = () => {
    window.location.reload();
  };

  // Handle login button click
  const handleGoToLogin = () => {
    const loginPath = isSuperAdminRoute ? '/super-admin/login' : '/recruiter/login';
    navigate(loginPath);
  };

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <Center h="100vh" style={{ flexDirection: 'column', gap: 16 }}>
        <Loader size="lg" />
        {loadingTimeout && (
          <Stack align="center" gap="sm" mt="lg">
            <Text c="dimmed" size="sm">Taking longer than expected...</Text>
            <Group gap="sm">
              <Button 
                variant="light" 
                leftSection={<IconRefresh size={16} />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
              <Button 
                variant="outline" 
                leftSection={<IconLogin size={16} />}
                onClick={handleGoToLogin}
              >
                Go to Login
              </Button>
            </Group>
          </Stack>
        )}
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
    { icon: <IconSparkles size={20} />, label: 'Features', path: `${baseRoute}/features` },
    { icon: <IconCreditCard size={20} />, label: 'Subscription', path: `${baseRoute}/subscriptions` },
    { icon: <IconFileInvoice size={20} />, label: 'Invoice', path: `${baseRoute}/invoice` },
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
              backgroundColor: isActive ? 'rgba(0, 120, 212, 0.12)' : 'transparent',
              color: isActive ? '#0078D4' : '#495057',
              textDecoration: 'none',
              width: '100%',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            {item.icon}
            <Text size="sm" fw={500} style={{ flex: 1 }}>{item.label}</Text>
            {isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </UnstyledButton>
          <Collapse in={isOpen}>
            <Stack gap={4} pl="md" mt={4}>
              {item.children?.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  end
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    ['sidebar-submenu-link', isActive && 'sidebar-submenu-link--active'].filter(Boolean).join(' ')
                  }
                >
                  <Text component="span" size="xs" fw={500}>
                    {child.label}
                  </Text>
                </NavLink>
              ))}
            </Stack>
          </Collapse>
        </Box>
      );
    }

    const showAlertBadge = item.label === 'Alerts' && alertPendingCount > 0;
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
          backgroundColor: isActive ? 'rgba(0, 120, 212, 0.12)' : 'transparent',
          color: isActive ? '#0078D4' : '#495057',
          textDecoration: 'none',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        <Box style={{ position: 'relative' }}>
          {item.icon}
          {showAlertBadge && (
            <Box
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 14,
                height: 14,
                paddingLeft: alertPendingCount > 9 ? 3 : 0,
                paddingRight: alertPendingCount > 9 ? 3 : 0,
                borderRadius: '50%',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: '1.5px solid #fff',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 0,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <span style={{ display: 'block', textAlign: 'center', lineHeight: 14 }}>
                {alertPendingCount > 99 ? '99+' : alertPendingCount}
              </span>
            </Box>
          )}
        </Box>
        <Text size="sm" fw={500}>{item.label}</Text>
      </UnstyledButton>
    );
  };

  return (
    <Box mih="100vh" bg="gray.0" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
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
            {!isSuperAdminRoute && (
              <Box style={{ order: 0 }}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  onClick={handleOpenNotifications}
                  styles={{
                    root: {
                      backgroundColor: 'transparent',
                      transition: 'none',
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    },
                  }}
                  style={{ backgroundColor: 'transparent' }}
                >
                  <Box style={{ position: 'relative' }}>
                    <IconBell size={20} color="#495057" />
                    {notifUnreadCount > 0 && (
                      <Box
                        style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          minWidth: 14,
                          height: 14,
                          paddingLeft: notifUnreadCount > 9 ? 3 : 0,
                          paddingRight: notifUnreadCount > 9 ? 3 : 0,
                          borderRadius: '50%',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: '1.5px solid #fff',
                          fontSize: 9,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        <span style={{ display: 'block', textAlign: 'center', lineHeight: 14 }}>
                          {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                        </span>
                      </Box>
                    )}
                  </Box>
                </ActionIcon>
              </Box>
            )}
            <Badge variant="light" color="blue" size="lg" visibleFrom="sm">
              {displayName}
            </Badge>
            <UnstyledButton onClick={logout}>
              <IconLogout size={20} color="#868e96" />
            </UnstyledButton>
          </Group>
        </Group>
      </Box>
      {!isSuperAdminRoute && notifOpened && (
        <Paper
          withBorder
          radius={0}
          shadow="md"
          style={{
            position: 'fixed',
            top: 60,
            right: 0,
            width: 500,
            maxWidth: '100vw',
            zIndex: 210,
          }}
        >
          <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid #e9ecef' }}>
            <Text fw={600}>Notifications</Text>
            <Group gap="xs">
              <Text size="sm" c="red">
                Unread
              </Text>
              <Badge size="sm" color="red" variant="light">
                {notifUnreadCount}
              </Badge>
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                loading={markingAllRead}
                disabled={notifs.length === 0}
                onClick={markAllNotificationsRead}
              >
                Read all
              </Button>
            </Group>
          </Group>

          {notifLoading ? (
            <Stack p="lg" align="center" gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading notifications...
              </Text>
            </Stack>
          ) : (
            <Box
              style={{ maxHeight: 560, overflowY: 'auto', overscrollBehavior: 'contain' }}
              onScroll={handleNotificationScroll}
            >
              {notifs.length === 0 ? (
                <Stack p="lg" align="center" gap={4}>
                  <Text fw={500} c="dimmed">
                    No unread notifications
                  </Text>
                </Stack>
              ) : (
                <Stack gap={0}>
                  {notifs.map((n) => (
                    <UnstyledButton
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderBottom: '1px solid #eef1f4',
                      }}
                    >
                      <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                          <Text fw={600} lineClamp={1}>
                            {n.title || 'Notification'}
                          </Text>
                          <Text size="sm" c="dimmed" mt={4} lineClamp={2}>
                            {n.message || ''}
                          </Text>
                        </Box>
                        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB') : '—'}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
              )}
              {notifLoadingMore && (
                <Group justify="center" py="sm">
                  <Loader size="xs" />
                </Group>
              )}
            </Box>
          )}
        </Paper>
      )}

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

      <Box style={{ display: 'flex', width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DashboardSidebar 
            expanded={sidebarExpanded} 
            onExpandChange={setSidebarExpanded}
            menuItems={menuItems}
            alertPendingCount={isSuperAdminRoute ? alertPendingCount : undefined}
          />
        )}
        
        {/* Main Content */}
        <Box
          component="main"
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : 60,
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            padding: isMobile ? '12px 12px 20px' : 24,
            minHeight: 'calc(100vh - 60px)',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
