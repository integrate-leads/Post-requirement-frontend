import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  Group,
  Pagination,
  Paper,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Badge,
  Modal,
  Button,
  Tooltip,
} from '@mantine/core';
import { IconSearch, IconList, IconEye, IconUsers, IconChartBar, IconFileText } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { DashboardPageHeader, DASHBOARD_TABLE_CARD_PROPS, DASHBOARD_TABLE_PROPS, DASHBOARD_TABLE_STYLES } from '@/components/dashboard';

/** Must match API `status` query values */
export const CAMPAIGN_STATUS_TABS = [
  'Processing',
  'Completed',
  'Failed',
  'Queued',
  'Scheduled',
] as const;

export type CampaignStatusTab = (typeof CAMPAIGN_STATUS_TABS)[number];

/** Must match API default `pagination.pageSize` */
const CAMPAIGN_PAGE_SIZE = 10;

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Expected API shape:
 * {
 *   success, message, data: [],
 *   pagination: { totalRecords, totalPages, currentPage, pageSize }
 * }
 */
function parseCampaignListResponse(
  raw: unknown,
  requestedPage: number,
  requestedLimit: number
): {
  rows: Record<string, unknown>[];
  totalPages: number;
  totalRecords: number;
  pageSize: number;
} {
  const root = raw as Record<string, unknown> | null | undefined;
  const empty = {
    rows: [] as Record<string, unknown>[],
    totalPages: 0,
    totalRecords: 0,
    pageSize: requestedLimit,
  };
  if (!root) return empty;

  let list: unknown[] = [];
  if (Array.isArray(root.data)) {
    list = root.data;
  } else if (Array.isArray(root)) {
    list = root;
  } else if (root.data && typeof root.data === 'object') {
    const d = root.data as Record<string, unknown>;
    if (Array.isArray(d.data)) list = d.data as unknown[];
    else if (Array.isArray(d.campaigns)) list = d.campaigns as unknown[];
  } else if (Array.isArray(root.campaigns)) {
    list = root.campaigns;
  }

  const rows = list
    .filter((x) => x && typeof x === 'object')
    .map((x) => x as Record<string, unknown>);

  const p = root.pagination as Record<string, unknown> | undefined;
  if (p && typeof p === 'object') {
    const totalRecords = Math.max(0, num(p.totalRecords, 0));
    const pageSize = num(p.pageSize, requestedLimit) || requestedLimit;
    let totalPages = Math.max(0, Math.floor(num(p.totalPages, 0)));

    if (totalPages <= 0 && totalRecords > 0 && pageSize > 0) {
      totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    }

    return { rows, totalPages, totalRecords, pageSize };
  }

  // Fallback when pagination object missing
  return {
    rows,
    totalPages: rows.length > 0 ? 1 : 0,
    totalRecords: rows.length,
    pageSize: requestedLimit,
  };
}

function formatCell(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }
  if (v instanceof Date) return v.toISOString();
  try {
    return JSON.stringify(v);
  } catch {
    return '—';
  }
}

function campaignName(row: Record<string, unknown>): string {
  const n =
    row.campaignName ??
    row.name ??
    row.title ??
    row.campaign_name ??
    row.label;
  return n != null && String(n).trim() ? String(n) : '—';
}

function campaignId(row: Record<string, unknown>): string {
  const id = row.id ?? row.campaignId ?? row._id;
  return id != null ? String(id) : '—';
}

/** API `analytics` object — keys are capitalized */
const ANALYTICS_KEYS = ['Sent', 'Bounced', 'Complaint', 'Failed', 'Pending'] as const;
export type AnalyticsKey = (typeof ANALYTICS_KEYS)[number];

export interface CampaignAnalytics {
  Sent: number;
  Bounced: number;
  Complaint: number;
  Failed: number;
  Pending: number;
}

function parseAnalytics(row: Record<string, unknown>): CampaignAnalytics {
  const raw = row.analytics;
  const base: CampaignAnalytics = {
    Sent: 0,
    Bounced: 0,
    Complaint: 0,
    Failed: 0,
    Pending: 0,
  };
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  for (const k of ANALYTICS_KEYS) {
    const v = o[k] ?? o[k.toLowerCase()];
    const n = Number(v);
    base[k] = Number.isFinite(n) ? n : 0;
  }
  return base;
}

const ANALYTICS_META: Record<
  AnalyticsKey,
  { label: string; color: string; description: string }
> = {
  Sent: { label: 'Sent', color: 'green', description: 'Delivered / sent successfully' },
  Bounced: { label: 'Bounced', color: 'gray', description: 'Hard or soft bounces' },
  Complaint: { label: 'Complaint', color: 'orange', description: 'Spam complaints' },
  Failed: { label: 'Failed', color: 'red', description: 'Send failures' },
  Pending: { label: 'Pending', color: 'yellow', description: 'Still in queue' },
};

function rowStatusBadgeColor(statusStr: string): string {
  const s = statusStr.toLowerCase();
  if (s.includes('complete')) return 'green';
  if (s.includes('fail')) return 'red';
  if (s.includes('process')) return 'blue';
  if (s.includes('queue')) return 'yellow';
  if (s.includes('schedul')) return 'violet';
  return 'gray';
}

function formatDateTime(v: unknown): string {
  if (v == null || v === '') return '—';
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return formatCell(v);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function hasTimestamp(v: unknown): boolean {
  if (v == null || v === '') return false;
  const d = new Date(String(v));
  return !Number.isNaN(d.getTime());
}

/** Compact modal date rows — skip empty values (no "Scheduled: —") */
function ModalScheduleSummary({ row }: { row: Record<string, unknown> }) {
  const items: { label: string; value: string }[] = [];
  if (hasTimestamp(row.createdAt)) {
    items.push({ label: 'Created', value: formatDateTime(row.createdAt) });
  }
  if (hasTimestamp(row.completedAt)) {
    items.push({ label: 'Completed', value: formatDateTime(row.completedAt) });
  }
  if (hasTimestamp(row.scheduledAt)) {
    items.push({ label: 'Scheduled', value: formatDateTime(row.scheduledAt) });
  }
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No schedule timestamps returned for this campaign.
      </Text>
    );
  }
  return (
    <Stack gap={6}>
      {items.map((item) => (
        <Group key={item.label} justify="space-between" wrap="nowrap" gap="md">
          <Text size="sm" c="dimmed" w={90} style={{ flexShrink: 0 }}>
            {item.label}
          </Text>
          <Text size="sm" fw={500} ta="right" style={{ minWidth: 0 }}>
            {item.value}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

function CampaignAnalyticsHero({ analytics }: { analytics: CampaignAnalytics }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
      {(Object.keys(ANALYTICS_META) as AnalyticsKey[]).map((key) => {
        const meta = ANALYTICS_META[key];
        return (
          <Paper key={key} p="md" radius="md" withBorder bg="gray.0">
            <Text size="xs" tt="uppercase" c="dimmed" fw={600} mb={4}>
              {meta.label}
            </Text>
            <Text fw={800} size="xl" c={meta.color}>
              {analytics[key]}
            </Text>
            <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
              {meta.description}
            </Text>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}

const EmailBroadcastCampaignsList: React.FC = () => {
  const [status, setStatus] = useState<CampaignStatusTab>('Processing');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 350);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(CAMPAIGN_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null);
  const [detailTab, setDetailTab] = useState<string>('campaign');

  useEffect(() => {
    if (detailRow) setDetailTab('campaign');
  }, [detailRow]);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = API_ENDPOINTS.ADMIN.EMAIL_BROAD_CAMPAIGNS(
        page,
        CAMPAIGN_PAGE_SIZE,
        status,
        debouncedSearch || undefined
      );
      const res = await api.get<unknown>(url);
      const payload = (res.data as Record<string, unknown>) ?? res.data;
      const parsed = parseCampaignListResponse(payload, page, CAMPAIGN_PAGE_SIZE);
      setRows(parsed.rows);
      setTotalPages(parsed.totalPages);
      setTotalRecords(parsed.totalRecords);
      setPageSize(parsed.pageSize);

      setPage((p) => {
        if (parsed.totalPages <= 0) return 1;
        return p > parsed.totalPages ? parsed.totalPages : p;
      });
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg ?? 'Failed to load campaigns');
      setRows([]);
      setTotalPages(0);
      setTotalRecords(0);
      setPageSize(CAMPAIGN_PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const onTabChange = (v: string | null) => {
    if (v && CAMPAIGN_STATUS_TABS.includes(v as CampaignStatusTab)) {
      setStatus(v as CampaignStatusTab);
      setPage(1);
    }
  };

  const rangeLabel = useMemo(() => {
    if (loading) return null;
    if (totalRecords === 0) return '0 campaigns';
    if (rows.length === 0) return `${totalRecords} campaign${totalRecords === 1 ? '' : 's'} total`;
    const from = (page - 1) * pageSize + 1;
    const to = from + rows.length - 1;
    return `Showing ${from}–${to} of ${totalRecords}`;
  }, [loading, rows.length, page, pageSize, totalRecords]);

  const statusColor = useMemo(
    () =>
      ({
        Processing: 'blue',
        Completed: 'green',
        Failed: 'red',
        Queued: 'yellow',
        Scheduled: 'violet',
      }) as Record<CampaignStatusTab, string>,
    []
  );

  return (
    <Box maw={1200} mx="auto" px={{ base: 'xs', sm: 'md' }} pb="xl">
      <DashboardPageHeader
        icon={<IconList size={24} stroke={1.75} />}
        title="Campaign activity"
        description={
          <>
            Filter by status and search. Data from{' '}
            <Text span fw={500} component="span">
              GET /email-broad/campaigns
            </Text>
            .
          </>
        }
      />

      <Card shadow="sm" padding="md" radius="md" withBorder mb="md">
        <Tabs value={status} onChange={onTabChange}>
          <Tabs.List grow style={{ flexWrap: 'wrap' }}>
            {CAMPAIGN_STATUS_TABS.map((s) => (
              <Tabs.Tab key={s} value={s}>
                {s}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        <TextInput
          mt="md"
          placeholder="Search campaigns…"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Card>

      {error && (
        <Text c="red" size="sm" mb="md">
          {error}
        </Text>
      )}

      <Card {...DASHBOARD_TABLE_CARD_PROPS}>
        <Group justify="space-between" align="flex-start" mb="xs" wrap="wrap" gap="sm">
          <Stack gap={4}>
            <Group gap="xs">
              <Text fw={600}>Results</Text>
              <Badge variant="light" color={statusColor[status]} size="sm">
                {status}
              </Badge>
            </Group>
            {rangeLabel && (
              <Text size="sm" c="dimmed">
                {rangeLabel}
              </Text>
            )}
          </Stack>
        </Group>

        {loading ? (
          <Stack gap={6}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={28} radius="sm" />
            ))}
          </Stack>
        ) : rows.length === 0 ? (
          <Text c="dimmed" size="sm" py="xl" ta="center">
            No campaigns for this status{debouncedSearch ? ' matching your search' : ''}.
          </Text>
        ) : (
          <ScrollArea type="auto" offsetScrollbars>
            <Table
              {...DASHBOARD_TABLE_PROPS}
              styles={DASHBOARD_TABLE_STYLES}
              style={{ tableLayout: 'fixed' }}
              miw={720}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={72}>ID</Table.Th>
                  <Table.Th>Campaign</Table.Th>
                  <Table.Th>Subject</Table.Th>
                  <Table.Th w={120}>Status</Table.Th>
                  <Table.Th w={120} ta="center">
                    Actions
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, idx) => {
                  const rowStatus = formatCell(row.status ?? status);
                  return (
                    <Table.Tr key={campaignId(row) + String(idx)}>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {campaignId(row)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={2}>
                          {campaignName(row)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {formatCell(row.subject ?? row.emailSubject)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light" color={rowStatusBadgeColor(rowStatus)}>
                          {rowStatus}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group justify="center" wrap="nowrap">
                          <Tooltip label="View campaign, recipients & analytics" withArrow position="left">
                            <Button
                              variant="light"
                              color="blue"
                              size="xs"
                              leftSection={<IconEye size={14} />}
                              onClick={() => setDetailRow(row)}
                            >
                              View
                            </Button>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {!loading && totalPages >= 1 && (
          <Group justify="space-between" align="center" mt="md" pt="sm" wrap="wrap" gap="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Text size="sm" c="dimmed">
              Page {Math.min(page, totalPages)} of {totalPages}
              {totalRecords > 0 ? ` · ${totalRecords} total` : ''}
            </Text>
            <Pagination
              value={Math.min(page, totalPages)}
              onChange={setPage}
              total={totalPages}
              withEdges
              siblings={1}
              boundaries={1}
            />
          </Group>
        )}
      </Card>

      <Modal
        opened={detailRow != null}
        onClose={() => setDetailRow(null)}
        title={
          detailRow ? (
            <Stack gap={4}>
              <Text fw={700} size="lg" lineClamp={2}>
                {campaignName(detailRow)}
              </Text>
              <Text size="sm" c="dimmed">
                Campaign #{campaignId(detailRow)}
              </Text>
            </Stack>
          ) : null
        }
        size="lg"
        padding="lg"
        radius="md"
      >
        {detailRow && (
          <Tabs value={detailTab} onChange={(v) => setDetailTab(v || 'campaign')} keepMounted={false}>
            <Tabs.List grow mb="md">
              <Tabs.Tab value="campaign" leftSection={<IconFileText size={16} />}>
                Campaign
              </Tabs.Tab>
              <Tabs.Tab value="recipients" leftSection={<IconUsers size={16} />}>
                Recipients
              </Tabs.Tab>
              <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
                Analytics
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="campaign">
              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <Box>
                    <Text size="xs" c="dimmed" fw={600}>
                      Subject
                    </Text>
                    <Text size="sm" mt={4}>
                      {formatCell(detailRow.subject)}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" fw={600}>
                      Reply to
                    </Text>
                    <Text size="sm" mt={4}>
                      {formatCell(detailRow.replyTo)}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" fw={600}>
                      List ID
                    </Text>
                    <Text size="sm" mt={4}>
                      {formatCell(detailRow.listId)}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" fw={600}>
                      Status
                    </Text>
                    <Badge mt={6} variant="light" color={rowStatusBadgeColor(formatCell(detailRow.status))}>
                      {formatCell(detailRow.status)}
                    </Badge>
                  </Box>
                </SimpleGrid>
                <Paper p="sm" radius="md" withBorder bg="gray.0">
                  <ModalScheduleSummary row={detailRow} />
                </Paper>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="recipients">
              <Stack gap="md" align="flex-start">
                <Paper p="lg" radius="md" withBorder w="100%">
                  <Group gap="sm" mb="xs">
                    <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                      <IconUsers size={20} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Total recipients
                      </Text>
                      <Text fw={800} size="2rem" lh={1.1}>
                        {formatCell(detailRow.totalRecipients)}
                      </Text>
                    </Box>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Number of contacts this campaign was sent to. Open the <strong>Analytics</strong> tab for
                    delivery outcomes (sent, bounced, failed, etc.).
                  </Text>
                </Paper>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="analytics">
              <CampaignAnalyticsHero analytics={parseAnalytics(detailRow)} />
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>
    </Box>
  );
};

export default EmailBroadcastCampaignsList;
