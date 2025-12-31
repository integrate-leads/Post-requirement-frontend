import React, { useState, useEffect } from 'react';
import { Card, Text, Table, Badge, Modal, Stack, Group, Box, Title, Avatar, ScrollArea, Paper, Divider, SimpleGrid, TextInput, Loader, Center, Pagination, Button } from '@mantine/core';
import { IconEye, IconFileInvoice, IconCurrencyRupee, IconSearch, IconBriefcase } from '@tabler/icons-react';
import { useMediaQuery, useDebouncedValue } from '@mantine/hooks';
import { format } from 'date-fns';
import { apiRequest } from '@/hooks/useApi';

interface Recruiter {
  id: number;
  name: string;
  email: string;
  companyName: string;
  'job postings': string;
  'total amount': string;
}

interface JobPosting {
  id: number;
  title: string;
  totalPayment: string;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    email: string;
    companyName: string;
  };
}

interface CountsData {
  totalRecruiters: number;
  totalRevenue: number;
  totalJobPostings: number;
}

interface RecruiterListResponse {
  success: boolean;
  message: string;
  data: {
    recruiters: Recruiter[];
    pagination: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

interface RecruiterDetailResponse {
  success: boolean;
  message: string;
  data: {
    jobPostings: JobPosting[];
    totalAmount: number;
    pagination: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

const Invoice: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Counts state
  const [counts, setCounts] = useState<CountsData>({ totalRecruiters: 0, totalRevenue: 0, totalJobPostings: 0 });
  const [countsLoading, setCountsLoading] = useState(true);
  
  // List state
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal state
  const [viewingRecruiter, setViewingRecruiter] = useState<Recruiter | null>(null);
  const [recruiterDetails, setRecruiterDetails] = useState<JobPosting[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTotalAmount, setDetailsTotalAmount] = useState(0);
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsTotalPages, setDetailsTotalPages] = useState(1);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Fetch counts
  useEffect(() => {
    const fetchCounts = async () => {
      setCountsLoading(true);
      try {
        const response = await apiRequest<{ success: boolean; data: CountsData }>('/super-admin/invoice/counts', {
          method: 'GET',
        });
        if (response.data?.success) {
          setCounts(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setCountsLoading(false);
      }
    };
    fetchCounts();
  }, []);

  // Fetch recruiters list
  useEffect(() => {
    const fetchRecruiters = async () => {
      setListLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          limit: 10,
        };
        if (debouncedSearch) params.search = debouncedSearch;

        const response = await apiRequest<RecruiterListResponse>('/super-admin/invoice/list/admins', {
          method: 'GET',
          params,
        });
        if (response.data?.success) {
          setRecruiters(response.data.data.recruiters);
          setTotalPages(response.data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Error fetching recruiters:', error);
      } finally {
        setListLoading(false);
      }
    };
    fetchRecruiters();
  }, [currentPage, debouncedSearch]);

  // Fetch recruiter details when modal opens
  useEffect(() => {
    if (!viewingRecruiter) {
      setRecruiterDetails([]);
      setDetailsPage(1);
      setDetailsTotalPages(1);
      return;
    }

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const response = await apiRequest<RecruiterDetailResponse>(`/super-admin/invoice/admin/${viewingRecruiter.id}`, {
          method: 'GET',
          params: { page: detailsPage, limit: 10 },
        });
        if (response.data?.success) {
          setRecruiterDetails(response.data.data.jobPostings);
          setDetailsTotalAmount(response.data.data.totalAmount);
          setDetailsTotalPages(response.data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Error fetching recruiter details:', error);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [viewingRecruiter, detailsPage]);

  const handleViewInvoice = (recruiter: Recruiter) => {
    setDetailsPage(1);
    setViewingRecruiter(recruiter);
  };

  const MobileCard = ({ recruiter }: { recruiter: Recruiter }) => (
    <Card shadow="sm" padding="md" withBorder mb="sm">
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <Avatar color="blue" radius="xl" size="md">{recruiter.name.charAt(0)}</Avatar>
          <Box>
            <Text fw={500} size="sm">{recruiter.name}</Text>
            <Text size="xs" c="dimmed">{recruiter.companyName}</Text>
          </Box>
        </Group>
      </Group>
      <Text size="xs" c="dimmed" mb="xs">{recruiter.email}</Text>
      <Group justify="space-between" mb="sm">
        <Box>
          <Text size="xs" c="dimmed">Total Jobs</Text>
          <Text fw={600}>{recruiter['job postings']}</Text>
        </Box>
        <Box ta="right">
          <Text size="xs" c="dimmed">Total Amount</Text>
          <Text fw={700} c="green">₹{parseFloat(recruiter['total amount']).toLocaleString()}</Text>
        </Box>
      </Group>
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => handleViewInvoice(recruiter)}
      >
        <IconEye size={16} className="mr-2" /> View Details
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
              {countsLoading ? (
                <Loader size="sm" />
              ) : (
                <Text size="xl" fw={700}>{counts.totalRecruiters}</Text>
              )}
              <Text size="xs" c="dimmed">Total Recruiters</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="green" radius="xl"><IconCurrencyRupee size={20} /></Avatar>
            <Box>
              {countsLoading ? (
                <Loader size="sm" />
              ) : (
                <Text size="xl" fw={700}>₹{counts.totalRevenue.toLocaleString()}</Text>
              )}
              <Text size="xs" c="dimmed">Total Revenue</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="violet" radius="xl"><IconBriefcase size={20} /></Avatar>
            <Box>
              {countsLoading ? (
                <Loader size="sm" />
              ) : (
                <Text size="xl" fw={700}>{counts.totalJobPostings}</Text>
              )}
              <Text size="xs" c="dimmed">Total Job Postings</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Search */}
      <Paper p="md" withBorder radius="md" mb="md">
        <TextInput
          placeholder="Search by name, email, or company..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Paper>

      {/* Recruiters List */}
      <Card shadow="sm" padding="md" withBorder>
        {listLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : recruiters.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No recruiters found</Text>
          </Center>
        ) : isMobile ? (
          <Stack gap="sm">
            {recruiters.map(recruiter => <MobileCard key={recruiter.id} recruiter={recruiter} />)}
          </Stack>
        ) : (
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
                {recruiters.map(recruiter => (
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
                    <Table.Td><Badge variant="light" color="blue">{recruiter.companyName}</Badge></Table.Td>
                    <Table.Td><Text size="sm">{recruiter['job postings']}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={700} c="green">₹{parseFloat(recruiter['total amount']).toLocaleString()}</Text></Table.Td>
                    <Table.Td>
                      <Button 
                        size="xs" 
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() => handleViewInvoice(recruiter)}
                      >
                        View
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {/* Pagination */}
        {!listLoading && totalPages > 1 && (
          <Group justify="center" mt="lg">
            <Pagination 
              total={totalPages} 
              value={currentPage} 
              onChange={setCurrentPage}
              size="sm"
            />
          </Group>
        )}
      </Card>

      {/* View Details Modal */}
      <Modal 
        opened={!!viewingRecruiter} 
        onClose={() => setViewingRecruiter(null)} 
        title={<Text fw={600} size="lg">Invoice Details</Text>} 
        size="lg" 
        fullScreen={isMobile}
      >
        {viewingRecruiter && (
          <Stack gap="lg">
            <Paper p="md" bg="gray.0" radius="md">
              <Group gap="md">
                <Avatar size="xl" color="blue" radius="xl">{viewingRecruiter.name.charAt(0)}</Avatar>
                <Box>
                  <Text size="xl" fw={600}>{viewingRecruiter.name}</Text>
                  <Text size="sm" c="dimmed">{viewingRecruiter.companyName}</Text>
                  <Text size="sm" c="dimmed">{viewingRecruiter.email}</Text>
                </Box>
              </Group>
            </Paper>

            <Box>
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Job Postings</Text>
                <Badge color="green" size="lg">Total: ₹{detailsTotalAmount.toLocaleString()}</Badge>
              </Group>
              <Divider mb="md" />
              
              {detailsLoading ? (
                <Center py="md">
                  <Loader />
                </Center>
              ) : recruiterDetails.length === 0 ? (
                <Center py="md">
                  <Text c="dimmed">No job postings found</Text>
                </Center>
              ) : (
                <Stack gap="sm">
                  {recruiterDetails.map(job => (
                    <Paper key={job.id} p="md" withBorder radius="md">
                      <Group justify="space-between">
                        <Box>
                          <Text fw={500}>{job.title}</Text>
                          <Text size="xs" c="dimmed">Posted: {format(new Date(job.createdAt), 'MMM dd, yyyy')}</Text>
                        </Box>
                        <Badge color="green" variant="light" size="lg">₹{parseFloat(job.totalPayment).toLocaleString()}</Badge>
                      </Group>
                    </Paper>
                  ))}

                  {/* Details Pagination */}
                  {detailsTotalPages > 1 && (
                    <Group justify="center" mt="md">
                      <Pagination 
                        total={detailsTotalPages} 
                        value={detailsPage} 
                        onChange={setDetailsPage}
                        size="sm"
                      />
                    </Group>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

export default Invoice;
