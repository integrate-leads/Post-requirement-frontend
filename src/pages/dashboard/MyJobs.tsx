import React, { useState } from 'react';
import { Card, Text, Badge, Button, Table, Group, Select, Modal, Stack } from '@mantine/core';
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

  const dayOptions = Object.entries(PRICING).map(([days, price]) => ({
    value: days,
    label: `${days} days - ₹${price}`,
  }));

  const handleRenew = (jobId: string) => {
    setRenewJobId(jobId);
  };

  const handleRenewConfirm = () => {
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (user && renewJobId) {
      addPaymentRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'renewal',
        jobId: renewJobId,
        amount: PRICING[parseInt(renewDays) as keyof typeof PRICING] || 0,
      });
    }
    setRenewJobId(null);
    setPaymentModalOpen(false);
  };

  const getStatusBadge = (job: { isApproved: boolean; isPaid: boolean; isActive: boolean; expiresAt: Date }) => {
    if (!job.isPaid) return <Badge color="gray" variant="light">Draft</Badge>;
    if (!job.isApproved) return <Badge color="yellow" variant="light">Pending Approval</Badge>;
    if (new Date(job.expiresAt) < new Date()) return <Badge color="red" variant="light">Expired</Badge>;
    if (job.isActive) return <Badge color="green" variant="light">Active</Badge>;
    return <Badge color="gray" variant="light">Inactive</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Text size="2xl" fw={700} className="text-foreground">My Job Postings</Text>
        <Text c="dimmed">Manage your job postings and track applications</Text>
      </div>

      {jobs.length === 0 ? (
        <Card shadow="sm" padding="xl" className="bg-card border border-border text-center">
          <Text c="dimmed" mb="md">You haven't posted any jobs yet.</Text>
          <Button
            component="a"
            href="/dashboard/post-job"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Post Your First Job
          </Button>
        </Card>
      ) : (
        <Card shadow="sm" padding="md" className="bg-card border border-border overflow-x-auto">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="text-foreground">Job Title</Table.Th>
                <Table.Th className="text-foreground">Status</Table.Th>
                <Table.Th className="text-foreground">Applications</Table.Th>
                <Table.Th className="text-foreground">Posted</Table.Th>
                <Table.Th className="text-foreground">Expires</Table.Th>
                <Table.Th className="text-foreground">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {jobs.map((job) => {
                const applicationCount = getApplicationsByJobId(job.id).length;
                return (
                  <Table.Tr key={job.id}>
                    <Table.Td>
                      <Text fw={500} className="text-foreground">{job.title}</Text>
                      <Text size="xs" c="dimmed">{job.location}</Text>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(job)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconUsers size={16} className="text-muted-foreground" />
                        <Text size="sm">{applicationCount}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatDistanceToNow(new Date(job.createdAt))} ago
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {format(new Date(job.expiresAt), 'MMM dd, yyyy')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconEye size={14} />}
                          component="a"
                          href={`/dashboard/applications?job=${job.id}`}
                          className="bg-accent text-accent-foreground"
                        >
                          View
                        </Button>
                        {job.isApproved && (
                          <Button
                            size="xs"
                            variant="outline"
                            leftSection={<IconRefresh size={14} />}
                            onClick={() => handleRenew(job.id)}
                            className="border-primary text-primary"
                          >
                            Renew
                          </Button>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Renew Modal */}
      <Modal
        opened={!!renewJobId && !paymentModalOpen}
        onClose={() => setRenewJobId(null)}
        title={<Text fw={600}>Renew Job Posting</Text>}
        centered
      >
        <Stack gap="md">
          <Select
            label="Select Duration"
            data={dayOptions}
            value={renewDays}
            onChange={(value) => setRenewDays(value || '5')}
            classNames={{
              input: 'bg-background border-input focus:border-primary',
              label: 'text-foreground'
            }}
          />

          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <Text size="sm" c="dimmed">Amount to Pay</Text>
            <Text size="xl" fw={700} className="text-primary">
              ₹{(PRICING[parseInt(renewDays) as keyof typeof PRICING] || 0).toLocaleString()}
            </Text>
          </div>

          <Button
            fullWidth
            onClick={handleRenewConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Proceed to Payment
          </Button>
        </Stack>
      </Modal>

      <PaymentModal
        opened={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setRenewJobId(null);
        }}
        amount={PRICING[parseInt(renewDays) as keyof typeof PRICING] || 0}
        description={`Renew Job Posting (${renewDays} days)`}
        onPaymentSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default MyJobs;
