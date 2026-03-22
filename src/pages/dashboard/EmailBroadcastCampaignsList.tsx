import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  Group,
  Pagination,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import { IconSearch, IconList } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { API_ENDPOINTS, api } from '@/hooks/useApi';

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
      <Paper
        withBorder
        p="lg"
        mb="lg"
        radius="md"
        style={{
          background: 'linear-gradient(135deg, #f8fbff 0%, #f1f8ff 100%)',
          borderColor: '#dbeafe',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="sm" mb={6}>
              <ThemeIcon variant="light" color="blue" radius="md" size="lg">
                <IconList size={18} />
              </ThemeIcon>
              <Title order={2}>Campaign activity</Title>
            </Group>
            <Text c="dimmed" size="sm" maw={560}>
              Filter by status and search. Data from{' '}
              <Text span fw={500} component="span">
                GET /email-broad/campaigns
              </Text>
              .
            </Text>
          </Box>
        </Group>
      </Paper>

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

      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Group justify="space-between" align="flex-start" mb="md" wrap="wrap" gap="md">
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
          <Stack gap="sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={40} radius="sm" />
            ))}
          </Stack>
        ) : rows.length === 0 ? (
          <Text c="dimmed" size="sm" py="xl" ta="center">
            No campaigns for this status{debouncedSearch ? ' matching your search' : ''}.
          </Text>
        ) : (
          <ScrollArea type="auto" offsetScrollbars>
            <Table striped highlightOnHover verticalSpacing="sm" miw={640}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Subject</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Scheduled</Table.Th>
                  <Table.Th>Recipients</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, idx) => (
                  <Table.Tr key={campaignId(row) + String(idx)}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {campaignId(row)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500} lineClamp={2}>
                        {campaignName(row)}
                      </Text>
                    </Table.Td>
                    <Table.Td maw={220}>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {formatCell(row.subject ?? row.emailSubject)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light" color={statusColor[status]}>
                        {formatCell(row.status ?? status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {formatCell(
                          row.scheduledAt ?? row.scheduled_at ?? row.scheduleAt ?? row.createdAt
                        )}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {formatCell(
                          row.totalRecipients ??
                            row.recipientCount ??
                            row.total_recipients ??
                            row.emailsCount
                        )}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {!loading && totalPages >= 1 && (
          <Group justify="space-between" align="center" mt="lg" pt="md" wrap="wrap" gap="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
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
    </Box>
  );
};

export default EmailBroadcastCampaignsList;
