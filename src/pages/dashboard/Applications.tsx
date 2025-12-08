import React, { useState } from 'react';
import { Card, Text, Table, Badge, Button, Modal, Stack, Group, Select, Box, Title, SimpleGrid } from '@mantine/core';
import { IconEye, IconDownload, IconLock } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { format } from 'date-fns';
import PaymentModal from '@/components/payment/PaymentModal';

const FREE_VIEW_LIMIT = 15;
const EXTRA_VIEW_PRICE = 299;

const Applications: React.FC = () => {
  const { user } = useAuth();
  const { getJobsByRecruiterId, getApplicationsByJobId, jobPostings, addPaymentRequest } = useAppData();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [viewingApplication, setViewingApplication] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewedCount, setViewedCount] = useState(0);

  const myJobs = getJobsByRecruiterId(user?.id || '');
  const jobOptions = myJobs.map(job => ({ value: job.id, label: `${job.title} (${getApplicationsByJobId(job.id).length} applications)` }));
  const applications = selectedJobId ? getApplicationsByJobId(selectedJobId) : [];
  const canViewMore = viewedCount < FREE_VIEW_LIMIT;

  const handleViewApplication = (app: any, index: number) => {
    if (index >= FREE_VIEW_LIMIT && viewedCount >= FREE_VIEW_LIMIT) { setPaymentModalOpen(true); return; }
    setViewingApplication(app);
    if (index >= viewedCount) setViewedCount(prev => Math.min(prev + 1, FREE_VIEW_LIMIT));
  };

  const handlePaymentSubmit = () => { if (user) addPaymentRequest({ userId: user.id, userName: user.name, userEmail: user.email, type: 'view_more', amount: EXTRA_VIEW_PRICE }); setPaymentModalOpen(false); };

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl"><Title order={2}>Applications</Title><Text c="dimmed">View and manage candidate applications</Text></Box>

      <Card shadow="sm" padding="lg" withBorder mb="lg">
        <Select label="Select Job Posting" placeholder="Choose a job to view applications" data={jobOptions} value={selectedJobId} onChange={setSelectedJobId} />
      </Card>

      {selectedJobId && (
        <>
          {applications.length > FREE_VIEW_LIMIT && (
            <Card shadow="sm" padding="md" mb="md" bg="blue.0"><Group justify="space-between"><Box><Text size="sm" fw={500}>Free limit: {FREE_VIEW_LIMIT} applications</Text><Text size="xs" c="dimmed">View {applications.length - FREE_VIEW_LIMIT} more for ₹{EXTRA_VIEW_PRICE}</Text></Box><Badge color="blue" size="lg">{Math.min(viewedCount, FREE_VIEW_LIMIT)} / {FREE_VIEW_LIMIT} free views used</Badge></Group></Card>
          )}

          {applications.length === 0 ? (
            <Card shadow="sm" padding="xl" withBorder ta="center"><Text c="dimmed">No applications received yet.</Text></Card>
          ) : (
            <Card shadow="sm" padding="md" withBorder style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover>
                <Table.Thead><Table.Tr><Table.Th>#</Table.Th><Table.Th>Name</Table.Th><Table.Th>Email</Table.Th><Table.Th>Phone</Table.Th><Table.Th>Applied On</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {applications.map((app, index) => {
                    const isLocked = index >= FREE_VIEW_LIMIT && viewedCount >= FREE_VIEW_LIMIT;
                    return (
                      <Table.Tr key={app.id}>
                        <Table.Td>{index + 1}</Table.Td>
                        <Table.Td><Text fw={500}>{isLocked ? '••••••••' : app.applicantName}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{isLocked ? '••••@••••.com' : app.applicantEmail}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{isLocked ? '••••••••••' : app.applicantPhone}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{format(new Date(app.submittedAt), 'MMM dd, yyyy')}</Text></Table.Td>
                        <Table.Td><Button size="xs" variant="light" leftSection={isLocked ? <IconLock size={14} /> : <IconEye size={14} />} onClick={() => handleViewApplication(app, index)}>{isLocked ? 'Unlock' : 'View'}</Button></Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Card>
          )}
        </>
      )}

      <Modal opened={!!viewingApplication} onClose={() => setViewingApplication(null)} title={<Text fw={600}>Application Details</Text>} size="lg">
        {viewingApplication && (
          <Stack gap="md">
            <SimpleGrid cols={2}><Box><Text size="sm" c="dimmed">Name</Text><Text fw={500}>{viewingApplication.applicantName}</Text></Box><Box><Text size="sm" c="dimmed">Email</Text><Text fw={500}>{viewingApplication.applicantEmail}</Text></Box><Box><Text size="sm" c="dimmed">Phone</Text><Text fw={500}>{viewingApplication.applicantPhone}</Text></Box><Box><Text size="sm" c="dimmed">Applied On</Text><Text fw={500}>{format(new Date(viewingApplication.submittedAt), 'MMM dd, yyyy HH:mm')}</Text></Box></SimpleGrid>
            <Box pt="md" style={{ borderTop: '1px solid #e9ecef' }}><Text fw={600} mb="md">Responses</Text><Stack gap="sm">{Object.entries(viewingApplication.answers).map(([q, a]) => <Box key={q}><Text size="sm" c="dimmed">{q}</Text><Text>{String(a)}</Text></Box>)}</Stack></Box>
            {viewingApplication.resumeUrl && <Button variant="outline" leftSection={<IconDownload size={16} />} component="a" href={viewingApplication.resumeUrl} target="_blank">Download Resume</Button>}
          </Stack>
        )}
      </Modal>

      <PaymentModal opened={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} amount={EXTRA_VIEW_PRICE} description="Unlock additional application views" onPaymentSubmit={handlePaymentSubmit} />
    </Box>
  );
};

export default Applications;