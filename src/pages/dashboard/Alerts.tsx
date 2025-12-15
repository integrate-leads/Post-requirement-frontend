import React from 'react';
import { Card, Text, Table, Badge, Button, Group, Stack, Box, Title, ThemeIcon, Paper, SimpleGrid, Avatar } from '@mantine/core';
import { IconCheck, IconX, IconClock, IconCurrencyRupee, IconBriefcase, IconEye, IconRefresh } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { format, formatDistanceToNow } from 'date-fns';

const Alerts: React.FC = () => {
  const { paymentRequests, approvePayment, rejectPayment, jobPostings } = useAppData();
  const pendingRequests = paymentRequests.filter(r => r.status === 'pending');
  const processedRequests = paymentRequests.filter(r => r.status !== 'pending');

  const getRequestDescription = (request: any) => {
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

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Payment Alerts</Title>
        <Text c="dimmed">Approve or reject payment verification requests</Text>
      </Box>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="yellow" variant="light" size="lg">
              <IconClock size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{pendingRequests.length}</Text>
              <Text size="xs" c="dimmed">Pending Requests</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="green" variant="light" size="lg">
              <IconCheck size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{processedRequests.filter(r => r.status === 'approved').length}</Text>
              <Text size="xs" c="dimmed">Approved</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="red" variant="light" size="lg">
              <IconX size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{processedRequests.filter(r => r.status === 'rejected').length}</Text>
              <Text size="xs" c="dimmed">Rejected</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Pending Approvals */}
      <Card shadow="sm" padding="lg" withBorder mb="lg">
        <Group gap="sm" mb="md">
          <ThemeIcon color="yellow" variant="light" size="lg">
            <IconClock size={20} />
          </ThemeIcon>
          <Box>
            <Text fw={600} size="lg">Pending Approvals</Text>
            <Text size="xs" c="dimmed">{pendingRequests.length} requests waiting for review</Text>
          </Box>
        </Group>

        {pendingRequests.length === 0 ? (
          <Paper p="xl" bg="gray.0" radius="md" ta="center">
            <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto">
              <IconCheck size={24} />
            </ThemeIcon>
            <Text c="dimmed" size="sm">All caught up! No pending requests.</Text>
          </Paper>
        ) : (
          <Stack gap="sm">
            {pendingRequests.map((request) => (
              <Paper key={request.id} p="md" withBorder radius="md">
                <Group justify="space-between" wrap="nowrap" gap="md">
                  <Group gap="md" style={{ flex: 1 }}>
                    <Avatar color={getRequestColor(request.type)} radius="xl">
                      {request.userName.charAt(0)}
                    </Avatar>
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb={4}>
                        <Text fw={500}>{request.userName}</Text>
                        <Badge color="yellow" variant="light" size="sm">Pending</Badge>
                      </Group>
                      <Text size="sm" c="dimmed">{request.userEmail}</Text>
                      <Group gap="xs" mt="xs">
                        <Badge 
                          leftSection={getRequestIcon(request.type)} 
                          color={getRequestColor(request.type)} 
                          variant="light" 
                          size="sm"
                        >
                          {request.type.replace('_', ' ')}
                        </Badge>
                        <Text size="sm">{getRequestDescription(request)}</Text>
                      </Group>
                      <Group gap="lg" mt="xs">
                        <Text size="lg" fw={700} c="blue">₹{request.amount.toLocaleString()}</Text>
                        <Text size="xs" c="dimmed">{formatDistanceToNow(new Date(request.createdAt))} ago</Text>
                      </Group>
                    </Box>
                  </Group>
                  <Stack gap="xs">
                    <Button 
                      size="sm" 
                      color="green" 
                      leftSection={<IconCheck size={16} />} 
                      onClick={() => approvePayment(request.id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      color="red" 
                      variant="outline" 
                      leftSection={<IconX size={16} />} 
                      onClick={() => rejectPayment(request.id)}
                    >
                      Reject
                    </Button>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Card>

      {/* Recent Activity */}
      <Card shadow="sm" padding="lg" withBorder>
        <Text fw={600} size="lg" mb="md">Recent Activity</Text>
        
        {processedRequests.length === 0 ? (
          <Paper p="xl" bg="gray.0" radius="md" ta="center">
            <ThemeIcon color="gray" variant="light" size="xl" mb="sm" mx="auto">
              <IconClock size={24} />
            </ThemeIcon>
            <Text c="dimmed" size="sm">No processed requests yet</Text>
          </Paper>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {processedRequests.slice(0, 20).map((request) => (
                  <Table.Tr key={request.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" color="blue" radius="xl">
                          {request.userName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Text fw={500} size="sm">{request.userName}</Text>
                          <Text size="xs" c="dimmed">{request.userEmail}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        leftSection={getRequestIcon(request.type)} 
                        color={getRequestColor(request.type)} 
                        variant="light" 
                        size="sm"
                      >
                        {request.type.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{getRequestDescription(request)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600}>₹{request.amount.toLocaleString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={request.status === 'approved' ? 'green' : 'red'} 
                        variant="light" 
                        size="sm"
                        leftSection={request.status === 'approved' ? <IconCheck size={12} /> : <IconX size={12} />}
                      >
                        {request.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default Alerts;
