import React, { useState } from 'react';
import { Card, Text, Badge, Button, Table, Group, Select, Modal, Stack, Box, Title } from '@mantine/core';
import { IconRefresh, IconEye, IconUsers } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData, PRICING } from '@/contexts/AppDataContext';
import { format, formatDistanceToNow } from 'date-fns';
import PaymentModal from '@/components/payment/PaymentModal';

const MyJobs: React.FC = () => {
  const { user } = useAuth();
  const { getJobsByRecruiterId, getApplicationsByJobId, addPaymentRequest } = useAppData();
  const [renewJobId, setRenewJobId] = useState<string | null>(null);
  const [renewDays, setRenewDays] = useState<string>('5');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const jobs = getJobsByRecruiterId(user?.id || '');
  const dayOptions = Object.entries(PRICING).map(([days, price]) => ({ value: days, label: `${days} days - ₹${price}` }));

  const getStatusBadge = (job: { isApproved: boolean; isPaid: boolean; isActive: boolean; expiresAt: Date }) => {
    if (!job.isPaid) return <Badge color="gray" variant="light">Draft</Badge>;
    if (!job.isApproved) return <Badge color="yellow" variant="light">Pending Approval</Badge>;
    if (new Date(job.expiresAt) < new Date()) return <Badge color="red" variant="light">Expired</Badge>;
    if (job.isActive) return <Badge color="green" variant="light">Active</Badge>;
    return <Badge color="gray" variant="light">Inactive</Badge>;
  };

  const handlePaymentSubmit = () => {
    if (user && renewJobId) addPaymentRequest({ userId: user.id, userName: user.name, userEmail: user.email, type: 'renewal', jobId: renewJobId, amount: PRICING[parseInt(renewDays) as keyof typeof PRICING] || 0 });
    setRenewJobId(null); setPaymentModalOpen(false);
  };

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl"><Title order={2}>My Job Postings</Title><Text c="dimmed">Manage your job postings and track applications</Text></Box>

      {jobs.length === 0 ? (
        <Card shadow="sm" padding="xl" withBorder ta="center"><Text c="dimmed" mb="md">You haven't posted any jobs yet.</Text><Button component="a" href="/dashboard/post-job">Post Your First Job</Button></Card>
      ) : (
        <Card shadow="sm" padding="md" withBorder style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Job Title</Table.Th><Table.Th>Status</Table.Th><Table.Th>Applications</Table.Th><Table.Th>Posted</Table.Th><Table.Th>Expires</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {jobs.map((job) => (
                <Table.Tr key={job.id}>
                  <Table.Td><Text fw={500}>{job.title}</Text><Text size="xs" c="dimmed">{job.location}</Text></Table.Td>
                  <Table.Td>{getStatusBadge(job)}</Table.Td>
                  <Table.Td><Group gap="xs"><IconUsers size={16} color="#868e96" /><Text size="sm">{getApplicationsByJobId(job.id).length}</Text></Group></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{formatDistanceToNow(new Date(job.createdAt))} ago</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{format(new Date(job.expiresAt), 'MMM dd, yyyy')}</Text></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="light" leftSection={<IconEye size={14} />} component="a" href={`/dashboard/applications?job=${job.id}`}>View</Button>
                      {job.isApproved && <Button size="xs" variant="outline" leftSection={<IconRefresh size={14} />} onClick={() => setRenewJobId(job.id)}>Renew</Button>}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={!!renewJobId && !paymentModalOpen} onClose={() => setRenewJobId(null)} title={<Text fw={600}>Renew Job Posting</Text>} centered>
        <Stack gap="md">
          <Select label="Select Duration" data={dayOptions} value={renewDays} onChange={(v) => setRenewDays(v || '5')} />
          <Box bg="blue.0" p="md" style={{ borderRadius: 8 }} ta="center"><Text size="sm" c="dimmed">Amount to Pay</Text><Text size="xl" fw={700} c="blue">₹{(PRICING[parseInt(renewDays) as keyof typeof PRICING] || 0).toLocaleString()}</Text></Box>
          <Button fullWidth onClick={() => setPaymentModalOpen(true)}>Proceed to Payment</Button>
        </Stack>
      </Modal>

      <PaymentModal opened={paymentModalOpen} onClose={() => { setPaymentModalOpen(false); setRenewJobId(null); }} amount={PRICING[parseInt(renewDays) as keyof typeof PRICING] || 0} description={`Renew Job Posting (${renewDays} days)`} onPaymentSubmit={handlePaymentSubmit} />
    </Box>
  );
};

export default MyJobs;