import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Table,
  Badge,
  Button,
  Modal,
  Stack,
  Group,
  Box,
  Title,
  SimpleGrid,
  TextInput,
  ActionIcon,
  Menu,
  Divider,
  ThemeIcon,
  Avatar,
  Paper,
  ScrollArea,
  Tabs,
  Loader,
  Skeleton,
  Select,
  Pagination
} from '@mantine/core';
import {
  IconEye,
  IconBriefcase,
  IconTrash,
  IconDotsVertical,
  IconPlus,
  IconUser,
  IconMail,
  IconBuilding,
  IconPhone,
  IconWorld,
  IconCalendar,
  IconBan,
  IconCircleCheck,
  IconSearch,
  IconLock
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useMediaQuery } from '@mantine/hooks';
import { API_ENDPOINTS, apiRequest } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';
import { validateEmail, validateName, validatePhone, validatePassword, validateCompanyName, validateWebsite } from '@/lib/validations';
import FormattedText from '@/components/FormattedText';

const COUNTRY_CODES = [
  { value: '+1', label: '+1' },
  { value: '+91', label: '+91' },
];

interface Admin {
  id: string;
  _id?: string;
  name: string;
  email: string;
  mobile?: string;
  companyName?: string;
  company?: string;
  companyWebsite?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  totalJobs?: string;
  activeJobs?: string;
}


interface AdminJob {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  country?: string;
  clientName?: string;
  role?: string;
  workLocations?: Array<{ state: string; city: string[] }>;
  workType?: string;
  jobType?: string[];
  payRate?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  primarySkills?: string[];
  niceToHaveSkills?: string[];
  responsibilities?: string;
  applicationQuestions?: string[];
  requiredDocuments?: string[];
  expiryDate?: string;
  paymentStatus?: string;
  planAmount?: string;
  totalPayment?: string;
  isVerified?: string;
  status?: string;
  deleted?: string;
  createdAt?: string;
  updatedAt?: string;
  admin?: {
    id: number;
    name: string;
    email: string;
    companyName: string;
  };
}

const Recruiters: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAdmin, setViewingAdmin] = useState<Admin | null>(null);
  const [viewingAdminDetails, setViewingAdminDetails] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [addingRecruiter, setAddingRecruiter] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Job postings tab
  const [activeTab, setActiveTab] = useState<string | null>('details');
  const [adminJobs, setAdminJobs] = useState<AdminJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsPage, setJobsPage] = useState(1);
  const [totalJobPages, setTotalJobPages] = useState(1);
  const [viewingJob, setViewingJob] = useState<AdminJob | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('+1');
  const [formPhone, setFormPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  
  // Form validation errors
  const [formNameError, setFormNameError] = useState('');
  const [formEmailError, setFormEmailError] = useState('');
  const [formPasswordError, setFormPasswordError] = useState('');
  const [formCompanyError, setFormCompanyError] = useState('');
  const [formPhoneError, setFormPhoneError] = useState('');
  const [formWebsiteError, setFormWebsiteError] = useState('');

  // Fetch admins
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      
      const url = `${API_ENDPOINTS.SUPER_ADMIN.LIST_ADMINS}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest<{ success: boolean; admins: Admin[] }>(url);

      if (response.data?.success) {
        setAdmins(response.data.admins || []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [searchQuery, statusFilter]);

  // View admin details
  const handleViewAdmin = async (admin: Admin) => {
    setViewingAdmin(admin);
    setActiveTab('details');
    setDetailsLoading(true);
    
    try {
      const adminId = admin._id || admin.id;
      const response = await apiRequest<{ success: boolean; admin: Admin }>(
        API_ENDPOINTS.SUPER_ADMIN.VIEW_ADMIN(adminId)
      );

      if (response.data?.success) {
        setViewingAdminDetails(response.data.admin);
      } else {
        setViewingAdminDetails(admin);
      }
    } catch (error) {
      console.error('Failed to fetch admin details:', error);
      setViewingAdminDetails(admin);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Fetch admin jobs
  const fetchAdminJobs = async (adminId: string, page: number = 1) => {
    setJobsLoading(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        data: { jobs: AdminJob[]; pagination?: { totalPages?: number } };
      }>(API_ENDPOINTS.SUPER_ADMIN.ADMIN_JOBS(adminId, page, 10));

      if (response.data?.success) {
        const jobsData = response.data.data;
        setAdminJobs(jobsData?.jobs || []);
        setTotalJobPages(jobsData?.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch admin jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    if (value === 'jobs' && viewingAdmin) {
      const adminId = viewingAdmin._id || viewingAdmin.id;
      fetchAdminJobs(adminId, 1);
      setJobsPage(1);
    }
  };

  // Block admin
  const handleBlockAdmin = async (admin: Admin) => {
    const adminId = admin._id || admin.id;
    setActionLoading(adminId);
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.BLOCK_ADMIN(adminId),
        { method: 'PATCH' }
      );
      
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Admin blocked successfully', color: 'green' });
        fetchAdmins();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to block admin', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to block admin', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  // Unblock admin
  const handleUnblockAdmin = async (admin: Admin) => {
    const adminId = admin._id || admin.id;
    setActionLoading(adminId);
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.UNBLOCK_ADMIN(adminId),
        { method: 'PATCH' }
      );
      
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Admin unblocked successfully', color: 'green' });
        fetchAdmins();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to unblock admin', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to unblock admin', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  // Delete admin
  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;
    
    const adminId = deletingAdmin._id || deletingAdmin.id;
    setActionLoading(adminId);
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.DELETE_ADMIN(adminId),
        { method: 'DELETE' }
      );
      
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Admin deleted successfully', color: 'green' });
        fetchAdmins();
        setDeletingAdmin(null);
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to delete admin', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to delete admin', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  // Validation handlers
  const handleFormNameChange = (value: string) => {
    setFormName(value);
    if (value) {
      const result = validateName(value);
      setFormNameError(result.isValid ? '' : result.error);
    } else {
      setFormNameError('');
    }
  };

  const handleFormEmailChange = (value: string) => {
    setFormEmail(value);
    if (value) {
      const result = validateEmail(value);
      setFormEmailError(result.isValid ? '' : result.error);
    } else {
      setFormEmailError('');
    }
  };

  const handleFormPasswordChange = (value: string) => {
    setFormPassword(value);
    if (value) {
      const result = validatePassword(value);
      setFormPasswordError(result.isValid ? '' : result.error);
    } else {
      setFormPasswordError('');
    }
  };

  const handleFormCompanyChange = (value: string) => {
    setFormCompany(value);
    if (value) {
      const result = validateCompanyName(value);
      setFormCompanyError(result.isValid ? '' : result.error);
    } else {
      setFormCompanyError('');
    }
  };

  const handleFormPhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setFormPhone(digitsOnly);
    if (digitsOnly) {
      const result = validatePhone(digitsOnly, formCountryCode);
      setFormPhoneError(result.isValid ? '' : result.error);
    } else {
      setFormPhoneError('');
    }
  };

  const handleFormWebsiteChange = (value: string) => {
    setFormWebsite(value);
    if (value) {
      const result = validateWebsite(value);
      setFormWebsiteError(result.isValid ? '' : result.error);
    } else {
      setFormWebsiteError('');
    }
  };

  // Add recruiter
  const handleAddSubmit = async () => {
    // Validate all fields
    let hasError = false;

    if (!formName.trim()) {
      setFormNameError('Name is required');
      hasError = true;
    } else {
      const nameResult = validateName(formName);
      if (!nameResult.isValid) {
        setFormNameError(nameResult.error);
        hasError = true;
      }
    }

    if (!formEmail.trim()) {
      setFormEmailError('Email is required');
      hasError = true;
    } else {
      const emailResult = validateEmail(formEmail);
      if (!emailResult.isValid) {
        setFormEmailError(emailResult.error);
        hasError = true;
      }
    }

    if (!formPassword.trim()) {
      setFormPasswordError('Password is required');
      hasError = true;
    } else {
      const passwordResult = validatePassword(formPassword);
      if (!passwordResult.isValid) {
        setFormPasswordError(passwordResult.error);
        hasError = true;
      }
    }

    if (!formCompany.trim()) {
      setFormCompanyError('Company name is required');
      hasError = true;
    } else {
      const companyResult = validateCompanyName(formCompany);
      if (!companyResult.isValid) {
        setFormCompanyError(companyResult.error);
        hasError = true;
      }
    }

    if (formPhone) {
      const phoneResult = validatePhone(formPhone, formCountryCode);
      if (!phoneResult.isValid) {
        setFormPhoneError(phoneResult.error);
        hasError = true;
      }
    }

    if (formWebsite) {
      const websiteResult = validateWebsite(formWebsite);
      if (!websiteResult.isValid) {
        setFormWebsiteError(websiteResult.error);
        hasError = true;
      }
    }

    if (hasError) return;

    setActionLoading('add');
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.CREATE_ADMIN,
        {
          method: 'POST',
          data: {
            email: formEmail,
            password: formPassword,
            name: formName,
            mobile: formPhone ? `${formCountryCode}-${formPhone}` : '',
            companyName: formCompany,
            companyWebsite: formWebsite,
          },
        }
      );
      
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Recruiter added successfully', color: 'green' });
        fetchAdmins();
        setAddingRecruiter(false);
        resetForm();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to add recruiter', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to add recruiter', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormCompany('');
    setFormCountryCode('+1');
    setFormPhone('');
    setFormWebsite('');
    setFormNameError('');
    setFormEmailError('');
    setFormPasswordError('');
    setFormCompanyError('');
    setFormPhoneError('');
    setFormWebsiteError('');
  };

  const openAddModal = () => {
    resetForm();
    setAddingRecruiter(true);
  };

  const getAdminStatus = (admin: Admin) => {
    if (admin.status) return admin.status;
    return admin.isActive ? 'active' : 'inactive';
  };

  const isBlocked = (admin: Admin) => {
    const status = getAdminStatus(admin).toLowerCase();
    return status === 'blocked' || status === 'inactive';
  };

  // Mobile Card View
  const MobileRecruiterCard = ({ admin }: { admin: Admin }) => (
    <Card shadow="sm" padding="md" withBorder mb="sm">
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <Avatar color="blue" radius="xl" size="md">
            {admin.name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Text fw={500} size="sm">{admin.name}</Text>
            <Text size="xs" c="dimmed">{admin.email}</Text>
          </Box>
        </Group>
        <Menu position="bottom-end" withArrow>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item 
              leftSection={isBlocked(admin) ? <IconCircleCheck size={14} /> : <IconBan size={14} />}
              onClick={() => isBlocked(admin) ? handleUnblockAdmin(admin) : handleBlockAdmin(admin)}
            >
              {isBlocked(admin) ? 'Active' : 'Inactive'}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => setDeletingAdmin(admin)}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      
      <Group gap="xs" mb="sm">
        <Badge variant="light" color="blue" size="sm">{admin.companyName || admin.company || 'N/A'}</Badge>
        <Badge color={isBlocked(admin) ? 'red' : 'green'} variant="light" size="sm">
          {getAdminStatus(admin)}
        </Badge>
      </Group>
      
      {admin.createdAt && (
        <Text size="xs" c="dimmed" mt="sm">
          Joined {format(new Date(admin.createdAt), 'MMM dd, yyyy')}
        </Text>
      )}
    </Card>
  );

  return (
    <Box maw={1200} mx="auto">
      <Group justify="space-between" mb="xl" wrap="wrap" gap="md">
        <Box>
          <Title order={2}>Recruiters</Title>
          <Text c="dimmed" size="sm">Manage and view all registered recruiters</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={openAddModal} size={isMobile ? 'sm' : 'md'}>
          Add Recruiter
        </Button>
      </Group>

      {/* Filters */}
      <Group mb="lg" gap="md">
        <TextInput
          placeholder="Search by name or email..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, maxWidth: 300 }}
        />
        <Select
          placeholder="Filter by status"
          data={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'blocked', label: 'Blocked' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          style={{ width: 150 }}
        />
      </Group>

      {loading ? (
        <Stack gap="sm">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} height={80} />
          ))}
        </Stack>
      ) : isMobile ? (
        <Stack gap="sm">
          {admins.map((admin) => (
            <MobileRecruiterCard key={admin._id || admin.id} admin={admin} />
          ))}
        </Stack>
      ) : (
        <Card shadow="sm" padding="md" withBorder>
          <ScrollArea>
            <Table striped highlightOnHover miw={800}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Recruiter</Table.Th>
                  <Table.Th>Company</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {admins.map((admin) => (
                  <Table.Tr key={admin._id || admin.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color="blue" radius="xl" size="sm">
                          {admin.name?.charAt(0) || 'A'}
                        </Avatar>
                        <Box>
                          <Text fw={500} size="sm">{admin.name}</Text>
                          <Text size="xs" c="dimmed">{admin.email}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">{admin.companyName || admin.company || 'N/A'}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{admin.mobile || 'N/A'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={isBlocked(admin) ? 'red' : 'green'} variant="light">
                        {getAdminStatus(admin)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {admin.createdAt ? format(new Date(admin.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" leftSection={<IconEye size={14} />} onClick={() => handleViewAdmin(admin)}>
                          View
                        </Button>
                        <Menu position="bottom-end" withArrow>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" loading={actionLoading === (admin._id || admin.id)}>
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item 
                              leftSection={isBlocked(admin) ? <IconCircleCheck size={14} /> : <IconBan size={14} />}
                              onClick={() => isBlocked(admin) ? handleUnblockAdmin(admin) : handleBlockAdmin(admin)}
                            >
                              {isBlocked(admin) ? 'Active' : 'Inactive'}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => setDeletingAdmin(admin)}>
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* View Details Modal with Tabs */}
      <Modal 
        opened={!!viewingAdmin} 
        onClose={() => {
          setViewingAdmin(null);
          setViewingAdminDetails(null);
          setAdminJobs([]);
        }} 
        title={<Text fw={600} size="lg">Recruiter Details</Text>} 
        size="lg"
        fullScreen={isMobile}
      >
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List mb="md">
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="jobs">Job Postings</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details">
            {detailsLoading ? (
              <Stack gap="md">
                <Skeleton height={100} />
                <Skeleton height={150} />
              </Stack>
            ) : viewingAdminDetails && (
              <Stack gap="lg">
                {/* Profile Header */}
                <Paper p="md" bg="gray.0" radius="md">
                  <Group gap="md" wrap="wrap">
                    <Avatar size="xl" color="blue" radius="xl">
                      {viewingAdminDetails.name?.charAt(0) || 'A'}
                    </Avatar>
                    <Box style={{ flex: 1, minWidth: 200 }}>
                      <Group justify="space-between" wrap="wrap" gap="sm">
                        <Box>
                          <Text size="xl" fw={600}>{viewingAdminDetails.name}</Text>
                          <Text size="sm" c="dimmed">{viewingAdminDetails.companyName || viewingAdminDetails.company}</Text>
                        </Box>
                        <Badge size="lg" color={isBlocked(viewingAdminDetails) ? 'red' : 'green'} variant="light">
                          {getAdminStatus(viewingAdminDetails)}
                        </Badge>
                      </Group>
                    </Box>
                  </Group>
                </Paper>

                {/* Contact Information */}
                <Box>
                  <Text fw={600} mb="sm">Contact Information</Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <IconMail size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">Email</Text>
                        <Text size="sm" fw={500}>{viewingAdminDetails.email}</Text>
                      </Box>
                    </Group>
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <IconPhone size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">Phone</Text>
                        <Text size="sm" fw={500}>{viewingAdminDetails.mobile || 'Not provided'}</Text>
                      </Box>
                    </Group>
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <IconBuilding size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">Company</Text>
                        <Text size="sm" fw={500}>{viewingAdminDetails.companyName || viewingAdminDetails.company || 'Not provided'}</Text>
                      </Box>
                    </Group>
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <IconWorld size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">Website</Text>
                        <Text size="sm" fw={500}>{viewingAdminDetails.companyWebsite || 'Not provided'}</Text>
                      </Box>
                    </Group>
                    {viewingAdminDetails.createdAt && (
                      <Group gap="sm">
                        <ThemeIcon variant="light" color="blue" size="md">
                          <IconCalendar size={16} />
                        </ThemeIcon>
                        <Box>
                          <Text size="xs" c="dimmed">Joined</Text>
                          <Text size="sm" fw={500}>{format(new Date(viewingAdminDetails.createdAt), 'MMMM dd, yyyy')}</Text>
                        </Box>
                      </Group>
                    )}
                  </SimpleGrid>
                </Box>
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="jobs">
            {jobsLoading ? (
              <Stack gap="sm">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} height={60} />
                ))}
              </Stack>
            ) : adminJobs.length === 0 ? (
              <Paper p="lg" bg="gray.0" radius="md" ta="center">
                <IconBriefcase size={32} color="#868e96" style={{ marginBottom: 8 }} />
                <Text c="dimmed" size="sm">No job postings yet</Text>
              </Paper>
            ) : (
              <>
                <Stack gap="sm">
                  {adminJobs.map(job => {
                    const locationDisplay = job.workLocations && job.workLocations.length > 0
                      ? `${job.workLocations[0].state}${job.workLocations[0].city?.length ? `, ${job.workLocations[0].city[0]}` : ''}`
                      : job.country || '';
                    const jobTypeDisplay = Array.isArray(job.jobType) ? job.jobType.join(', ') : (job.jobType || '');
                    
                    return (
                      <Paper 
                        key={job._id || job.id} 
                        p="md" 
                        withBorder 
                        radius="md" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setViewingJob(job)}
                      >
                        <Group justify="space-between" wrap="wrap" gap="sm">
                          <Box>
                            <Text fw={500}>{job.title}</Text>
                            <Group gap="xs" mt={4} wrap="wrap">
                              {locationDisplay && (
                                <>
                                  <Text size="xs" c="dimmed">{locationDisplay}</Text>
                                  {jobTypeDisplay && <Text size="xs" c="dimmed">•</Text>}
                                </>
                              )}
                              {jobTypeDisplay && (
                                <Text size="xs" c="dimmed">{jobTypeDisplay}</Text>
                              )}
                            </Group>
                          </Box>
                          <Badge 
                            color={job.status?.toLowerCase() === 'active' ? 'green' : 'gray'} 
                            variant="light" 
                            size="sm"
                            tt="uppercase"
                          >
                            {job.status || 'Draft'}
                          </Badge>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
                {totalJobPages > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination 
                      value={jobsPage} 
                      onChange={(page) => {
                        setJobsPage(page);
                        if (viewingAdmin) {
                          fetchAdminJobs(viewingAdmin._id || viewingAdmin.id, page);
                        }
                      }} 
                      total={totalJobPages} 
                    />
                  </Group>
                )}
              </>
            )}
          </Tabs.Panel>
        </Tabs>
      </Modal>

      {/* Job Details Modal */}
      <Modal 
        opened={!!viewingJob} 
        onClose={() => setViewingJob(null)} 
        title={<Text fw={600} size="lg">Job Details</Text>} 
        size="lg"
        fullScreen={isMobile}
      >
        {viewingJob && (
          <Stack gap="lg">
            <Paper p="md" bg="gray.0" radius="md">
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Box>
                  <Text size="xl" fw={600}>{viewingJob.title}</Text>
                  <Text size="sm" c="dimmed">{viewingJob.clientName || viewingJob.admin?.companyName}</Text>
                </Box>
                <Badge 
                  color={viewingJob.status?.toLowerCase() === 'active' ? 'green' : 'gray'} 
                  variant="light" 
                  size="lg"
                  tt="uppercase"
                >
                  {viewingJob.status || 'Draft'}
                </Badge>
              </Group>
            </Paper>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconBriefcase size={16} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Role</Text>
                  <Text size="sm" fw={500}>{viewingJob.role || viewingJob.title}</Text>
                </Box>
              </Group>
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconWorld size={16} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Country</Text>
                  <Text size="sm" fw={500}>{viewingJob.country || 'Not specified'}</Text>
                </Box>
              </Group>
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconBuilding size={16} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Work Type</Text>
                  <Text size="sm" fw={500}>{viewingJob.workType || 'Not specified'}</Text>
                </Box>
              </Group>
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconCalendar size={16} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Job Type</Text>
                  <Text size="sm" fw={500}>{Array.isArray(viewingJob.jobType) ? viewingJob.jobType.join(', ') : (viewingJob.jobType || 'Not specified')}</Text>
                </Box>
              </Group>
              {viewingJob.payRate && (
                <Group gap="sm">
                  <ThemeIcon variant="light" color="green" size="md">
                    <IconBriefcase size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">Pay Rate</Text>
                    <Text size="sm" fw={500}>{viewingJob.payRate}</Text>
                  </Box>
                </Group>
              )}
              {viewingJob.createdAt && (
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" size="md">
                    <IconCalendar size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">Posted On</Text>
                    <Text size="sm" fw={500}>{format(new Date(viewingJob.createdAt), 'MMM dd, yyyy')}</Text>
                  </Box>
                </Group>
              )}
            </SimpleGrid>

            {viewingJob.workLocations && viewingJob.workLocations.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Work Locations</Text>
                <Group gap="xs" wrap="wrap">
                  {viewingJob.workLocations.map((loc, idx) => (
                    <Badge key={idx} variant="light" color="blue">
                      {loc.state}{loc.city?.length ? ` - ${loc.city.join(', ')}` : ''}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}

            {viewingJob.description && (
              <Box>
                <Text fw={600} mb="xs">Description</Text>
                <ScrollArea.Autosize mah={300}>
                  <FormattedText text={viewingJob.description} />
                </ScrollArea.Autosize>
              </Box>
            )}

            {viewingJob.primarySkills && viewingJob.primarySkills.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Primary Skills</Text>
                <Group gap="xs" wrap="wrap">
                  {viewingJob.primarySkills.map((skill, idx) => (
                    <Badge key={idx} variant="light" color="grape">{skill}</Badge>
                  ))}
                </Group>
              </Box>
            )}

            {viewingJob.niceToHaveSkills && viewingJob.niceToHaveSkills.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Nice to Have Skills</Text>
                <Group gap="xs" wrap="wrap">
                  {viewingJob.niceToHaveSkills.map((skill, idx) => (
                    <Badge key={idx} variant="light" color="gray">{skill}</Badge>
                  ))}
                </Group>
              </Box>
            )}

            {viewingJob.requiredDocuments && viewingJob.requiredDocuments.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Required Documents</Text>
                <Group gap="xs" wrap="wrap">
                  {viewingJob.requiredDocuments.map((doc, idx) => (
                    <Badge key={idx} variant="outline" color="dark">{doc}</Badge>
                  ))}
                </Group>
              </Box>
            )}

            <Divider />

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Payment Status</Text>
                <Badge color={viewingJob.paymentStatus === 'Completed' ? 'green' : 'yellow'} variant="light">
                  {viewingJob.paymentStatus || 'Pending'}
                </Badge>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Verification</Text>
                <Badge color={viewingJob.isVerified === 'Approved' ? 'green' : 'yellow'} variant="light">
                  {viewingJob.isVerified || 'Pending'}
                </Badge>
              </Box>
              {viewingJob.expiryDate && (
                <Box>
                  <Text size="xs" c="dimmed">Expiry Date</Text>
                  <Text size="sm" fw={500}>{format(new Date(viewingJob.expiryDate), 'MMM dd, yyyy')}</Text>
                </Box>
              )}
            </SimpleGrid>
          </Stack>
        )}
      </Modal>


      {/* Add Modal */}
      <Modal 
        opened={addingRecruiter} 
        onClose={() => setAddingRecruiter(false)} 
        title={<Text fw={600}>Add New Recruiter</Text>}
        fullScreen={isMobile}
      >
        <Stack gap="md">
          <TextInput
            label="Full Name"
            leftSection={<IconUser size={16} />}
            value={formName}
            onChange={(e) => handleFormNameChange(e.target.value)}
            error={formNameError}
            required
          />
          <TextInput
            label="Email"
            leftSection={<IconMail size={16} />}
            value={formEmail}
            onChange={(e) => handleFormEmailChange(e.target.value)}
            error={formEmailError}
            required
          />
          <TextInput
            label="Password"
            leftSection={<IconLock size={16} />}
            type="password"
            value={formPassword}
            onChange={(e) => handleFormPasswordChange(e.target.value)}
            error={formPasswordError}
            required
          />
          <TextInput
            label="Company Name"
            leftSection={<IconBuilding size={16} />}
            value={formCompany}
            onChange={(e) => handleFormCompanyChange(e.target.value)}
            error={formCompanyError}
            required
          />
          <Box>
            <Text size="sm" fw={500} mb={4}>Phone</Text>
            <Group gap={6} wrap="nowrap">
              <Select
                data={COUNTRY_CODES}
                value={formCountryCode}
                onChange={(v) => setFormCountryCode(v || '+1')}
                w={120}
                styles={{ input: { textAlign: 'center', fontWeight: 500 } }}
              />
              <TextInput
                placeholder="9876543210"
                leftSection={<IconPhone size={16} />}
                value={formPhone}
                onChange={(e) => handleFormPhoneChange(e.target.value)}
                style={{ flex: 1 }}
              />
            </Group>
            {formPhoneError && <Text size="xs" c="red" mt={4}>{formPhoneError}</Text>}
          </Box>
          <TextInput
            label="Company Website"
            leftSection={<IconWorld size={16} />}
            value={formWebsite}
            onChange={(e) => handleFormWebsiteChange(e.target.value)}
            error={formWebsiteError}
            placeholder="https://example.com"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setAddingRecruiter(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit} loading={actionLoading === 'add'}>Add Recruiter</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        opened={!!deletingAdmin} 
        onClose={() => setDeletingAdmin(null)} 
        title={<Text fw={600} c="red">Delete Recruiter</Text>}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{deletingAdmin?.name}</strong>? 
            This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setDeletingAdmin(null)}>Cancel</Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={!!actionLoading}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Recruiters;
