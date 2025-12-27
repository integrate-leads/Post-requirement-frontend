import React, { useState } from 'react';
import { Card, Text, Table, Badge, Button, Modal, Stack, Group, Box, Title, Avatar, ScrollArea, Paper, Divider, SimpleGrid } from '@mantine/core';
import { IconEye, IconFileInvoice, IconCurrencyRupee } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { format } from 'date-fns';

// Dummy data for invoices
const dummyRecruiters = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@techcorp.com',
    company: 'TechCorp Solutions',
    totalAmount: 45000,
    jobPostings: [
      { id: 'j1', title: 'Senior React Developer', amount: 15000, postedAt: '2024-01-15' },
      { id: 'j2', title: 'Full Stack Engineer', amount: 15000, postedAt: '2024-02-10' },
      { id: 'j3', title: 'DevOps Engineer', amount: 15000, postedAt: '2024-03-05' },
    ],
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@innovate.io',
    company: 'Innovate.io',
    totalAmount: 30000,
    jobPostings: [
      { id: 'j4', title: 'Product Manager', amount: 15000, postedAt: '2024-01-20' },
      { id: 'j5', title: 'UI/UX Designer', amount: 15000, postedAt: '2024-02-25' },
    ],
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael@globaltech.com',
    company: 'GlobalTech Inc',
    totalAmount: 60000,
    jobPostings: [
      { id: 'j6', title: 'Data Scientist', amount: 15000, postedAt: '2024-01-08' },
      { id: 'j7', title: 'ML Engineer', amount: 15000, postedAt: '2024-02-12' },
      { id: 'j8', title: 'Backend Developer', amount: 15000, postedAt: '2024-03-01' },
      { id: 'j9', title: 'QA Engineer', amount: 15000, postedAt: '2024-03-15' },
    ],
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@startupx.com',
    company: 'StartupX',
    totalAmount: 15000,
    jobPostings: [
      { id: 'j10', title: 'Founding Engineer', amount: 15000, postedAt: '2024-03-10' },
    ],
  },
];

const Invoice: React.FC = () => {
  const [viewingRecruiter, setViewingRecruiter] = useState<typeof dummyRecruiters[0] | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const totalRevenue = dummyRecruiters.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalJobs = dummyRecruiters.reduce((sum, r) => sum + r.jobPostings.length, 0);

  const MobileCard = ({ recruiter }: { recruiter: typeof dummyRecruiters[0] }) => (
    <Card shadow="sm" padding="md" withBorder mb="sm">
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <Avatar color="blue" radius="xl" size="md">{recruiter.name.charAt(0)}</Avatar>
          <Box>
            <Text fw={500} size="sm">{recruiter.name}</Text>
            <Text size="xs" c="dimmed">{recruiter.company}</Text>
          </Box>
        </Group>
      </Group>
      <Group justify="space-between" mb="sm">
        <Box>
          <Text size="xs" c="dimmed">Total Jobs</Text>
          <Text fw={600}>{recruiter.jobPostings.length}</Text>
        </Box>
        <Box ta="right">
          <Text size="xs" c="dimmed">Total Amount</Text>
          <Text fw={700} c="blue">₹{recruiter.totalAmount.toLocaleString()}</Text>
        </Box>
      </Group>
      <Button fullWidth variant="light" leftSection={<IconEye size={16} />} onClick={() => setViewingRecruiter(recruiter)}>
        View Details
      </Button>
    </Card>
  );

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Invoices</Title>
        <Text c="dimmed" size="sm">View recruiter payments and job posting invoices</Text>
      </Box>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="blue" radius="xl"><IconFileInvoice size={20} /></Avatar>
            <Box>
              <Text size="xl" fw={700}>{dummyRecruiters.length}</Text>
              <Text size="xs" c="dimmed">Total Recruiters</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="green" radius="xl"><IconCurrencyRupee size={20} /></Avatar>
            <Box>
              <Text size="xl" fw={700}>₹{totalRevenue.toLocaleString()}</Text>
              <Text size="xs" c="dimmed">Total Revenue</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="violet" radius="xl"><IconFileInvoice size={20} /></Avatar>
            <Box>
              <Text size="xl" fw={700}>{totalJobs}</Text>
              <Text size="xs" c="dimmed">Total Job Postings</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {isMobile ? (
        <Stack gap="sm">
          {dummyRecruiters.map(recruiter => <MobileCard key={recruiter.id} recruiter={recruiter} />)}
        </Stack>
      ) : (
        <Card shadow="sm" padding="md" withBorder>
          <ScrollArea>
            <Table striped highlightOnHover miw={700}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Recruiter</Table.Th>
                  <Table.Th>Company</Table.Th>
                  <Table.Th>Job Postings</Table.Th>
                  <Table.Th>Total Amount</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {dummyRecruiters.map(recruiter => (
                  <Table.Tr key={recruiter.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color="blue" radius="xl" size="sm">{recruiter.name.charAt(0)}</Avatar>
                        <Box>
                          <Text fw={500} size="sm">{recruiter.name}</Text>
                          <Text size="xs" c="dimmed">{recruiter.email}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td><Badge variant="light" color="blue">{recruiter.company}</Badge></Table.Td>
                    <Table.Td><Text size="sm">{recruiter.jobPostings.length}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={700} c="blue">₹{recruiter.totalAmount.toLocaleString()}</Text></Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="light" leftSection={<IconEye size={14} />} onClick={() => setViewingRecruiter(recruiter)}>
                        View
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* View Details Modal */}
      <Modal opened={!!viewingRecruiter} onClose={() => setViewingRecruiter(null)} title={<Text fw={600} size="lg">Invoice Details</Text>} size="lg" fullScreen={isMobile}>
        {viewingRecruiter && (
          <Stack gap="lg">
            <Paper p="md" bg="gray.0" radius="md">
              <Group gap="md">
                <Avatar size="xl" color="blue" radius="xl">{viewingRecruiter.name.charAt(0)}</Avatar>
                <Box>
                  <Text size="xl" fw={600}>{viewingRecruiter.name}</Text>
                  <Text size="sm" c="dimmed">{viewingRecruiter.company}</Text>
                  <Text size="sm" c="dimmed">{viewingRecruiter.email}</Text>
                </Box>
              </Group>
            </Paper>

            <Box>
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Job Postings</Text>
                <Badge color="blue" size="lg">Total: ₹{viewingRecruiter.totalAmount.toLocaleString()}</Badge>
              </Group>
              <Divider mb="md" />
              <Stack gap="sm">
                {viewingRecruiter.jobPostings.map(job => (
                  <Paper key={job.id} p="md" withBorder radius="md">
                    <Group justify="space-between">
                      <Box>
                        <Text fw={500}>{job.title}</Text>
                        <Text size="xs" c="dimmed">Posted: {format(new Date(job.postedAt), 'MMM dd, yyyy')}</Text>
                      </Box>
                      <Badge color="green" variant="light" size="lg">₹{job.amount.toLocaleString()}</Badge>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

export default Invoice;
