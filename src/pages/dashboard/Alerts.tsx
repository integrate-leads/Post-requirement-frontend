import React from 'react';
import { Card, Text, Table, Badge, Button, Group, Stack, Box, Title, ThemeIcon } from '@mantine/core';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { format, formatDistanceToNow } from 'date-fns';

const Alerts: React.FC = () => {
  const { paymentRequests, approvePayment, rejectPayment, jobPostings } = useAppData();
  const pendingRequests = paymentRequests.filter(r => r.status === 'pending');
  const processedRequests = paymentRequests.filter(r => r.status !== 'pending');

  const getRequestDescription = (request: any) => {
    switch (request.type) {
      case 'service': return 'Service subscription';
      case 'job_posting': return `Job Posting: ${jobPostings.find(j => j.id === request.jobId)?.title || 'Unknown'}`;
      case 'renewal': return 'Job Renewal';
      case 'view_more': return 'Additional Application Views';
      default: return 'Payment Request';
    }
  };

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl"><Title order={2}>Payment Alerts</Title><Text c="dimmed">Approve or reject payment verification requests</Text></Box>

      <Card shadow="sm" padding="lg" withBorder mb="lg">
        <Group gap="sm" mb="md"><ThemeIcon color="yellow" variant="light"><IconClock size={20} /></ThemeIcon><Text fw={600} size="lg">Pending Approvals ({pendingRequests.length})</Text></Group>
        {pendingRequests.length === 0 ? <Text c="dimmed" size="sm">No pending requests</Text> : (
          <Stack gap="sm">
            {pendingRequests.map((request) => (
              <Card key={request.id} padding="md" bg="gray.0">
                <Group justify="space-between" wrap="nowrap" gap="md">
                  <Box style={{ flex: 1 }}>
                    <Group gap="sm" mb="xs"><Text fw={500}>{request.userName}</Text><Badge color="yellow" variant="light" size="sm">Pending</Badge></Group>
                    <Text size="sm" c="dimmed">{request.userEmail}</Text>
                    <Text size="sm" mt="xs">{getRequestDescription(request)}</Text>
                    <Group gap="lg" mt="xs"><Text size="sm" fw={600} c="blue">₹{request.amount.toLocaleString()}</Text><Text size="xs" c="dimmed">{formatDistanceToNow(new Date(request.createdAt))} ago</Text></Group>
                  </Box>
                  <Group gap="xs" wrap="nowrap">
                    <Button size="sm" color="green" leftSection={<IconCheck size={16} />} onClick={() => approvePayment(request.id)}>Approve</Button>
                    <Button size="sm" color="red" variant="outline" leftSection={<IconX size={16} />} onClick={() => rejectPayment(request.id)}>Reject</Button>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Card>

      <Card shadow="sm" padding="lg" withBorder>
        <Text fw={600} size="lg" mb="md">Recent Activity</Text>
        {processedRequests.length === 0 ? <Text c="dimmed" size="sm">No processed requests yet</Text> : (
          <Box style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead><Table.Tr><Table.Th>User</Table.Th><Table.Th>Type</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Status</Table.Th><Table.Th>Date</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {processedRequests.slice(0, 20).map((request) => (
                  <Table.Tr key={request.id}>
                    <Table.Td><Text fw={500} size="sm">{request.userName}</Text><Text size="xs" c="dimmed">{request.userEmail}</Text></Table.Td>
                    <Table.Td><Text size="sm">{getRequestDescription(request)}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={500}>₹{request.amount.toLocaleString()}</Text></Table.Td>
                    <Table.Td><Badge color={request.status === 'approved' ? 'green' : 'red'} variant="light" size="sm">{request.status}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}</Text></Table.Td>
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