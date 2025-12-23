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
}

interface AdminJob {
  id: string;
  _id?: string;
  title: string;
  location?: string;
  jobType?: string;
  status?: string;
  amount?: number;
  createdAt?: string;
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
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');

  // Fetch admins
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      
      const url = `${API_ENDPOINTS.SUPER_ADMIN.LIST_ADMINS}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest<{ success: boolean; data: Admin[] }>(url);
      
      if (response.data?.success) {
        setAdmins(response.data.data || []);
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
      const response = await apiRequest<{ success: boolean; data: Admin }>(
        API_ENDPOINTS.SUPER_ADMIN.VIEW_ADMIN(adminId)
      );
      
      if (response.data?.success) {
        setViewingAdminDetails(response.data.data);
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
      const response = await apiRequest<{ success: boolean; data: { jobs: AdminJob[]; totalPages?: number } }>(
        API_ENDPOINTS.SUPER_ADMIN.ADMIN_JOBS(adminId, page, 10)
      );
      
      if (response.data?.success) {
        const jobsData = response.data.data;
        setAdminJobs(Array.isArray(jobsData) ? jobsData : jobsData.jobs || []);
        setTotalJobPages(jobsData.totalPages || 1);
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
        { method: 'PUT' }
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
        { method: 'PUT' }
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

  // Add recruiter
  const handleAddSubmit = async () => {
    setActionLoading('add');
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.CREATE_ADMIN,
        {
          method: 'POST',
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            name: formName,
            mobile: formPhone,
            companyName: formCompany,
            companyWebsite: formWebsite,
          }),
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
    setFormPhone('');
    setFormWebsite('');
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
            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => handleViewAdmin(admin)}>
              View Details
            </Menu.Item>
            <Menu.Item 
              leftSection={isBlocked(admin) ? <IconCircleCheck size={14} /> : <IconBan size={14} />}
              onClick={() => isBlocked(admin) ? handleUnblockAdmin(admin) : handleBlockAdmin(admin)}
            >
              {isBlocked(admin) ? 'Unblock' : 'Block'}
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
                              {isBlocked(admin) ? 'Unblock' : 'Block'}
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
                  {adminJobs.map(job => (
                    <Paper key={job._id || job.id} p="md" withBorder radius="md">
                      <Group justify="space-between" wrap="wrap" gap="sm">
                        <Box>
                          <Text fw={500}>{job.title}</Text>
                          <Group gap="xs" mt={4} wrap="wrap">
                            <Text size="xs" c="dimmed">{job.location || 'N/A'}</Text>
                            <Text size="xs" c="dimmed">•</Text>
                            <Text size="xs" c="dimmed">{job.jobType || 'N/A'}</Text>
                          </Group>
                        </Box>
                        <Group gap="xs" wrap="wrap">
                          <Badge color={job.status === 'active' ? 'green' : 'gray'} variant="light" size="sm">
                            {job.status || 'Draft'}
                          </Badge>
                          {job.amount && (
                            <Badge color="blue" variant="light" size="sm">
                              ₹{job.amount.toLocaleString()}
                            </Badge>
                          )}
                        </Group>
                      </Group>
                    </Paper>
                  ))}
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
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <TextInput
            label="Email"
            leftSection={<IconMail size={16} />}
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
          />
          <TextInput
            label="Password"
            leftSection={<IconLock size={16} />}
            type="password"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            required
          />
          <TextInput
            label="Company Name"
            leftSection={<IconBuilding size={16} />}
            value={formCompany}
            onChange={(e) => setFormCompany(e.target.value)}
            required
          />
          <TextInput
            label="Phone"
            leftSection={<IconPhone size={16} />}
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
          />
          <TextInput
            label="Company Website"
            leftSection={<IconWorld size={16} />}
            value={formWebsite}
            onChange={(e) => setFormWebsite(e.target.value)}
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
