import React, { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Button, Group, Stack, Box, Title, ThemeIcon, Paper, SimpleGrid, ScrollArea, Skeleton, Loader, Avatar, Pagination } from '@mantine/core';
import { IconCheck, IconX, IconClock, IconBriefcase, IconEye, IconCurrencyRupee, IconActivity, IconCurrencyDollar } from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useMediaQuery } from '@mantine/hooks';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

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

const Alerts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [alertCounts, setAlertCounts] = useState<AlertCounts | null>(null);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [pendingPagination, setPendingPagination] = useState<PaginationData | null>(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch pending jobs with pagination
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
    fetchPendingJobs(1);
    fetchRecentActivities();
  }, [isSuperAdmin]);

  // Handle pagination change
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

  // Payment Request Card matching reference design
  const PaymentRequestCard = ({ job }: { job: PendingJob }) => {
    const typeBadge = getJobTypeBadge(job);
    const jobId = job._id || job.id?.toString() || '';
    const price = getJobPrice(job);
    const currencySymbol = getCurrencySymbol(job);
    
    return (
      <Card shadow="xs" padding="md" withBorder mb="sm" radius="md">
        <Stack gap="sm">
          <Group gap="sm" wrap="nowrap">
            <Avatar 
              color="blue" 
              radius="xl" 
              size={isMobile ? 36 : 40}
            >
              {getRecruiterName(job)[0].toUpperCase()}
            </Avatar>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs" mb={4} wrap="wrap">
                <Text fw={600} size={isMobile ? "sm" : "md"} lineClamp={1}>
                  {getRecruiterName(job)}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" lineClamp={1}>{getRecruiterEmail(job)}</Text>
            </Box>
          </Group>
          
          <Group gap="xs" wrap="wrap">
            <Badge color="orange" variant="light" size="xs">PENDING</Badge>
            <Badge 
              color={typeBadge.color} 
              variant="light" 
              size="xs"
            >
              {typeBadge.label}
            </Badge>
          </Group>
          
          <Box>
            <Text size="sm" fw={500} lineClamp={1}>
              {job.title || 'Untitled Job'}
            </Text>
            {job.role && job.role !== job.title && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                Role: {job.role}
              </Text>
            )}
          </Box>
          
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <Text fw={700} c="green.7" size={isMobile ? "sm" : "md"}>
                {currencySymbol}{price > 0 ? price : job.planAmount || '0'}
              </Text>
              <Text size="xs" c="dimmed">{getTimeAgo(job.createdAt)}</Text>
            </Group>
          </Group>
          
          <Group gap="xs" grow>
            <Button 
              size="xs"
              color="green" 
              leftSection={actionLoading === jobId ? <Loader size={12} color="white" /> : <IconCheck size={12} />}
              onClick={() => handleVerifyJob(jobId, 'Approve')}
              disabled={actionLoading !== null}
            >
              Approve
            </Button>
            <Button 
              size="xs"
              color="red" 
              variant="outline" 
              leftSection={actionLoading === jobId ? <Loader size={12} /> : <IconX size={12} />}
              onClick={() => handleVerifyJob(jobId, 'Reject')}
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
      <Box mb="xl">
        <Title order={2} size={isMobile ? 'h3' : 'h2'}>Alerts & Activity</Title>
        <Text c="dimmed" size="sm">Monitor pending approvals and recent activity</Text>
      </Box>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="yellow" variant="light" size="lg"><IconClock size={20} /></ThemeIcon>
            <Box>
              {loading ? <Skeleton height={28} width={40} /> : <Text size="xl" fw={700}>{alertCounts?.pendingCount ?? pendingJobs.length}</Text>}
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
        {/* Payment Requests (Pending Job Approvals) */}
        <Card shadow="sm" padding="md" withBorder>
          <Group gap="sm" mb="md">
            <ThemeIcon color="orange" variant="light" size="lg" radius="xl">
              <IconCurrencyRupee size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={600} size="lg">Payment Requests</Text>
              <Text size="xs" c="dimmed">{pendingPagination?.totalRecords ?? pendingJobs.length} requests waiting</Text>
            </Box>
          </Group>

          {pendingLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map(i => <Skeleton key={i} height={100} />)}
            </Stack>
          ) : pendingJobs.length === 0 ? (
            <Paper p="xl" bg="gray.0" radius="md" ta="center">
              <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto"><IconCheck size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No pending requests</Text>
            </Paper>
          ) : (
            <>
              <ScrollArea h={pendingJobs.length > 3 ? 400 : 'auto'}>
                <Stack gap="sm">
                  {pendingJobs.map((job) => (
                    <PaymentRequestCard key={job._id || job.id} job={job} />
                  ))}
                </Stack>
              </ScrollArea>
              
              {/* Pagination for pending jobs */}
              {pendingPagination && pendingPagination.totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination
                    total={pendingPagination.totalPages}
                    value={pendingPage}
                    onChange={handlePageChange}
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
            <ScrollArea>
              <Table striped highlightOnHover>
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
