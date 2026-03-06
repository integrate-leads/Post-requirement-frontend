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
import { IconPlus, IconEdit, IconSearch } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { format } from 'date-fns';
import { API_ENDPOINTS, apiRequest } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';

interface Subscription {
  id: string;
  _id?: string;
  userId?: string;
  userName?: string;
  planId?: string;
  featureId?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
}

const SUBSCRIPTIONS_LIST_DEFAULT: Subscription[] = [];

const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(SUBSCRIPTIONS_LIST_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Create/Edit form state
  const [formUserId, setFormUserId] = useState('');
  const [formPlanId, setFormPlanId] = useState('');
  const [formStartDate, setFormStartDate] = useState<Date | null>(null);
  const [formEndDate, setFormEndDate] = useState<Date | null>(null);
  const [formStatus, setFormStatus] = useState<string>('Active');
  const [formAutoRenew, setFormAutoRenew] = useState(false);
  const [formUserIdError, setFormUserIdError] = useState('');
  const [formPlanIdError, setFormPlanIdError] = useState('');
  const [formStartDateError, setFormStartDateError] = useState('');
  const [formEndDateError, setFormEndDateError] = useState('');

  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', String(page));
      params.append('limit', String(perPage));
      const url = `${API_ENDPOINTS.SUPER_ADMIN.LIST_SUBSCRIPTIONS}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest<{
        success: boolean;
        subscriptions?: Subscription[];
        data?: { subscriptions?: Subscription[]; pagination?: { totalPages?: number } };
      }>(url);

      if (response.data?.success) {
        const list = response.data.subscriptions ?? response.data.data?.subscriptions ?? [];
        setSubscriptions(list);
        const total = response.data.data?.pagination?.totalPages ?? 1;
        setTotalPages(total);
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
  }, [page, searchQuery]);

  const getSubId = (s: Subscription) => s._id || s.id;
  const isActive = (s: Subscription) => s.status?.toLowerCase() === 'active';

  const handleToggleStatus = async (sub: Subscription) => {
    const id = getSubId(sub);
    setActionLoading(id);
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.TOGGLE_SUBSCRIPTION(id),
        { method: 'PATCH' }
      );
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Subscription status updated', color: 'green' });
        fetchSubscriptions();
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
    setFormUserId('');
    setFormPlanId('');
    setFormStartDate(null);
    setFormEndDate(null);
    setFormStatus('Active');
    setFormAutoRenew(false);
    setFormUserIdError('');
    setFormPlanIdError('');
    setFormStartDateError('');
    setFormEndDateError('');
    setEditingSubscription(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setFormUserId(sub.userId ?? sub.userName ?? '');
    setFormPlanId(sub.planId ?? sub.featureId ?? '');
    setFormStartDate(sub.startDate ? new Date(sub.startDate) : null);
    setFormEndDate(sub.endDate ? new Date(sub.endDate) : null);
    setFormStatus(sub.status || 'Active');
    setFormAutoRenew(sub.autoRenew ?? false);
    setFormUserIdError('');
    setFormPlanIdError('');
    setFormStartDateError('');
    setFormEndDateError('');
    setEditingSubscription(sub);
    setCreateModalOpen(true);
  };

  const validateForm = () => {
    let hasError = false;
    if (!formUserId.trim()) {
      setFormUserIdError('User ID is required');
      hasError = true;
    } else setFormUserIdError('');
    if (!formPlanId.trim()) {
      setFormPlanIdError('Plan ID is required');
      hasError = true;
    } else setFormPlanIdError('');
    if (!formStartDate) {
      setFormStartDateError('Start date is required');
      hasError = true;
    } else setFormStartDateError('');
    if (!formEndDate) {
      setFormEndDateError('End date is required');
      hasError = true;
    } else setFormEndDateError('');
    return !hasError;
  };

  const handleCreateOrUpdate = async () => {
    if (!validateForm()) return;

    setActionLoading(editingSubscription ? getSubId(editingSubscription) : 'create');
    try {
      const payload = {
        userId: formUserId.trim(),
        planId: formPlanId.trim(),
        featureId: formPlanId.trim(),
        startDate: formStartDate ? formStartDate.toISOString().split('T')[0] : undefined,
        endDate: formEndDate ? formEndDate.toISOString().split('T')[0] : undefined,
        status: formStatus,
        autoRenew: formAutoRenew,
      };

      if (editingSubscription) {
        const response = await apiRequest<{ success: boolean }>(
          API_ENDPOINTS.SUPER_ADMIN.UPDATE_SUBSCRIPTION(getSubId(editingSubscription)),
          { method: 'PUT', data: payload }
        );
        if (response.data?.success) {
          notifications.show({ title: 'Success', message: 'Subscription updated', color: 'green' });
          setCreateModalOpen(false);
          fetchSubscriptions();
        } else {
          notifications.show({ title: 'Error', message: response.error || 'Failed to update', color: 'red' });
        }
      } else {
        const response = await apiRequest<{ success: boolean }>(
          API_ENDPOINTS.SUPER_ADMIN.CREATE_SUBSCRIPTION,
          { method: 'POST', data: payload }
        );
        if (response.data?.success) {
          notifications.show({ title: 'Success', message: 'Subscription created', color: 'green' });
          setCreateModalOpen(false);
          fetchSubscriptions();
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
          <Title order={2}>Subscriptions</Title>
          <Text c="dimmed" size="sm">Manage user subscriptions and duration</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal} size={isMobile ? 'sm' : 'md'}>
          Create New Subscription
        </Button>
      </Group>

      <Group mb="lg" gap="md">
        <TextInput
          placeholder="Search by user or plan..."
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
            <Table striped highlightOnHover miw={800}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Plan / Feature ID</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Start Date</Table.Th>
                  <Table.Th>End Date</Table.Th>
                  <Table.Th>Auto Renew</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {subscriptions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="xl">No subscriptions yet. Create one to get started.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  subscriptions.map((s) => (
                    <Table.Tr key={getSubId(s)}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{s.userName ?? s.userId ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{s.planId ?? s.featureId ?? '—'}</Text>
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
                        <Badge variant="light" size="sm" color={s.autoRenew ? 'blue' : 'gray'}>
                          {s.autoRenew ? 'Yes' : 'No'}
                        </Badge>
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

      {/* Create / Edit Subscription Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={<Text fw={600}>{editingSubscription ? 'Edit Subscription' : 'Create New Subscription'}</Text>}
        fullScreen={isMobile}
      >
        <Stack gap="md">
          <TextInput
            label="User ID"
            placeholder="Enter user ID"
            value={formUserId}
            onChange={(e) => {
              setFormUserId(e.target.value);
              if (formUserIdError) setFormUserIdError('');
            }}
            error={formUserIdError}
            required
          />
          <TextInput
            label="Plan ID"
            placeholder="Enter plan ID"
            value={formPlanId}
            onChange={(e) => {
              setFormPlanId(e.target.value);
              if (formPlanIdError) setFormPlanIdError('');
            }}
            error={formPlanIdError}
            required
          />
          <DateInput
            label="Start Date"
            placeholder="Pick start date"
            value={formStartDate}
            onChange={setFormStartDate}
            valueFormat="YYYY-MM-DD"
            clearable
          />
          {formStartDateError && (
            <Text size="xs" c="red">{formStartDateError}</Text>
          )}
          <DateInput
            label="End Date"
            placeholder="Pick end date"
            value={formEndDate}
            onChange={setFormEndDate}
            valueFormat="YYYY-MM-DD"
            clearable
          />
          {formEndDateError && (
            <Text size="xs" c="red">{formEndDateError}</Text>
          )}
          <Select
            label="Status"
            placeholder="Select status"
            data={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
            value={formStatus}
            onChange={(v) => setFormStatus(v ?? 'Active')}
            required
          />
          <Group align="center" gap="sm">
            <Text size="sm" fw={500}>Auto Renew</Text>
            <Switch
              checked={formAutoRenew}
              onChange={(e) => setFormAutoRenew(e.currentTarget.checked)}
              label={formAutoRenew ? 'Yes' : 'No'}
            />
          </Group>
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
