import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconBriefcase, 
  IconUsers, 
  IconFileText, 
  IconBell, 
  IconSettings,
  IconCreditCard,
  IconChevronRight,
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

const DashboardSidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
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
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border z-40 transition-all duration-200 ${
        isExpanded ? 'w-56' : 'w-14'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="p-2 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive 
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isExpanded && (
                <>
                  <span className="flex-1 text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                  <IconChevronRight size={14} className="opacity-50" />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
