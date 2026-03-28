import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Table,
  Badge,
  Modal,
  Stack,
  Group,
  Box,
  Avatar,
  ScrollArea,
  Paper,
  Divider,
  SimpleGrid,
  TextInput,
  Loader,
  Center,
  Pagination,
  Button,
} from '@mantine/core';
import {
  IconEye,
  IconFileInvoice,
  IconCurrencyRupee,
  IconSearch,
  IconBriefcase,
  IconCreditCard,
  IconSend,
} from '@tabler/icons-react';
import { useMediaQuery, useDebouncedValue } from '@mantine/hooks';
import { format } from 'date-fns';
import { API_ENDPOINTS, apiRequest } from '@/hooks/useApi';
import { DashboardPageHeader, DASHBOARD_TABLE_CARD_PROPS, DASHBOARD_TABLE_PROPS, DASHBOARD_TABLE_STYLES } from '@/components/dashboard';

/** Matches super-admin dashboard counts API */
interface CountsData {
  totalRecruiters: number;
  totalRevenue: number;
  totalJobPostings: number;
  totalSubscriptions: number;
  totalCampaignsCompleted: number;
}

interface RecruiterFeature {
  subscriptionFeatureId: number;
  featureName: string;
  price: number;
  timePeriod: string;
  paymentStatus: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Recruiter {
  id: number;
  name: string;
  email: string;
  companyName: string;
  totalAmount: number;
  subscriptionStatus: string;
  totalSubscriptions: number;
  features: RecruiterFeature[];
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

const safeToLocaleString = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString();
};

const defaultCounts: CountsData = {
  totalRecruiters: 0,
  totalRevenue: 0,
  totalJobPostings: 0,
  totalSubscriptions: 0,
  totalCampaignsCompleted: 0,
};

const Invoice: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [counts, setCounts] = useState<CountsData>(defaultCounts);
  const [countsLoading, setCountsLoading] = useState(true);

  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewingRecruiter, setViewingRecruiter] = useState<Recruiter | null>(null);
  const [recruiterDetails, setRecruiterDetails] = useState<JobPosting[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTotalAmount, setDetailsTotalAmount] = useState(0);
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsTotalPages, setDetailsTotalPages] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchCounts = async () => {
      setCountsLoading(true);
      try {
        const response = await apiRequest<{ success: boolean; data: CountsData }>(
          API_ENDPOINTS.SUPER_ADMIN.INVOICE_COUNTS,
          { method: 'GET' }
        );
        if (response.data?.success && response.data.data) {
          setCounts({ ...defaultCounts, ...response.data.data });
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setCountsLoading(false);
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchRecruiters = async () => {
      setListLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          limit: 10,
        };
        if (debouncedSearch) params.search = debouncedSearch;

        const response = await apiRequest<RecruiterListResponse>(API_ENDPOINTS.SUPER_ADMIN.INVOICE_LIST_ADMINS, {
          method: 'GET',
          params,
        });
        if (response.data?.success && response.data.data) {
          const rows = (response.data.data.recruiters || []).map((r) => ({
            ...r,
            features: Array.isArray(r.features) ? r.features : [],
          }));
          setRecruiters(rows);
          setTotalPages(response.data.data.pagination?.totalPages ?? 1);
        }
      } catch (error) {
        console.error('Error fetching recruiters:', error);
      } finally {
        setListLoading(false);
      }
    };
    fetchRecruiters();
  }, [currentPage, debouncedSearch]);

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
        const response = await apiRequest<RecruiterDetailResponse>(
          API_ENDPOINTS.SUPER_ADMIN.INVOICE_ADMIN_DETAIL(viewingRecruiter.id),
          {
            method: 'GET',
            params: { page: detailsPage, limit: 10 },
          }
        );
        if (response.data?.success && response.data.data) {
          setRecruiterDetails(response.data.data.jobPostings || []);
          setDetailsTotalAmount(response.data.data.totalAmount ?? 0);
          setDetailsTotalPages(response.data.data.pagination?.totalPages ?? 1);
        }
      } catch (error) {
        console.error('Error fetching recruiter details:', error);
        setRecruiterDetails([]);
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

  const subscriptionBadgeColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'green';
    if (s === 'inactive') return 'gray';
    return 'blue';
  };

  /** Mobile list — matches Alerts `MobileActivityCard` / Recruiters mobile row (View + layout). */
  const MobileCard = ({ recruiter }: { recruiter: Recruiter }) => (
    <Card shadow="sm" padding="sm" withBorder mb="xs" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" gap="xs" align="flex-start">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Avatar color="blue" radius="xl" size="sm" style={{ flexShrink: 0 }}>
              {recruiter.name.charAt(0)}
            </Avatar>
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Text size="sm" fw={500} lineClamp={1}>
                {recruiter.name}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {recruiter.companyName || 'N/A'}
              </Text>
            </Box>
          </Group>
          <Badge
            variant="light"
            color={subscriptionBadgeColor(recruiter.subscriptionStatus)}
            size="xs"
            style={{ flexShrink: 0 }}
          >
            {recruiter.subscriptionStatus || '—'}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" lineClamp={2}>
          {recruiter.email}
        </Text>
        <Group justify="space-between" wrap="wrap" gap="xs">
          <Box>
            <Text size="xs" c="dimmed">
              Subscriptions
            </Text>
            <Text size="sm" fw={600}>
              {recruiter.totalSubscriptions}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">
              Features
            </Text>
            <Text size="sm" fw={600}>
              {recruiter.features.length}
            </Text>
          </Box>
        </Group>
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Text size="xs" c="dimmed" lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
            Total{' '}
            <Text component="span" fw={700} c="green" size="sm">
              ₹{safeToLocaleString(recruiter.totalAmount)}
            </Text>
          </Text>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconEye size={12} />}
            onClick={() => handleViewInvoice(recruiter)}
            styles={{ root: { height: 28, paddingLeft: 8, paddingRight: 10 } }}
          >
            View
          </Button>
        </Group>
      </Stack>
    </Card>
  );

  return (
    <Box maw={1200} mx="auto" px={{ base: 'xs', sm: 'md' }} pb={{ base: 'xl', sm: 0 }}>
      <DashboardPageHeader
        icon={<IconFileInvoice size={24} stroke={1.75} />}
        title="Invoices"
        description="View recruiter payments, subscriptions, job postings, and campaign billing."
      />

      <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 5 }} spacing="md" mb="lg">
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="blue" radius="xl">
              <IconFileInvoice size={20} />
            </Avatar>
            <Box>
              {countsLoading ? (
                <Loader size="sm" />
              ) : (
                <Text size="xl" fw={700}>
                  {counts.totalRecruiters}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Total Recruiters
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="green" radius="xl">
              <IconCurrencyRupee size={20} />
            </Avatar>
            <Box>
              {countsLoading ? (
                <Loader size="sm" />
              ) : (
                <Text size="xl" fw={700}>
                  ₹{safeToLocaleString(counts.totalRevenue)}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Total Revenue
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="violet" radius="xl">
              <IconBriefcase size={20} />
            </Avatar>
            <Box>
              {countsLoading ? (
                <Loader size="sm" />
              ) : (
                <Text size="xl" fw={700}>
                  {counts.totalJobPostings}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Total Job Postings
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="orange" radius="xl">
              <IconCreditCard size={20} />
            </Avatar>
            <Box>
              {countsLoading ? (
                <Loader size="sm" />
              ) : (
                <Text size="xl" fw={700}>
                  {counts.totalSubscriptions}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Total Subscriptions
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" withBorder radius="md">
          <Group gap="sm">
            <Avatar color="cyan" radius="xl">
              <IconSend size={20} />
            </Avatar>
            <Box>
              {countsLoading ? (
                <Loader size="sm" />
              ) : (
                <Text size="xl" fw={700}>
                  {counts.totalCampaignsCompleted}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Campaigns Completed
              </Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      <Paper p="md" withBorder radius="md" mb="md">
        <TextInput
          placeholder="Search by name, email, or company..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Paper>

      <Card {...DASHBOARD_TABLE_CARD_PROPS}>
        {listLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : recruiters.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No recruiters found</Text>
          </Center>
        ) : isMobile ? (
          <Stack gap="xs">
            {recruiters.map((recruiter) => (
              <MobileCard key={recruiter.id} recruiter={recruiter} />
            ))}
          </Stack>
        ) : (
          <ScrollArea type="auto" offsetScrollbars>
            <Table {...DASHBOARD_TABLE_PROPS} styles={DASHBOARD_TABLE_STYLES} miw={900}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Recruiter</Table.Th>
                  <Table.Th>Company</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th ta="center">Subscriptions</Table.Th>
                  <Table.Th ta="center">Features</Table.Th>
                  <Table.Th>Total Amount</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recruiters.map((recruiter) => (
                  <Table.Tr key={recruiter.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color="blue" radius="xl" size="sm">
                          {recruiter.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Text fw={500} size="sm">
                            {recruiter.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {recruiter.email}
                          </Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {recruiter.companyName || 'N/A'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={subscriptionBadgeColor(recruiter.subscriptionStatus)} size="sm">
                        {recruiter.subscriptionStatus || '—'}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Text size="sm">{recruiter.totalSubscriptions}</Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Text size="sm">{recruiter.features.length}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={700} c="green">
                        ₹{safeToLocaleString(recruiter.totalAmount)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={12} />}
                        onClick={() => handleViewInvoice(recruiter)}
                        styles={{ root: { height: 28, paddingLeft: 8, paddingRight: 10 } }}
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

        {!listLoading && totalPages > 1 && (
          <Group justify="center" mt="lg">
            <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} size="sm" />
          </Group>
        )}
      </Card>

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
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Group gap="md">
                  <Avatar size="xl" color="blue" radius="xl">
                    {viewingRecruiter.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Text size="xl" fw={600}>
                      {viewingRecruiter.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {viewingRecruiter.companyName || '—'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {viewingRecruiter.email}
                    </Text>
                  </Box>
                </Group>
                <Stack gap="xs" align="flex-end">
                  <Badge size="lg" variant="light" color={subscriptionBadgeColor(viewingRecruiter.subscriptionStatus)}>
                    {viewingRecruiter.subscriptionStatus}
                  </Badge>
                  <Badge color="green" size="lg" variant="filled">
                    List total: ₹{safeToLocaleString(viewingRecruiter.totalAmount)}
                  </Badge>
                </Stack>
              </Group>
            </Paper>

            <Box>
              <Text fw={600} mb="sm">
                Purchased features
              </Text>
              <Divider mb="md" />
              {viewingRecruiter.features.length === 0 ? (
                <Center py="md">
                  <Text c="dimmed" size="sm">
                    No feature purchases on record
                  </Text>
                </Center>
              ) : (
                <Stack gap="sm">
                  {viewingRecruiter.features.map((f) => (
                    <Paper key={f.subscriptionFeatureId} p="md" withBorder radius="md">
                      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                        <Box style={{ flex: 1, minWidth: 200 }}>
                          <Text fw={600}>{f.featureName}</Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {f.timePeriod} days • Payment: {f.paymentStatus} • {f.status}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {format(new Date(f.startDate), 'MMM d, yyyy')} –{' '}
                            {format(new Date(f.endDate), 'MMM d, yyyy')}
                          </Text>
                        </Box>
                        <Badge color="green" variant="light" size="lg">
                          ₹{safeToLocaleString(f.price)}
                        </Badge>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

            <Box>
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Job postings</Text>
                <Badge color="green" size="lg">
                  API total: ₹{safeToLocaleString(detailsTotalAmount)}
                </Badge>
              </Group>
              <Divider mb="md" />

              {detailsLoading ? (
                <Center py="md">
                  <Loader />
                </Center>
              ) : recruiterDetails.length === 0 ? (
                <Center py="md">
                  <Text c="dimmed" size="sm">
                    No job postings returned for this recruiter
                  </Text>
                </Center>
              ) : (
                <Stack gap="sm">
                  {recruiterDetails.map((job) => (
                    <Paper key={job.id} p="md" withBorder radius="md">
                      <Group justify="space-between">
                        <Box>
                          <Text fw={500}>{job.title}</Text>
                          <Text size="xs" c="dimmed">
                            Posted: {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                          </Text>
                        </Box>
                        <Badge color="green" variant="light" size="lg">
                          ₹{safeToLocaleString(job.totalPayment)}
                        </Badge>
                      </Group>
                    </Paper>
                  ))}

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
