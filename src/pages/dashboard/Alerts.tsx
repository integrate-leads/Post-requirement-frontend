import React, { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Button, Group, Stack, Box, Title, ThemeIcon, Paper, SimpleGrid, ScrollArea, Skeleton, Loader, Avatar } from '@mantine/core';
import { IconCheck, IconX, IconClock, IconBriefcase, IconEye, IconCreditCard, IconActivity } from '@tabler/icons-react';
import { format } from 'date-fns';
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
  recruiterCompany?: string;
  companyName?: string;
  isVerified?: string;
  status?: string;
  createdAt?: string;
}

interface RecentActivity {
  id: string;
  type: 'job_posted' | 'application' | 'approval';
  title: string;
  subtitle: string;
  time: string;
  color: string;
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
        const approvedJobs = allJobs.filter(job => job.isVerified === 'Approve').slice(0, 5);
        const activities: RecentActivity[] = approvedJobs.map((job, index) => ({
          id: job._id || job.id || `activity-${index}`,
          type: 'job_posted' as const,
          title: job.title,
          subtitle: job.recruiterCompany || job.companyName || 'Company',
          time: job.createdAt ? format(new Date(job.createdAt), 'MMM dd, yyyy') : 'Recently',
          color: 'blue',
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

  const handleViewRecruiter = () => {
    navigate('/dashboard/recruiters');
  };

  // Mobile Pending Job Card
  const MobilePendingJobCard = ({ job }: { job: PendingJob }) => (
    <Card shadow="sm" padding="md" withBorder mb="sm">
      <Group justify="space-between" mb="sm">
        <Box style={{ flex: 1 }}>
          <Text fw={500} size="sm">{job.title}</Text>
          <Text size="xs" c="dimmed">{job.recruiterCompany || job.companyName || 'N/A'}</Text>
        </Box>
        <Badge color="yellow" variant="light" size="sm">Pending</Badge>
      </Group>
      <Text size="xs" c="dimmed" mb="sm">
        {job.createdAt ? format(new Date(job.createdAt), 'MMM dd, yyyy') : 'N/A'}
      </Text>
      <Group gap="xs">
        <Button 
          size="xs" 
          color="green" 
          leftSection={actionLoading === (job._id || job.id) ? <Loader size={14} color="white" /> : <IconCheck size={14} />}
          onClick={() => handleVerifyJob(job._id || job.id, 'Approve')}
          disabled={actionLoading !== null}
          style={{ flex: 1 }}
        >
          Approve
        </Button>
        <Button 
          size="xs" 
          color="red" 
          variant="outline" 
          leftSection={actionLoading === (job._id || job.id) ? <Loader size={14} /> : <IconX size={14} />}
          onClick={() => handleVerifyJob(job._id || job.id, 'Reject')}
          disabled={actionLoading !== null}
          style={{ flex: 1 }}
        >
          Reject
        </Button>
      </Group>
    </Card>
  );

  // Mobile Activity Card
  const MobileActivityCard = ({ activity }: { activity: RecentActivity }) => (
    <Card shadow="sm" padding="sm" withBorder mb="xs">
      <Group gap="sm">
        <Avatar color={activity.color} radius="xl" size="sm">
          <IconBriefcase size={14} />
        </Avatar>
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={500}>{activity.title}</Text>
          <Text size="xs" c="dimmed">{activity.subtitle}</Text>
        </Box>
        <Text size="xs" c="dimmed">{activity.time}</Text>
      </Group>
    </Card>
  );

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Alerts & Activity</Title>
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

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Payment Requests (Pending Job Approvals) */}
        <Card shadow="sm" padding="lg" withBorder>
          <Group gap="sm" mb="md">
            <ThemeIcon color="orange" variant="light" size="lg"><IconCreditCard size={20} /></ThemeIcon>
            <Box>
              <Text fw={600} size="lg">Payment Requests</Text>
              <Text size="xs" c="dimmed">{pendingJobs.length} requests waiting</Text>
            </Box>
          </Group>

          {jobsLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map(i => <Skeleton key={i} height={60} />)}
            </Stack>
          ) : pendingJobs.length === 0 ? (
            <Paper p="xl" bg="gray.0" radius="md" ta="center">
              <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto"><IconCheck size={24} /></ThemeIcon>
              <Text c="dimmed" size="sm">No pending requests</Text>
            </Paper>
          ) : isMobile ? (
            <Stack gap="sm">
              {pendingJobs.slice(0, 5).map((job) => (
                <MobilePendingJobCard key={job._id || job.id} job={job} />
              ))}
            </Stack>
          ) : (
            <ScrollArea h={300}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Job Title</Table.Th>
                    <Table.Th>Company</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendingJobs.slice(0, 5).map((job) => (
                    <Table.Tr key={job._id || job.id}>
                      <Table.Td>
                        <Text fw={500} size="sm">{job.title}</Text>
                        <Text size="xs" c="dimmed">
                          {job.createdAt ? format(new Date(job.createdAt), 'MMM dd, yyyy') : 'N/A'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{job.recruiterCompany || job.companyName || 'N/A'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button 
                            size="xs" 
                            color="green" 
                            leftSection={actionLoading === (job._id || job.id) ? <Loader size={14} color="white" /> : <IconCheck size={14} />}
                            onClick={() => handleVerifyJob(job._id || job.id, 'Approve')}
                            disabled={actionLoading !== null}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="xs" 
                            color="red" 
                            variant="outline" 
                            leftSection={actionLoading === (job._id || job.id) ? <Loader size={14} /> : <IconX size={14} />}
                            onClick={() => handleVerifyJob(job._id || job.id, 'Reject')}
                            disabled={actionLoading !== null}
                          >
                            Reject
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Card>

        {/* Recent Activity */}
        <Card shadow="sm" padding="lg" withBorder>
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
            <ScrollArea h={300}>
              <Stack gap="sm">
                {recentActivities.map((activity) => (
                  <Paper key={activity.id} p="sm" withBorder radius="sm">
                    <Group gap="sm">
                      <Avatar color={activity.color} radius="xl" size="md">
                        <IconBriefcase size={16} />
                      </Avatar>
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>{activity.title}</Text>
                        <Text size="xs" c="dimmed">{activity.subtitle}</Text>
                      </Box>
                      <Text size="xs" c="dimmed">{activity.time}</Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          )}
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default Alerts;
