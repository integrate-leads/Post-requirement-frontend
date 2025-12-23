import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import ScrollToTop from './components/ScrollToTop';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import NotFound from './pages/NotFound';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Services from './pages/dashboard/Services';
import PostJob from './pages/dashboard/PostJob';
import MyJobs from './pages/dashboard/MyJobs';
import Applications from './pages/dashboard/Applications';
import Recruiters from './pages/dashboard/Recruiters';
import Alerts from './pages/dashboard/Alerts';
import Settings from './pages/dashboard/Settings';

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
      <AuthProvider>
        <AppDataProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
              </Route>

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="services" element={<Services />} />
                <Route path="post-job" element={<PostJob />} />
                <Route path="my-jobs" element={<MyJobs />} />
                <Route path="applications" element={<Applications />} />
                <Route path="recruiters" element={<Recruiters />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppDataProvider>
      </AuthProvider>
    </MantineProvider>
  </QueryClientProvider>
);

export default App;