import React, { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Button, Group, Stack, Box, ThemeIcon, Paper, SimpleGrid, ScrollArea, Skeleton, Loader, Avatar, Pagination } from '@mantine/core';
import { IconCheck, IconX, IconClock, IconBriefcase, IconEye, IconCurrencyRupee, IconActivity, IconCurrencyDollar, IconBell } from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useMediaQuery } from '@mantine/hooks';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { DashboardPageHeader, DASHBOARD_TABLE_PROPS, DASHBOARD_TABLE_STYLES } from '@/components/dashboard';

interface AlertCounts {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface JobAdmin {
  id: number;
  name: string;
  email: string;
  companyName: string;
  companyWebsite?: string;
}

interface PendingJob {
  id: number;
  _id?: string;
  title: string;
  description?: string;
  adminId?: number;
  country?: string;
  clientName?: string;
  role?: string;
  workLocations?: Array<{ state: string; city: string[] }>;
  workType?: string;
  jobType?: string[];
  payRate?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  primarySkills?: string[];
  niceToHaveSkills?: string[];
  responsibilities?: string;
  applicationQuestions?: Array<{ question: string; type: string }>;
  requiredDocuments?: string[];
  expiryDate?: string | null;
  paymentStatus?: string;
  planAmount?: string;
  totalPayment?: string;
  isVerified?: string;
  status?: string;
  deleted?: string;
  createdAt?: string;
  updatedAt?: string;
  admin?: JobAdmin;
  // Legacy fields for backward compatibility
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterCompany?: string;
  companyName?: string;
  amount?: number;
  price?: number;
  type?: string;
}

interface RecentActivity {
  id: string;
  type: 'job_posted' | 'application' | 'approval';
  title: string;
  company: string;
  status: string;
  date: string;
}

interface PaginationData {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

interface PurchaseRequest {
  id: number;
  featureId: number;
  subscriptionId: number;
  startDate: string | null;
  endDate: string | null;
  price: string;
  timePeriod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const Alerts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [alertCounts, setAlertCounts] = useState<AlertCounts | null>(null);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [pendingPagination, setPendingPagination] = useState<PaginationData | null>(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseRequestsTotal, setPurchaseRequestsTotal] = useState<number>(0);
  const [purchaseRequestsPage, setPurchaseRequestsPage] = useState(1);
  const [purchaseRequestsTotalPages, setPurchaseRequestsTotalPages] = useState(1);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [purchaseRequestsLoading, setPurchaseRequestsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch pending purchase requests (Payment Requests)
  const fetchPendingPurchaseRequests = async (page: number = 1) => {
    if (!isSuperAdmin) return;
    setPurchaseRequestsLoading(true);
    try {
      const response = await api.get<{
        success: boolean;
        message?: string;
        totalRecords: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
        data: PurchaseRequest[];
      }>(`${API_ENDPOINTS.SUPER_ADMIN.LIST_PENDING_PURCHASE_REQUESTS}?page=${page}&limit=10`);

      if (response.data?.success && Array.isArray(response.data.data)) {
        setPurchaseRequests(response.data.data);
        setPurchaseRequestsTotal(response.data.totalRecords ?? 0);
        setPurchaseRequestsTotalPages(response.data.totalPages ?? 1);
      } else {
        setPurchaseRequests([]);
        setPurchaseRequestsTotal(0);
        setPurchaseRequestsTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to fetch pending purchase requests:', error);
      setPurchaseRequests([]);
      setPurchaseRequestsTotal(0);
      setPurchaseRequestsTotalPages(1);
    } finally {
      setPurchaseRequestsLoading(false);
    }
  };

  // Fetch pending jobs with pagination (kept for any other use)
  const fetchPendingJobs = async (page: number = 1) => {
    if (!isSuperAdmin) return;
    setPendingLoading(true);
    try {
      const response = await api.get<{
        success: boolean;
        data: { jobPosts: PendingJob[]; pagination: PaginationData };
      }>(`${API_ENDPOINTS.SUPER_ADMIN.LIST_JOBS}?page=${page}&limit=10&verified=Pending`);

      if (response.data?.success) {
        setPendingJobs(response.data.data?.jobPosts || []);
        setPendingPagination(response.data.data?.pagination || null);
      }
    } catch (error) {
      console.error('Failed to fetch pending jobs:', error);
    } finally {
      setPendingLoading(false);
    }
  };

  // Fetch recent activities (approved/active jobs)
  const fetchRecentActivities = async () => {
    if (!isSuperAdmin) return;
    
    setJobsLoading(true);
    try {
      const jobsResponse = await api.get<{
        success: boolean;
        data: { jobPosts: PendingJob[] };
      }>(API_ENDPOINTS.SUPER_ADMIN.LIST_JOBS);

      if (jobsResponse.data?.success) {
        const allJobs = jobsResponse.data.data?.jobPosts || [];
        
        // Generate recent activities from approved jobs
        const approvedJobs = allJobs.filter(job => job.isVerified === 'Approved' || job.status === 'Active').slice(0, 5);
        const activities: RecentActivity[] = approvedJobs.map((job, index) => ({
          id: job._id || job.id?.toString() || `activity-${index}`,
          type: 'job_posted' as const,
          title: job.title || 'Untitled Job',
          company: job.admin?.companyName || job.recruiterCompany || job.companyName || 'Unknown Company',
          status: job.status || 'Active',
          date: job.createdAt ? format(new Date(job.createdAt), 'MMM dd, yyyy') : 'Recently',
        }));
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchAlertCounts = async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<{ success: boolean; data: AlertCounts }>(
        API_ENDPOINTS.SUPER_ADMIN.ALERT_COUNT
      );
      if (response.data?.success) {
        setAlertCounts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alert counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertCounts();
    fetchPendingPurchaseRequests(1);
    fetchPendingJobs(1);
    fetchRecentActivities();
  }, [isSuperAdmin]);

  // Handle pagination change for payment requests
  const handlePurchaseRequestPageChange = (page: number) => {
    setPurchaseRequestsPage(page);
    fetchPendingPurchaseRequests(page);
  };

  const handleVerifyPurchaseRequest = async (id: number, status: 'Approve' | 'Reject') => {
    const idStr = String(id);
    setActionLoading(idStr);
    try {
      const response = await api.patch(
        API_ENDPOINTS.SUPER_ADMIN.VERIFY_FEATURE(idStr),
        { status }
      );
      if (response.data?.success) {
        notifications.show({
          title: 'Success',
          message: response.data?.message ?? `Request ${status === 'Approve' ? 'approved' : 'rejected'} successfully`,
          color: status === 'Approve' ? 'green' : 'orange',
        });
        fetchAlertCounts();
        fetchPendingPurchaseRequests(purchaseRequestsPage);
        window.dispatchEvent(new CustomEvent('alerts-updated'));
      }
    } catch (error) {
      console.error('Failed to verify purchase request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update request status',
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle pagination change for pending jobs
  const handlePageChange = (page: number) => {
    setPendingPage(page);
    fetchPendingJobs(page);
  };

  const handleVerifyJob = async (jobId: string | number, status: 'Approve' | 'Reject') => {
    const idStr = jobId.toString();
    setActionLoading(idStr);
    try {
      // Using PATCH method for verify job API
      const response = await api.patch(
        API_ENDPOINTS.SUPER_ADMIN.VERIFY_JOB(idStr),
        { status }
      );
      if (response.data?.success) {
        notifications.show({
          title: 'Success',
          message: `Job ${status === 'Approve' ? 'approved' : 'rejected'} successfully`,
          color: status === 'Approve' ? 'green' : 'red',
        });
        // Refresh data
        fetchAlertCounts();
        fetchPendingJobs(pendingPage);
        fetchRecentActivities();
        window.dispatchEvent(new CustomEvent('alerts-updated'));
      }
    } catch (error) {
      console.error('Failed to verify job:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update job status',
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getJobTypeBadge = (job: PendingJob) => {
    const type = job.type?.toLowerCase() || 'job posting';
    if (type.includes('renewal')) {
      return { label: 'RENEWAL', color: 'blue', icon: '↻' };
    } else if (type.includes('view')) {
      return { label: 'VIEW MORE', color: 'green', icon: '👁' };
    }
    return { label: 'JOB POSTING', color: 'cyan', icon: '📋' };
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // Get recruiter name from job data
  const getRecruiterName = (job: PendingJob) => {
    return job.admin?.name || job.recruiterName || 'Unknown User';
  };

  // Get recruiter email from job data
  const getRecruiterEmail = (job: PendingJob) => {
    return job.admin?.email || job.recruiterEmail || 'No email';
  };

  // Get price/amount from job data
  const getJobPrice = (job: PendingJob) => {
    const amount = job.totalPayment || job.planAmount || job.amount || job.price;
    return amount ? parseFloat(amount.toString()) : 0;
  };

  // Get currency symbol based on country
  const getCurrencySymbol = (job: PendingJob) => {
    return job.country === 'India' ? '₹' : '$';
  };

  // Payment Request Card (subscription feature / purchase request)
  const PurchaseRequestCard = ({ request }: { request: PurchaseRequest }) => {
    const requestId = String(request.id);
    return (
      <Card shadow="xs" padding="md" withBorder mb="sm" radius="md">
        <Stack gap="sm">
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Group gap="xs" wrap="wrap">
              <Badge color="orange" variant="light" size="xs">PENDING</Badge>
              <Badge color="blue" variant="light" size="xs">Feature #{request.featureId}</Badge>
              <Text size="xs" c="dimmed">Sub #{request.subscriptionId}</Text>
            </Group>
            <Text size="xs" c="dimmed">{getTimeAgo(request.createdAt)}</Text>
          </Group>
          <Group gap="md" wrap="wrap">
            <Box>
              <Text size="xs" c="dimmed">Price</Text>
              <Text fw={600} size="sm">₹{request.price}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Period</Text>
              <Text size="sm">{request.timePeriod} days</Text>
            </Box>
            {request.startDate && (
              <Box>
                <Text size="xs" c="dimmed">Start</Text>
                <Text size="xs">{format(new Date(request.startDate), 'yyyy-MM-dd')}</Text>
              </Box>
            )}
            {request.endDate && (
              <Box>
                <Text size="xs" c="dimmed">End</Text>
                <Text size="xs">{format(new Date(request.endDate), 'yyyy-MM-dd')}</Text>
              </Box>
            )}
          </Group>
          <Group gap="xs" grow>
            <Button
              size="xs"
              color="green"
              leftSection={actionLoading === requestId ? <Loader size={12} color="white" /> : <IconCheck size={12} />}
              onClick={() => handleVerifyPurchaseRequest(request.id, 'Approve')}
              disabled={actionLoading !== null}
            >
              Approve
            </Button>
            <Button
              size="xs"
              color="red"
              variant="outline"
              leftSection={actionLoading === requestId ? <Loader size={12} /> : <IconX size={12} />}
              onClick={() => handleVerifyPurchaseRequest(request.id, 'Reject')}
              disabled={actionLoading !== null}
            >
              Reject
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  };

  // Mobile Activity Card
  const MobileActivityCard = ({ activity }: { activity: RecentActivity }) => (
    <Card shadow="sm" padding="sm" withBorder mb="xs" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} lineClamp={1}>{activity.title}</Text>
            <Text size="xs" c="dimmed">{activity.company}</Text>
          </Box>
          <Badge color={activity.status === 'Active' ? 'green' : 'gray'} variant="light" size="xs" style={{ flexShrink: 0 }}>
            {activity.status}
          </Badge>
        </Group>
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">{activity.date}</Text>
          <Button 
            size="xs" 
            variant="light" 
            leftSection={<IconEye size={12} />} 
            onClick={() => navigate('/super-admin/recruiters')}
            styles={{ root: { height: 28, paddingLeft: 8, paddingRight: 10 } }}
          >
            View
          </Button>
        </Group>
      </Stack>
    </Card>
  );

  return (
    <Box maw={1200} mx="auto" px={{ base: 'xs', sm: 'md' }} style={{ overflowX: 'hidden' }}>
      <DashboardPageHeader
        icon={<IconBell size={24} stroke={1.75} />}
        title="Alerts & Activity"
        description="Monitor pending payment requests, approvals, and recent job activity."
      />

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="yellow" variant="light" size="lg"><IconClock size={20} /></ThemeIcon>
            <Box>
              {loading && !purchaseRequestsTotal ? <Skeleton height={28} width={40} /> : <Text size="xl" fw={700}>{purchaseRequestsTotal ?? alertCounts?.pendingCount ?? 0}</Text>}
              <Text size="xs" c="dimmed">Pending</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="green" variant="light" size="lg"><IconCheck size={20} /></ThemeIcon>
            <Box>
              {loading ? <Skeleton height={28} width={40} /> : <Text size="xl" fw={700}>{alertCounts?.approvedCount ?? 0}</Text>}
              <Text size="xs" c="dimmed">Approved</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="red" variant="light" size="lg"><IconX size={20} /></ThemeIcon>
            <Box>
              {loading ? <Skeleton height={28} width={40} /> : <Text size="xl" fw={700}>{alertCounts?.rejectedCount ?? 0}</Text>}
              <Text size="xs" c="dimmed">Rejected</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      <Stack gap="lg">
        {/* Payment Requests (Pending purchase / subscription feature requests) */}
        <Card shadow="sm" padding="md" withBorder>
          <Group gap="sm" mb="md">
            <ThemeIcon color="orange" variant="light" size="lg" radius="xl">
              <IconCurrencyRupee size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={600} size="lg">Payment Requests</Text>
              <Text size="xs" c="dimmed">{purchaseRequestsTotal} requests waiting</Text>
            </Box>
          </Group>

          {purchaseRequestsLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map(i => <Skeleton key={i} height={100} />)}
            </Stack>
          ) : purchaseRequests.length === 0 ? (
            <Paper p="xl" bg="gray.0" radius="md" ta="center">
              <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto"><IconCheck size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No pending payment requests</Text>
            </Paper>
          ) : (
            <>
              <ScrollArea h={purchaseRequests.length > 3 ? 400 : 'auto'}>
                <Stack gap="sm">
                  {purchaseRequests.map((req) => (
                    <PurchaseRequestCard key={req.id} request={req} />
                  ))}
                </Stack>
              </ScrollArea>

              {purchaseRequestsTotalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination
                    total={purchaseRequestsTotalPages}
                    value={purchaseRequestsPage}
                    onChange={handlePurchaseRequestPageChange}
                    size="sm"
                    radius="md"
                  />
                </Group>
              )}
            </>
          )}
        </Card>

        {/* Recent Activity */}
        <Card shadow="sm" padding="md" withBorder>
          <Group gap="sm" mb="md">
            <ThemeIcon color="blue" variant="light" size="lg"><IconActivity size={20} /></ThemeIcon>
            <Box>
              <Text fw={600} size="lg">Recent Activity</Text>
              <Text size="xs" c="dimmed">Latest approved jobs</Text>
            </Box>
          </Group>

          {jobsLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map(i => <Skeleton key={i} height={50} />)}
            </Stack>
          ) : recentActivities.length === 0 ? (
            <Paper p="xl" bg="gray.0" radius="md" ta="center">
              <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto"><IconActivity size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No recent activity</Text>
            </Paper>
          ) : isMobile ? (
            <Stack gap="xs">
              {recentActivities.map((activity) => (
                <MobileActivityCard key={activity.id} activity={activity} />
              ))}
            </Stack>
          ) : (
            <ScrollArea type="auto" offsetScrollbars>
              <Table {...DASHBOARD_TABLE_PROPS} styles={DASHBOARD_TABLE_STYLES}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Job Title</Table.Th>
                    <Table.Th>Company</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recentActivities.map((activity) => (
                    <Table.Tr key={activity.id}>
                      <Table.Td style={{ maxWidth: 500 }}>
                        <Text fw={500} size="sm" lineClamp={2}>{activity.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{activity.company}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={activity.status === 'Active' ? 'green' : 'gray'} variant="light" size="sm">{activity.status.toUpperCase()}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{activity.date}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button size="xs" variant="light" leftSection={<IconEye size={14} />} onClick={() => navigate('/super-admin/recruiters')}>
                          View
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Card>
      </Stack>
    </Box>
  );
};

export default Alerts;
