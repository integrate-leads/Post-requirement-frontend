import React, { useState } from 'react';
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
  Paper
} from '@mantine/core';
import { 
  IconEye, 
  IconBriefcase, 
  IconEdit, 
  IconTrash, 
  IconDotsVertical, 
  IconPlus,
  IconUser,
  IconMail,
  IconBuilding,
  IconPhone,
  IconWorld,
  IconCalendar,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { format } from 'date-fns';

const Recruiters: React.FC = () => {
  const { recruiters, jobPostings, getApplicationsByJobId, updateRecruiter, deleteRecruiter, addRecruiter } = useAppData();
  const [viewingRecruiter, setViewingRecruiter] = useState<any>(null);
  const [editingRecruiter, setEditingRecruiter] = useState<any>(null);
  const [deletingRecruiter, setDeletingRecruiter] = useState<any>(null);
  const [addingRecruiter, setAddingRecruiter] = useState(false);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');

  const getRecruiterStats = (recruiterId: string) => { 
    const jobs = jobPostings.filter(j => j.recruiterId === recruiterId); 
    return { 
      jobs: jobs.length, 
      applications: jobs.reduce((sum, job) => sum + getApplicationsByJobId(job.id).length, 0),
      activeJobs: jobs.filter(j => j.isActive && j.isApproved).length
    }; 
  };
  
  const getRecruiterJobs = (recruiterId: string) => jobPostings.filter(j => j.recruiterId === recruiterId);

  const handleEditSubmit = () => {
    if (editingRecruiter) {
      updateRecruiter(editingRecruiter.id, {
        name: formName,
        email: formEmail,
        company: formCompany,
        phone: formPhone,
        companyWebsite: formWebsite,
      });
      setEditingRecruiter(null);
    }
  };

  const handleAddSubmit = () => {
    addRecruiter({
      name: formName,
      email: formEmail,
      company: formCompany,
      phone: formPhone,
      companyWebsite: formWebsite,
      approvedServices: [],
      isActive: true,
    });
    setAddingRecruiter(false);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (deletingRecruiter) {
      deleteRecruiter(deletingRecruiter.id);
      setDeletingRecruiter(null);
    }
  };

  const openEditModal = (recruiter: any) => {
    setFormName(recruiter.name);
    setFormEmail(recruiter.email);
    setFormCompany(recruiter.company);
    setFormPhone(recruiter.phone || '');
    setFormWebsite(recruiter.companyWebsite || '');
    setEditingRecruiter(recruiter);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormCompany('');
    setFormPhone('');
    setFormWebsite('');
  };

  const openAddModal = () => {
    resetForm();
    setAddingRecruiter(true);
  };

  return (
    <Box maw={1200} mx="auto">
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={2}>Recruiters</Title>
          <Text c="dimmed">Manage and view all registered recruiters</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={openAddModal}>
          Add Recruiter
        </Button>
      </Group>

      <Card shadow="sm" padding="md" withBorder style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Recruiter</Table.Th>
              <Table.Th>Company</Table.Th>
              <Table.Th>Job Postings</Table.Th>
              <Table.Th>Applications</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Joined</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {recruiters.map((recruiter) => {
              const stats = getRecruiterStats(recruiter.id);
              return (
                <Table.Tr key={recruiter.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar color="blue" radius="xl" size="sm">
                        {recruiter.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Text fw={500} size="sm">{recruiter.name}</Text>
                        <Text size="xs" c="dimmed">{recruiter.email}</Text>
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue">{recruiter.company}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <IconBriefcase size={16} color="#868e96" />
                      <Text size="sm">{stats.jobs}</Text>
                      {stats.activeJobs > 0 && (
                        <Badge size="xs" color="green" variant="light">{stats.activeJobs} active</Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{stats.applications}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={recruiter.isActive ? 'green' : 'gray'} variant="light">
                      {recruiter.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{format(new Date(recruiter.createdAt), 'MMM dd, yyyy')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="light" leftSection={<IconEye size={14} />} onClick={() => setViewingRecruiter(recruiter)}>
                        View
                      </Button>
                      <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEditModal(recruiter)}>
                            Edit
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={recruiter.isActive ? <IconX size={14} /> : <IconCheck size={14} />}
                            onClick={() => updateRecruiter(recruiter.id, { isActive: !recruiter.isActive })}
                          >
                            {recruiter.isActive ? 'Deactivate' : 'Activate'}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => setDeletingRecruiter(recruiter)}>
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      {/* View Details Modal */}
      <Modal 
        opened={!!viewingRecruiter} 
        onClose={() => setViewingRecruiter(null)} 
        title={<Text fw={600} size="lg">Recruiter Details</Text>} 
        size="lg"
      >
        {viewingRecruiter && (
          <Stack gap="lg">
            {/* Profile Header */}
            <Paper p="md" bg="gray.0" radius="md">
              <Group gap="md">
                <Avatar size="xl" color="blue" radius="xl">
                  {viewingRecruiter.name.charAt(0)}
                </Avatar>
                <Box style={{ flex: 1 }}>
                  <Group justify="space-between">
                    <Box>
                      <Text size="xl" fw={600}>{viewingRecruiter.name}</Text>
                      <Text size="sm" c="dimmed">{viewingRecruiter.company}</Text>
                    </Box>
                    <Badge size="lg" color={viewingRecruiter.isActive ? 'green' : 'gray'} variant="light">
                      {viewingRecruiter.isActive ? 'Active' : 'Inactive'}
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
                    <Text size="sm" fw={500}>{viewingRecruiter.email}</Text>
                  </Box>
                </Group>
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" size="md">
                    <IconPhone size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">Phone</Text>
                    <Text size="sm" fw={500}>{viewingRecruiter.phone || 'Not provided'}</Text>
                  </Box>
                </Group>
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" size="md">
                    <IconBuilding size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">Company</Text>
                    <Text size="sm" fw={500}>{viewingRecruiter.company}</Text>
                  </Box>
                </Group>
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" size="md">
                    <IconWorld size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">Website</Text>
                    <Text size="sm" fw={500}>{viewingRecruiter.companyWebsite || 'Not provided'}</Text>
                  </Box>
                </Group>
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" size="md">
                    <IconCalendar size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">Joined</Text>
                    <Text size="sm" fw={500}>{format(new Date(viewingRecruiter.createdAt), 'MMMM dd, yyyy')}</Text>
                  </Box>
                </Group>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Statistics */}
            <Box>
              <Text fw={600} mb="sm">Statistics</Text>
              <SimpleGrid cols={3} spacing="md">
                <Paper p="md" bg="blue.0" radius="md" ta="center">
                  <Text size="xl" fw={700} c="blue">{getRecruiterStats(viewingRecruiter.id).jobs}</Text>
                  <Text size="xs" c="dimmed">Total Jobs</Text>
                </Paper>
                <Paper p="md" bg="green.0" radius="md" ta="center">
                  <Text size="xl" fw={700} c="green">{getRecruiterStats(viewingRecruiter.id).activeJobs}</Text>
                  <Text size="xs" c="dimmed">Active Jobs</Text>
                </Paper>
                <Paper p="md" bg="orange.0" radius="md" ta="center">
                  <Text size="xl" fw={700} c="orange">{getRecruiterStats(viewingRecruiter.id).applications}</Text>
                  <Text size="xs" c="dimmed">Applications</Text>
                </Paper>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Job Postings */}
            <Box>
              <Text fw={600} mb="sm">Job Postings</Text>
              {getRecruiterJobs(viewingRecruiter.id).length === 0 ? (
                <Paper p="lg" bg="gray.0" radius="md" ta="center">
                  <IconBriefcase size={32} color="#868e96" style={{ marginBottom: 8 }} />
                  <Text c="dimmed" size="sm">No job postings yet</Text>
                </Paper>
              ) : (
                <Stack gap="sm">
                  {getRecruiterJobs(viewingRecruiter.id).map(job => (
                    <Paper key={job.id} p="md" withBorder radius="md">
                      <Group justify="space-between">
                        <Box>
                          <Text fw={500}>{job.title}</Text>
                          <Group gap="xs" mt={4}>
                            <Text size="xs" c="dimmed">{job.workLocation}</Text>
                            <Text size="xs" c="dimmed">•</Text>
                            <Text size="xs" c="dimmed">{job.jobType}</Text>
                          </Group>
                        </Box>
                        <Group gap="xs">
                          <Badge color={job.isActive && job.isApproved ? 'green' : 'gray'} variant="light" size="sm">
                            {job.isActive && job.isApproved ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge color="blue" variant="light" size="sm">
                            {getApplicationsByJobId(job.id).length} applications
                          </Badge>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => openEditModal(viewingRecruiter)}>
                Edit Recruiter
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal 
        opened={!!editingRecruiter} 
        onClose={() => setEditingRecruiter(null)} 
        title={<Text fw={600}>Edit Recruiter</Text>}
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
            <Button variant="outline" onClick={() => setEditingRecruiter(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Modal */}
      <Modal 
        opened={addingRecruiter} 
        onClose={() => setAddingRecruiter(false)} 
        title={<Text fw={600}>Add New Recruiter</Text>}
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
            <Button onClick={handleAddSubmit}>Add Recruiter</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        opened={!!deletingRecruiter} 
        onClose={() => setDeletingRecruiter(null)} 
        title={<Text fw={600} c="red">Delete Recruiter</Text>}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{deletingRecruiter?.name}</strong>? 
            This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setDeletingRecruiter(null)}>Cancel</Button>
            <Button color="red" onClick={handleDeleteConfirm}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Recruiters;
