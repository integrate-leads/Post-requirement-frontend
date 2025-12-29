import React, { useState, useEffect } from 'react';
import { Card, Text, Table, Badge, Button, Modal, Stack, Group, Select, Box, Title, SimpleGrid, Paper, ThemeIcon, Avatar, Divider, ScrollArea, Loader, TextInput, Pagination } from '@mantine/core';
import { IconEye, IconDownload, IconLock, IconUsers, IconBriefcase, IconMail, IconPhone, IconMapPin, IconCalendar, IconSearch } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import PaymentModal from '@/components/payment/PaymentModal';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import { API_ENDPOINTS, api } from '@/hooks/useApi';

const FREE_VIEW_LIMIT = 15;
const EXTRA_VIEW_PRICE = 299;

interface JobTitle {
  id: number;
  title: string;
}

interface Application {
  id: number;
  jobId: number;
  adminId: number;
  candidateId: number;
  SSN: string;
  visaStatus: string;
  applicationAnswer: Array<{ question: string; answer: boolean | string }>;
  workRefDetails: Array<{ name: string; title: string; email: string; phone: string }>;
  EmployerDetails: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactNumber: string;
  };
  documents: Record<string, string>;
  deleted: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  candidate: {
    id: number;
    fullName: string;
    email: string;
    contactNumber: string;
    currentLocation: string;
  };
}

interface ApplicationsResponse {
  success: boolean;
  data: {
    applications: Application[];
    stats: {
      totalApplications: number;
      thisWeekApplications: number;
    };
    pagination: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

interface JobTitlesResponse {
  success: boolean;
  data: {
    jobs: JobTitle[];
    pagination: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

const Applications: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // State
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(searchParams.get('job'));
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ totalApplications: 0, thisWeekApplications: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // View state
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewedCount, setViewedCount] = useState(0);

  const canViewMore = viewedCount < FREE_VIEW_LIMIT;

  // Fetch job titles
  useEffect(() => {
    const fetchJobTitles = async () => {
      setJobsLoading(true);
      try {
        const response = await api.get<JobTitlesResponse>(
          API_ENDPOINTS.ADMIN.JOB_TITLES(1, 20, jobSearch || undefined)
        );
        if (response.data?.success) {
          setJobTitles(response.data.data.jobs);
        }
      } catch (error) {
        console.error('Failed to fetch job titles:', error);
      } finally {
        setJobsLoading(false);
      }
    };
    
    const debounce = setTimeout(fetchJobTitles, 300);
    return () => clearTimeout(debounce);
  }, [jobSearch]);

  // Fetch applications when job is selected
  useEffect(() => {
    if (!selectedJobId) {
      setApplications([]);
      setStats({ totalApplications: 0, thisWeekApplications: 0 });
      return;
    }
    
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await api.get<ApplicationsResponse>(
          API_ENDPOINTS.ADMIN.JOB_APPLICATIONS(parseInt(selectedJobId), page, 10)
        );
        if (response.data?.success) {
          setApplications(response.data.data.applications);
          setStats(response.data.data.stats);
          setTotalPages(response.data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [selectedJobId, page]);

  // Update selected job from URL
  useEffect(() => {
    const jobId = searchParams.get('job');
    if (jobId) {
      setSelectedJobId(jobId);
    }
  }, [searchParams]);

  const handleViewApplication = (app: Application, index: number) => {
    if (index >= FREE_VIEW_LIMIT && viewedCount >= FREE_VIEW_LIMIT) { 
      setPaymentModalOpen(true); 
      return; 
    }
    setViewingApplication(app);
    if (index >= viewedCount) setViewedCount(prev => Math.min(prev + 1, FREE_VIEW_LIMIT));
  };

  const handlePaymentSubmit = () => { 
    setPaymentModalOpen(false); 
  };

  const jobOptions = jobTitles.map(job => ({ 
    value: job.id.toString(), 
    label: job.title 
  }));

  // Mobile Application Card
  const MobileApplicationCard = ({ app, index }: { app: Application; index: number }) => {
    const isLocked = index >= FREE_VIEW_LIMIT && viewedCount >= FREE_VIEW_LIMIT;
    return (
      <Card shadow="sm" padding="md" withBorder mb="sm">
        <Group justify="space-between" mb="sm">
          <Group gap="sm">
            <Avatar size="sm" color="blue" radius="xl">
              {index + 1}
            </Avatar>
            <Box>
              <Text fw={500} size="sm">{isLocked ? '••••••••' : app.candidate.fullName}</Text>
              <Text size="xs" c="dimmed">{isLocked ? '••••@••••.com' : app.candidate.email}</Text>
            </Box>
          </Group>
          <Badge size="xs" variant="light" color={app.status === 'Applied' ? 'blue' : 'gray'}>
            {app.status}
          </Badge>
        </Group>
        
        <Group justify="space-between" mb="sm">
          <Text size="xs" c="dimmed">{isLocked ? '••••••••••' : app.candidate.contactNumber}</Text>
          <Badge size="xs" variant="light" color="gray">
            {formatDistanceToNow(new Date(app.createdAt))} ago
          </Badge>
        </Group>
        
        <Button 
          size="xs" 
          variant="light" 
          leftSection={isLocked ? <IconLock size={14} /> : <IconEye size={14} />} 
          onClick={() => handleViewApplication(app, index)}
          fullWidth
        >
          {isLocked ? 'Unlock' : 'View Details'}
        </Button>
      </Card>
    );
  };

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Applications</Title>
        <Text c="dimmed" size="sm">View and manage candidate applications</Text>
      </Box>

      {/* Job Selection */}
      <Card shadow="sm" padding={isMobile ? 'md' : 'lg'} withBorder mb="lg">
        <Stack gap="md">
          <Select 
            label="Select Job Posting" 
            placeholder="Search and select a job..." 
            data={jobOptions} 
            value={selectedJobId} 
            onChange={(v) => { setSelectedJobId(v); setPage(1); }}
            searchable
            searchValue={jobSearch}
            onSearchChange={setJobSearch}
            nothingFoundMessage={jobsLoading ? 'Loading...' : 'No jobs found'}
            comboboxProps={{ withinPortal: true, zIndex: 1000 }}
          />
        </Stack>
      </Card>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="blue" variant="light" size="lg">
              <IconUsers size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{stats.totalApplications}</Text>
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
              <Text size="xl" fw={700}>{stats.thisWeekApplications}</Text>
              <Text size="xs" c="dimmed">This Week</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {selectedJobId ? (
        <>
          {/* Free View Limit Banner */}
          {applications.length > FREE_VIEW_LIMIT && (
            <Card shadow="sm" padding="md" mb="md" bg="blue.0">
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Box>
                  <Text size="sm" fw={500}>Free limit: {FREE_VIEW_LIMIT} applications</Text>
                  <Text size="xs" c="dimmed">View {applications.length - FREE_VIEW_LIMIT} more for ₹{EXTRA_VIEW_PRICE}</Text>
                </Box>
                <Badge color="blue" size="md">{Math.min(viewedCount, FREE_VIEW_LIMIT)} / {FREE_VIEW_LIMIT} free</Badge>
              </Group>
            </Card>
          )}

          {loading ? (
            <Card shadow="sm" padding="xl" withBorder ta="center">
              <Loader />
            </Card>
          ) : applications.length === 0 ? (
            <Card shadow="sm" padding="xl" withBorder ta="center">
              <ThemeIcon color="gray" variant="light" size="xl" mb="md" mx="auto">
                <IconUsers size={32} />
              </ThemeIcon>
              <Text c="dimmed">No applications received yet for this job.</Text>
            </Card>
          ) : isMobile ? (
            <Stack gap={0}>
              {applications.map((app, index) => (
                <MobileApplicationCard key={app.id} app={app} index={index} />
              ))}
            </Stack>
          ) : (
            <Card shadow="sm" padding="md" withBorder>
              <ScrollArea>
                <Table striped highlightOnHover miw={600}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Candidate</Table.Th>
                      <Table.Th>Contact</Table.Th>
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Status</Table.Th>
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
                              <Text fw={500}>{isLocked ? '••••••••' : app.candidate.fullName}</Text>
                              <Text size="xs" c="dimmed">{isLocked ? '••••@••••.com' : app.candidate.email}</Text>
                            </Box>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">{isLocked ? '••••••••••' : app.candidate.contactNumber}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">{isLocked ? '••••••' : app.candidate.currentLocation}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="sm" variant="light" color={app.status === 'Applied' ? 'blue' : 'gray'}>
                              {app.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Text size="sm" c="dimmed">{format(new Date(app.createdAt), 'MMM dd, yyyy')}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Button 
                              size="xs" 
                              variant="light" 
                              leftSection={isLocked ? <IconLock size={14} /> : <IconEye size={14} />} 
                              onClick={() => handleViewApplication(app, index)}
                            >
                              {isLocked ? 'Unlock' : 'View'}
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Group justify="center" mt="lg">
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          )}
        </>
      ) : (
        <Card shadow="sm" padding="xl" withBorder ta="center">
          <ThemeIcon color="gray" variant="light" size="xl" mb="md" mx="auto">
            <IconBriefcase size={32} />
          </ThemeIcon>
          <Text c="dimmed" mb="sm">Select a job posting to view applications</Text>
        </Card>
      )}

      {/* Application Details Modal */}
      <Modal 
        opened={!!viewingApplication} 
        onClose={() => setViewingApplication(null)} 
        title={<Text fw={600} size="lg">Application Details</Text>} 
        size="lg"
        fullScreen={isMobile}
      >
        {viewingApplication && (
          <Stack gap="md">
            {/* Candidate Header */}
            <Paper p="md" bg="gray.0" radius="md">
              <Group gap="md" wrap="wrap">
                <Avatar size="xl" color="blue" radius="xl">
                  {viewingApplication.candidate.fullName.charAt(0)}
                </Avatar>
                <Box style={{ flex: 1, minWidth: 200 }}>
                  <Text size="xl" fw={600}>{viewingApplication.candidate.fullName}</Text>
                  <Group gap="md" mt={4} wrap="wrap">
                    <Group gap={4}>
                      <IconMail size={14} color="#868e96" />
                      <Text size="sm" c="dimmed">{viewingApplication.candidate.email}</Text>
                    </Group>
                    <Group gap={4}>
                      <IconPhone size={14} color="#868e96" />
                      <Text size="sm" c="dimmed">{viewingApplication.candidate.contactNumber}</Text>
                    </Group>
                  </Group>
                </Box>
              </Group>
            </Paper>

            {/* Quick Info */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Location</Text>
                <Text fw={500}>{viewingApplication.candidate.currentLocation}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Visa Status</Text>
                <Text fw={500}>{viewingApplication.visaStatus}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">SSN (Last 4)</Text>
                <Text fw={500}>{viewingApplication.SSN}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Applied On</Text>
                <Text fw={500}>{format(new Date(viewingApplication.createdAt), 'MMMM dd, yyyy')}</Text>
              </Box>
            </SimpleGrid>

            <Divider />

            {/* Application Answers */}
            {viewingApplication.applicationAnswer && viewingApplication.applicationAnswer.length > 0 && (
              <Box>
                <Text fw={600} mb="md">Application Responses</Text>
                <Stack gap="sm">
                  {viewingApplication.applicationAnswer.map((qa, idx) => (
                    <Paper key={idx} p="sm" withBorder radius="sm">
                      <Text size="xs" c="dimmed" mb={4}>{qa.question}</Text>
                      <Text size="sm" fw={500}>{String(qa.answer)}</Text>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Work References */}
            {viewingApplication.workRefDetails && viewingApplication.workRefDetails.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Text fw={600} mb="md">Work References</Text>
                  <Stack gap="sm">
                    {viewingApplication.workRefDetails.map((ref, idx) => (
                      <Paper key={idx} p="sm" withBorder radius="sm">
                        <Text fw={500}>{ref.name} - {ref.title}</Text>
                        <Text size="sm" c="dimmed">{ref.email} | {ref.phone}</Text>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </>
            )}

            {/* Employer Details */}
            {viewingApplication.EmployerDetails && viewingApplication.EmployerDetails.companyName && (
              <>
                <Divider />
                <Box>
                  <Text fw={600} mb="md">Employer Details</Text>
                  <Paper p="sm" withBorder radius="sm">
                    <Text fw={500}>{viewingApplication.EmployerDetails.companyName}</Text>
                    <Text size="sm">{viewingApplication.EmployerDetails.contactName}</Text>
                    <Text size="sm" c="dimmed">
                      {viewingApplication.EmployerDetails.contactEmail} | {viewingApplication.EmployerDetails.contactNumber}
                    </Text>
                  </Paper>
                </Box>
              </>
            )}

            {/* Documents */}
            {viewingApplication.documents && Object.keys(viewingApplication.documents).length > 0 && (
              <>
                <Divider />
                <Box>
                  <Text fw={600} mb="md">Documents</Text>
                  <Group gap="sm">
                    {Object.entries(viewingApplication.documents).map(([name, url]) => (
                      <Button 
                        key={name}
                        variant="outline" 
                        leftSection={<IconDownload size={16} />} 
                        component="a" 
                        href={url} 
                        target="_blank"
                        size="sm"
                      >
                        {name}
                      </Button>
                    ))}
                  </Group>
                </Box>
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