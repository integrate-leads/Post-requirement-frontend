import React, { useState, useEffect } from 'react';
import { Card, Text, Badge, Button, Table, Group, Select, Modal, Stack, Box, Title, Paper, ThemeIcon, SimpleGrid, Avatar, ScrollArea, TextInput, Pagination, Loader } from '@mantine/core';
import { IconRefresh, IconEye, IconUsers, IconBriefcase, IconCalendar, IconMapPin, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import FormattedText from '@/components/FormattedText';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import PaymentModal from '@/components/payment/PaymentModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { API_ENDPOINTS, api } from '@/hooks/useApi';

interface BillingPlan {
  id: number;
  amount: string;
  timePeriod: string;
}

interface JobPost {
  id: number;
  title: string;
  description: string;
  adminId: number;
  country: string;
  clientName: string;
  role: string;
  workLocations: Array<{ state: string; city: string[] }>;
  workType: string;
  jobType: string[];
  payRate: string;
  projectStartDate: string;
  projectEndDate: string;
  primarySkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string;
  applicationQuestions: Array<{ question: string; type: string }>;
  requiredDocuments: string[];
  paymentStatus: string;
  planAmount: string;
  isVerified: string;
  status: string;
  applicationCount: string;
  admin: {
    id: number;
    name: string;
    email: string;
    companyName: string;
  };
}

interface JobCountsResponse {
  success: boolean;
  data: {
    totalJobs: number;
    activeJobs: number;
    applications: number;
  };
}

interface JobPostsResponse {
  success: boolean;
  data: {
    jobs: JobPost[];
    pagination: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

const MyJobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Determine base route
  const baseRoute = location.pathname.includes('/recruiter/') ? '/recruiter' : '/dashboard';

  // State
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [counts, setCounts] = useState({ totalJobs: 0, activeJobs: 0, applications: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Renew state
  const [renewJobId, setRenewJobId] = useState<number | null>(null);
  const [renewJob, setRenewJob] = useState<JobPost | null>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  
  // View job state
  const [viewingJob, setViewingJob] = useState<JobPost | null>(null);
  
  // Delete state
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  // Fetch counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await api.get<JobCountsResponse>(API_ENDPOINTS.ADMIN.JOB_POST_COUNT);
        if (response.data?.success) {
          setCounts(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch job counts:', error);
      }
    };
    fetchCounts();
  }, []);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await api.get<JobPostsResponse>(
          API_ENDPOINTS.ADMIN.JOB_POSTS(page, 10, search || undefined, statusFilter || undefined)
        );
        if (response.data?.success) {
          setJobs(response.data.data.jobs);
          setTotalPages(response.data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(fetchJobs, 300);
    return () => clearTimeout(debounce);
  }, [page, search, statusFilter]);

  // Handle renew click
  const handleRenewClick = async (job: JobPost) => {
    setRenewJob(job);
    setRenewJobId(job.id);
    
    try {
      const response = await api.get<{ success: boolean; data: { plans: BillingPlan[] } }>(
        API_ENDPOINTS.ADMIN.BILLING_PLANS
      );
      if (response.data?.success) {
        setBillingPlans(response.data.data.plans);
        if (response.data.data.plans.length > 0) {
          setSelectedPlanId(response.data.data.plans[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to fetch billing plans:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load billing plans',
        color: 'red',
      });
    }
  };

  // Handle payment submit
  const handlePaymentSubmit = async () => {
    if (!renewJobId || !selectedPlanId) return;
    
    setRenewLoading(true);
    const selectedPlan = billingPlans.find(p => p.id.toString() === selectedPlanId);
    
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        API_ENDPOINTS.ADMIN.RENEW_JOB(renewJobId),
        { planAmount: selectedPlan?.amount }
      );
      
      if (response.data?.success) {
        notifications.show({
          title: 'Success',
          message: 'Job renewed successfully!',
          color: 'green',
        });
        
        // Refresh jobs
        const jobsResponse = await api.get<JobPostsResponse>(
          API_ENDPOINTS.ADMIN.JOB_POSTS(page, 10, search || undefined, statusFilter || undefined)
        );
        if (jobsResponse.data?.success) {
          setJobs(jobsResponse.data.data.jobs);
        }
        
        // Refresh counts
        const countsResponse = await api.get<JobCountsResponse>(API_ENDPOINTS.ADMIN.JOB_POST_COUNT);
        if (countsResponse.data?.success) {
          setCounts(countsResponse.data.data);
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: 'Error',
        message: axiosError.response?.data?.message || 'Failed to renew job',
        color: 'red',
      });
    } finally {
      setRenewLoading(false);
      setPaymentModalOpen(false);
      setRenewJobId(null);
      setRenewJob(null);
    }
  };

  // Handle delete job
  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    setDeletingJobId(jobId);
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.ADMIN.CREATE_JOB}/${jobId}`
      );
      
      if (response.data?.success) {
        notifications.show({
          title: 'Success',
          message: 'Job post deleted successfully',
          color: 'green',
        });
        
        // Refresh jobs list
        const jobsResponse = await api.get<JobPostsResponse>(
          API_ENDPOINTS.ADMIN.JOB_POSTS(page, 10, search || undefined, statusFilter || undefined)
        );
        if (jobsResponse.data?.success) {
          setJobs(jobsResponse.data.data.jobs);
          setTotalPages(jobsResponse.data.data.pagination.totalPages);
        }
        
        // Refresh counts
        const countsResponse = await api.get<JobCountsResponse>(API_ENDPOINTS.ADMIN.JOB_POST_COUNT);
        if (countsResponse.data?.success) {
          setCounts(countsResponse.data.data);
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: 'Error',
        message: axiosError.response?.data?.message || 'Failed to delete job',
        color: 'red',
      });
    } finally {
      setDeletingJobId(null);
    }
  };

  const getStatusBadge = (job: JobPost) => {
    if (job.status === 'Active') return <Badge color="green" variant="light" size="sm">Active</Badge>;
    if (job.status === 'Expired') return <Badge color="red" variant="light" size="sm">Expired</Badge>;
    if (job.isVerified === 'Pending') return <Badge color="yellow" variant="light" size="sm">Pending Verification</Badge>;
    if (job.paymentStatus === 'Pending') return <Badge color="gray" variant="light" size="sm">Payment Pending</Badge>;
    return <Badge color="gray" variant="light" size="sm">{job.status}</Badge>;
  };

  const selectedPlan = billingPlans.find(p => p.id.toString() === selectedPlanId);

  // Mobile Job Card
  const MobileJobCard = ({ job }: { job: JobPost }) => (
    <Card shadow="sm" padding="md" withBorder mb="sm">
      <Group justify="space-between" mb="xs">
        <Box style={{ flex: 1 }}>
          <Text fw={500} size="sm" lineClamp={1}>{job.title}</Text>
          <Group gap="xs" mt={4}>
            <Badge size="xs" variant="light">{job.country}</Badge>
            <Text size="xs" c="dimmed">{job.workLocations?.[0]?.state}</Text>
          </Group>
        </Box>
        {getStatusBadge(job)}
      </Group>
      
      <SimpleGrid cols={3} spacing="xs" mb="sm">
        <Paper p="xs" bg="gray.0" radius="sm" ta="center">
          <Text size="sm" fw={600}>{job.applicationCount}</Text>
          <Text size="xs" c="dimmed">Apps</Text>
        </Paper>
        <Paper p="xs" bg="gray.0" radius="sm" ta="center">
          <Text size="xs" c="dimmed">Pay</Text>
          <Text size="xs" fw={500} lineClamp={1}>${job.planAmount}</Text>
        </Paper>
        <Paper p="xs" bg="gray.0" radius="sm" ta="center">
          <Text size="xs" c="dimmed">Type</Text>
          <Text size="xs" fw={500}>{job.workType}</Text>
        </Paper>
      </SimpleGrid>
      
      <Group gap="xs">
        <Button 
          size="xs" 
          variant="light" 
          leftSection={<IconEye size={14} />} 
          onClick={() => setViewingJob(job)}
          style={{ flex: 1 }}
        >
          View
        </Button>
        <Button 
          size="xs" 
          variant="outline" 
          leftSection={<IconUsers size={14} />} 
          onClick={() => navigate(`${baseRoute}/applications?job=${job.id}`)}
          style={{ flex: 1 }}
        >
          Apps
        </Button>
        <Button 
          size="xs" 
          variant="outline" 
          color="violet"
          leftSection={<IconRefresh size={14} />} 
          onClick={() => handleRenewClick(job)}
        >
          Renew
        </Button>
        <Button 
          size="xs" 
          variant="outline" 
          color="red"
          leftSection={<IconTrash size={14} />} 
          onClick={() => handleDeleteJob(job.id)}
          loading={deletingJobId === job.id}
        >
          Delete
        </Button>
      </Group>
    </Card>
  );

  return (
    <Box maw={1200} mx="auto">
      <Group justify="space-between" mb="xl" wrap="wrap" gap="md">
        <Box>
          <Title order={2}>My Job Postings</Title>
          <Text c="dimmed" size="sm">Manage your job postings and track applications</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate(`${baseRoute}/post-job`)} size={isMobile ? 'sm' : 'md'}>
          Post New Job
        </Button>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <ThemeIcon color="blue" variant="light" size="lg">
              <IconBriefcase size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>{counts.totalJobs}</Text>
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
              <Text size="xl" fw={700}>{counts.activeJobs}</Text>
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
              <Text size="xl" fw={700}>{counts.applications}</Text>
              <Text size="xs" c="dimmed">Applications</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Search and Filter */}
      <Card shadow="sm" padding="md" withBorder mb="lg">
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Search jobs..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: 'Active', label: 'Active' },
              { value: 'Expired', label: 'Expired' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            clearable
            w={150}
            comboboxProps={{ withinPortal: true, zIndex: 1000 }}
          />
        </Group>
      </Card>

      {loading ? (
        <Card shadow="sm" padding="xl" withBorder ta="center">
          <Loader />
        </Card>
      ) : jobs.length === 0 ? (
        <Card shadow="sm" padding="xl" withBorder ta="center">
          <ThemeIcon color="gray" variant="light" size="xl" mb="md" mx="auto">
            <IconBriefcase size={32} />
          </ThemeIcon>
          <Text c="dimmed" mb="md">No jobs found.</Text>
          <Button onClick={() => navigate(`${baseRoute}/post-job`)}>Post Your First Job</Button>
        </Card>
      ) : isMobile ? (
        <Stack gap={0}>
          {jobs.map((job) => (
            <MobileJobCard key={job.id} job={job} />
          ))}
        </Stack>
      ) : (
        <Card shadow="sm" padding="md" withBorder>
          <ScrollArea>
            <Table striped highlightOnHover miw={800}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Job Details</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Applications</Table.Th>
                  <Table.Th>Work Type</Table.Th>
                  <Table.Th>Pay Rate</Table.Th>
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
                          <Badge size="xs" variant="light">{job.country}</Badge>
                          <Text size="xs" c="dimmed">{job.workLocations?.[0]?.state}</Text>
                        </Group>
                      </Box>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(job)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Avatar size="sm" color="blue" radius="xl">
                          <IconUsers size={14} />
                        </Avatar>
                        <Text size="sm" fw={500}>{job.applicationCount}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{job.workType}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{job.payRate}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
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
                          onClick={() => navigate(`${baseRoute}/applications?job=${job.id}`)}
                        >
                          Applications
                        </Button>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          color="violet"
                          leftSection={<IconRefresh size={14} />} 
                          onClick={() => handleRenewClick(job)}
                        >
                          Renew
                        </Button>
                        <Button 
                          size="xs" 
                          variant="light" 
                          color="red"
                          onClick={() => handleDeleteJob(job.id)}
                          loading={deletingJobId === job.id}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
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

      {/* View Job Modal */}
      <Modal 
        opened={!!viewingJob} 
        onClose={() => setViewingJob(null)} 
        title={<Text fw={600} size="lg">Job Details</Text>}
        size="lg"
        fullScreen={isMobile}
      >
        {viewingJob && (
          <Stack gap="md">
            <Paper p="md" bg="gray.0" radius="md">
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Box>
                  <Text size="xl" fw={600}>{viewingJob.title}</Text>
                  <Group gap="xs" mt={4} wrap="wrap">
                    <Badge>{viewingJob.country}</Badge>
                    <Text size="sm" c="dimmed">{viewingJob.workLocations?.[0]?.state}</Text>
                  </Group>
                </Box>
                {getStatusBadge(viewingJob)}
              </Group>
            </Paper>

            <SimpleGrid cols={{ base: 2 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Job Type</Text>
                <Text fw={500}>{viewingJob.jobType?.join(', ')}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Pay Rate</Text>
                <Text fw={500}>{viewingJob.payRate}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Work Type</Text>
                <Text fw={500}>{viewingJob.workType}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Applications</Text>
                <Text fw={500}>{viewingJob.applicationCount}</Text>
              </Box>
            </SimpleGrid>

            <Box>
              <Text size="xs" c="dimmed" mb={4}>Primary Skills</Text>
              <Group gap="xs" wrap="wrap">
                {viewingJob.primarySkills?.map((skill: string) => (
                  <Badge key={skill} variant="light" size="sm">{skill}</Badge>
                ))}
              </Group>
            </Box>

            <Box>
              <Text size="xs" c="dimmed" mb={4}>Description</Text>
              <FormattedText text={viewingJob.description} className="text-sm" />
            </Box>

            <Group justify="flex-end" mt="md" wrap="wrap" gap="sm">
              <Button variant="outline" onClick={() => setViewingJob(null)}>Close</Button>
              <Button onClick={() => { setViewingJob(null); navigate(`${baseRoute}/applications?job=${viewingJob.id}`); }}>
                View Applications
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Renew Modal */}
      <Modal 
        opened={!!renewJobId && !paymentModalOpen} 
        onClose={() => { setRenewJobId(null); setRenewJob(null); }} 
        title={<Text fw={600}>Renew Job Posting</Text>} 
        centered
        fullScreen={isMobile}
      >
        <Stack gap="md">
          {renewJob && (
            <Paper p="md" bg="gray.0" radius="md">
              <Text fw={500}>{renewJob.title}</Text>
              <Text size="sm" c="dimmed">{renewJob.country} - {renewJob.workLocations?.[0]?.state}</Text>
            </Paper>
          )}
          
          <Select 
            label="Select Duration" 
            data={billingPlans.map(plan => ({
              value: plan.id.toString(),
              label: `${plan.timePeriod} - $${plan.amount}`
            }))} 
            value={selectedPlanId} 
            onChange={setSelectedPlanId} 
            comboboxProps={{ withinPortal: true, zIndex: 1000 }}
          />
          <Box bg="blue.0" p="md" style={{ borderRadius: 8 }} ta="center">
            <Text size="sm" c="dimmed">Amount to Pay</Text>
            <Text size="xl" fw={700} c="blue">${selectedPlan?.amount || 0}</Text>
          </Box>
          <Button fullWidth onClick={() => setPaymentModalOpen(true)}>Proceed to Payment</Button>
        </Stack>
      </Modal>

      <PaymentModal 
        opened={paymentModalOpen} 
        onClose={() => { setPaymentModalOpen(false); setRenewJobId(null); setRenewJob(null); }} 
        amount={parseInt(selectedPlan?.amount || '0')} 
        description={`Renew Job Posting (${selectedPlan?.timePeriod || ''})`} 
        onPaymentSubmit={handlePaymentSubmit}
        isSubmitting={renewLoading}
      />
    </Box>
  );
};

export default MyJobs;