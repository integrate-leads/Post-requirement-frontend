import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Text,
  Group,
  SimpleGrid,
  RingProgress,
  Badge,
  Box,
  Title,
  Stack,
  Skeleton,
  Divider,
  Paper,
  ScrollArea,
  Button,
} from '@mantine/core';
import {
  IconBriefcase,
  IconUsers,
  IconClock,
  IconFileText,
  IconEye,
  IconCheck,
  IconMail,
  IconSend,
  IconList,
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { usePurchasedFeatures } from '@/contexts/PurchasedFeaturesContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '@/hooks/useApi';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
  loading?: boolean;
}

/** GET /super-admin/dashboard/counts — super-admin only */
interface SuperAdminDashboardCounts {
  totalRecruiters: number;
  totalJobPostings: number;
  pendingApproval: number;
}

/**
 * Optional email fields — when backend adds these to dashboard/counts, they replace placeholders.
 * Example names (align with your API): totalEmailCampaigns, emailCampaignsCompleted, …
 */
interface SuperAdminDashboardCountsApi extends SuperAdminDashboardCounts {
  totalEmailCampaigns?: number;
  emailCampaignsCompleted?: number;
  emailCampaignsScheduled?: number;
  emailCampaignsDraft?: number;
  totalEmailRecipients?: number;
  recruitersWithEmailBroadcast?: number;
}

interface SuperAdminEmailMetrics {
  totalCampaigns: number;
  completedCampaigns: number;
  scheduledCampaigns: number;
  draftCampaigns: number;
  totalRecipients: number;
  recruitersWithFeature: number;
}

/** Shown until `/super-admin/dashboard/counts` includes email fields */
const EMAIL_METRICS_PLACEHOLDER: SuperAdminEmailMetrics = {
  totalCampaigns: 24,
  completedCampaigns: 18,
  scheduledCampaigns: 3,
  draftCampaigns: 3,
  totalRecipients: 15420,
  recruitersWithFeature: 7,
};

function pickMetric(apiVal: unknown, fallback: number): number {
  if (apiVal === null || apiVal === undefined || apiVal === '') return fallback;
  const n = Number(apiVal);
  return Number.isFinite(n) ? n : fallback;
}

function mergeEmailMetricsFromApi(d: SuperAdminDashboardCountsApi | undefined): SuperAdminEmailMetrics {
  if (!d) return { ...EMAIL_METRICS_PLACEHOLDER };
  return {
    totalCampaigns: pickMetric(d.totalEmailCampaigns, EMAIL_METRICS_PLACEHOLDER.totalCampaigns),
    completedCampaigns: pickMetric(
      d.emailCampaignsCompleted,
      EMAIL_METRICS_PLACEHOLDER.completedCampaigns
    ),
    scheduledCampaigns: pickMetric(
      d.emailCampaignsScheduled,
      EMAIL_METRICS_PLACEHOLDER.scheduledCampaigns
    ),
    draftCampaigns: pickMetric(d.emailCampaignsDraft, EMAIL_METRICS_PLACEHOLDER.draftCampaigns),
    totalRecipients: pickMetric(d.totalEmailRecipients, EMAIL_METRICS_PLACEHOLDER.totalRecipients),
    recruitersWithFeature: pickMetric(
      d.recruitersWithEmailBroadcast,
      EMAIL_METRICS_PLACEHOLDER.recruitersWithFeature
    ),
  };
}

function hasRealEmailCounts(d: SuperAdminDashboardCountsApi | undefined): boolean {
  if (!d) return false;
  return (
    d.totalEmailCampaigns != null ||
    d.emailCampaignsCompleted != null ||
    d.emailCampaignsScheduled != null ||
    d.emailCampaignsDraft != null ||
    d.totalEmailRecipients != null ||
    d.recruitersWithEmailBroadcast != null
  );
}

interface AdminDashboardCounts {
  totalJobPostings: number;
  activeJobPostings: number;
  totalApplications: number;
  pendingPayments: number;
  activeApplications: number;
}

/** Optional email fields from GET /admin/dashboard/counts (when backend adds them) */
interface AdminDashboardCountsApi extends AdminDashboardCounts {
  totalEmailCampaigns?: number;
  emailCampaignsCompleted?: number;
  emailCampaignsScheduled?: number;
  emailCampaignsDraft?: number;
  totalEmailRecipients?: number;
}

interface RecruiterEmailMetrics {
  totalLists: number;
  totalContacts: number;
  templatesCount: number;
  totalCampaigns: number;
  completedCampaigns: number;
  scheduledCampaigns: number;
  draftCampaigns: number;
}

const RECRUITER_EMAIL_METRICS_ZERO: RecruiterEmailMetrics = {
  totalLists: 0,
  totalContacts: 0,
  templatesCount: 0,
  totalCampaigns: 0,
  completedCampaigns: 0,
  scheduledCampaigns: 0,
  draftCampaigns: 0,
};

function mergeRecruiterEmailFromCounts(
  d: AdminDashboardCountsApi | undefined,
  base: RecruiterEmailMetrics
): RecruiterEmailMetrics {
  if (!d) return base;
  return {
    ...base,
    totalCampaigns: pickMetric(d.totalEmailCampaigns, base.totalCampaigns),
    completedCampaigns: pickMetric(d.emailCampaignsCompleted, base.completedCampaigns),
    scheduledCampaigns: pickMetric(d.emailCampaignsScheduled, base.scheduledCampaigns),
    draftCampaigns: pickMetric(d.emailCampaignsDraft, base.draftCampaigns),
  };
}

function hasRecruiterEmailCountsFromApi(d: AdminDashboardCountsApi | undefined): boolean {
  if (!d) return false;
  return (
    d.totalEmailCampaigns != null ||
    d.emailCampaignsCompleted != null ||
    d.emailCampaignsScheduled != null ||
    d.emailCampaignsDraft != null ||
    d.totalEmailRecipients != null
  );
}

interface AdminProfile {
  id: number;
  name: string;
  email: string;
  mobile: string;
  profileImage: string | null;
  status: string;
  companyName: string;
  companyWebsite: string;
  address: string;
  idProof: string[];
  emailVerified: string;
}

interface RecentJob {
  id: number;
  _id?: string;
  title: string;
  recruiterCompany?: string;
  companyName?: string;
  isApproved?: boolean;
  isPaid?: boolean;
  status?: string;
  isVerified?: string;
  paymentStatus?: string;
  admin?: {
    companyName?: string;
  };
}

/** Same ring geometry for all dashboard doughnut charts */
const DASHBOARD_RING_SIZE = 200;
const DASHBOARD_RING_THICKNESS = 22;
/** Fixed chart area so side-by-side cards align visually */
const DASHBOARD_CHART_AREA_MIN_HEIGHT = 300;

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description, loading }) => (
  <Card
    shadow="sm"
    padding="lg"
    withBorder
    radius="md"
    style={{
      transition: 'box-shadow 0.2s ease, transform 0.15s ease',
    }}
  >
    <Group gap="md" mb="xs" wrap="nowrap" align="flex-start">
      <Box
        w={44}
        h={44}
        style={{
          backgroundColor: `${color}18`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box style={{ minWidth: 0, flex: 1 }}>
        {loading ? (
          <Skeleton height={28} width={72} mb={6} />
        ) : (
          <Text size="xl" fw={700} lh={1.2}>
            {value}
          </Text>
        )}
        <Text size="sm" c="dimmed" mt={4} lh={1.35}>
          {title}
        </Text>
        {description && (
          <Text size="xs" c="dimmed" mt={6} lh={1.4}>
            {description}
          </Text>
        )}
      </Box>
    </Group>
  </Card>
);

interface DashboardRingChartProps {
  sections: { value: number; color: string }[];
  centerValue: React.ReactNode;
  centerSub: string;
}

const DashboardRingChart: React.FC<DashboardRingChartProps> = ({
  sections,
  centerValue,
  centerSub,
}) => (
  <Box
    style={{
      minHeight: DASHBOARD_CHART_AREA_MIN_HEIGHT,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <RingProgress
      size={DASHBOARD_RING_SIZE}
      thickness={DASHBOARD_RING_THICKNESS}
      sections={sections}
      roundCaps
      label={
        <Box ta="center" maw={120} px="xs">
          <Box>{centerValue}</Box>
          <Text size="xs" c="dimmed" mt={6} lh={1.3}>
            {centerSub}
          </Text>
        </Box>
      }
    />
  </Box>
);

const Dashboard: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { applications, paymentRequests } = useAppData();
  const {
    hasPostRequirement,
    hasEmailBroadcast,
    loading: purchasedFeaturesLoading,
  } = usePurchasedFeatures();
  const navigate = useNavigate();

  const [superAdminCounts, setSuperAdminCounts] = useState<SuperAdminDashboardCounts | null>(null);
  const [emailMetrics, setEmailMetrics] = useState<SuperAdminEmailMetrics>(EMAIL_METRICS_PLACEHOLDER);
  const [emailCountsFromApi, setEmailCountsFromApi] = useState(false);
  const [adminCounts, setAdminCounts] = useState<AdminDashboardCounts | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [recruiterEmailMetrics, setRecruiterEmailMetrics] = useState<RecruiterEmailMetrics>(
    RECRUITER_EMAIL_METRICS_ZERO
  );
  const [recruiterEmailCountsFromApi, setRecruiterEmailCountsFromApi] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setJobsLoading(true);

      if (isSuperAdmin) {
        try {
          const countsResponse = await api.get<{ success: boolean; data: SuperAdminDashboardCountsApi }>(
            API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_COUNTS
          );
          if (countsResponse.data?.success && countsResponse.data.data) {
            const d = countsResponse.data.data;
            setSuperAdminCounts({
              totalRecruiters: Number(d.totalRecruiters) || 0,
              totalJobPostings: Number(d.totalJobPostings) || 0,
              pendingApproval: Number(d.pendingApproval) || 0,
            });
            setEmailMetrics(mergeEmailMetricsFromApi(d));
            setEmailCountsFromApi(hasRealEmailCounts(d));
          }
        } catch (error) {
          console.error('Failed to fetch super admin dashboard counts:', error);
          setEmailMetrics({ ...EMAIL_METRICS_PLACEHOLDER });
          setEmailCountsFromApi(false);
        } finally {
          setLoading(false);
        }

        try {
          const jobsResponse = await api.get<{
            success: boolean;
            data: { jobPosts: RecentJob[] };
          }>(`${API_ENDPOINTS.SUPER_ADMIN.LIST_JOBS}?page=1&limit=5`);

          if (jobsResponse.data?.success) {
            setRecentJobs(jobsResponse.data.data?.jobPosts || []);
          }
        } catch (error) {
          console.error('Failed to fetch recent jobs:', error);
        } finally {
          setJobsLoading(false);
        }
      } else if (purchasedFeaturesLoading) {
        setLoading(true);
        return;
      } else {
        setRecruiterEmailMetrics(RECRUITER_EMAIL_METRICS_ZERO);
        setRecruiterEmailCountsFromApi(false);

        try {
          const profileResponse = await api.get<{ success: boolean; data: AdminProfile }>(
            API_ENDPOINTS.ADMIN.GET_PROFILE
          );
          if (profileResponse.data?.success) {
            setAdminProfile(profileResponse.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch admin profile:', error);
        }

        let countsPayload: AdminDashboardCountsApi | undefined;
        try {
          const countsResponse = await api.get<{ success: boolean; data: AdminDashboardCountsApi }>(
            API_ENDPOINTS.ADMIN.DASHBOARD_COUNTS
          );
          if (countsResponse.data?.success && countsResponse.data.data) {
            const raw = countsResponse.data.data;
            countsPayload = raw;
            setAdminCounts({
              totalJobPostings: Number(raw.totalJobPostings) || 0,
              activeJobPostings: Number(raw.activeJobPostings) || 0,
              totalApplications: Number(raw.totalApplications) || 0,
              pendingPayments: Number(raw.pendingPayments) || 0,
              activeApplications: Number(raw.activeApplications) || 0,
            });
            setRecruiterEmailCountsFromApi(hasRecruiterEmailCountsFromApi(raw));
          }
        } catch (error) {
          console.error('Failed to fetch admin dashboard counts:', error);
          setAdminCounts(null);
        }

        if (hasEmailBroadcast) {
          let listsN = 0;
          let contactsN = 0;
          let templatesN = 0;
          try {
            const labelsRes = await api.get<{
              success?: boolean;
              data?: { listId: number; emailCount?: number }[];
            }>(API_ENDPOINTS.ADMIN.EMAIL_BROAD_LIST_LABELS);
            const rows = labelsRes.data?.success && Array.isArray(labelsRes.data.data) ? labelsRes.data.data : [];
            listsN = rows.length;
            contactsN = rows.reduce((acc, r) => acc + (Number(r.emailCount) || 0), 0);
          } catch {
            listsN = 0;
            contactsN = 0;
          }
          try {
            const tplRes = await api.get<{
              success?: boolean;
              data?: unknown[];
              pagination?: { total?: number; totalRecords?: number; totalCount?: number };
            }>(API_ENDPOINTS.ADMIN.EMAIL_BROAD_TEMPLATE_LIST(1, 50));
            const arr = tplRes.data?.success && Array.isArray(tplRes.data.data) ? tplRes.data.data : [];
            templatesN =
              tplRes.data?.pagination?.totalRecords ??
              tplRes.data?.pagination?.total ??
              tplRes.data?.pagination?.totalCount ??
              arr.length;
          } catch {
            templatesN = 0;
          }

          const fromLists: RecruiterEmailMetrics = {
            ...RECRUITER_EMAIL_METRICS_ZERO,
            totalLists: listsN,
            totalContacts: contactsN,
            templatesCount: templatesN,
          };
          const merged = mergeRecruiterEmailFromCounts(countsPayload, fromLists);
          setRecruiterEmailMetrics(merged);
        } else {
          setRecruiterEmailMetrics(RECRUITER_EMAIL_METRICS_ZERO);
        }

        if (hasPostRequirement) {
          try {
            const jobsResponse = await api.get<{
              success: boolean;
              data: { jobs: RecentJob[] };
            }>(API_ENDPOINTS.ADMIN.JOB_POSTS(1, 5));

            if (jobsResponse.data?.success) {
              setRecentJobs(jobsResponse.data.data?.jobs || []);
            } else {
              setRecentJobs([]);
            }
          } catch (error) {
            console.error('Failed to fetch recent jobs:', error);
            setRecentJobs([]);
          } finally {
            setJobsLoading(false);
          }
        } else {
          setRecentJobs([]);
          setJobsLoading(false);
        }

        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isSuperAdmin, purchasedFeaturesLoading, hasPostRequirement, hasEmailBroadcast]);

  const pendingPayments = paymentRequests.filter((p) => p.status === 'pending');

  const handleViewJob = () => {
    navigate(isSuperAdmin ? '/super-admin/recruiters' : '/recruiter/my-jobs');
  };

  const displayName = adminProfile?.name || user?.name || 'User';

  const emailRingSections = useMemo(() => {
    const t =
      emailMetrics.completedCampaigns +
      emailMetrics.scheduledCampaigns +
      emailMetrics.draftCampaigns;
    if (t <= 0) {
      return [
        { value: 33.33, color: 'green' },
        { value: 33.33, color: 'blue' },
        { value: 33.34, color: 'gray' },
      ];
    }
    return [
      { value: (emailMetrics.completedCampaigns / t) * 100, color: 'green' },
      { value: (emailMetrics.scheduledCampaigns / t) * 100, color: 'blue' },
      { value: (emailMetrics.draftCampaigns / t) * 100, color: 'gray' },
    ];
  }, [emailMetrics]);

  const recruiterEmailRingSections = useMemo(() => {
    const t =
      recruiterEmailMetrics.completedCampaigns +
      recruiterEmailMetrics.scheduledCampaigns +
      recruiterEmailMetrics.draftCampaigns;
    if (t <= 0) {
      return [
        { value: 33.33, color: 'green' },
        { value: 33.33, color: 'blue' },
        { value: 33.34, color: 'gray' },
      ];
    }
    return [
      { value: (recruiterEmailMetrics.completedCampaigns / t) * 100, color: 'green' },
      { value: (recruiterEmailMetrics.scheduledCampaigns / t) * 100, color: 'blue' },
      { value: (recruiterEmailMetrics.draftCampaigns / t) * 100, color: 'gray' },
    ];
  }, [recruiterEmailMetrics]);

  const recruiterWelcomeBlurb = useMemo(() => {
    if (isSuperAdmin) return '';
    if (hasPostRequirement && hasEmailBroadcast) {
      return 'Your job posts, applications, and email broadcast activity.';
    }
    if (hasPostRequirement) {
      return 'Your job posts, applications, and account activity.';
    }
    if (hasEmailBroadcast) {
      return 'Your email lists, templates, and campaign activity.';
    }
    return 'Your recruiter dashboard.';
  }, [isSuperAdmin, hasPostRequirement, hasEmailBroadcast]);

  return (
    <Box maw={1200} w="100%" mx="auto" px={{ base: 'xs', sm: 0 }} pb="xl">
      <Box mb="xl" pt={4} pb="sm">
        <Title order={2} size="h2" fw={700} lh={1.2}>
          Welcome back, {displayName}
        </Title>
        <Text c="dimmed" size="sm" mt={10} maw={640} lh={1.55}>
          {isSuperAdmin
            ? 'Overview of recruiters, job posts, email broadcast, and platform activity.'
            : recruiterWelcomeBlurb}
        </Text>
      </Box>

      {isSuperAdmin && (
        <Text fw={700} size="sm" tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: '0.04em' }}>
          Post requirement & jobs
        </Text>
      )}

      {isSuperAdmin && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 'sm', sm: 'md' }} mb="lg">
          <StatCard
            title="Total Recruiters"
            value={superAdminCounts?.totalRecruiters ?? '--'}
            icon={<IconUsers size={20} color="#0078D4" />}
            color="#0078D4"
            loading={loading}
          />
          <StatCard
            title="Total Job Postings"
            value={superAdminCounts?.totalJobPostings ?? '--'}
            icon={<IconBriefcase size={20} color="#107C10" />}
            color="#107C10"
            loading={loading}
          />
          <StatCard
            title="Pending Approvals"
            value={superAdminCounts?.pendingApproval ?? '--'}
            icon={<IconClock size={20} color="#D83B01" />}
            color="#D83B01"
            loading={loading}
          />
          <StatCard
            title="Job applications (demo)"
            description="From app context sample data"
            value={applications.length}
            icon={<IconFileText size={20} color="#8764B8" />}
            color="#8764B8"
          />
        </SimpleGrid>
      )}

      {!isSuperAdmin && hasPostRequirement && (
        <>
          <Text fw={700} size="sm" tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: '0.04em' }}>
            Jobs & applications
          </Text>
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing={{ base: 'sm', sm: 'md' }}
            mb={hasEmailBroadcast ? 'lg' : 'xl'}
          >
            <StatCard
              title="Total Job Postings"
              value={adminCounts?.totalJobPostings ?? '--'}
              icon={<IconBriefcase size={20} color="#0078D4" />}
              color="#0078D4"
              loading={loading}
            />
            <StatCard
              title="Active Job Postings"
              value={adminCounts?.activeJobPostings ?? '--'}
              icon={<IconCheck size={20} color="#107C10" />}
              color="#107C10"
              loading={loading}
            />
            <StatCard
              title="Total Applications"
              value={adminCounts?.totalApplications ?? '--'}
              icon={<IconFileText size={20} color="#8764B8" />}
              color="#8764B8"
              loading={loading}
            />
          </SimpleGrid>
        </>
      )}

      {!isSuperAdmin && hasEmailBroadcast && (
        <>
          {hasPostRequirement && <Divider my="xl" />}
          <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="sm">
            <Text fw={700} size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: '0.04em' }}>
              Email broadcast
            </Text>
            {!recruiterEmailCountsFromApi &&
              recruiterEmailMetrics.totalCampaigns === 0 &&
              recruiterEmailMetrics.completedCampaigns === 0 &&
              recruiterEmailMetrics.scheduledCampaigns === 0 &&
              recruiterEmailMetrics.draftCampaigns === 0 && (
                <Badge size="sm" variant="light" color="gray">
                  Campaign totals from dashboard API when available
                </Badge>
              )}
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 'sm', sm: 'md' }} mb="xl">
            <StatCard
              title="Email lists"
              value={recruiterEmailMetrics.totalLists}
              icon={<IconList size={20} color="#0078D4" />}
              color="#0078D4"
              loading={loading}
            />
            <StatCard
              title="Contacts in lists"
              value={recruiterEmailMetrics.totalContacts.toLocaleString()}
              icon={<IconUsers size={20} color="#107C10" />}
              color="#107C10"
              loading={loading}
            />
            <StatCard
              title="Templates"
              value={recruiterEmailMetrics.templatesCount}
              icon={<IconFileText size={20} color="#8764B8" />}
              color="#8764B8"
              loading={loading}
            />
            <StatCard
              title="Campaigns"
              value={recruiterEmailMetrics.totalCampaigns}
              icon={<IconSend size={20} color="#D83B01" />}
              color="#D83B01"
              loading={loading}
            />
          </SimpleGrid>
        </>
      )}

      {isSuperAdmin && (
        <>
          <Divider my="xl" />
          <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="sm">
            <Text fw={700} size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: '0.04em' }}>
              Email broadcast
            </Text>
            {!emailCountsFromApi && (
              <Badge size="sm" variant="light" color="orange">
                Sample data — API fields not wired yet
              </Badge>
            )}
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 'sm', sm: 'md' }} mb="xl">
            <StatCard
              title="Total campaigns"
              value={emailMetrics.totalCampaigns}
              icon={<IconSend size={20} color="#0078D4" />}
              color="#0078D4"
            />
            <StatCard
              title="Completed"
              value={emailMetrics.completedCampaigns}
              icon={<IconCheck size={20} color="#107C10" />}
              color="#107C10"
            />
            <StatCard
              title="Recipients (all time)"
              value={emailMetrics.totalRecipients.toLocaleString()}
              icon={<IconMail size={20} color="#8764B8" />}
              color="#8764B8"
            />
            <StatCard
              title="Recruiters w/ Email feature"
              value={emailMetrics.recruitersWithFeature}
              icon={<IconUsers size={20} color="#D83B01" />}
              color="#D83B01"
            />
          </SimpleGrid>
        </>
      )}

      {isSuperAdmin ? (
        <>
          <Card shadow="sm" padding="lg" withBorder radius="md" mb="xl">
            <Group justify="space-between" align="flex-start" mb="sm" wrap="wrap">
              <Box>
                <Text fw={600} size="lg">
                  Recent activity
                </Text>
                <Text size="xs" c="dimmed" mt={4} maw={560}>
                  Latest job posts from the list API.
                </Text>
              </Box>
            </Group>
            {jobsLoading ? (
              <Stack gap="sm">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} height={52} radius="md" />
                ))}
              </Stack>
            ) : recentJobs.length === 0 ? (
              <Paper p="xl" radius="md" bg="gray.0" withBorder>
                <Text c="dimmed" size="sm" ta="center">
                  No recent activity
                </Text>
              </Paper>
            ) : (
              <ScrollArea h={400} type="auto" offsetScrollbars>
                <Stack gap="xs">
                  {recentJobs.map((job) => (
                    <Paper
                      key={job._id ?? job.id}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                      onClick={handleViewJob}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                      }}
                    >
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0, flex: 1 }}>
                          <Badge size="sm" variant="light" color="teal" style={{ flexShrink: 0 }}>
                            Job post
                          </Badge>
                          <Box style={{ minWidth: 0, flex: 1 }} miw={0}>
                            <Text size="sm" fw={500} lineClamp={2}>
                              {job.title}
                            </Text>
                            <Text size="xs" c="dimmed" mt={2}>
                              {job.admin?.companyName ||
                                job.recruiterCompany ||
                                job.companyName ||
                                'N/A'}
                            </Text>
                          </Box>
                        </Group>
                        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }} align="center">
                          <Badge
                            color={
                              job.isVerified === 'Approved' || job.status === 'Active'
                                ? 'green'
                                : job.isVerified === 'Pending' || job.paymentStatus === 'Pending'
                                  ? 'yellow'
                                  : 'gray'
                            }
                            variant="light"
                            size="sm"
                          >
                            {job.isVerified === 'Approved' || job.status === 'Active'
                              ? 'ACTIVE'
                              : job.isVerified === 'Pending'
                                ? 'PENDING'
                                : (job.status || 'Draft').toUpperCase()}
                          </Badge>
                          <IconEye size={16} color="#868e96" />
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Card>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'stretch' }}>
            <Card
              shadow="sm"
              padding="lg"
              withBorder
              radius="md"
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <Text fw={600} size="lg" mb="xs">
                Payment status
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Sample mix until the API sends a real breakdown.
              </Text>
              <DashboardRingChart
                sections={[
                  {
                    value:
                      (paymentRequests.filter((p) => p.status === 'approved').length /
                        Math.max(paymentRequests.length, 1)) *
                      100,
                    color: 'green',
                  },
                  {
                    value:
                      (pendingPayments.length / Math.max(paymentRequests.length, 1)) * 100,
                    color: 'yellow',
                  },
                  {
                    value:
                      (paymentRequests.filter((p) => p.status === 'rejected').length /
                        Math.max(paymentRequests.length, 1)) *
                      100,
                    color: 'red',
                  },
                ]}
                centerValue={
                  <Text size="xl" fw={700}>
                    {paymentRequests.length}
                  </Text>
                }
                centerSub="Requests"
              />
              <Stack gap="xs" mt="md" align="center">
                <Group justify="center" gap="lg" wrap="wrap">
                  <Group gap="xs">
                    <Box w={10} h={10} bg="green" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Approved: {paymentRequests.filter((p) => p.status === 'approved').length}</Text>
                  </Group>
                  <Group gap="xs">
                    <Box w={10} h={10} bg="yellow" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Pending: {pendingPayments.length}</Text>
                  </Group>
                  <Group gap="xs">
                    <Box w={10} h={10} bg="red" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Rejected: {paymentRequests.filter((p) => p.status === 'rejected').length}</Text>
                  </Group>
                </Group>
              </Stack>
            </Card>

            <Card
              shadow="sm"
              padding="lg"
              withBorder
              radius="md"
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <Text fw={600} size="lg" mb="xs">
                Email campaign status
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                {!emailCountsFromApi
                  ? 'Sample mix until the API sends a real breakdown.'
                  : 'Campaigns by status.'}
              </Text>
              <DashboardRingChart
                sections={emailRingSections}
                centerValue={
                  <Text size="xl" fw={700}>
                    {emailMetrics.totalCampaigns}
                  </Text>
                }
                centerSub="Campaigns"
              />
              <Stack gap="xs" mt="md" align="center">
                <Group justify="center" gap="md" wrap="wrap">
                  <Group gap="xs">
                    <Box w={10} h={10} bg="green" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Completed: {emailMetrics.completedCampaigns}</Text>
                  </Group>
                  <Group gap="xs">
                    <Box w={10} h={10} bg="blue" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Scheduled: {emailMetrics.scheduledCampaigns}</Text>
                  </Group>
                  <Group gap="xs">
                    <Box w={10} h={10} bg="gray" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Draft: {emailMetrics.draftCampaigns}</Text>
                  </Group>
                </Group>
              </Stack>
            </Card>
          </SimpleGrid>
        </>
      ) : (
        <Stack gap="xl">
          {hasPostRequirement && (
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
              <Card shadow="sm" padding="lg" withBorder radius="md">
                <Text fw={600} size="lg" mb="md">
                  Recent activity
                </Text>
                {jobsLoading ? (
                  <Stack gap="sm">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} height={50} />
                    ))}
                  </Stack>
                ) : recentJobs.length === 0 ? (
                  <Text c="dimmed" size="sm">
                    No recent job activity
                  </Text>
                ) : (
                  <Stack gap="sm">
                    {recentJobs.map((job) => (
                      <Group
                        key={job._id || job.id}
                        justify="space-between"
                        align="flex-start"
                        wrap="nowrap"
                        py="xs"
                        style={{ borderBottom: '1px solid #e9ecef', cursor: 'pointer' }}
                        onClick={handleViewJob}
                      >
                        <Box style={{ minWidth: 0, flex: 1 }} miw={0}>
                          <Text size="sm" fw={500} lineClamp={2}>
                            {job.title}
                          </Text>
                          <Text size="xs" c="dimmed" mt={2}>
                            {job.admin?.companyName || job.recruiterCompany || job.companyName || 'N/A'}
                          </Text>
                        </Box>
                        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }} align="center">
                          <Badge
                            color={
                              job.isVerified === 'Approved' || job.status === 'Active'
                                ? 'green'
                                : job.isVerified === 'Pending' || job.paymentStatus === 'Pending'
                                  ? 'yellow'
                                  : 'gray'
                            }
                            variant="light"
                            size="sm"
                          >
                            {job.isVerified === 'Approved' || job.status === 'Active'
                              ? 'ACTIVE'
                              : job.isVerified === 'Pending'
                                ? 'PENDING'
                                : (job.status || 'Draft').toUpperCase()}
                          </Badge>
                          <IconEye size={16} color="#868e96" />
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                )}
              </Card>

              <Card shadow="sm" padding="lg" withBorder radius="md">
                <Text fw={600} size="lg" mb="md">
                  Application status
                </Text>
                <DashboardRingChart
                  sections={[
                    {
                      value: adminCounts?.totalJobPostings
                        ? (adminCounts.activeJobPostings / adminCounts.totalJobPostings) * 100
                        : 0,
                      color: 'green',
                    },
                    {
                      value: adminCounts?.totalJobPostings
                        ? ((adminCounts.totalJobPostings - adminCounts.activeJobPostings) /
                            adminCounts.totalJobPostings) *
                          100
                        : 0,
                      color: 'blue',
                    },
                  ]}
                  centerValue={
                    <Text size="xl" fw={700}>
                      {adminCounts?.totalJobPostings ?? 0}
                    </Text>
                  }
                  centerSub="Total jobs"
                />
                {adminCounts && (
                  <Group justify="center" gap="xl" mt="md">
                    <Group gap="xs">
                      <Box w={12} h={12} bg="green" style={{ borderRadius: '50%' }} />
                      <Text size="sm">Active: {adminCounts.activeJobPostings}</Text>
                    </Group>
                    <Group gap="xs">
                      <Box w={12} h={12} bg="blue" style={{ borderRadius: '50%' }} />
                      <Text size="sm">
                        Inactive: {adminCounts.totalJobPostings - adminCounts.activeJobPostings}
                      </Text>
                    </Group>
                  </Group>
                )}
              </Card>
            </SimpleGrid>
          )}

          {hasEmailBroadcast && (
            <Card
              shadow="sm"
              padding="lg"
              withBorder
              radius="md"
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <Text fw={600} size="lg" mb="xs">
                Email campaign status
              </Text>
              <Text size="xs" c="dimmed" mb="md" maw={560}>
                {recruiterEmailCountsFromApi
                  ? 'Your campaigns by status.'
                  : (recruiterEmailMetrics.completedCampaigns +
                        recruiterEmailMetrics.scheduledCampaigns +
                        recruiterEmailMetrics.draftCampaigns) ===
                      0
                    ? 'Upload lists and create campaigns from Email broadcast. Campaign breakdown appears here when your API returns counts on /admin/dashboard/counts.'
                    : 'Campaign breakdown from your dashboard data.'}
              </Text>
              <DashboardRingChart
                sections={recruiterEmailRingSections}
                centerValue={
                  <Text size="xl" fw={700}>
                    {recruiterEmailMetrics.totalCampaigns}
                  </Text>
                }
                centerSub="Campaigns"
              />
              <Stack gap="xs" mt="md" align="center">
                <Group justify="center" gap="md" wrap="wrap">
                  <Group gap="xs">
                    <Box w={10} h={10} bg="green" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Completed: {recruiterEmailMetrics.completedCampaigns}</Text>
                  </Group>
                  <Group gap="xs">
                    <Box w={10} h={10} bg="blue" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Scheduled: {recruiterEmailMetrics.scheduledCampaigns}</Text>
                  </Group>
                  <Group gap="xs">
                    <Box w={10} h={10} bg="gray" style={{ borderRadius: '50%' }} />
                    <Text size="sm">Draft: {recruiterEmailMetrics.draftCampaigns}</Text>
                  </Group>
                </Group>
                <Button
                  variant="light"
                  size="sm"
                  mt="sm"
                  leftSection={<IconMail size={16} />}
                  onClick={() => navigate('/recruiter/email-broadcast/upload')}
                >
                  Open email broadcast
                </Button>
              </Stack>
            </Card>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Dashboard;
