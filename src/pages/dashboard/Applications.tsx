import React, { useState, useEffect } from 'react';
import { Card, Text, Table, Badge, Button, Modal, Stack, Group, Select, Box, Title, SimpleGrid, Paper, ThemeIcon, Avatar, Divider, Tabs } from '@mantine/core';
import { IconEye, IconDownload, IconLock, IconUsers, IconBriefcase, IconMail, IconPhone, IconMapPin, IconCalendar } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { format, formatDistanceToNow } from 'date-fns';
import PaymentModal from '@/components/payment/PaymentModal';
import { useSearchParams } from 'react-router-dom';

const FREE_VIEW_LIMIT = 15;
const EXTRA_VIEW_PRICE = 299;

const Applications: React.FC = () => {
  const { user } = useAuth();
  const { getJobsByRecruiterId, getApplicationsByJobId, jobPostings, addPaymentRequest, applications: allApplications } = useAppData();
  const [searchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(searchParams.get('job'));
  const [viewingApplication, setViewingApplication] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewedCount, setViewedCount] = useState(0);

  // For demo, show jobs from first recruiter if current user has no jobs
  const userJobs = getJobsByRecruiterId(user?.id || '');
  const myJobs = userJobs.length > 0 ? userJobs : jobPostings.filter(j => j.recruiterId === '1');
  
  const jobOptions = myJobs.map(job => ({ 
    value: job.id, 
    label: `${job.title} (${getApplicationsByJobId(job.id).length} applications)` 
  }));
  
  const applications = selectedJobId ? getApplicationsByJobId(selectedJobId) : [];
  const selectedJob = selectedJobId ? jobPostings.find(j => j.id === selectedJobId) : null;
  const canViewMore = viewedCount < FREE_VIEW_LIMIT;

  // Stats
  const totalApplications = myJobs.reduce((sum, job) => sum + getApplicationsByJobId(job.id).length, 0);
  const recentApplications = myJobs.reduce((sum, job) => {
    const apps = getApplicationsByJobId(job.id);
    const recent = apps.filter(a => new Date(a.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    return sum + recent.length;
  }, 0);

  const handleViewApplication = (app: any, index: number) => {
    if (index >= FREE_VIEW_LIMIT && viewedCount >= FREE_VIEW_LIMIT) { 
      setPaymentModalOpen(true); 
      return; 
    }
    setViewingApplication(app);
    if (index >= viewedCount) setViewedCount(prev => Math.min(prev + 1, FREE_VIEW_LIMIT));
  };

  const handlePaymentSubmit = () => { 
    if (user) addPaymentRequest({ userId: user.id, userName: user.name, userEmail: user.email, type: 'view_more', amount: EXTRA_VIEW_PRICE }); 
    setPaymentModalOpen(false); 
  };

  useEffect(() => {
    const jobId = searchParams.get('job');
    if (jobId) {
      setSelectedJobId(jobId);
    }
  }, [searchParams]);

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Applications</Title>
        <Text c="dimmed">View and manage candidate applications</Text>
      </Box>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="blue" variant="light" size="lg">
              <IconUsers size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{totalApplications}</Text>
              <Text size="xs" c="dimmed">Total Applications</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="green" variant="light" size="lg">
              <IconCalendar size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{recentApplications}</Text>
              <Text size="xs" c="dimmed">This Week</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="orange" variant="light" size="lg">
              <IconBriefcase size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{myJobs.length}</Text>
              <Text size="xs" c="dimmed">Active Jobs</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Job Selection Card */}
      <Card shadow="sm" padding="lg" withBorder mb="lg">
        <Group justify="space-between" align="flex-end">
          <Select 
            label="Select Job Posting" 
            placeholder="Choose a job to view applications" 
            data={jobOptions} 
            value={selectedJobId} 
            onChange={setSelectedJobId}
            style={{ flex: 1, maxWidth: 400 }}
          />
          {selectedJob && (
            <Badge size="lg" variant="light" color="blue">
              {applications.length} Applications
            </Badge>
          )}
        </Group>
      </Card>

      {selectedJobId ? (
        <>
          {/* Selected Job Info */}
          {selectedJob && (
            <Paper p="md" mb="lg" withBorder radius="md" bg="gray.0">
              <Group justify="space-between">
                <Box>
                  <Text fw={600} size="lg">{selectedJob.title}</Text>
                  <Group gap="xs" mt={4}>
                    <Badge size="sm" variant="light">{selectedJob.workLocationCountry}</Badge>
                    <Text size="sm" c="dimmed">{selectedJob.workLocation}</Text>
                    <Text size="sm" c="dimmed">•</Text>
                    <Text size="sm" c="dimmed">{selectedJob.jobType}</Text>
                  </Group>
                </Box>
                <Group>
                  <Badge color={selectedJob.isActive ? 'green' : 'gray'} variant="light">
                    {selectedJob.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Group>
              </Group>
            </Paper>
          )}

          {/* Free View Limit Banner */}
          {applications.length > FREE_VIEW_LIMIT && (
            <Card shadow="sm" padding="md" mb="md" bg="blue.0">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500}>Free limit: {FREE_VIEW_LIMIT} applications</Text>
                  <Text size="xs" c="dimmed">View {applications.length - FREE_VIEW_LIMIT} more for ₹{EXTRA_VIEW_PRICE}</Text>
                </Box>
                <Badge color="blue" size="lg">{Math.min(viewedCount, FREE_VIEW_LIMIT)} / {FREE_VIEW_LIMIT} free views used</Badge>
              </Group>
            </Card>
          )}

          {applications.length === 0 ? (
            <Card shadow="sm" padding="xl" withBorder ta="center">
              <ThemeIcon color="gray" variant="light" size="xl" mb="md" mx="auto">
                <IconUsers size={32} />
              </ThemeIcon>
              <Text c="dimmed">No applications received yet for this job.</Text>
            </Card>
          ) : (
            <Card shadow="sm" padding="md" withBorder style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Candidate</Table.Th>
                    <Table.Th>Contact</Table.Th>
                    <Table.Th>Applied</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {applications.map((app, index) => {
                    const isLocked = index >= FREE_VIEW_LIMIT && viewedCount >= FREE_VIEW_LIMIT;
                    return (
                      <Table.Tr key={app.id}>
                        <Table.Td>
                          <Avatar size="sm" color="blue" radius="xl">
                            {index + 1}
                          </Avatar>
                        </Table.Td>
                        <Table.Td>
                          <Box>
                            <Text fw={500}>{isLocked ? '••••••••' : app.applicantName}</Text>
                            <Text size="xs" c="dimmed">{isLocked ? '••••@••••.com' : app.applicantEmail}</Text>
                          </Box>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">{isLocked ? '••••••••••' : app.applicantPhone}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Text size="sm" c="dimmed">{format(new Date(app.submittedAt), 'MMM dd, yyyy')}</Text>
                            <Badge size="xs" variant="light" color="gray">
                              {formatDistanceToNow(new Date(app.submittedAt))} ago
                            </Badge>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Button 
                            size="xs" 
                            variant="light" 
                            leftSection={isLocked ? <IconLock size={14} /> : <IconEye size={14} />} 
                            onClick={() => handleViewApplication(app, index)}
                          >
                            {isLocked ? 'Unlock' : 'View Details'}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Card>
          )}
        </>
      ) : (
        <Card shadow="sm" padding="xl" withBorder ta="center">
          <ThemeIcon color="gray" variant="light" size="xl" mb="md" mx="auto">
            <IconBriefcase size={32} />
          </ThemeIcon>
          <Text c="dimmed" mb="sm">Select a job posting to view applications</Text>
          <Text size="xs" c="dimmed">You have {myJobs.length} job postings with {totalApplications} total applications</Text>
        </Card>
      )}

      {/* Application Details Modal */}
      <Modal 
        opened={!!viewingApplication} 
        onClose={() => setViewingApplication(null)} 
        title={<Text fw={600} size="lg">Application Details</Text>} 
        size="lg"
      >
        {viewingApplication && (
          <Stack gap="md">
            {/* Candidate Header */}
            <Paper p="md" bg="gray.0" radius="md">
              <Group gap="md">
                <Avatar size="xl" color="blue" radius="xl">
                  {viewingApplication.applicantName.charAt(0)}
                </Avatar>
                <Box style={{ flex: 1 }}>
                  <Text size="xl" fw={600}>{viewingApplication.applicantName}</Text>
                  <Group gap="md" mt={4}>
                    <Group gap={4}>
                      <IconMail size={14} color="#868e96" />
                      <Text size="sm" c="dimmed">{viewingApplication.applicantEmail}</Text>
                    </Group>
                    <Group gap={4}>
                      <IconPhone size={14} color="#868e96" />
                      <Text size="sm" c="dimmed">{viewingApplication.applicantPhone}</Text>
                    </Group>
                  </Group>
                </Box>
              </Group>
            </Paper>

            {/* Quick Info */}
            <SimpleGrid cols={2} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Applied On</Text>
                <Text fw={500}>{format(new Date(viewingApplication.submittedAt), 'MMMM dd, yyyy')}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Application ID</Text>
                <Text fw={500}>{viewingApplication.id}</Text>
              </Box>
            </SimpleGrid>

            <Divider />

            {/* Responses */}
            <Box>
              <Text fw={600} mb="md">Candidate Responses</Text>
              <Stack gap="sm">
                {Object.entries(viewingApplication.answers).map(([question, answer]) => (
                  <Paper key={question} p="sm" withBorder radius="sm">
                    <Text size="xs" c="dimmed" mb={4}>{question}</Text>
                    <Text size="sm" fw={500}>{String(answer)}</Text>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* Resume Download */}
            {viewingApplication.resumeUrl && (
              <>
                <Divider />
                <Button 
                  variant="outline" 
                  leftSection={<IconDownload size={16} />} 
                  component="a" 
                  href={viewingApplication.resumeUrl} 
                  target="_blank"
                  fullWidth
                >
                  Download Resume
                </Button>
              </>
            )}
          </Stack>
        )}
      </Modal>

      <PaymentModal 
        opened={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        amount={EXTRA_VIEW_PRICE} 
        description="Unlock additional application views" 
        onPaymentSubmit={handlePaymentSubmit} 
      />
    </Box>
  );
};

export default Applications;
