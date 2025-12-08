import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  Stack, 
  Tooltip, 
  UnstyledButton, 
  Text,
  Transition
} from '@mantine/core';
import { 
  IconLayoutDashboard, 
  IconBriefcase, 
  IconUsers, 
  IconFileText, 
  IconBell, 
  IconSettings,
  IconCreditCard,
  IconPlus
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  adminOnly?: boolean;
  recruiterOnly?: boolean;
}

interface DashboardSidebarProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ expanded, onExpandChange }) => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { 
      icon: <IconLayoutDashboard size={20} />, 
      label: 'Dashboard', 
      path: '/dashboard' 
    },
    { 
      icon: <IconCreditCard size={20} />, 
      label: 'Services', 
      path: '/dashboard/services',
      recruiterOnly: true 
    },
    { 
      icon: <IconPlus size={20} />, 
      label: 'Post Requirement', 
      path: '/dashboard/post-job',
      recruiterOnly: true 
    },
    { 
      icon: <IconBriefcase size={20} />, 
      label: 'My Job Postings', 
      path: '/dashboard/my-jobs',
      recruiterOnly: true 
    },
    { 
      icon: <IconFileText size={20} />, 
      label: 'Applications', 
      path: '/dashboard/applications',
      recruiterOnly: true 
    },
    { 
      icon: <IconUsers size={20} />, 
      label: 'Recruiters', 
      path: '/dashboard/recruiters',
      adminOnly: true 
    },
    { 
      icon: <IconBell size={20} />, 
      label: 'Alerts', 
      path: '/dashboard/alerts',
      adminOnly: true 
    },
    { 
      icon: <IconSettings size={20} />, 
      label: 'Settings', 
      path: '/dashboard/settings' 
    },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.adminOnly && user?.role !== 'super_admin') return false;
    if (item.recruiterOnly && user?.role !== 'recruiter') return false;
    return true;
  });

  return (
    <Box
      component="aside"
      style={{
        position: 'fixed',
        left: 0,
        top: 60,
        height: 'calc(100vh - 60px)',
        width: expanded ? 220 : 60,
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e9ecef',
        zIndex: 50,
        transition: 'width 200ms ease',
        overflow: 'hidden',
      }}
      onMouseEnter={() => onExpandChange(true)}
      onMouseLeave={() => onExpandChange(false)}
    >
      <Stack gap={4} p="xs">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Tooltip 
              key={item.path} 
              label={item.label} 
              position="right" 
              disabled={expanded}
              withArrow
            >
              <UnstyledButton
                component={NavLink}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: isActive ? '#0078D4' : 'transparent',
                  color: isActive ? 'white' : '#495057',
                  textDecoration: 'none',
                  transition: 'background-color 150ms ease',
                }}
              >
                <Box style={{ flexShrink: 0 }}>{item.icon}</Box>
                {expanded && (
                  <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                    {item.label}
                  </Text>
                )}
              </UnstyledButton>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
};

export default DashboardSidebar;