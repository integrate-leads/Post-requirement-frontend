import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Text,
  Group,
  SimpleGrid,
  RingProgress,
  Badge,
  Box,
  Stack,
  Skeleton,
  Divider,
  Paper,
  ScrollArea,
  Button,
  ThemeIcon,
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
  IconLayoutDashboard,
  IconClipboardList,
  IconInbox,
  IconChevronRight,
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchasedFeatures } from '@/contexts/PurchasedFeaturesContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { DashboardPageHeader } from '@/components/dashboard';

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
  totalJobApplications: number;
  approvedPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
}

/** Raw API `data` — fields may be omitted on older responses */
type SuperAdminDashboardCountsApi = Partial<SuperAdminDashboardCounts> & {
  totalCampaigns?: number;
  totalCampaignsCompleted?: number;
  totalRecipients?: number;
  recruiterWithBroadcasting?: number;
  completedCampaigns?: number;
  scheduledCampaigns?: number;
  draftCampaigns?: number;
  /** Legacy alternate keys */
  totalEmailCampaigns?: number;
  emailCampaignsCompleted?: number;
  emailCampaignsScheduled?: number;
  emailCampaignsDraft?: number;
  totalEmailRecipients?: number;
  recruitersWithEmailBroadcast?: number;
};

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

const SUPER_ADMIN_EMAIL_ZERO: SuperAdminEmailMetrics = {
  totalCampaigns: 0,
  completedCampaigns: 0,
  scheduledCampaigns: 0,
  draftCampaigns: 0,
  totalRecipients: 0,
  recruitersWithFeature: 0,
};

function pickMetric(apiVal: unknown, fallback: number): number {
  if (apiVal === null || apiVal === undefined || apiVal === '') return fallback;
  const n = Number(apiVal);
  return Number.isFinite(n) ? n : fallback;
}

function mergeEmailMetricsFromApi(d: SuperAdminDashboardCountsApi | undefined): SuperAdminEmailMetrics {
  if (!d) return { ...EMAIL_METRICS_PLACEHOLDER };
  const fromApi = hasRealEmailCounts(d);
  const base = fromApi ? SUPER_ADMIN_EMAIL_ZERO : EMAIL_METRICS_PLACEHOLDER;
  const totalCampaigns = d.totalCampaigns ?? d.totalEmailCampaigns;
  const completed =
    d.completedCampaigns ?? d.emailCampaignsCompleted ?? d.totalCampaignsCompleted;
  const scheduled = d.scheduledCampaigns ?? d.emailCampaignsScheduled;
  const draft = d.draftCampaigns ?? d.emailCampaignsDraft;
  const recipients = d.totalRecipients ?? d.totalEmailRecipients;
  const recruiters =
    d.recruiterWithBroadcasting ?? d.recruitersWithEmailBroadcast;
  return {
    totalCampaigns: pickMetric(totalCampaigns, base.totalCampaigns),
    completedCampaigns: pickMetric(completed, base.completedCampaigns),
    scheduledCampaigns: pickMetric(scheduled, base.scheduledCampaigns),
    draftCampaigns: pickMetric(draft, base.draftCampaigns),
    totalRecipients: pickMetric(recipients, base.totalRecipients),
    recruitersWithFeature: pickMetric(recruiters, base.recruitersWithFeature),
  };
}

function hasRealEmailCounts(d: SuperAdminDashboardCountsApi | undefined): boolean {
  if (!d) return false;
  return (
    d.totalCampaigns != null ||
    d.totalCampaignsCompleted != null ||
    d.completedCampaigns != null ||
    d.scheduledCampaigns != null ||
    d.draftCampaigns != null ||
    d.totalRecipients != null ||
    d.recruiterWithBroadcasting != null ||
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

/**
 * GET /admin/dashboard/counts — recruiter `data` (fields optional when API omits them).
 * Email broadcast: emailList, contactList, templates, totalCampaigns, completedCampaigns, scheduledCampaigns, draftCampaigns
 */
type AdminDashboardCountsApi = Partial<AdminDashboardCounts> & {
  emailList?: number;
  contactList?: number;
  templates?: number;
  totalCampaigns?: number;
  completedCampaigns?: number;
  scheduledCampaigns?: number;
  draftCampaigns?: number;
  /** Legacy alternate keys (still merged if present) */
  totalEmailCampaigns?: number;
  emailCampaignsCompleted?: number;
  emailCampaignsScheduled?: number;
  emailCampaignsDraft?: number;
  totalEmailRecipients?: number;
};

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

function mergeRecruiterMetricsFromDashboardApi(
  d: AdminDashboardCountsApi | undefined,
  base: RecruiterEmailMetrics
): RecruiterEmailMetrics {
  if (!d) return base;
  const totalCampaigns = d.totalCampaigns ?? d.totalEmailCampaigns;
  const completed = d.completedCampaigns ?? d.emailCampaignsCompleted;
  const scheduled = d.scheduledCampaigns ?? d.emailCampaignsScheduled;
  const draft = d.draftCampaigns ?? d.emailCampaignsDraft;
  return {
    ...base,
    totalLists: pickMetric(d.emailList, base.totalLists),
    totalContacts: pickMetric(d.contactList, base.totalContacts),
    templatesCount: pickMetric(d.templates, base.templatesCount),
    totalCampaigns: pickMetric(totalCampaigns, base.totalCampaigns),
    completedCampaigns: pickMetric(completed, base.completedCampaigns),
    scheduledCampaigns: pickMetric(scheduled, base.scheduledCampaigns),
    draftCampaigns: pickMetric(draft, base.draftCampaigns),
  };
}

function hasRecruiterEmailCountsFromApi(d: AdminDashboardCountsApi | undefined): boolean {
  if (!d) return false;
  return (
    d.emailList != null ||
    d.contactList != null ||
    d.templates != null ||
    d.totalCampaigns != null ||
    d.completedCampaigns != null ||
    d.scheduledCampaigns != null ||
    d.draftCampaigns != null ||
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
  clientName?: string;
  country?: string;
  workType?: string;
  workLocations?: { city?: string[]; state?: string }[];
  applicationCount?: string | number;
  isApproved?: boolean;
  isPaid?: boolean;
  status?: string;
  isVerified?: string;
  paymentStatus?: string;
  admin?: {
    companyName?: string;
    name?: string;
    email?: string;
  };
}

/** From GET /admin/job-post or GET /super-admin/list/jobs — `data.campaigns` */
interface RecentCampaign {
  id: number;
  campaignName?: string;
  subject?: string;
  status?: string;
  totalRecipients?: number;
  replyTo?: string;
  scheduledAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  admin?: {
    companyName?: string;
    name?: string;
    email?: string;
  };
}

function formatJobLocationPreview(job: RecentJob): string {
  const locs = job.workLocations;
  if (!locs?.length) return '';
  const first = locs.find((w) => (w.city?.length ?? 0) > 0 || (w.state && w.state.length > 0));
  if (!first) return '';
  const cities = first.city?.filter(Boolean).join(', ');
  if (cities && first.state) return `${cities}, ${first.state}`;
  if (first.state) return first.state;
  return cities || '';
}

function campaignStatusColor(status: string | undefined): string {
  const s = (status || '').toLowerCase();
  if (s.includes('complete')) return 'green';
  if (s.includes('schedule') || s.includes('pending')) return 'blue';
  if (s.includes('draft')) return 'gray';
  if (s.includes('pause')) return 'orange';
  return 'gray';
}

const RECENT_ACTIVITY_CARD_SHADOW = '0 1px 3px rgba(0, 0, 0, 0.06)';

function RecentActivitySectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      mb="md"
      pl="sm"
      py={8}
      style={{
        borderLeft: '3px solid var(--mantine-color-blue-filled)',
        backgroundColor: 'var(--mantine-color-gray-0)',
        borderRadius: '0 var(--mantine-radius-md) var(--mantine-radius-md) 0',
      }}
    >
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.06em' }}>
        {children}
      </Text>
    </Box>
  );
}

function RecentJobActivityItem({ job, onClick }: { job: RecentJob; onClick: () => void }) {
  const locLine = formatJobLocationPreview(job);
  const metaLine = [locLine, job.workType].filter(Boolean).join(' · ');
  const statusLabel =
    job.isVerified === 'Approved' || job.status === 'Active'
      ? 'ACTIVE'
      : job.isVerified === 'Pending'
        ? 'PENDING'
        : (job.status || 'Draft').toUpperCase();
  const statusColor =
    job.isVerified === 'Approved' || job.status === 'Active'
      ? 'green'
      : job.isVerified === 'Pending' || job.paymentStatus === 'Pending'
        ? 'yellow'
        : 'gray';

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      onClick={onClick}
      style={{
        cursor: 'pointer',
        boxShadow: RECENT_ACTIVITY_CARD_SHADOW,
        transition: 'box-shadow 0.2s ease, transform 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = RECENT_ACTIVITY_CARD_SHADOW;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = '';
      }}
    >
      <Group gap="md" wrap="nowrap" align="flex-start">
        <ThemeIcon variant="light" color="teal" size={44} radius="md" style={{ flexShrink: 0 }}>
          <IconBriefcase size={22} stroke={1.6} />
        </ThemeIcon>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text size="sm" fw={600} lh={1.45} lineClamp={2}>
            {job.title}
          </Text>
          <Group gap="xs" wrap="wrap" mt={8} align="center">
            {job.country ? (
              <Badge size="xs" variant="light" color="blue" tt="uppercase">
                {job.country}
              </Badge>
            ) : null}
            {metaLine ? (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {metaLine}
              </Text>
            ) : null}
          </Group>
          <Text size="xs" c="dimmed" mt={6}>
            {job.admin?.companyName ||
              job.clientName ||
              job.recruiterCompany ||
              job.companyName ||
              '—'}
            {' · '}
            Applications: {Number(job.applicationCount) || 0}
          </Text>
        </Box>
        <Group
          gap={8}
          wrap="nowrap"
          align="center"
          justify="flex-end"
          style={{ flexShrink: 0, alignSelf: 'center' }}
        >
          <Badge color={statusColor} variant="light" size="sm" style={{ whiteSpace: 'nowrap' }}>
            {statusLabel}
          </Badge>
          <ThemeIcon variant="subtle" color="gray" size="sm" radius="sm" style={{ flexShrink: 0 }}>
            <IconEye size={16} />
          </ThemeIcon>
        </Group>
      </Group>
    </Paper>
  );
}

function RecentCampaignActivityItem({
  campaign: c,
  onClick,
  showRecruiterLine,
}: {
  campaign: RecentCampaign;
  onClick: () => void;
  showRecruiterLine?: boolean;
}) {
  const when = c.completedAt || c.scheduledAt || c.createdAt;
  const whenLabel = when
    ? new Date(when).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      onClick={onClick}
      style={{
        cursor: 'pointer',
        boxShadow: RECENT_ACTIVITY_CARD_SHADOW,
        transition: 'box-shadow 0.2s ease, transform 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = RECENT_ACTIVITY_CARD_SHADOW;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = '';
      }}
    >
      <Group gap="md" wrap="nowrap" align="flex-start">
        <ThemeIcon variant="light" color="violet" size={44} radius="md" style={{ flexShrink: 0 }}>
          <IconSend size={22} stroke={1.6} />
        </ThemeIcon>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text size="sm" fw={600} lh={1.45} lineClamp={2}>
            {c.campaignName || c.subject || 'Campaign'}
          </Text>
          {c.subject && c.campaignName && c.subject !== c.campaignName ? (
            <Text size="xs" c="dimmed" mt={6} lineClamp={2} lh={1.35}>
              {c.subject}
            </Text>
          ) : null}
          <Group gap="md" wrap="wrap" mt={8}>
            <Text size="xs" c="dimmed">
              {c.totalRecipients ?? 0} recipients
            </Text>
            {whenLabel ? (
              <Text size="xs" c="dimmed">
                {whenLabel}
              </Text>
            ) : null}
          </Group>
          {showRecruiterLine ? (
            <Text size="xs" c="dimmed" mt={6}>
              {c.admin?.companyName || c.admin?.name || '—'}
            </Text>
          ) : null}
        </Box>
        <Group
          gap={8}
          wrap="nowrap"
          align="center"
          justify="flex-end"
          style={{ flexShrink: 0, alignSelf: 'center' }}
        >
          <Badge
            color={campaignStatusColor(c.status)}
            variant="light"
            size="sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            {(c.status || '—').toUpperCase()}
          </Badge>
          <ThemeIcon variant="subtle" color="gray" size="sm" radius="sm" style={{ flexShrink: 0 }}>
            <IconChevronRight size={16} />
          </ThemeIcon>
        </Group>
      </Group>
    </Paper>
  );
}

function RecentActivityEmpty({ message }: { message: string }) {
  return (
    <Paper
      p="xl"
      radius="lg"
      withBorder
      style={{
        borderStyle: 'dashed',
        backgroundColor: 'var(--mantine-color-gray-0)',
      }}
    >
      <Stack align="center" gap="md">
        <ThemeIcon size={56} variant="light" color="gray" radius="xl">
          <IconInbox size={28} stroke={1.5} />
        </ThemeIcon>
        <Text c="dimmed" size="sm" ta="center" maw={320} lh={1.5}>
          {message}
        </Text>
      </Stack>
    </Paper>
  );
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
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [recruiterEmailMetrics, setRecruiterEmailMetrics] = useState<RecruiterEmailMetrics>(
    RECRUITER_EMAIL_METRICS_ZERO
  );
  const [recruiterEmailCountsFromApi, setRecruiterEmailCountsFromApi] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setActivityLoading(true);

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
              totalJobApplications: Number(d.totalJobApplications) || 0,
              approvedPayments: Number(d.approvedPayments) || 0,
              pendingPayments: Number(d.pendingPayments) || 0,
              rejectedPayments: Number(d.rejectedPayments) || 0,
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
            data?: {
              jobPosts?: RecentJob[];
              campaigns?: RecentCampaign[];
              pagination?: unknown;
              subscriptions?: unknown;
            };
          }>(`${API_ENDPOINTS.SUPER_ADMIN.LIST_JOBS}?page=1&limit=5`);

          if (jobsResponse.data?.success && jobsResponse.data.data) {
            const payload = jobsResponse.data.data;
            setRecentJobs(Array.isArray(payload.jobPosts) ? payload.jobPosts : []);
            const rawCampaigns = Array.isArray(payload.campaigns) ? payload.campaigns : [];
            setRecentCampaigns(rawCampaigns.slice(0, 5));
          } else {
            setRecentJobs([]);
            setRecentCampaigns([]);
          }
        } catch (error) {
          console.error('Failed to fetch recent jobs:', error);
          setRecentJobs([]);
          setRecentCampaigns([]);
        } finally {
          setActivityLoading(false);
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
              pendingPayments: Number(raw.pendingPayments ?? 0) || 0,
              activeApplications: Number(raw.activeApplications) || 0,
            });
            if (hasEmailBroadcast) {
              setRecruiterEmailCountsFromApi(hasRecruiterEmailCountsFromApi(raw));
            } else {
              setRecruiterEmailCountsFromApi(false);
            }
          }
        } catch (error) {
          console.error('Failed to fetch admin dashboard counts:', error);
          setAdminCounts(null);
          setRecruiterEmailCountsFromApi(false);
        }

        if (hasEmailBroadcast) {
          let merged = mergeRecruiterMetricsFromDashboardApi(
            countsPayload,
            RECRUITER_EMAIL_METRICS_ZERO
          );

          const needListContactFromApi =
            !countsPayload ||
            (countsPayload.emailList == null && countsPayload.contactList == null);
          if (needListContactFromApi) {
            try {
              const labelsRes = await api.get<{
                success?: boolean;
                data?: { listId: number; emailCount?: number }[];
              }>(API_ENDPOINTS.ADMIN.EMAIL_BROAD_LIST_LABELS);
              const rows =
                labelsRes.data?.success && Array.isArray(labelsRes.data.data) ? labelsRes.data.data : [];
              merged = {
                ...merged,
                totalLists: rows.length,
                totalContacts: rows.reduce((acc, r) => acc + (Number(r.emailCount) || 0), 0),
              };
            } catch {
              /* keep merged lists/contacts from dashboard API or zero */
            }
          }

          if (!countsPayload || countsPayload.templates == null) {
            try {
              const tplRes = await api.get<{
                success?: boolean;
                data?: unknown[];
                pagination?: { total?: number; totalRecords?: number; totalCount?: number };
              }>(API_ENDPOINTS.ADMIN.EMAIL_BROAD_TEMPLATE_LIST(1, 50));
              const arr = tplRes.data?.success && Array.isArray(tplRes.data.data) ? tplRes.data.data : [];
              const templatesN =
                tplRes.data?.pagination?.totalRecords ??
                tplRes.data?.pagination?.total ??
                tplRes.data?.pagination?.totalCount ??
                arr.length;
              merged = { ...merged, templatesCount: templatesN };
            } catch {
              /* keep dashboard templates or zero */
            }
          }

          setRecruiterEmailMetrics(merged);
        } else {
          setRecruiterEmailMetrics(RECRUITER_EMAIL_METRICS_ZERO);
        }

        if (hasPostRequirement || hasEmailBroadcast) {
          try {
            const activityRes = await api.get<{
              success: boolean;
              data: { jobs?: RecentJob[]; campaigns?: RecentCampaign[] };
            }>(API_ENDPOINTS.ADMIN.JOB_POSTS(1, 5));

            if (activityRes.data?.success && activityRes.data.data) {
              const payload = activityRes.data.data;
              setRecentJobs(
                hasPostRequirement && Array.isArray(payload.jobs) ? payload.jobs : []
              );
              setRecentCampaigns(
                hasEmailBroadcast && Array.isArray(payload.campaigns) ? payload.campaigns : []
              );
            } else {
              setRecentJobs([]);
              setRecentCampaigns([]);
            }
          } catch (error) {
            console.error('Failed to fetch recent jobs / campaigns:', error);
            setRecentJobs([]);
            setRecentCampaigns([]);
          } finally {
            setActivityLoading(false);
          }
        } else {
          setRecentJobs([]);
          setRecentCampaigns([]);
          setActivityLoading(false);
        }

        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isSuperAdmin, purchasedFeaturesLoading, hasPostRequirement, hasEmailBroadcast]);

  const handleViewJob = () => {
    navigate(isSuperAdmin ? '/super-admin/recruiters' : '/recruiter/my-jobs');
  };

  const handleOpenCampaignsList = () => {
    navigate('/recruiter/email-broadcast/campaigns/list');
  };

  const handleSuperAdminCampaignClick = () => {
    navigate('/super-admin/recruiters');
  };

  const displayName = adminProfile?.name || user?.name || 'User';

  /** Recruiter dashboard sections follow purchased plan: post only, email only, or both side-by-side */
  const showRecruiterPost = !isSuperAdmin && hasPostRequirement;
  const showRecruiterEmail = !isSuperAdmin && hasEmailBroadcast;
  const showRecruiterBoth = showRecruiterPost && showRecruiterEmail;

  const recruiterRecentActivityMode: 'jobs' | 'campaigns' | 'both' = showRecruiterBoth
    ? 'both'
    : showRecruiterPost
      ? 'jobs'
      : 'campaigns';

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

  const superAdminPaymentRingSections = useMemo(() => {
    if (!superAdminCounts) {
      return [
        { value: 33.33, color: 'green' },
        { value: 33.33, color: 'yellow' },
        { value: 33.34, color: 'red' },
      ];
    }
    const { approvedPayments, pendingPayments, rejectedPayments } = superAdminCounts;
    const t = approvedPayments + pendingPayments + rejectedPayments;
    if (t <= 0) {
      return [
        { value: 33.33, color: 'green' },
        { value: 33.33, color: 'yellow' },
        { value: 33.34, color: 'red' },
      ];
    }
    return [
      { value: (approvedPayments / t) * 100, color: 'green' },
      { value: (pendingPayments / t) * 100, color: 'yellow' },
      { value: (rejectedPayments / t) * 100, color: 'red' },
    ];
  }, [superAdminCounts]);

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

  const recruiterRecentActivityCard =
    showRecruiterPost || showRecruiterEmail ? (
      <Card
        shadow="sm"
        padding="lg"
        withBorder
        radius="md"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Box mb="lg">
          <Text fw={600} size="xl" lh={1.3}>
            Recent activity
          </Text>
          <Text size="sm" c="dimmed" mt={6}>
            Latest job posts and email campaigns at a glance.
          </Text>
        </Box>
        {activityLoading ? (
          <Stack gap="sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={92} radius="md" />
            ))}
          </Stack>
        ) : (
          <Stack gap="xl" style={{ flex: 1 }}>
            {(recruiterRecentActivityMode === 'jobs' || recruiterRecentActivityMode === 'both') && (
              <Box>
                <RecentActivitySectionLabel>Job posts</RecentActivitySectionLabel>
                {recentJobs.length === 0 ? (
                  <Paper p="md" radius="md" bg="gray.0" withBorder>
                    <Text c="dimmed" size="sm" ta="center">
                      No recent job posts
                    </Text>
                  </Paper>
                ) : (
                  <Stack gap="sm">
                    {recentJobs.map((job) => (
                      <RecentJobActivityItem
                        key={job._id || job.id}
                        job={job}
                        onClick={handleViewJob}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {recruiterRecentActivityMode === 'both' && <Divider my="md" />}

            {(recruiterRecentActivityMode === 'campaigns' || recruiterRecentActivityMode === 'both') && (
              <Box>
                <RecentActivitySectionLabel>Email campaigns</RecentActivitySectionLabel>
                {recentCampaigns.length === 0 ? (
                  <Paper p="md" radius="md" bg="gray.0" withBorder>
                    <Text c="dimmed" size="sm" ta="center">
                      No recent email campaigns
                    </Text>
                  </Paper>
                ) : (
                  <Stack gap="sm">
                    {recentCampaigns.map((c) => (
                      <RecentCampaignActivityItem
                        key={c.id}
                        campaign={c}
                        onClick={handleOpenCampaignsList}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
        )}
      </Card>
    ) : null;

  const jobPostingStatusCard = showRecruiterPost ? (
    <Card shadow="sm" padding="lg" withBorder radius="md" style={{ height: '100%' }}>
      <Text fw={600} size="lg" mb="md">
        Job posting status
      </Text>
      <Text size="xs" c="dimmed" mb="md">
        Active vs inactive postings from dashboard counts.
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
  ) : null;

  const emailCampaignStatusCard = showRecruiterEmail ? (
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
          ? 'Completed, scheduled, and draft campaigns from your dashboard counts.'
          : (recruiterEmailMetrics.completedCampaigns +
                recruiterEmailMetrics.scheduledCampaigns +
                recruiterEmailMetrics.draftCampaigns) ===
              0
            ? 'Upload lists and create campaigns from Email broadcast. Counts appear when GET /admin/dashboard/counts returns campaign fields.'
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
      <Group justify="center" gap="md" wrap="wrap" mt="md">
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
    </Card>
  ) : null;

  return (
    <Box maw={1200} w="100%" mx="auto" px={{ base: 'xs', sm: 0 }} pb="xl">
      <DashboardPageHeader
        icon={<IconLayoutDashboard size={24} stroke={1.75} />}
        title={`Welcome back, ${displayName}`}
        description={
          isSuperAdmin
            ? 'Overview of recruiters, job posts, email broadcast, and platform activity.'
            : recruiterWelcomeBlurb
        }
      />

      {isSuperAdmin && (
        <>
          <Text fw={700} size="sm" tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: '0.04em' }}>
            Jobs & applications
          </Text>
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 4 }}
            spacing={{ base: 'sm', sm: 'md' }}
            mb="lg"
          >
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
              title="Total Applications"
              value={superAdminCounts?.totalJobApplications ?? '--'}
              icon={<IconFileText size={20} color="#8764B8" />}
              color="#8764B8"
              loading={loading}
            />
          </SimpleGrid>

          <Divider my="xl" />
          <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="sm">
            <Text fw={700} size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: '0.04em' }}>
              Email broadcast
            </Text>
            {!emailCountsFromApi &&
              emailMetrics.totalCampaigns === 0 &&
              emailMetrics.completedCampaigns === 0 &&
              emailMetrics.scheduledCampaigns === 0 &&
              emailMetrics.draftCampaigns === 0 && (
                <Badge size="sm" variant="light" color="gray">
                  Connect email metrics from GET /super-admin/dashboard/counts
                </Badge>
              )}
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 'sm', sm: 'md' }} mb="xl">
            <StatCard
              title="Total campaigns"
              value={emailMetrics.totalCampaigns}
              icon={<IconSend size={20} color="#0078D4" />}
              color="#0078D4"
              loading={loading}
            />
            <StatCard
              title="Completed"
              value={emailMetrics.completedCampaigns}
              icon={<IconCheck size={20} color="#107C10" />}
              color="#107C10"
              loading={loading}
            />
            <StatCard
              title="Recipients (all time)"
              value={emailMetrics.totalRecipients.toLocaleString()}
              icon={<IconMail size={20} color="#8764B8" />}
              color="#8764B8"
              loading={loading}
            />
            <StatCard
              title="Recruiters w/ Email feature"
              value={emailMetrics.recruitersWithFeature}
              icon={<IconUsers size={20} color="#D83B01" />}
              color="#D83B01"
              loading={loading}
            />
          </SimpleGrid>
        </>
      )}

      {showRecruiterPost && (
        <>
          <Text fw={700} size="sm" tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: '0.04em' }}>
            Jobs & applications
          </Text>
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 4 }}
            spacing={{ base: 'sm', sm: 'md' }}
            mb={showRecruiterEmail ? 'lg' : 'xl'}
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
            <StatCard
              title="Active Applications"
              value={adminCounts?.activeApplications ?? '--'}
              icon={<IconClipboardList size={20} color="#D83B01" />}
              color="#D83B01"
              loading={loading}
            />
          </SimpleGrid>
        </>
      )}

      {showRecruiterEmail && (
        <>
          {showRecruiterPost && <Divider my="xl" />}
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
                  Connect email metrics from GET /admin/dashboard/counts
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

      {isSuperAdmin ? (
        <>
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="xl" style={{ alignItems: 'stretch' }}>
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
                Approved, pending, and rejected payments from GET /super-admin/dashboard/counts.
              </Text>
              <DashboardRingChart
                sections={superAdminPaymentRingSections}
                centerValue={
                  <Text size="xl" fw={700}>
                    {superAdminCounts
                      ? superAdminCounts.approvedPayments +
                        superAdminCounts.pendingPayments +
                        superAdminCounts.rejectedPayments
                      : '—'}
                  </Text>
                }
                centerSub="Payments"
              />
              <Stack gap="xs" mt="md" align="center">
                <Group justify="center" gap="lg" wrap="wrap">
                  <Group gap="xs">
                    <Box w={10} h={10} bg="green" style={{ borderRadius: '50%' }} />
                    <Text size="sm">
                      Approved: {superAdminCounts?.approvedPayments ?? '—'}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Box w={10} h={10} bg="yellow" style={{ borderRadius: '50%' }} />
                    <Text size="sm">
                      Pending: {superAdminCounts?.pendingPayments ?? '—'}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Box w={10} h={10} bg="red" style={{ borderRadius: '50%' }} />
                    <Text size="sm">
                      Rejected: {superAdminCounts?.rejectedPayments ?? '—'}
                    </Text>
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
                {emailCountsFromApi
                  ? 'Completed, scheduled, and draft campaigns from dashboard counts.'
                  : (emailMetrics.completedCampaigns +
                        emailMetrics.scheduledCampaigns +
                        emailMetrics.draftCampaigns) ===
                      0
                    ? 'Campaign counts appear when GET /super-admin/dashboard/counts includes campaign fields.'
                    : 'Campaign breakdown from dashboard data.'}
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

          <Card shadow="sm" padding="lg" withBorder radius="md">
            <Box mb="lg">
              <Text fw={600} size="xl" lh={1.3}>
                Recent activity
              </Text>
              <Text size="sm" c="dimmed" mt={6} maw={640}>
                Latest job posts and email campaigns across the platform.
              </Text>
            </Box>
            {activityLoading ? (
              <Stack gap="sm">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} height={92} radius="md" />
                ))}
              </Stack>
            ) : recentJobs.length === 0 && recentCampaigns.length === 0 ? (
              <RecentActivityEmpty message="No recent job posts or campaigns to show yet." />
            ) : (
              <ScrollArea h={440} type="auto" offsetScrollbars>
                <Stack gap="xl" pr="xs">
                  <Box>
                    <RecentActivitySectionLabel>Job posts</RecentActivitySectionLabel>
                    {recentJobs.length === 0 ? (
                      <Paper p="md" radius="md" bg="gray.0" withBorder>
                        <Text c="dimmed" size="sm" ta="center">
                          No recent job posts
                        </Text>
                      </Paper>
                    ) : (
                      <Stack gap="sm">
                        {recentJobs.map((job) => (
                          <RecentJobActivityItem
                            key={job._id || job.id}
                            job={job}
                            onClick={handleViewJob}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Divider my={4} />

                  <Box>
                    <RecentActivitySectionLabel>Email campaigns</RecentActivitySectionLabel>
                    {recentCampaigns.length === 0 ? (
                      <Paper p="md" radius="md" bg="gray.0" withBorder>
                        <Text c="dimmed" size="sm" ta="center">
                          No recent email campaigns
                        </Text>
                      </Paper>
                    ) : (
                      <Stack gap="sm">
                        {recentCampaigns.map((c) => (
                          <RecentCampaignActivityItem
                            key={c.id}
                            campaign={c}
                            onClick={handleSuperAdminCampaignClick}
                            showRecruiterLine
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </ScrollArea>
            )}
          </Card>
        </>
      ) : (
        <Stack gap="xl">
          {showRecruiterBoth && (
            <>
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                {jobPostingStatusCard}
                {emailCampaignStatusCard}
              </SimpleGrid>
              {recruiterRecentActivityCard}
            </>
          )}
          {showRecruiterPost && !showRecruiterEmail && (
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'stretch' }}>
              {jobPostingStatusCard}
              {recruiterRecentActivityCard}
            </SimpleGrid>
          )}
          {showRecruiterEmail && !showRecruiterPost && (
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'stretch' }}>
              {emailCampaignStatusCard}
              {recruiterRecentActivityCard}
            </SimpleGrid>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Dashboard;
