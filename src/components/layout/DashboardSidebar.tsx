import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  Stack, 
  Tooltip, 
  UnstyledButton, 
  Text,
  Collapse
} from '@mantine/core';
import { 
  IconLayoutDashboard, 
  IconBriefcase, 
  IconUsers, 
  IconFileText, 
  IconBell, 
  IconSettings,
  IconCreditCard,
  IconPlus,
  IconChevronDown,
  IconChevronRight,
  IconFileInvoice
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path?: string;
  adminOnly?: boolean;
  recruiterOnly?: boolean;
  freelancerOnly?: boolean;
  children?: MenuItem[];
}

interface DashboardSidebarProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ expanded, onExpandChange }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>(['Post Requirement']);

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
      recruiterOnly: true,
      children: [
        { 
          icon: <IconPlus size={18} />, 
          label: 'New Job Posting', 
          path: '/dashboard/post-job' 
        },
        { 
          icon: <IconBriefcase size={18} />, 
          label: 'My Job Postings', 
          path: '/dashboard/my-jobs' 
        },
        { 
          icon: <IconFileText size={18} />, 
          label: 'Applications', 
          path: '/dashboard/applications' 
        },
      ]
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
      icon: <IconFileInvoice size={20} />, 
      label: 'Invoice', 
      path: '/dashboard/invoice',
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
    if (item.freelancerOnly && user?.role !== 'freelancer') return false;
    return true;
  });

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const isChildActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some(child => child.path && location.pathname === child.path);
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const isActive = item.path ? location.pathname === item.path : isChildActive(item.children);
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus.includes(item.label);

    if (hasChildren) {
      return (
        <Box key={item.label}>
          <Tooltip 
            label={item.label} 
            position="right" 
            disabled={expanded}
            withArrow
          >
            <UnstyledButton
              onClick={() => toggleMenu(item.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: isActive ? 'rgba(0, 120, 212, 0.1)' : 'transparent',
                color: isActive ? '#0078D4' : '#495057',
                textDecoration: 'none',
                transition: 'background-color 150ms ease',
                width: '100%',
              }}
            >
              <Box style={{ flexShrink: 0 }}>{item.icon}</Box>
              {expanded && (
                <>
                  <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap', flex: 1 }}>
                    {item.label}
                  </Text>
                  {isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                </>
              )}
            </UnstyledButton>
          </Tooltip>
          
          {expanded && (
            <Collapse in={isOpen}>
              <Stack gap={2} pl="md" mt={4}>
                {item.children?.map(child => renderMenuItem(child, true))}
              </Stack>
            </Collapse>
          )}
        </Box>
      );
    }

    return (
      <Tooltip 
        key={item.path || item.label} 
        label={item.label} 
        position="right" 
        disabled={expanded}
        withArrow
      >
        <UnstyledButton
          component={NavLink}
          to={item.path || '#'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isChild ? 8 : 12,
            padding: isChild ? '8px 12px' : '10px 12px',
            borderRadius: 8,
            backgroundColor: isActive ? '#0078D4' : 'transparent',
            color: isActive ? 'white' : '#495057',
            textDecoration: 'none',
            transition: 'background-color 150ms ease',
            fontSize: isChild ? 13 : 14,
          }}
        >
          <Box style={{ flexShrink: 0 }}>{item.icon}</Box>
          {expanded && (
            <Text size={isChild ? 'xs' : 'sm'} fw={500} style={{ whiteSpace: 'nowrap' }}>
              {item.label}
            </Text>
          )}
        </UnstyledButton>
      </Tooltip>
    );
  };

  return (
    <Box
      component="aside"
      style={{
        position: 'fixed',
        left: 0,
        top: 60,
        height: 'calc(100vh - 60px)',
        width: expanded ? 240 : 60,
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
        {filteredItems.map((item) => renderMenuItem(item))}
      </Stack>
    </Box>
  );
};

export default DashboardSidebar;
