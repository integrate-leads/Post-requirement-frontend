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
  TextInput,
  Textarea,
  ActionIcon,
  ScrollArea,
  Switch,
  Skeleton,
  Pagination,
} from '@mantine/core';
import { IconPlus, IconEdit, IconSearch } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { API_ENDPOINTS, apiRequest } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';

interface Feature {
  id: string;
  _id?: string;
  name: string;
  description: string;
  amount?: number | string;
  status: string;
  isActive?: boolean;
}

const FEATURES_LIST_DEFAULT: Feature[] = [];

const Features: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>(FEATURES_LIST_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Create/Edit form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formStatus, setFormStatus] = useState(true);
  const [formNameError, setFormNameError] = useState('');
  const [formDescriptionError, setFormDescriptionError] = useState('');

  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', String(page));
      params.append('limit', String(perPage));
      const url = `${API_ENDPOINTS.SUPER_ADMIN.LIST_FEATURES}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest<{
        success: boolean;
        features?: Feature[];
        data?: { features?: Feature[]; pagination?: { totalPages?: number } };
      }>(url);

      if (response.data?.success) {
        const list = response.data.features ?? response.data.data?.features ?? [];
        setFeatures(list);
        const total = response.data.data?.pagination?.totalPages ?? 1;
        setTotalPages(total);
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [page, searchQuery]);

  const getFeatureId = (f: Feature) => f._id || f.id;
  const isActive = (f: Feature) => f.status?.toLowerCase() === 'active' || f.isActive === true;

  const handleToggleStatus = async (feature: Feature) => {
    const id = getFeatureId(feature);
    setActionLoading(id);
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.TOGGLE_FEATURE(id),
        { method: 'PATCH' }
      );
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Feature status updated', color: 'green' });
        fetchFeatures();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to update status', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to update status', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setFormAmount('');
    setFormStatus(true);
    setFormNameError('');
    setFormDescriptionError('');
    setEditingFeature(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (feature: Feature) => {
    setFormName(feature.name);
    setFormDescription(feature.description);
    setFormAmount(feature.amount != null ? String(feature.amount) : '');
    setFormStatus(isActive(feature));
    setFormNameError('');
    setFormDescriptionError('');
    setEditingFeature(feature);
    setCreateModalOpen(true);
  };

  const validateForm = () => {
    let hasError = false;
    if (!formName.trim()) {
      setFormNameError('Name is required');
      hasError = true;
    } else setFormNameError('');
    if (!formDescription.trim()) {
      setFormDescriptionError('Description is required');
      hasError = true;
    } else setFormDescriptionError('');
    return !hasError;
  };

  const handleCreateOrUpdate = async () => {
    if (!validateForm()) return;

    setActionLoading(editingFeature ? getFeatureId(editingFeature) : 'create');
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        amount: formAmount ? (isNaN(Number(formAmount)) ? formAmount : Number(formAmount)) : undefined,
        status: formStatus ? 'Active' : 'Inactive',
      };

      if (editingFeature) {
        const response = await apiRequest<{ success: boolean }>(
          API_ENDPOINTS.SUPER_ADMIN.UPDATE_FEATURE(getFeatureId(editingFeature)),
          { method: 'PUT', data: payload }
        );
        if (response.data?.success) {
          notifications.show({ title: 'Success', message: 'Feature updated', color: 'green' });
          setCreateModalOpen(false);
          fetchFeatures();
        } else {
          notifications.show({ title: 'Error', message: response.error || 'Failed to update', color: 'red' });
        }
      } else {
        const response = await apiRequest<{ success: boolean }>(
          API_ENDPOINTS.SUPER_ADMIN.CREATE_FEATURE,
          { method: 'POST', data: payload }
        );
        if (response.data?.success) {
          notifications.show({ title: 'Success', message: 'Feature created', color: 'green' });
          setCreateModalOpen(false);
          fetchFeatures();
        } else {
          notifications.show({ title: 'Error', message: response.error || 'Failed to create', color: 'red' });
        }
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Something went wrong', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Box maw={1200} mx="auto">
      <Group justify="space-between" mb="xl" wrap="wrap" gap="md">
        <Box>
          <Title order={2}>Features</Title>
          <Text c="dimmed" size="sm">Manage features and their status</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal} size={isMobile ? 'sm' : 'md'}>
          Create Feature
        </Button>
      </Group>

      <Group mb="lg" gap="md">
        <TextInput
          placeholder="Search by name..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, maxWidth: 300 }}
        />
      </Group>

      {loading ? (
        <Stack gap="sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={56} />
          ))}
        </Stack>
      ) : (
        <Card shadow="sm" padding="md" withBorder>
          <ScrollArea>
            <Table striped highlightOnHover miw={700}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {features.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed" py="xl">No features yet. Create one to get started.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  features.map((f) => (
                    <Table.Tr key={getFeatureId(f)}>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{getFeatureId(f)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{f.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2}>{f.description || '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{f.amount != null ? String(f.amount) : '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={isActive(f) ? 'green' : 'gray'} variant="light" size="sm">
                          {f.status || (isActive(f) ? 'Active' : 'Inactive')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Switch
                            size="sm"
                            checked={isActive(f)}
                            disabled={!!actionLoading}
                            onChange={() => handleToggleStatus(f)}
                          />
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            onClick={() => openEditModal(f)}
                            loading={actionLoading === getFeatureId(f)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {totalPages > 1 && (
            <Group justify="flex-end" mt="md">
              <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
            </Group>
          )}
        </Card>
      )}

      {/* Create / Edit Feature Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={<Text fw={600}>{editingFeature ? 'Edit Feature' : 'Create Feature'}</Text>}
        fullScreen={isMobile}
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Feature Name"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value);
              if (formNameError) setFormNameError('');
            }}
            error={formNameError}
            required
          />
          <Textarea
            label="Description"
            placeholder="Feature Description"
            value={formDescription}
            onChange={(e) => {
              setFormDescription(e.target.value);
              if (formDescriptionError) setFormDescriptionError('');
            }}
            error={formDescriptionError}
            required
            minRows={2}
          />
          <TextInput
            label="Amount"
            placeholder="Optional amount"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
          />
          <Group align="center" gap="sm">
            <Text size="sm" fw={500}>Status</Text>
            <Switch
              checked={formStatus}
              onChange={(e) => setFormStatus(e.currentTarget.checked)}
              label={formStatus ? 'Active' : 'Inactive'}
            />
          </Group>
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} loading={!!actionLoading}>
              {editingFeature ? 'Update Feature' : 'Create Feature'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Features;
