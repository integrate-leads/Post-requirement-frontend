import React, { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Button, Group, Stack, Box, Title, ThemeIcon, Paper, SimpleGrid, ScrollArea, Skeleton, Loader, Avatar } from '@mantine/core';
import { IconCheck, IconX, IconClock, IconBriefcase, IconEye, IconCurrencyRupee, IconActivity, IconRefresh } from '@tabler/icons-react';
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

interface PendingJob {
  id: string;
  _id?: string;
  title: string;
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterCompany?: string;
  companyName?: string;
  isVerified?: string;
  status?: string;
  createdAt?: string;
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

const Alerts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [alertCounts, setAlertCounts] = useState<AlertCounts | null>(null);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchData = async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      setJobsLoading(false);
      return;
    }

    // Fetch alert counts
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

    // Fetch jobs and filter for pending verification
    try {
      const jobsResponse = await api.get<{
        success: boolean;
        data: { jobPosts: PendingJob[] };
      }>(API_ENDPOINTS.SUPER_ADMIN.LIST_JOBS);

      if (jobsResponse.data?.success) {
        const allJobs = jobsResponse.data.data?.jobPosts || [];
        // Filter only jobs with isVerified: "Pending"
        const pending = allJobs.filter(job => job.isVerified === 'Pending');
        setPendingJobs(pending);
        
        // Generate recent activities from approved jobs
        const approvedJobs = allJobs.filter(job => job.isVerified === 'Approve' || job.status === 'Active').slice(0, 5);
        const activities: RecentActivity[] = approvedJobs.map((job, index) => ({
          id: job._id || job.id || `activity-${index}`,
          type: 'job_posted' as const,
          title: job.title,
          company: job.recruiterCompany || job.companyName || 'N/A',
          status: job.status || 'ACTIVE',
          date: job.createdAt ? format(new Date(job.createdAt), 'MMM dd, yyyy') : 'Recently',
        }));
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Failed to fetch pending jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin]);

  const handleVerifyJob = async (jobId: string, status: 'Approve' | 'Reject') => {
    setActionLoading(jobId);
    try {
      // Using PATCH method for verify job API
      const response = await api.patch(
        API_ENDPOINTS.SUPER_ADMIN.VERIFY_JOB(jobId),
        { status }
      );
      if (response.data?.success) {
        notifications.show({
          title: 'Success',
          message: `Job ${status === 'Approve' ? 'approved' : 'rejected'} successfully`,
          color: status === 'Approve' ? 'green' : 'red',
        });
        // Refresh data
        fetchData();
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

  // Payment Request Card matching reference design
  const PaymentRequestCard = ({ job }: { job: PendingJob }) => {
    const typeBadge = getJobTypeBadge(job);
    const jobId = job._id || job.id;
    const price = job.amount || job.price || 299;
    
    return (
      <Card shadow="xs" padding="md" withBorder mb="sm" radius="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" style={{ flex: 1 }} wrap="nowrap">
            <Avatar 
              color="blue" 
              radius="xl" 
              size={isMobile ? 36 : 40}
            >
              {(job.recruiterName || 'U')[0].toUpperCase()}
            </Avatar>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs" mb={4} wrap="wrap">
                <Text fw={600} size={isMobile ? "sm" : "md"} truncate>
                  {job.recruiterName || 'Unknown User'}
                </Text>
                <Badge color="orange" variant="light" size="xs">PENDING</Badge>
              </Group>
              <Text size="xs" c="dimmed" mb={6}>{job.recruiterEmail || 'No email'}</Text>
              <Group gap="xs" wrap="nowrap">
                <Badge 
                  color={typeBadge.color} 
                  variant="light" 
                  size="xs"
                  leftSection={<Text size="xs">{typeBadge.icon}</Text>}
                >
                  {typeBadge.label}
                </Badge>
                <Text size="xs" c="dimmed" truncate style={{ maxWidth: isMobile ? 100 : 200 }}>
                  {job.title}
                </Text>
              </Group>
              <Group gap="xs" mt="xs">
                <Text fw={700} c="green.7" size={isMobile ? "sm" : "md"}>₹{price}</Text>
                <Text size="xs" c="dimmed">{getTimeAgo(job.createdAt)}</Text>
              </Group>
            </Box>
          </Group>
          
          <Stack gap="xs" style={{ flexShrink: 0 }}>
            <Button 
              size={isMobile ? "xs" : "sm"}
              color="green" 
              leftSection={actionLoading === jobId ? <Loader size={14} color="white" /> : <IconCheck size={14} />}
              onClick={() => handleVerifyJob(jobId, 'Approve')}
              disabled={actionLoading !== null}
              style={{ minWidth: isMobile ? 80 : 100 }}
            >
              Approve
            </Button>
            <Button 
              size={isMobile ? "xs" : "sm"}
              color="red" 
              variant="outline" 
              leftSection={actionLoading === jobId ? <Loader size={14} /> : <IconX size={14} />}
              onClick={() => handleVerifyJob(jobId, 'Reject')}
              disabled={actionLoading !== null}
              style={{ minWidth: isMobile ? 80 : 100 }}
            >
              Reject
            </Button>
          </Stack>
        </Group>
      </Card>
    );
  };

  // Mobile Activity Card
  const MobileActivityCard = ({ activity }: { activity: RecentActivity }) => (
    <Card shadow="sm" padding="sm" withBorder mb="xs">
      <Group gap="sm" justify="space-between">
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={500} truncate>{activity.title}</Text>
          <Text size="xs" c="dimmed">{activity.company}</Text>
        </Box>
        <Stack gap={4} align="flex-end">
          <Badge color="gray" variant="light" size="xs">{activity.status}</Badge>
          <Text size="xs" c="dimmed">{activity.date}</Text>
        </Stack>
        <Button size="xs" variant="light" leftSection={<IconEye size={14} />}>
          View
        </Button>
      </Group>
    </Card>
  );

  return (
    <Box maw={1200} mx="auto" px={{ base: 'xs', sm: 'md' }}>
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
              <Text size="xs" c="dimmed">{pendingJobs.length} requests waiting</Text>
            </Box>
          </Group>

          {jobsLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map(i => <Skeleton key={i} height={100} />)}
            </Stack>
          ) : pendingJobs.length === 0 ? (
            <Paper p="xl" bg="gray.0" radius="md" ta="center">
              <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto"><IconCheck size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No pending requests</Text>
            </Paper>
          ) : (
            <ScrollArea h={pendingJobs.length > 3 ? 400 : 'auto'}>
              <Stack gap="sm">
                {pendingJobs.map((job) => (
                  <PaymentRequestCard key={job._id || job.id} job={job} />
                ))}
              </Stack>
            </ScrollArea>
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
                      <Table.Td>
                        <Text fw={500} size="sm">{activity.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{activity.company}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="gray" variant="light" size="sm">{activity.status}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{activity.date}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button size="xs" variant="light" leftSection={<IconEye size={14} />}>
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
