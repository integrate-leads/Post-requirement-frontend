import { MantineProvider, createTheme } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { PurchasedFeaturesProvider } from '@/contexts/PurchasedFeaturesContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import ScrollToTop from './components/ScrollToTop';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Index from './pages/Index';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
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
import Features from './pages/dashboard/Features';
import Subscriptions from './pages/dashboard/Subscriptions';
import EmailBroadcast from './pages/dashboard/EmailBroadcast';
import EmailListContacts from './pages/dashboard/EmailListContacts';
import SendEmail from './pages/dashboard/SendEmail';
import EmailBroadcastCampaignsList from './pages/dashboard/EmailBroadcastCampaignsList';
import EmailTemplates from './pages/dashboard/EmailTemplates';
import RequireRecruiterFeature from './components/RequireRecruiterFeature';
import RequireAnyRecruiterFeature from './components/RequireAnyRecruiterFeature';
import Pricing from './pages/Pricing';

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
      <DatesProvider settings={{ firstDayOfWeek: 0, weekendDays: [0, 6] }}>
      <Notifications position="top-right" />
      <BrowserRouter
        future={{
          v7_startTransition: true,
        }}
      >
        <AuthProvider>
          <PurchasedFeaturesProvider>
          <AppDataProvider>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/pricing" element={<Pricing />} />
                
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
                <Route path="features" element={<Features />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="invoice" element={<Invoice />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Recruiter Dashboard Routes */}
              <Route path="/recruiter" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
                <Route path="dashboard" element={<RequireAnyRecruiterFeature><Dashboard /></RequireAnyRecruiterFeature>} />
                {/* <Route path="services" element={<Services />} /> */}
                <Route path="post-job" element={<RequireRecruiterFeature feature="postRequirement"><PostJob /></RequireRecruiterFeature>} />
                <Route path="my-jobs" element={<RequireRecruiterFeature feature="postRequirement"><MyJobs /></RequireRecruiterFeature>} />
                <Route path="applications" element={<RequireRecruiterFeature feature="postRequirement"><Applications /></RequireRecruiterFeature>} />
                <Route path="email-broadcast" element={<RequireRecruiterFeature feature="emailBroadcast"><Navigate to="email-broadcast/upload" replace /></RequireRecruiterFeature>} />
                <Route path="email-broadcast/upload" element={<RequireRecruiterFeature feature="emailBroadcast"><EmailBroadcast /></RequireRecruiterFeature>} />
                <Route path="email-broadcast/contact/:id" element={<RequireRecruiterFeature feature="emailBroadcast"><EmailListContacts /></RequireRecruiterFeature>} />
                <Route path="email-broadcast/templates" element={<RequireRecruiterFeature feature="emailBroadcast"><EmailTemplates /></RequireRecruiterFeature>} />
                <Route
                  path="email-broadcast/campaigns/list"
                  element={
                    <RequireRecruiterFeature feature="emailBroadcast">
                      <EmailBroadcastCampaignsList />
                    </RequireRecruiterFeature>
                  }
                />
                <Route path="email-broadcast/campaigns" element={<RequireRecruiterFeature feature="emailBroadcast"><SendEmail /></RequireRecruiterFeature>} />
                <Route path="settings" element={<RequireAnyRecruiterFeature><Settings /></RequireAnyRecruiterFeature>} />
                <Route path="pricing" element={<Pricing />} />
              </Route>

              {/* Redirect old /dashboard to appropriate route based on login */}
              <Route path="/dashboard" element={<Navigate to="/recruiter/dashboard" replace />} />
              <Route path="/dashboard/*" element={<Navigate to="/recruiter/dashboard" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppDataProvider>
          </PurchasedFeaturesProvider>
        </AuthProvider>
      </BrowserRouter>
      </DatesProvider>
    </MantineProvider>
  </QueryClientProvider>
);

export default App;
