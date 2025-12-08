import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@mantine/core';
import { IconUser, IconLogout } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-semibold text-foreground">RecruitPro</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/#services" className="text-muted-foreground hover:text-foreground transition-colors">
              Services
            </Link>
            <Link to="/#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About Us
            </Link>
            <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse Jobs
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconUser size={16} />}
                    className="bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                  >
                    {user?.name}
                  </Button>
                </Link>
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={handleLogout}
                  leftSection={<IconLogout size={16} />}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button
                  variant="filled"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
