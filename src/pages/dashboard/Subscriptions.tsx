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
  Select,
  ActionIcon,
  ScrollArea,
  Switch,
  Skeleton,
  Pagination,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconPlus, IconEdit, IconSearch, IconTrash } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { format, differenceInCalendarDays } from 'date-fns';
import { API_ENDPOINTS, apiRequest } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';

interface Subscription {
  id: number | string;
  _id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  featureId?: string;
  featureName?: string;
  totalPayment?: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface FeatureFormRow {
  featureId: string;
  price: string;
  startDate: Date | null;
  endDate: Date | null;
  timePeriod: string;
}

const EMPTY_FEATURE_ROW: FeatureFormRow = {
  featureId: '',
  price: '',
  startDate: null,
  endDate: null,
  timePeriod: '',
};

const SUBSCRIPTIONS_LIST_DEFAULT: Subscription[] = [];

const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(SUBSCRIPTIONS_LIST_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Create/Edit form state
  const [formRecruiterId, setFormRecruiterId] = useState('');
  const [formRecruiterError, setFormRecruiterError] = useState('');
  const [featureRows, setFeatureRows] = useState<FeatureFormRow[]>([EMPTY_FEATURE_ROW]);

  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', String(perPage));

      const url = `${API_ENDPOINTS.SUPER_ADMIN.LIST_SUBSCRIPTIONS}${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const response = await apiRequest<{
        success?: boolean;
        total?: number;
        currentPage?: number;
        totalPages?: number;
        subscriptions?: {
          id: number;
          adminId: number;
          totalPayment: string | number;
          status: string;
          createdAt: string;
          updatedAt: string;
          admin?: { id: number; name: string; email: string };
          subscriptionFeatures?: {
            id: number;
            featureId: number;
            subscriptionId: number;
            price: string | number;
            timePeriod: string;
            startDate: string;
            endDate: string;
            feature?: { id: number; name: string };
          }[];
        }[];
      }>(url);

      if (response.data?.success) {
        const apiSubs = response.data.subscriptions ?? [];
        const mapped: Subscription[] = apiSubs.map((s) => {
          const firstFeature = s.subscriptionFeatures?.[0];
          return {
            id: s.id,
            userId: String(s.adminId),
            userName: s.admin?.name,
            userEmail: s.admin?.email,
            featureId: firstFeature ? String(firstFeature.featureId) : undefined,
            featureName: firstFeature?.feature?.name,
            totalPayment: String(s.totalPayment),
            status: s.status,
            startDate: firstFeature?.startDate,
            endDate: firstFeature?.endDate,
          };
        });

        setSubscriptions(mapped);
        const totalPages =
          response.data.totalPages ??
          (response.data.total ? Math.max(1, Math.ceil(response.data.total / perPage)) : 1);
        setTotalPages(totalPages);
      } else {
        setSubscriptions([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, searchQuery, statusFilter]);

  const getSubId = (s: Subscription) => s._id || s.id;

  const isActive = (s: Subscription) => s.status?.toLowerCase() === 'active';

  const recalcTimePeriodForRow = (row: FeatureFormRow): FeatureFormRow => {
    if (row.startDate && row.endDate) {
      const days = differenceInCalendarDays(row.endDate, row.startDate);
      if (days <= 0) {
        notifications.show({
          title: 'Invalid dates',
          message: 'End date must be after start date.',
          color: 'red',
        });
        return { ...row, timePeriod: '' };
      }
      return { ...row, timePeriod: String(days) };
    }
    return { ...row, timePeriod: '' };
  };

  const handleToggleStatus = async (sub: Subscription) => {
    const id = getSubId(sub);
    setActionLoading(id);
    try {
      const endpoint = isActive(sub)
        ? API_ENDPOINTS.SUPER_ADMIN.DEACTIVATE_SUBSCRIPTION(id)
        : API_ENDPOINTS.SUPER_ADMIN.ACTIVATE_SUBSCRIPTION(id);

      const response = await apiRequest<{ success?: boolean }>(endpoint, { method: 'PATCH' });
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Subscription status updated', color: 'green' });
        fetchSubscriptions();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to update status', color: 'red' });
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update status', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  const openCreateModal = () => {
    setFormRecruiterId('');
    setFormRecruiterError('');
    setFeatureRows([EMPTY_FEATURE_ROW]);
    setEditingSubscription(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setFormRecruiterId(sub.userId ?? '');
    setFormRecruiterError('');
    const firstRow: FeatureFormRow = {
      featureId: sub.featureId ?? '',
      price: '',
      startDate: sub.startDate ? new Date(sub.startDate) : null,
      endDate: sub.endDate ? new Date(sub.endDate) : null,
      timePeriod: '',
    };
    setFeatureRows([recalcTimePeriodForRow(firstRow)]);
    setEditingSubscription(sub);
    setCreateModalOpen(true);
  };

  const addFeatureRow = () => {
    setFeatureRows((prev) => [...prev, { ...EMPTY_FEATURE_ROW }]);
  };

  const removeFeatureRow = (index: number) => {
    setFeatureRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateFeatureRowField = (
    index: number,
    field: keyof Omit<FeatureFormRow, 'startDate' | 'endDate'>,
    value: string
  ) => {
    setFeatureRows((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      next[index] = row;
      return next;
    });
  };

  const updateFeatureRowDate = (index: number, field: 'startDate' | 'endDate', value: Date | null) => {
    setFeatureRows((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      next[index] = recalcTimePeriodForRow(row);
      return next;
    });
  };

  const validateForm = () => {
    let hasError = false;
    if (!formRecruiterId.trim()) {
      setFormRecruiterError('Recruiter ID is required');
      hasError = true;
    } else {
      setFormRecruiterError('');
    }

    if (featureRows.length === 0) {
      notifications.show({
        title: 'Add at least one feature',
        message: 'Please add at least one feature with price and dates.',
        color: 'red',
      });
      hasError = true;
    }

    featureRows.forEach((row, idx) => {
      if (!row.featureId.trim() || !row.price.trim() || !row.startDate || !row.endDate) {
        notifications.show({
          title: 'Missing data',
          message: `Please complete all fields for feature row #${idx + 1}.`,
          color: 'red',
        });
        hasError = true;
      } else if (!row.timePeriod || isNaN(Number(row.timePeriod))) {
        notifications.show({
          title: 'Invalid time period',
          message: `Time period for feature row #${idx + 1} must be in days (numbers only).`,
          color: 'red',
        });
        hasError = true;
      }
    });

    return !hasError;
  };

  const handleCreateOrUpdate = async () => {
    if (!validateForm()) return;

    const recruiterIdNum = Number(formRecruiterId.trim());
    if (!Number.isFinite(recruiterIdNum)) {
      notifications.show({
        title: 'Invalid recruiter ID',
        message: 'Recruiter ID must be a number.',
        color: 'red',
      });
      return;
    }

    const featuresPayload = featureRows.map((row) => ({
      id: Number(row.featureId.trim()),
      price: Number(row.price.trim()),
      timePeriod: row.timePeriod,
      startDate: row.startDate ? format(row.startDate, 'yyyy-MM-dd') : undefined,
      endDate: row.endDate ? format(row.endDate, 'yyyy-MM-dd') : undefined,
    }));

    if (featuresPayload.some((f) => !Number.isFinite(f.id) || !Number.isFinite(f.price))) {
      notifications.show({
        title: 'Invalid feature data',
        message: 'Feature ID and price must be valid numbers.',
        color: 'red',
      });
      return;
    }

    setActionLoading(editingSubscription ? getSubId(editingSubscription) : 'create');
    try {
      if (editingSubscription) {
        const first = featuresPayload[0];
        const payload = {
          price: first.price,
          timePeriod: first.timePeriod,
          startDate: first.startDate,
          endDate: first.endDate,
          featureIds: featuresPayload.map((f) => f.id),
        };

        const response = await apiRequest<{ success?: boolean }>(
          API_ENDPOINTS.SUPER_ADMIN.UPDATE_SUBSCRIPTION(getSubId(editingSubscription)),
          { method: 'PATCH', data: payload }
        );
        if (response.data?.success) {
          notifications.show({ title: 'Success', message: 'Subscription updated', color: 'green' });
          setCreateModalOpen(false);
          fetchSubscriptions();
        } else {
          notifications.show({
            title: 'Error',
            message: response.error || 'Failed to update subscription',
            color: 'red',
          });
        }
      } else {
        const payload = {
          recruiterId: recruiterIdNum,
          features: featuresPayload,
        };

        const response = await apiRequest<{ success?: boolean }>(
          API_ENDPOINTS.SUPER_ADMIN.CREATE_SUBSCRIPTION,
          { method: 'POST', data: payload }
        );
        if (response.data?.success) {
          notifications.show({
            title: 'Success',
            message: 'Subscription plan created successfully',
            color: 'green',
          });
          setCreateModalOpen(false);
          fetchSubscriptions();
        } else {
          notifications.show({
            title: 'Error',
            message: response.error || 'Failed to create subscription',
            color: 'red',
          });
        }
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message || error?.response?.data?.error || 'Something went wrong';
      notifications.show({ title: 'Error', message: backendMessage, color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Box maw={1200} mx="auto">
      <Group justify="space-between" mb="xl" wrap="wrap" gap="md">
        <Box>
          <Title order={2}>Subscriptions</Title>
          <Text c="dimmed" size="sm">
            Manage recruiter subscriptions and their feature plans.
          </Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal} size={isMobile ? 'sm' : 'md'}>
          Create New Subscription
        </Button>
      </Group>

      <Group mb="lg" gap="md">
        <TextInput
          placeholder="Search by recruiter..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, maxWidth: 300 }}
        />
        <Select
          placeholder="Filter by status"
          data={[
            { value: 'All', label: 'All' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter((v as 'All' | 'Active' | 'Inactive') ?? 'All')}
          style={{ width: 160 }}
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
            <Table striped highlightOnHover miw={900}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Recruiter</Table.Th>
                  <Table.Th>Feature</Table.Th>
                  <Table.Th>Total Payment</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Start Date</Table.Th>
                  <Table.Th>End Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {subscriptions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="xl">
                        No subscriptions found.{' '}
                        {searchQuery || statusFilter !== 'All'
                          ? 'Try adjusting your filters.'
                          : 'Create one to get started.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  subscriptions.map((s) => (
                    <Table.Tr key={String(getSubId(s))}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{s.userName ?? s.userId ?? '—'}</Text>
                        {s.userEmail && (
                          <Text size="xs" c="dimmed">
                            {s.userEmail}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{s.featureName ?? s.featureId ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {s.totalPayment ? `₹${Number(s.totalPayment).toFixed(2)}` : '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={isActive(s) ? 'green' : 'gray'} variant="light" size="sm">
                          {s.status || (isActive(s) ? 'Active' : 'Inactive')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {s.startDate ? format(new Date(s.startDate), 'yyyy-MM-dd') : '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {s.endDate ? format(new Date(s.endDate), 'yyyy-MM-dd') : '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Switch
                            size="sm"
                            checked={isActive(s)}
                            disabled={!!actionLoading}
                            onChange={() => handleToggleStatus(s)}
                          />
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            onClick={() => openEditModal(s)}
                            loading={actionLoading === getSubId(s)}
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

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={<Text fw={600}>{editingSubscription ? 'Edit Subscription' : 'Create New Subscription'}</Text>}
        fullScreen={isMobile}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Recruiter ID"
            placeholder="Enter recruiter (admin) ID"
            value={formRecruiterId}
            onChange={(e) => {
              setFormRecruiterId(e.target.value);
              if (formRecruiterError) setFormRecruiterError('');
            }}
            error={formRecruiterError}
            required
          />

          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Features</Text>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addFeatureRow}>
                Add feature
              </Button>
            </Group>
            <Text size="xs" c="dimmed" mb="xs">
              Each feature will have its own price and date range. Time period is auto-calculated in days from
              start to end date and cannot be changed.
            </Text>

            <Stack gap="xs">
              {featureRows.map((row, index) => (
                <Group key={index} gap="xs" align="flex-end" wrap="wrap">
                  <TextInput
                    label="Feature ID"
                    placeholder="e.g. 2"
                    value={row.featureId}
                    onChange={(e) => updateFeatureRowField(index, 'featureId', e.target.value)}
                    style={{ width: 120 }}
                    required
                  />
                  <TextInput
                    label="Price"
                    placeholder="e.g. 899"
                    type="number"
                    value={row.price}
                    onChange={(e) => updateFeatureRowField(index, 'price', e.target.value)}
                    style={{ width: 140 }}
                    required
                  />
                  <DateInput
                    label="Start Date"
                    placeholder="Pick start date"
                    value={row.startDate}
                    onChange={(date) => updateFeatureRowDate(index, 'startDate', date)}
                    valueFormat="YYYY-MM-DD"
                    clearable
                    required
                    style={{ minWidth: 160 }}
                  />
                  <DateInput
                    label="End Date"
                    placeholder="Pick end date"
                    value={row.endDate}
                    onChange={(date) => updateFeatureRowDate(index, 'endDate', date)}
                    valueFormat="YYYY-MM-DD"
                    clearable
                    required
                    style={{ minWidth: 160 }}
                  />
                  <TextInput
                    label="Time period (days)"
                    value={row.timePeriod}
                    readOnly
                    disabled
                    placeholder="-"
                    style={{ width: 160 }}
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeFeatureRow(index)}
                    disabled={featureRows.length <= 1}
                    aria-label="Remove feature"
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
              {editingSubscription ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Subscriptions;
