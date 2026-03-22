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
  Paper,
  ThemeIcon,
} from '@mantine/core';
import { IconPlus, IconEdit, IconSearch, IconPlayerPlay, IconPlayerPause, IconSparkles, IconCurrencyDollar } from '@tabler/icons-react';
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
    const rawPlans = feature.plans ?? [];
    // Single-plan UI: edit only the first plan; extra API plans are removed on save
    const plans = rawPlans.length
      ? [{ id: rawPlans[0].id, price: String(rawPlans[0].price ?? ''), timePeriod: rawPlans[0].timePeriod ?? '' }]
      : [{ price: '', timePeriod: '' }];
    setFormPlans(plans);
    const extraPlanIds = rawPlans
      .slice(1)
      .map((p) => p.id)
      .filter((id): id is number => typeof id === 'number' && id > 0);
    setRemovePlanIds(extraPlanIds);
    setFormNameError('');
    setFormDescriptionError('');
    setEditingFeature(feature);
    setCreateModalOpen(true);
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
        title: 'Plan required',
        message: 'Please set price and time period for the plan.',
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

  const emptyState = (
    <Stack align="center" gap={4} py="xl">
      <Text fw={500}>No features found</Text>
      <Text c="dimmed" size="sm" ta="center">
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
  );

  return (
    <Box maw={1200} mx="auto" px={{ base: 'xs', sm: 'md', lg: 'xl' }} py={{ base: 'xs', sm: 'md' }}>
      <Stack gap={{ base: 'sm', md: 'md' }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box style={{ minWidth: 0 }} pt={4}>
            <Title order={2} size="h2" fw={700} lh={1.2}>
              Features
            </Title>
            <Text c="dimmed" size="sm" mt={10} maw={560} lh={1.55}>
              Configure what recruiters can subscribe to and how each capability is priced.
            </Text>
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreateModal}
            size={isMobile ? 'sm' : 'md'}
            fullWidth={isMobile}
          >
            Create Feature
          </Button>
        </Group>

        <TextInput
          placeholder="Search by name..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: isMobile ? '100%' : 320 }}
          w={{ base: '100%', sm: 320 }}
        />

        {loading ? (
          <Card shadow="sm" padding={{ base: 'sm', sm: 'md' }} withBorder={false} radius="md">
            <Stack gap="sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={isMobile ? 120 : 56} radius="sm" />
              ))}
            </Stack>
          </Card>
        ) : features.length === 0 ? (
          <Card shadow="sm" padding="lg" withBorder={false} radius="md">
            {emptyState}
          </Card>
        ) : isMobile ? (
          <Stack gap="sm">
            {features.map((f) => (
              <Card key={String(getFeatureId(f))} shadow="sm" padding="md" withBorder={false} radius="md">
                <Stack gap="xs">
                  <Group justify="space-between" wrap="nowrap" gap="xs">
                    <Text size="sm" fw={600} lineClamp={1} style={{ minWidth: 0 }}>
                      {f.name}
                    </Text>
                    <Badge
                      color={isActive(f) ? 'green' : 'gray'}
                      variant="light"
                      size="sm"
                      radius="sm"
                    >
                      {f.status ?? (isActive(f) ? 'Active' : 'Inactive')}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {f.description || '—'}
                  </Text>
                  <Group gap={4} wrap="wrap">
                    {plansSummaryBadges(f)}
                  </Group>
                  <Group gap="xs" wrap="wrap">
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
                </Stack>
              </Card>
            ))}
            {totalPages > 1 && (
              <>
                <Divider my="xs" />
                <Group justify="center">
                  <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
                </Group>
              </>
            )}
          </Stack>
        ) : (
          <Card shadow="sm" padding={{ base: 'xs', sm: 'md' }} withBorder={false} radius="md">
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
                  {features.map((f) => (
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
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            {totalPages > 1 && (
              <>
                <Divider my="md" />
                <Group justify="space-between" align="center" wrap="wrap" gap="xs">
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
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color={editingFeature ? 'blue' : 'green'}>
              <IconSparkles size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={600} size={{ base: 'md', sm: 'lg' }}>
                {editingFeature ? 'Edit Feature' : 'Create Feature'}
              </Text>
              {editingFeature && (
                <Text size="xs" c="dimmed" mt={2}>
                  ID: {getFeatureId(editingFeature)}
                </Text>
              )}
            </Box>
          </Group>
        }
        fullScreen={isMobile}
        size="lg"
        padding={{ base: 'sm', sm: 'md' }}
        radius="md"
        styles={{ title: { flex: 1 } }}
      >
        <ScrollArea.Autosize mah={isMobile ? '70vh' : 520} type="auto" offsetScrollbars>
          <Stack gap="lg">
            <Paper p="md" radius="md" bg="gray.0" shadow="xs" withBorder={false}>
              <Text size="sm" fw={600} mb="md" c="dark">Basic information</Text>
              <Stack gap="md">
                <TextInput
                  label="Name"
                  placeholder="e.g. Job posting"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formNameError) setFormNameError('');
                  }}
                  error={formNameError}
                  required
                  size="sm"
                />
                <Textarea
                  label="Description"
                  placeholder="Brief description of what this feature includes"
                  value={formDescription}
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                    if (formDescriptionError) setFormDescriptionError('');
                  }}
                  error={formDescriptionError}
                  required
                  minRows={3}
                  maxRows={6}
                  size="sm"
                  autosize
                />
              </Stack>
            </Paper>

            <Paper p="md" radius="md" bg="gray.0" shadow="xs" withBorder={false}>
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs" mb="xs">
                <Box>
                  <Text size="sm" fw={600} c="dark">Pricing plan</Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    One plan per feature. Time period in days (e.g. 28 for monthly).
                  </Text>
                </Box>
                {/* Only one plan per feature — "Add plan" disabled intentionally */}
              </Group>
              <Stack gap="sm">
                {formPlans.map((row, index) => (
                  <Paper key={index} p="sm" radius="sm" bg="white" shadow="xs" withBorder={false}>
                    <Group gap="md" align="flex-start" wrap="wrap">
                      <TextInput
                        label="Price"
                        placeholder="0"
                        type="number"
                        min={0}
                        value={row.price}
                        onChange={(e) => updatePlanRow(index, 'price', e.target.value)}
                        size="sm"
                        style={{ minWidth: isMobile ? '100%' : 100 }}
                        leftSection={<IconCurrencyDollar size={14} style={{ opacity: 0.6 }} />}
                      />
                      <TextInput
                        label="Time period (days)"
                        placeholder="e.g. 28"
                        value={row.timePeriod}
                        onChange={(e) => updatePlanRow(index, 'timePeriod', e.target.value)}
                        size="sm"
                        style={{ flex: 1, minWidth: isMobile ? '100%' : 140 }}
                      />
                      {/* Single plan only — no Remove (pairs with no "Add plan") */}
                      {/* <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => removePlanRow(index)}
                        disabled={formPlans.length <= 1}
                      >
                        Remove
                      </Button> */}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>

            <Divider />

            <Group justify="flex-end" gap="sm" wrap="wrap">
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateOrUpdate}
                loading={!!actionLoading}
                leftSection={!actionLoading && (editingFeature ? <IconEdit size={16} /> : <IconPlus size={16} />)}
              >
                {editingFeature ? 'Update Feature' : 'Create Feature'}
              </Button>
            </Group>
          </Stack>
        </ScrollArea.Autosize>
      </Modal>
    </Box>
  );
};

export default Features;
