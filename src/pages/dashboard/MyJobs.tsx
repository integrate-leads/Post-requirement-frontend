import React, { useState } from 'react';
import { Card, Text, Badge, Button, Table, Group, Select, Modal, Stack, Box, Title, Paper, ThemeIcon, SimpleGrid, Avatar } from '@mantine/core';
import { IconRefresh, IconEye, IconUsers, IconBriefcase, IconCalendar, IconMapPin, IconPlus } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData, PRICING } from '@/contexts/AppDataContext';
import { format, formatDistanceToNow } from 'date-fns';
import PaymentModal from '@/components/payment/PaymentModal';
import { useNavigate } from 'react-router-dom';

const MyJobs: React.FC = () => {
  const { user } = useAuth();
  const { getJobsByRecruiterId, getApplicationsByJobId, addPaymentRequest, jobPostings } = useAppData();
  const [renewJobId, setRenewJobId] = useState<string | null>(null);
  const [renewDays, setRenewDays] = useState<string>('5');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState<any>(null);
  const navigate = useNavigate();

  // For demo, show jobs from first recruiter if current user has no jobs
  const userJobs = getJobsByRecruiterId(user?.id || '');
  const jobs = userJobs.length > 0 ? userJobs : jobPostings.filter(j => j.recruiterId === '1');
  
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

  // Stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.isActive && j.isApproved && new Date(j.expiresAt) > new Date()).length;
  const totalApplications = jobs.reduce((sum, job) => sum + getApplicationsByJobId(job.id).length, 0);

  return (
    <Box maw={1200} mx="auto">
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={2}>My Job Postings</Title>
          <Text c="dimmed">Manage your job postings and track applications</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/dashboard/post-job')}>
          Post New Job
        </Button>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="blue" variant="light" size="lg">
              <IconBriefcase size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{totalJobs}</Text>
              <Text size="xs" c="dimmed">Total Jobs</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="green" variant="light" size="lg">
              <IconCalendar size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{activeJobs}</Text>
              <Text size="xs" c="dimmed">Active Jobs</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="orange" variant="light" size="lg">
              <IconUsers size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{totalApplications}</Text>
              <Text size="xs" c="dimmed">Total Applications</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {jobs.length === 0 ? (
        <Card shadow="sm" padding="xl" withBorder ta="center">
          <ThemeIcon color="gray" variant="light" size="xl" mb="md" mx="auto">
            <IconBriefcase size={32} />
          </ThemeIcon>
          <Text c="dimmed" mb="md">You haven't posted any jobs yet.</Text>
          <Button onClick={() => navigate('/dashboard/post-job')}>Post Your First Job</Button>
        </Card>
      ) : (
        <Card shadow="sm" padding="md" withBorder style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Job Details</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Applications</Table.Th>
                <Table.Th>Posted</Table.Th>
                <Table.Th>Expires</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {jobs.map((job) => (
                <Table.Tr key={job.id}>
                  <Table.Td>
                    <Box>
                      <Text fw={500}>{job.title}</Text>
                      <Group gap="xs" mt={4}>
                        <Badge size="xs" variant="light">{job.workLocationCountry}</Badge>
                        <Text size="xs" c="dimmed">{job.workLocation}</Text>
                      </Group>
                    </Box>
                  </Table.Td>
                  <Table.Td>{getStatusBadge(job)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Avatar size="sm" color="blue" radius="xl">
                        <IconUsers size={14} />
                      </Avatar>
                      <Text size="sm" fw={500}>{getApplicationsByJobId(job.id).length}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{formatDistanceToNow(new Date(job.createdAt))} ago</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{format(new Date(job.expiresAt), 'MMM dd, yyyy')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button 
                        size="xs" 
                        variant="light" 
                        leftSection={<IconEye size={14} />} 
                        onClick={() => setViewingJob(job)}
                      >
                        View
                      </Button>
                      <Button 
                        size="xs" 
                        variant="outline" 
                        leftSection={<IconUsers size={14} />} 
                        onClick={() => navigate(`/dashboard/applications?job=${job.id}`)}
                      >
                        Applications
                      </Button>
                      {job.isApproved && (
                        <Button 
                          size="xs" 
                          variant="outline" 
                          color="violet"
                          leftSection={<IconRefresh size={14} />} 
                          onClick={() => setRenewJobId(job.id)}
                        >
                          Renew
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* View Job Modal */}
      <Modal 
        opened={!!viewingJob} 
        onClose={() => setViewingJob(null)} 
        title={<Text fw={600} size="lg">Job Details</Text>}
        size="lg"
      >
        {viewingJob && (
          <Stack gap="md">
            <Paper p="md" bg="gray.0" radius="md">
              <Group justify="space-between">
                <Box>
                  <Text size="xl" fw={600}>{viewingJob.title}</Text>
                  <Group gap="xs" mt={4}>
                    <Badge>{viewingJob.workLocationCountry}</Badge>
                    <Text size="sm" c="dimmed">{viewingJob.workLocation}</Text>
                  </Group>
                </Box>
                {getStatusBadge(viewingJob)}
              </Group>
            </Paper>

            <SimpleGrid cols={2} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Job Type</Text>
                <Text fw={500}>{viewingJob.jobType}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Pay Rate</Text>
                <Text fw={500}>{viewingJob.payRate}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Payment Type</Text>
                <Text fw={500}>{viewingJob.paymentType}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Applications</Text>
                <Text fw={500}>{getApplicationsByJobId(viewingJob.id).length}</Text>
              </Box>
            </SimpleGrid>

            <Box>
              <Text size="xs" c="dimmed" mb={4}>Primary Skills</Text>
              <Group gap="xs">
                {viewingJob.primarySkills.split(',').map((skill: string) => (
                  <Badge key={skill.trim()} variant="light" size="sm">{skill.trim()}</Badge>
                ))}
              </Group>
            </Box>

            <Box>
              <Text size="xs" c="dimmed" mb={4}>Description</Text>
              <Text size="sm">{viewingJob.description}</Text>
            </Box>

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => setViewingJob(null)}>Close</Button>
              <Button onClick={() => { setViewingJob(null); navigate(`/dashboard/applications?job=${viewingJob.id}`); }}>
                View Applications
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Renew Modal */}
      <Modal opened={!!renewJobId && !paymentModalOpen} onClose={() => setRenewJobId(null)} title={<Text fw={600}>Renew Job Posting</Text>} centered>
        <Stack gap="md">
          <Select label="Select Duration" data={dayOptions} value={renewDays} onChange={(v) => setRenewDays(v || '5')} />
          <Box bg="blue.0" p="md" style={{ borderRadius: 8 }} ta="center">
            <Text size="sm" c="dimmed">Amount to Pay</Text>
            <Text size="xl" fw={700} c="blue">₹{(PRICING[parseInt(renewDays) as keyof typeof PRICING] || 0).toLocaleString()}</Text>
          </Box>
          <Button fullWidth onClick={() => setPaymentModalOpen(true)}>Proceed to Payment</Button>
        </Stack>
      </Modal>

      <PaymentModal 
        opened={paymentModalOpen} 
        onClose={() => { setPaymentModalOpen(false); setRenewJobId(null); }} 
        amount={PRICING[parseInt(renewDays) as keyof typeof PRICING] || 0} 
        description={`Renew Job Posting (${renewDays} days)`} 
        onPaymentSubmit={handlePaymentSubmit} 
      />
    </Box>
  );
};

export default MyJobs;
