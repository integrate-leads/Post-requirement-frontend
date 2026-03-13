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
  Skeleton,
  Pagination,
  Divider,
  Tooltip,
} from '@mantine/core';
import { IconPlus, IconEdit, IconSearch, IconTrash, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { API_ENDPOINTS, apiRequest } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';

export interface FeaturePlan {
  id?: number;
  price: number;
  timePeriod: string;
}

interface Feature {
  id: string | number;
  _id?: string | number;
  name: string;
  description: string;
  status?: string;
  isActive?: boolean;
  plans?: FeaturePlan[];
}

type FormPlanRow = { id?: number; price: string; timePeriod: string };

const FEATURES_LIST_DEFAULT: Feature[] = [];

const Features: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>(FEATURES_LIST_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Create/Edit form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPlans, setFormPlans] = useState<FormPlanRow[]>([{ price: '', timePeriod: '' }]);
  const [removePlanIds, setRemovePlanIds] = useState<number[]>([]);
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
        success?: boolean;
        features?: Feature[];
        data?: { features?: Feature[]; data?: Feature[]; pagination?: { totalPages?: number; total?: number } };
      }>(url);

      const raw = response.data as any;
      if (raw?.success !== false) {
        const list = raw?.features ?? raw?.data?.features ?? raw?.data?.data ?? [];
        setFeatures(Array.isArray(list) ? list : []);
        const pagination = raw?.data?.pagination ?? raw?.pagination;
        const total = pagination?.totalPages ?? (pagination?.total ? Math.ceil(Number(pagination.total) / perPage) : 1);
        setTotalPages(Math.max(1, total));
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

  const getFeatureId = (f: Feature): string | number => f._id ?? f.id;
  const isActive = (f: Feature) => f.status?.toLowerCase() === 'active' || f.isActive === true;

  const handleActivate = async (feature: Feature) => {
    const id = getFeatureId(feature);
    setActionLoading(id);
    try {
      const response = await apiRequest<{ success?: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.ACTIVATE_FEATURE(id),
        { method: 'PATCH' }
      );
      if (response.data?.success !== false && !response.error) {
        notifications.show({ title: 'Success', message: 'Feature activated', color: 'green' });
        fetchFeatures();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to activate', color: 'red' });
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to activate', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (feature: Feature) => {
    const id = getFeatureId(feature);
    setActionLoading(id);
    try {
      const response = await apiRequest<{ success?: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.DEACTIVATE_FEATURE(id),
        { method: 'PATCH' }
      );
      if (response.data?.success !== false && !response.error) {
        notifications.show({ title: 'Success', message: 'Feature deactivated', color: 'green' });
        fetchFeatures();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to deactivate', color: 'red' });
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to deactivate', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setFormPlans([{ price: '', timePeriod: '' }]);
    setRemovePlanIds([]);
    setFormNameError('');
    setFormDescriptionError('');
    setEditingFeature(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (feature: Feature) => {
    setFormName(feature.name);
    setFormDescription(feature.description);
    const plans = feature.plans?.length
      ? feature.plans.map((p) => ({ id: p.id, price: String(p.price ?? ''), timePeriod: p.timePeriod ?? '' }))
      : [{ price: '', timePeriod: '' }];
    setFormPlans(plans);
    setRemovePlanIds([]);
    setFormNameError('');
    setFormDescriptionError('');
    setEditingFeature(feature);
    setCreateModalOpen(true);
  };

  const addPlanRow = () => setFormPlans((prev) => [...prev, { price: '', timePeriod: '' }]);
  const removePlanRow = (index: number) => {
    const row = formPlans[index];
    if (row?.id != null && row.id > 0) {
      setRemovePlanIds((prev) => [...prev, row.id!]);
    }
    setFormPlans((prev) => prev.filter((_, i) => i !== index));
  };
  const updatePlanRow = (index: number, field: 'price' | 'timePeriod', value: string) => {
    setFormPlans((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], [field]: value };
      return next;
    });
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
    const hasValidPlan = formPlans.some((p) => p.price.trim() !== '' && p.timePeriod.trim() !== '');
    if (!hasValidPlan) {
      notifications.show({
        title: 'Add at least one plan',
        message: 'Please add at least one plan with price and time period.',
        color: 'red',
      });
      hasError = true;
    }
    return !hasError;
  };

  const handleCreateOrUpdate = async () => {
    if (!validateForm()) return;

    const plansPayload = formPlans
      .filter((p) => p.price.trim() !== '' && p.timePeriod.trim() !== '')
      .map((p) => ({
        id: editingFeature ? (p.id != null && p.id > 0 ? p.id : 0) : undefined,
        price: Number(p.price),
        timePeriod: String(p.timePeriod).trim(),
      }));

    if (editingFeature && plansPayload.some((p) => p.price === 0 || Number.isNaN(p.price))) {
      notifications.show({ title: 'Error', message: 'Plan price must be a valid number', color: 'red' });
      return;
    }

    setActionLoading(editingFeature ? getFeatureId(editingFeature) : 'create');
    try {
      if (editingFeature) {
        const payload = {
          name: formName.trim(),
          description: formDescription.trim(),
          ...(removePlanIds.length > 0 ? { removePlanIds } : {}),
          plans: plansPayload.map((p) => ({ id: p.id ?? 0, price: p.price, timePeriod: p.timePeriod })),
        };
        const response = await apiRequest<{ success?: boolean }>(
          API_ENDPOINTS.SUPER_ADMIN.UPDATE_FEATURE(getFeatureId(editingFeature)),
          { method: 'PATCH', data: payload }
        );
        if (response.data?.success !== false && !response.error) {
          notifications.show({ title: 'Success', message: 'Feature updated', color: 'green' });
          setCreateModalOpen(false);
          fetchFeatures();
        } else {
          notifications.show({ title: 'Error', message: response.error || 'Failed to update', color: 'red' });
        }
      } else {
        const payload = {
          name: formName.trim(),
          description: formDescription.trim(),
          plans: plansPayload.map((p) => ({ price: p.price, timePeriod: p.timePeriod })),
        };
        const response = await apiRequest<{ success?: boolean }>(
          API_ENDPOINTS.SUPER_ADMIN.CREATE_FEATURE,
          { method: 'POST', data: payload }
        );
        if (response.data?.success !== false && !response.error) {
          notifications.show({ title: 'Success', message: 'Feature created', color: 'green' });
          setCreateModalOpen(false);
          fetchFeatures();
        } else {
          notifications.show({ title: 'Error', message: response.error || 'Failed to create', color: 'red' });
        }
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Something went wrong', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  const plansSummaryBadges = (f: Feature) => {
    const plans = f.plans ?? [];
    if (plans.length === 0) {
      return <Text size="sm" c="dimmed">No plans added</Text>;
    }
    if (plans.length === 1) {
      const p = plans[0];
      return (
        <Badge size="xs" variant="light" color="blue" radius="sm">
          ${p.price}/{p.timePeriod}
        </Badge>
      );
    }

    const [first, ...rest] = plans;
    return (
      <Tooltip
        label={
          <Group gap={4} wrap="wrap">
            {plans.map((p, idx) => (
              <Badge key={p.id ?? idx} size="xs" variant="light" color="blue" radius="sm">
                ${p.price}/{p.timePeriod}
              </Badge>
            ))}
          </Group>
        }
        withArrow
        color="gray.1"
        position="top"
        offset={4}
        radius="md"
        withinPortal
      >
        <Group gap={4} wrap="nowrap">
          <Badge size="xs" variant="light" color="blue" radius="sm">
            ${first.price}/{first.timePeriod}
          </Badge>
          <Text size="xs" c="dimmed">
            +{rest.length} more
          </Text>
        </Group>
      </Tooltip>
    );
  };

  return (
    <Box maw={1200} mx="auto">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Title order={2}>Features</Title>
            <Text c="dimmed" size="sm">
              Configure platform capabilities and pricing plans for your recruiters.
            </Text>
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreateModal}
            size={isMobile ? 'sm' : 'md'}
          >
            Create Feature
          </Button>
        </Group>

        <Group mb="xs" gap="md">
          <TextInput
            placeholder="Search by name..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, maxWidth: 320 }}
          />
        </Group>

        {loading ? (
          <Card shadow="xs" padding="md" withBorder radius="md">
            <Stack gap="sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={56} radius="sm" />
              ))}
            </Stack>
          </Card>
        ) : (
          <Card shadow="sm" padding="md" withBorder radius="md">
            <ScrollArea>
              <Table striped highlightOnHover miw={720} verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Plans</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {features.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Stack align="center" gap={4} py="xl">
                          <Text fw={500}>No features found</Text>
                          <Text c="dimmed" size="sm">
                            {searchQuery
                              ? 'Try adjusting your search term.'
                              : 'Create a feature to start configuring your plans.'}
                          </Text>
                          {!searchQuery && (
                            <Button
                              mt="sm"
                              size="xs"
                              variant="light"
                              leftSection={<IconPlus size={14} />}
                              onClick={openCreateModal}
                            >
                              Create your first feature
                            </Button>
                          )}
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    features.map((f) => (
                      <Table.Tr key={String(getFeatureId(f))}>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {getFeatureId(f)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {f.name}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ maxWidth: 320 }}>
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {f.description || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>{plansSummaryBadges(f)}</Table.Td>
                        <Table.Td>
                          <Badge
                            color={isActive(f) ? 'green' : 'gray'}
                            variant="light"
                            size="sm"
                            radius="sm"
                          >
                            {f.status ?? (isActive(f) ? 'Active' : 'Inactive')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="flex-start">
                            {isActive(f) ? (
                              <Button
                                size="xs"
                                variant="subtle"
                                color="orange"
                                leftSection={<IconPlayerPause size={14} />}
                                onClick={() => handleDeactivate(f)}
                                loading={actionLoading === getFeatureId(f)}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                variant="subtle"
                                color="teal"
                                leftSection={<IconPlayerPlay size={14} />}
                                onClick={() => handleActivate(f)}
                                loading={actionLoading === getFeatureId(f)}
                              >
                                Activate
                              </Button>
                            )}
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
              <>
                <Divider my="md" />
                <Group justify="space-between" align="center">
                  <Text size="xs" c="dimmed">
                    Showing page {page} of {totalPages}
                  </Text>
                  <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
                </Group>
              </>
            )}
          </Card>
        )}

      </Stack>

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={<Text fw={600}>{editingFeature ? 'Edit Feature' : 'Create Feature'}</Text>}
        fullScreen={isMobile}
        size="lg"
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
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Plans (price & time period)</Text>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addPlanRow}>
                Add plan
              </Button>
            </Group>
            <Text size="xs" c="dimmed" mb="xs">
              Define one or more pricing options for this feature. Time period is usually in days (e.g. 15).
            </Text>
            <Stack gap="xs">
              {formPlans.map((row, index) => (
                <Group key={index} gap="xs" align="flex-end">
                  <TextInput
                    placeholder="Price"
                    type="number"
                    value={row.price}
                    onChange={(e) => updatePlanRow(index, 'price', e.target.value)}
                    style={{ width: 100 }}
                  />
                  <TextInput
                    placeholder="Time period in days (e.g. 15)"
                    value={row.timePeriod}
                    onChange={(e) => updatePlanRow(index, 'timePeriod', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removePlanRow(index)}
                    disabled={formPlans.length <= 1}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </Box>
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
