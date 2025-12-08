import React from 'react';
import { Card, Text, Table, Badge, Button, Group, Stack } from '@mantine/core';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { format, formatDistanceToNow } from 'date-fns';

const Alerts: React.FC = () => {
  const { paymentRequests, approvePayment, rejectPayment, jobPostings } = useAppData();

  const pendingRequests = paymentRequests.filter(r => r.status === 'pending');
  const processedRequests = paymentRequests.filter(r => r.status !== 'pending');

  const getRequestDescription = (request: any) => {
    switch (request.type) {
      case 'service':
        return `Service subscription`;
      case 'job_posting':
        const job = jobPostings.find(j => j.id === request.jobId);
        return `Job Posting: ${job?.title || 'Unknown'}`;
      case 'renewal':
        return 'Job Renewal';
      case 'view_more':
        return 'Additional Application Views';
      default:
        return 'Payment Request';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Text size="2xl" fw={700} className="text-foreground">Payment Alerts</Text>
        <Text c="dimmed">Approve or reject payment verification requests</Text>
      </div>

      {/* Pending Requests */}
      <Card shadow="sm" padding="lg" className="bg-card border border-border mb-6">
        <Group gap="sm" mb="md">
          <IconClock size={20} className="text-warning" />
          <Text fw={600} size="lg" className="text-foreground">
            Pending Approvals ({pendingRequests.length})
          </Text>
        </Group>

        {pendingRequests.length === 0 ? (
          <Text c="dimmed" size="sm">No pending requests</Text>
        ) : (
          <Stack gap="sm">
            {pendingRequests.map((request) => (
              <Card key={request.id} padding="md" className="bg-secondary border border-border">
                <Group justify="space-between" wrap="nowrap">
                  <div className="flex-1">
                    <Group gap="sm" mb="xs">
                      <Text fw={500} className="text-foreground">{request.userName}</Text>
                      <Badge color="yellow" variant="light" size="sm">Pending</Badge>
                    </Group>
                    <Text size="sm" c="dimmed">{request.userEmail}</Text>
                    <Text size="sm" className="text-foreground" mt="xs">
                      {getRequestDescription(request)}
                    </Text>
                    <Group gap="lg" mt="xs">
                      <Text size="sm" fw={600} className="text-primary">
                        ₹{request.amount.toLocaleString()}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDistanceToNow(new Date(request.createdAt))} ago
                      </Text>
                    </Group>
                  </div>
                  <Group gap="xs">
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
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Card>

      {/* Processed Requests */}
      <Card shadow="sm" padding="lg" className="bg-card border border-border">
        <Text fw={600} size="lg" mb="md" className="text-foreground">
          Recent Activity
        </Text>

        {processedRequests.length === 0 ? (
          <Text c="dimmed" size="sm">No processed requests yet</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="text-foreground">User</Table.Th>
                <Table.Th className="text-foreground">Type</Table.Th>
                <Table.Th className="text-foreground">Amount</Table.Th>
                <Table.Th className="text-foreground">Status</Table.Th>
                <Table.Th className="text-foreground">Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {processedRequests.slice(0, 20).map((request) => (
                <Table.Tr key={request.id}>
                  <Table.Td>
                    <Text fw={500} size="sm" className="text-foreground">{request.userName}</Text>
                    <Text size="xs" c="dimmed">{request.userEmail}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{getRequestDescription(request)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>₹{request.amount.toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={request.status === 'approved' ? 'green' : 'red'} 
                      variant="light"
                      size="sm"
                    >
                      {request.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Alerts;
