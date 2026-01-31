import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import ScrollToTop from './components/ScrollToTop';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Index from './pages/Index';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import NotFound from './pages/NotFound';

// Auth Pages
import AuthLogin from './pages/auth/AuthLogin';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
// import Services from './pages/dashboard/Services'; // Commented out - not needed
import PostJob from './pages/dashboard/PostJob';
import MyJobs from './pages/dashboard/MyJobs';
import Applications from './pages/dashboard/Applications';
import Recruiters from './pages/dashboard/Recruiters';
import Alerts from './pages/dashboard/Alerts';
import Settings from './pages/dashboard/Settings';
import Invoice from './pages/dashboard/Invoice';

const queryClient = new QueryClient();

const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: [
      '#e5f3ff',
      '#cce7ff',
      '#99ceff',
      '#66b5ff',
      '#339cff',
      '#0078D4',
      '#0062ad',
      '#004d86',
      '#003760',
      '#002239',
    ],
  },
  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
  headings: {
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <BrowserRouter
        future={{
          v7_startTransition: true,
        }}
      >
        <AuthProvider>
          <AppDataProvider>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                
                {/* Super Admin Auth Routes */}
                <Route path="/super-admin/login" element={<AuthLogin />} />
                <Route path="/super-admin/forgot-password" element={<AuthLogin />} />
                
                {/* Recruiter Auth Routes */}
                <Route path="/recruiter/login" element={<AuthLogin />} />
                <Route path="/recruiter/forgot-password" element={<AuthLogin />} />
                <Route path="/recruiter/signup" element={<AuthLogin />} />
              </Route>
              
              {/* Redirect old /login to recruiter login */}
              <Route path="/login" element={<Navigate to="/recruiter/login" replace />} />

              {/* Super Admin Dashboard Routes */}
              <Route path="/super-admin" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="recruiters" element={<Recruiters />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="invoice" element={<Invoice />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Recruiter Dashboard Routes */}
              <Route path="/recruiter" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                {/* <Route path="services" element={<Services />} /> */}
                <Route path="post-job" element={<PostJob />} />
                <Route path="my-jobs" element={<MyJobs />} />
                <Route path="applications" element={<Applications />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Redirect old /dashboard to appropriate route based on login */}
              <Route path="/dashboard" element={<Navigate to="/recruiter/dashboard" replace />} />
              <Route path="/dashboard/*" element={<Navigate to="/recruiter/dashboard" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  </QueryClientProvider>
);

export default App;
