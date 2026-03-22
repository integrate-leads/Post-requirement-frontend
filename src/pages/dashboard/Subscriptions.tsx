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
  TextInput,
  Select,
  ActionIcon,
  ScrollArea,
  Switch,
  Skeleton,
  Pagination,
  Divider,
  Grid,
  Autocomplete,
  Loader,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconPlus, IconEdit, IconSearch, IconTrash, IconCreditCard } from '@tabler/icons-react';
import { useMediaQuery, useDebouncedValue } from '@mantine/hooks';
import { format, differenceInCalendarDays } from 'date-fns';
import { API_ENDPOINTS, apiRequest } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';
import { DashboardPageHeader, DASHBOARD_TABLE_CARD_PROPS, DASHBOARD_TABLE_PROPS, DASHBOARD_TABLE_STYLES } from '@/components/dashboard';

interface Subscription {
  id: number | string;
  _id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  featureId?: string;
  featureName?: string;
  /** First feature's price (for edit modal); totalPayment is subscription-level total */
  price?: string;
  totalPayment?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  /** All features when loaded (for edit modal multi-row) */
  subscriptionFeatures?: { subscriptionFeatureId?: number; featureId: number; price: string | number; timePeriod: string; startDate: string; endDate: string; feature?: { id: number; name: string } }[];
}

interface FeatureFormRow {
  subscriptionFeatureId?: number;
  featureId: string;
  /** Name from API when editing or after pick — keeps label if id not in current search results */
  featureLabel?: string;
  price: string;
  startDate: Date | null;
  endDate: Date | null;
  timePeriod: string;
}

const EMPTY_FEATURE_ROW: FeatureFormRow = {
  featureId: '',
  featureLabel: '',
  price: '',
  startDate: null,
  endDate: null,
  timePeriod: '',
};

interface CatalogFeature {
  id: number;
  name: string;
}

interface AdminOption {
  id: number;
  name: string;
  email: string;
}

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
  const [recruiterDisplay, setRecruiterDisplay] = useState('');
  const [recruiterSuggestions, setRecruiterSuggestions] = useState<AdminOption[]>([]);
  const [recruiterSearchLoading, setRecruiterSearchLoading] = useState(false);
  const [formRecruiterError, setFormRecruiterError] = useState('');
  const [featureRows, setFeatureRows] = useState<FeatureFormRow[]>([EMPTY_FEATURE_ROW]);

  /** Super-admin feature catalog for subscription modal (searchable) */
  const [featureSearch, setFeatureSearch] = useState('');
  const [debouncedFeatureSearch] = useDebouncedValue(featureSearch, 300);
  const [featureOptions, setFeatureOptions] = useState<CatalogFeature[]>([]);
  const [featuresCatalogLoading, setFeaturesCatalogLoading] = useState(false);

  const [debouncedRecruiterSearch] = useDebouncedValue(recruiterDisplay, 300);
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
          const features = s.subscriptionFeatures ?? [];
          return {
            id: s.id,
            userId: String(s.adminId),
            userName: s.admin?.name,
            userEmail: s.admin?.email,
            featureId: firstFeature ? String(firstFeature.featureId) : undefined,
            featureName: firstFeature?.feature?.name,
            price: firstFeature != null ? String(firstFeature.price) : undefined,
            totalPayment: String(s.totalPayment),
            status: s.status,
            startDate: firstFeature?.startDate,
            endDate: firstFeature?.endDate,
            subscriptionFeatures: features.map((f) => ({
              subscriptionFeatureId: f.id,
              featureId: f.featureId,
              price: f.price,
              timePeriod: f.timePeriod,
              startDate: f.startDate,
              endDate: f.endDate,
              feature: f.feature,
            })),
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

  // Fetch recruiter suggestions for Create/Edit subscription modal
  useEffect(() => {
    if (!createModalOpen) return;
    const query = debouncedRecruiterSearch.trim();
    if (query.length < 1) {
      setRecruiterSuggestions([]);
      return;
    }
    let cancelled = false;
    setRecruiterSearchLoading(true);
    const params = new URLSearchParams();
    params.set('search', query);
    const url = `${API_ENDPOINTS.SUPER_ADMIN.LIST_ADMINS}?${params.toString()}`;
    apiRequest<{ success?: boolean; admins?: AdminOption[]; data?: AdminOption[] }>(url)
      .then((response) => {
        if (cancelled) return;
        const raw = response.data as { success?: boolean; admins?: AdminOption[]; data?: AdminOption[] } | undefined;
        const list = raw?.admins ?? raw?.data ?? [];
        setRecruiterSuggestions(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setRecruiterSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setRecruiterSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [createModalOpen, debouncedRecruiterSearch]);

  // Fetch features for Create/Edit subscription modal: GET /super-admin/feature?page=1&limit=10&search=
  useEffect(() => {
    if (!createModalOpen) {
      setFeatureSearch('');
      setFeatureOptions([]);
      return;
    }
    let cancelled = false;
    setFeaturesCatalogLoading(true);
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '10');
    const q = debouncedFeatureSearch.trim();
    if (q) params.set('search', q);
    const url = `${API_ENDPOINTS.SUPER_ADMIN.LIST_FEATURES}?${params.toString()}`;
    apiRequest<{
      success?: boolean;
      features?: CatalogFeature[];
      data?: { features?: CatalogFeature[] };
    }>(url)
      .then((response) => {
        if (cancelled) return;
        const raw = response.data as {
          success?: boolean;
          features?: CatalogFeature[];
          data?: { features?: CatalogFeature[] };
        } | undefined;
        const list = raw?.features ?? raw?.data?.features ?? [];
        setFeatureOptions(
          Array.isArray(list)
            ? list.map((f) => ({
                id: Number(f.id),
                name: String(f.name ?? ''),
              }))
            : []
        );
      })
      .catch(() => {
        if (!cancelled) setFeatureOptions([]);
      })
      .finally(() => {
        if (!cancelled) setFeaturesCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [createModalOpen, debouncedFeatureSearch]);

  const featureSelectData = React.useMemo(() => {
    const map = new Map<string, string>();
    featureOptions.forEach((f) => map.set(String(f.id), f.name));
    featureRows.forEach((r) => {
      if (r.featureId && r.featureLabel && !map.has(r.featureId)) {
        map.set(r.featureId, r.featureLabel);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [featureOptions, featureRows]);

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
    setRecruiterDisplay('');
    setRecruiterSuggestions([]);
    setFormRecruiterError('');
    setFeatureSearch('');
    setFeatureRows([EMPTY_FEATURE_ROW]);
    setEditingSubscription(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setFeatureSearch('');
    setFormRecruiterId(sub.userId ?? '');
    setRecruiterDisplay(
      sub.userName && sub.userEmail
        ? `${sub.userName} - ${sub.userEmail}`
        : sub.userId
          ? String(sub.userId)
          : ''
    );
    setRecruiterSuggestions([]);
    setFormRecruiterError('');

    const features = sub.subscriptionFeatures && sub.subscriptionFeatures.length > 0
      ? sub.subscriptionFeatures
      : sub.featureId != null || sub.price != null || sub.startDate != null
        ? [{ featureId: Number(sub.featureId) || 0, price: sub.price ?? sub.totalPayment ?? '', timePeriod: '', startDate: sub.startDate ?? '', endDate: sub.endDate ?? '', feature: sub.featureName ? { id: Number(sub.featureId) || 0, name: sub.featureName } : undefined }]
        : [];

    const rows: FeatureFormRow[] = features.length > 0
      ? features.map((f) => ({
          subscriptionFeatureId: f.subscriptionFeatureId,
          featureId: String(f.featureId),
          featureLabel: f.feature?.name,
          price: String(f.price ?? ''),
          startDate: f.startDate ? new Date(f.startDate) : null,
          endDate: f.endDate ? new Date(f.endDate) : null,
          timePeriod: f.timePeriod || '',
        }))
      : [
          {
            ...EMPTY_FEATURE_ROW,
            featureId: sub.featureId ?? '',
            featureLabel: sub.featureName,
            price: sub.price ?? sub.totalPayment ?? '',
            startDate: sub.startDate ? new Date(sub.startDate) : null,
            endDate: sub.endDate ? new Date(sub.endDate) : null,
            timePeriod: '',
          },
        ];

    setFeatureRows(rows.map(recalcTimePeriodForRow));
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

  const updateFeatureRowFeatureSelect = (
    index: number,
    featureId: string | null,
    selectedLabel?: string
  ) => {
    const id = featureId ?? '';
    const label =
      selectedLabel?.trim() ||
      featureOptions.find((f) => String(f.id) === id)?.name ||
      '';
    setFeatureRows((prev) => {
      const next = [...prev];
      const prevRow = next[index];
      next[index] = {
        ...prevRow,
        featureId: id,
        featureLabel: id ? label || prevRow?.featureLabel || '' : '',
      };
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
      setFormRecruiterError('Please select a recruiter');
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
      subscriptionFeatureId: row.subscriptionFeatureId,
      featureId: Number(row.featureId.trim()),
      price: Number(row.price.trim()),
      timePeriod: row.timePeriod,
      startDate: row.startDate ? format(row.startDate, 'yyyy-MM-dd') : undefined,
      endDate: row.endDate ? format(row.endDate, 'yyyy-MM-dd') : undefined,
    }));

    if (featuresPayload.some((f) => !Number.isFinite(f.featureId) || !Number.isFinite(f.price))) {
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
        const payload = {
          features: featuresPayload.map(({ subscriptionFeatureId, featureId, price, timePeriod, startDate, endDate }) => {
            const item: { featureId: number; price: number; timePeriod: string; startDate?: string; endDate?: string; subscriptionFeatureId?: number } = {
              featureId,
              price,
              timePeriod,
              startDate,
              endDate,
            };
            if (subscriptionFeatureId != null && subscriptionFeatureId > 0) {
              item.subscriptionFeatureId = subscriptionFeatureId;
            }
            return item;
          }),
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

  const subscriptionEmptyState = (
    <Text ta="center" c="dimmed" py="xl" size="sm">
      No subscriptions found.{' '}
      {searchQuery || statusFilter !== 'All'
        ? 'Try adjusting your filters.'
        : 'Create one to get started.'}
    </Text>
  );

  return (
    <Box maw={1200} mx="auto" px="md" py="sm">
      <DashboardPageHeader
        icon={<IconCreditCard size={24} stroke={1.75} />}
        title="Subscriptions"
        description="Manage recruiter subscriptions and their feature plans."
        actions={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreateModal}
            size={isMobile ? 'sm' : 'md'}
            fullWidth={isMobile}
          >
            Create New Subscription
          </Button>
        }
      />
      <Stack gap="md">
        <Group gap="md" align="flex-end" wrap="wrap">
          <TextInput
            placeholder="Search by recruiter..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: isMobile ? undefined : 1, maxWidth: isMobile ? '100%' : 300 }}
            w={{ base: '100%', sm: 300 }}
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
            w={{ base: '100%', sm: 160 }}
          />
        </Group>

      {loading ? (
        <Card shadow="xs" padding="md" withBorder radius="md">
          <Stack gap="sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={isMobile ? 140 : 56} radius="sm" />
            ))}
          </Stack>
        </Card>
      ) : subscriptions.length === 0 ? (
        <Card shadow="sm" padding="md" withBorder radius="md">
          {subscriptionEmptyState}
        </Card>
      ) : isMobile ? (
        <Stack gap="sm">
          {subscriptions.map((s) => (
            <Card key={String(getSubId(s))} shadow="sm" padding="md" withBorder radius="md">
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} lineClamp={1}>
                      {s.userName ?? s.userId ?? '—'}
                    </Text>
                    {s.userEmail && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {s.userEmail}
                      </Text>
                    )}
                  </Box>
                  <Badge color={isActive(s) ? 'green' : 'gray'} variant="light" size="sm">
                    {s.status || (isActive(s) ? 'Active' : 'Inactive')}
                  </Badge>
                </Group>
                <Group gap="md">
                  <Text size="xs" c="dimmed">
                    {s.featureName ?? s.featureId ?? '—'}
                  </Text>
                  {s.totalPayment != null && (
                    <Text size="xs" fw={500}>
                      {s.totalPayment ? `₹${Number(s.totalPayment).toFixed(2)}` : '—'}
                    </Text>
                  )}
                </Group>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    {s.startDate ? format(new Date(s.startDate), 'yyyy-MM-dd') : '—'}
                  </Text>
                  <Text size="xs">→</Text>
                  <Text size="xs" c="dimmed">
                    {s.endDate ? format(new Date(s.endDate), 'yyyy-MM-dd') : '—'}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Switch
                    size="sm"
                    checked={isActive(s)}
                    disabled={!!actionLoading}
                    onChange={() => handleToggleStatus(s)}
                  />
                  <Text size="xs">Status</Text>
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
              </Stack>
            </Card>
          ))}
          {totalPages > 1 && (
            <Group justify="center" mt="xs">
              <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
            </Group>
          )}
        </Stack>
      ) : (
        <Card {...DASHBOARD_TABLE_CARD_PROPS}>
          <ScrollArea type="auto" offsetScrollbars>
            <Table {...DASHBOARD_TABLE_PROPS} styles={DASHBOARD_TABLE_STYLES} miw={900}>
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
                {subscriptions.map((s) => (
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
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {totalPages > 1 && (
            <Group justify="space-between" align="center" mt="md" wrap="wrap" gap="xs">
              <Text size="xs" c="dimmed">
                Page {page} of {totalPages}
              </Text>
              <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
            </Group>
          )}
        </Card>
      )}
      </Stack>

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={
          <Text fw={600} fz="lg">
            {editingSubscription ? 'Edit Subscription' : 'Create New Subscription'}
          </Text>
        }
        fullScreen={isMobile}
        size="xl"
        radius="md"
        padding="lg"
      >
        <Stack gap="lg">
          <Box>
            <Text size="sm" fw={500} mb={4} c="dark.7">
              Recruiter
            </Text>
            <Autocomplete
              placeholder="Enter name or email"
              value={recruiterDisplay}
              onChange={(value) => {
                setRecruiterDisplay(value);
                if (!value) setFormRecruiterId('');
                if (formRecruiterError) setFormRecruiterError('');
              }}
              onOptionSubmit={(optionValue) => {
                const admin = recruiterSuggestions.find(
                  (a) => `${a.name} - ${a.email}` === optionValue
                );
                if (admin) {
                  setFormRecruiterId(String(admin.id));
                  setRecruiterDisplay(optionValue);
                  setFormRecruiterError('');
                }
              }}
              data={recruiterSuggestions.map((a) => `${a.name} - ${a.email}`)}
              rightSection={recruiterSearchLoading ? <Loader size={16} type="dots" /> : undefined}
              error={formRecruiterError}
              required
              size="sm"
            />
          </Box>

          <Divider label="Features" labelPosition="left" />

          <Box>
            <Group justify="space-between" mb="sm">
              <Text size="xs" c="dimmed">
                Add one or more features with price and date range. Duration is auto-calculated from start and end date.
              </Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={addFeatureRow}
              >
                Add feature
              </Button>
            </Group>

            <ScrollArea.Autosize mah={320} type="scroll" offsetScrollbars>
              <Stack gap="md">
                {featureRows.map((row, index) => (
                  <Card
                    key={`feature-row-${row.subscriptionFeatureId ?? 'n'}-${index}`}
                    withBorder
                    padding="md"
                    radius="sm"
                    bg="gray.0"
                  >
                    <Group justify="space-between" mb="sm">
                      <Text size="sm" fw={600} c="dark.6">
                        Feature {index + 1}
                      </Text>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => removeFeatureRow(index)}
                        disabled={featureRows.length <= 1}
                      >
                        Remove
                      </Button>
                    </Group>
                    <Grid gutter="sm">
                      <Grid.Col span={{ base: 12, xs: 6 }}>
                        <Select
                          label="Feature"
                          placeholder="Search by name..."
                          description=""
                          searchable
                          clearable
                          required
                          size="sm"
                          data={featureSelectData}
                          value={row.featureId || null}
                          onChange={(v, option) =>
                            updateFeatureRowFeatureSelect(index, v, option?.label)
                          }
                          onSearchChange={setFeatureSearch}
                          filter={({ options }) => options}
                          nothingFoundMessage={
                            featuresCatalogLoading ? 'Loading…' : 'No features match your search'
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 6 }}>
                        <TextInput
                          label="Price"
                          placeholder="e.g. 899"
                          type="number"
                          value={row.price}
                          onChange={(e) => updateFeatureRowField(index, 'price', e.target.value)}
                          required
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 6 }}>
                        <DateInput
                          label="Start Date"
                          placeholder="Pick start date"
                          value={row.startDate}
                          onChange={(date) => updateFeatureRowDate(index, 'startDate', date)}
                          valueFormat="YYYY-MM-DD"
                          clearable
                          required
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 6 }}>
                        <DateInput
                          label="End Date"
                          placeholder="Pick end date"
                          value={row.endDate}
                          onChange={(date) => updateFeatureRowDate(index, 'endDate', date)}
                          valueFormat="YYYY-MM-DD"
                          clearable
                          required
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Group gap="xs" align="center">
                          <Text size="xs" c="dimmed">
                            Duration:
                          </Text>
                          {row.timePeriod ? (
                            <Badge size="sm" variant="light" color="gray">
                              {row.timePeriod} days (auto)
                            </Badge>
                          ) : (
                            <Text size="xs" c="dimmed" fs="italic">
                              Set start and end date
                            </Text>
                          )}
                        </Group>
                      </Grid.Col>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          </Box>

          <Divider />

          <Group justify="flex-end" gap="sm" wrap="wrap">
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              fullWidth={isMobile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrUpdate}
              loading={!!actionLoading}
              fullWidth={isMobile}
            >
              {editingSubscription ? 'Update subscription' : 'Create subscription'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Subscriptions;
