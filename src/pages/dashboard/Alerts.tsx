import React, { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Button, Group, Stack, Box, Title, ThemeIcon, Paper, SimpleGrid, Avatar, ScrollArea, Skeleton } from '@mantine/core';
import { IconCheck, IconX, IconClock, IconCurrencyRupee, IconBriefcase, IconEye, IconRefresh } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { format, formatDistanceToNow } from 'date-fns';
import { useMediaQuery } from '@mantine/hooks';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AlertCounts {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface RecentJob {
  id: string;
  _id?: string;
  title: string;
  recruiterCompany?: string;
  companyName?: string;
  status?: string;
  createdAt?: string;
}

const Alerts: React.FC = () => {
  const { paymentRequests, approvePayment, rejectPayment, jobPostings } = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [alertCounts, setAlertCounts] = useState<AlertCounts | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  
  const pendingRequests = paymentRequests.filter(r => r.status === 'pending');
  const processedRequests = paymentRequests.filter(r => r.status !== 'pending');
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
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

      // Fetch recent jobs
      try {
        const jobsResponse = await api.get<{ success: boolean; data: RecentJob[] }>(
          API_ENDPOINTS.SUPER_ADMIN.LIST_JOBS
        );
        if (jobsResponse.data?.success) {
          setRecentJobs(jobsResponse.data.data?.slice(0, 10) || []);
        }
      } catch (error) {
        console.error('Failed to fetch recent jobs:', error);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchData();
  }, [isSuperAdmin]);

  const handleViewRecruiter = () => {
    navigate('/dashboard/recruiters');
  };

  const getRequestDescription = (request: { type: string; jobId?: string }) => {
    switch (request.type) {
      case 'service': return 'Service Subscription';
      case 'job_posting': return `Job Posting: ${jobPostings.find(j => j.id === request.jobId)?.title || 'New Job'}`;
      case 'renewal': return `Job Renewal: ${jobPostings.find(j => j.id === request.jobId)?.title || 'Job'}`;
      case 'view_more': return 'Additional Application Views';
      default: return 'Payment Request';
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'job_posting': return <IconBriefcase size={16} />;
      case 'renewal': return <IconRefresh size={16} />;
      case 'view_more': return <IconEye size={16} />;
      default: return <IconCurrencyRupee size={16} />;
    }
  };

  const getRequestColor = (type: string) => {
    switch (type) {
      case 'job_posting': return 'blue';
      case 'renewal': return 'violet';
      case 'view_more': return 'cyan';
      default: return 'gray';
    }
  };

  // Mobile Pending Request Card
  const MobilePendingCard = ({ request }: { request: { id: string; userName: string; userEmail: string; type: string; amount: number; createdAt: Date } }) => (
    <Card shadow="sm" padding="md" withBorder mb="sm">
      <Group gap="sm" mb="sm">
        <Avatar color={getRequestColor(request.type)} radius="xl" size="md">
          {request.userName.charAt(0)}
        </Avatar>
        <Box style={{ flex: 1 }}>
          <Text fw={500} size="sm">{request.userName}</Text>
          <Text size="xs" c="dimmed">{request.userEmail}</Text>
        </Box>
        <Badge color="yellow" variant="light" size="sm">Pending</Badge>
      </Group>
      
      <Group gap="xs" mb="sm" wrap="wrap">
        <Badge leftSection={getRequestIcon(request.type)} color={getRequestColor(request.type)} variant="light" size="sm">
          {request.type.replace('_', ' ')}
        </Badge>
      </Group>
      
      <Text size="sm" c="dimmed" mb="sm">{getRequestDescription(request)}</Text>
      
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={700} c="blue">₹{request.amount.toLocaleString()}</Text>
        <Text size="xs" c="dimmed">{formatDistanceToNow(new Date(request.createdAt))} ago</Text>
      </Group>
      
      <Group gap="xs">
        <Button size="xs" color="green" leftSection={<IconCheck size={14} />} onClick={() => approvePayment(request.id)} style={{ flex: 1 }}>Approve</Button>
        <Button size="xs" color="red" variant="outline" leftSection={<IconX size={14} />} onClick={() => rejectPayment(request.id)} style={{ flex: 1 }}>Reject</Button>
      </Group>
    </Card>
  );

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Payment Alerts</Title>
        <Text c="dimmed" size="sm">Approve or reject payment verification requests</Text>
      </Box>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="yellow" variant="light" size="lg"><IconClock size={20} /></ThemeIcon>
            <Box>
              {loading ? <Skeleton height={28} width={40} /> : <Text size="xl" fw={700}>{alertCounts?.pendingCount ?? pendingRequests.length}</Text>}
              <Text size="xs" c="dimmed">Pending</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="green" variant="light" size="lg"><IconCheck size={20} /></ThemeIcon>
            <Box>
              {loading ? <Skeleton height={28} width={40} /> : <Text size="xl" fw={700}>{alertCounts?.approvedCount ?? processedRequests.filter(r => r.status === 'approved').length}</Text>}
              <Text size="xs" c="dimmed">Approved</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="red" variant="light" size="lg"><IconX size={20} /></ThemeIcon>
            <Box>
              {loading ? <Skeleton height={28} width={40} /> : <Text size="xl" fw={700}>{alertCounts?.rejectedCount ?? processedRequests.filter(r => r.status === 'rejected').length}</Text>}
              <Text size="xs" c="dimmed">Rejected</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Pending Approvals */}
      <Card shadow="sm" padding="lg" withBorder mb="lg">
        <Group gap="sm" mb="md">
          <ThemeIcon color="yellow" variant="light" size="lg"><IconClock size={20} /></ThemeIcon>
          <Box>
            <Text fw={600} size="lg">Pending Approvals</Text>
            <Text size="xs" c="dimmed">{pendingRequests.length} requests waiting</Text>
          </Box>
        </Group>

        {pendingRequests.length === 0 ? (
          <Paper p="xl" bg="gray.0" radius="md" ta="center">
            <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto"><IconCheck size={24} /></ThemeIcon>
            <Text c="dimmed" size="sm">All caught up! No pending requests.</Text>
          </Paper>
        ) : isMobile ? (
          <Stack gap={0}>{pendingRequests.map((request) => <MobilePendingCard key={request.id} request={request} />)}</Stack>
        ) : (
          <Stack gap="sm">
            {pendingRequests.map((request) => (
              <Paper key={request.id} p="md" withBorder radius="md">
                <Group justify="space-between" wrap="nowrap" gap="md">
                  <Group gap="md" style={{ flex: 1 }}>
                    <Avatar color={getRequestColor(request.type)} radius="xl">{request.userName.charAt(0)}</Avatar>
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb={4}>
                        <Text fw={500}>{request.userName}</Text>
                        <Badge color="yellow" variant="light" size="sm">Pending</Badge>
                      </Group>
                      <Text size="sm" c="dimmed">{request.userEmail}</Text>
                      <Group gap="xs" mt="xs">
                        <Badge leftSection={getRequestIcon(request.type)} color={getRequestColor(request.type)} variant="light" size="sm">{request.type.replace('_', ' ')}</Badge>
                        <Text size="sm">{getRequestDescription(request)}</Text>
                      </Group>
                      <Group gap="lg" mt="xs">
                        <Text size="lg" fw={700} c="blue">₹{request.amount.toLocaleString()}</Text>
                        <Text size="xs" c="dimmed">{formatDistanceToNow(new Date(request.createdAt))} ago</Text>
                      </Group>
                    </Box>
                  </Group>
                  <Stack gap="xs">
                    <Button size="sm" color="green" leftSection={<IconCheck size={16} />} onClick={() => approvePayment(request.id)}>Approve</Button>
                    <Button size="sm" color="red" variant="outline" leftSection={<IconX size={16} />} onClick={() => rejectPayment(request.id)}>Reject</Button>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Card>

      {/* Recent Activity - Jobs List */}
      <Card shadow="sm" padding="lg" withBorder>
        <Text fw={600} size="lg" mb="md">Recent Activity</Text>
        {jobsLoading ? (
          <Stack gap="sm">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} height={50} />
            ))}
          </Stack>
        ) : recentJobs.length === 0 ? (
          <Paper p="xl" bg="gray.0" radius="md" ta="center">
            <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto"><IconClock size={24} /></ThemeIcon>
            <Text c="dimmed" size="sm">No recent activity</Text>
          </Paper>
        ) : (
          <ScrollArea>
            <Table striped highlightOnHover miw={700}>
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
                {recentJobs.map((job) => (
                  <Table.Tr key={job._id || job.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">{job.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{job.recruiterCompany || job.companyName || 'N/A'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={job.status === 'approved' ? 'green' : job.status === 'pending' ? 'yellow' : 'gray'} 
                        variant="light" 
                        size="sm"
                      >
                        {job.status || 'Draft'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {job.createdAt ? format(new Date(job.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Button 
                        size="xs" 
                        variant="light" 
                        leftSection={<IconEye size={14} />}
                        onClick={handleViewRecruiter}
                      >
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
    </Box>
  );
};

export default Alerts;
