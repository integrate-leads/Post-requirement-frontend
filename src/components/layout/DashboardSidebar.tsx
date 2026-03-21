import React, { useState, useEffect } from 'react';
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
  IconChevronDown,
  IconChevronRight
} from '@tabler/icons-react';
import './sidebarSubmenu.css';

interface MenuItem {
  icon?: React.ReactNode;
  label: string;
  path: string;
  children?: MenuItem[];
}

interface DashboardSidebarProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  menuItems: MenuItem[];
  /** Pending payment requests count (super-admin Alerts); show red badge when > 0 */
  alertPendingCount?: number;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ expanded, onExpandChange, menuItems, alertPendingCount = 0 }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  // Keep parent sections expanded when the active route is a child link
  useEffect(() => {
    const labels = menuItems
      .filter((item) => item.children?.some((c) => c.path === location.pathname))
      .map((i) => i.label);
    if (!labels.length) return;
    setOpenMenus((prev) => [...new Set([...prev, ...labels])]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only when pathname changes; menuItems from props changes every parent render
  }, [location.pathname]);

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
                justifyContent: expanded ? undefined : 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: isActive ? 'rgba(0, 120, 212, 0.12)' : 'transparent',
                color: isActive ? '#0078D4' : '#495057',
                textDecoration: 'none',
                transition: 'background-color 150ms ease',
                width: '100%',
                border: 'none',
                boxShadow: 'none',
                outline: 'none',
              }}
            >
              <Box style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>{item.icon}</Box>
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

    const showAlertBadge = !isChild && item.label === 'Alerts' && alertPendingCount > 0;

    if (isChild) {
      return (
        <Tooltip
          key={item.path || item.label}
          label={item.label}
          position="right"
          disabled={expanded}
          withArrow
        >
          <NavLink
            to={item.path || '#'}
            end
            className={({ isActive }) =>
              ['sidebar-submenu-link', isActive && 'sidebar-submenu-link--active'].filter(Boolean).join(' ')
            }
          >
            <Text component="span" size="xs" fw={500} style={{ whiteSpace: 'nowrap' }}>
              {item.label}
            </Text>
          </NavLink>
        </Tooltip>
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
            justifyContent: expanded ? undefined : 'center',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: isActive ? 'rgba(0, 120, 212, 0.12)' : 'transparent',
            color: isActive ? '#0078D4' : '#495057',
            textDecoration: 'none',
            transition: 'background-color 150ms ease',
            fontSize: 14,
            border: 'none',
            boxShadow: 'none',
            outline: 'none',
          }}
        >
          <Box style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit', position: 'relative' }}>
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
                  border: '1.5px solid #f8f9fa',
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
          {expanded && (
            <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
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
        {menuItems.map((item) => renderMenuItem(item))}
      </Stack>
    </Box>
  );
};

export default DashboardSidebar;
