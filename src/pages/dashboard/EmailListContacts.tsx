import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  Modal,
  Textarea,
  Select,
  Alert,
  Group,
  Table,
  TextInput,
  Checkbox,
  Pagination,
  ActionIcon,
} from '@mantine/core';
import { IconArrowLeft, IconUpload, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDebouncedValue } from '@mantine/hooks';
import { useAtom } from 'jotai';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { emailBroadcastCreatedListsAtom, emailBroadcastContactsAtom } from '@/store/emailBroadcastAtoms';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';

interface ApiLabelItem {
  listId: number;
  label: string;
  metadata?: Record<string, unknown>;
}

/** Contact row from GET /email-broad/items/{listId} - may use different key names from API */
interface ApiContactItem {
  id: number;
  email: string;
  firstName?: string;
  phone?: string | number;
  first_name?: string;
  [key: string]: unknown;
}

/** Normalize API item to a consistent shape (id, email, firstName, phone) */
function normalizeApiItem(raw: Record<string, unknown>): ApiContactItem {
  const id = Number(raw.id ?? raw.emailId ?? 0);
  const email = String(raw.email ?? '');
  const firstName = raw.firstName != null ? String(raw.firstName) : raw.first_name != null ? String(raw.first_name) : raw.name != null ? String(raw.name) : undefined;
  const phone = raw.phone != null ? (typeof raw.phone === 'number' ? raw.phone : Number(String(raw.phone).replace(/\D/g, '')) || undefined) : undefined;
  return { id, email, firstName, phone };
}

interface EmailLabel {
  id: string;
  listId: number;
  label: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_PER_PAGE = 25;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parsePhone = (val: string | undefined): number | undefined => {
  if (val == null || val === '') return undefined;
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 0) return undefined;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? undefined : n;
};

const EmailListContacts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [createdLists] = useAtom(emailBroadcastCreatedListsAtom);
  const [contactsByList, setContactsByList] = useAtom(emailBroadcastContactsAtom);
  const [list, setList] = useState<EmailLabel | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [apiItems, setApiItems] = useState<ApiContactItem[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [loadingItems, setLoadingItems] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [importMethod, setImportMethod] = useState<'upload' | 'paste'>('upload');
  const [importLoading, setImportLoading] = useState(false);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [selectedEmailColumn, setSelectedEmailColumn] = useState<string | null>(null);
  const [selectedFirstNameColumn, setSelectedFirstNameColumn] = useState<string | null>(null);
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [importHistory, setImportHistory] = useState<{ date: string; newCount: number; updatedCount: number; unchangedCount: number }[]>([]);

  /** After upload from file, store display column names per list so List Manager shows same names */
  const [listDisplayHeaders, setListDisplayHeaders] = useState<Record<string, { labels: string[]; keys: string[] }>>({});

  const listId = id ?? '';
  const [debouncedSearch] = useDebouncedValue(search, 300);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      const fromAtom = createdLists.find((c) => c.id === listId);
      if (fromAtom) {
        setList({
          id: fromAtom.id,
          listId: fromAtom.listId ?? 0,
          label: fromAtom.label,
          metadata: fromAtom.metadata,
        });
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<{
          success: boolean;
          message?: string;
          data: ApiLabelItem[];
        }>(API_ENDPOINTS.ADMIN.EMAIL_BROAD_LIST_LABELS);
        if (response.data?.success && Array.isArray(response.data.data)) {
          const found = response.data.data.find(
            (item) => String(item.listId) === listId
          );
          if (found) {
            setList({
              id: String(found.listId),
              listId: found.listId,
              label: found.label,
              metadata: found.metadata,
            });
          } else {
            setList(null);
          }
        } else {
          setList(null);
        }
      } catch {
        setList(null);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [listId, createdLists]);

  const listIdNum = list?.listId && list.listId > 0 ? list.listId : null;

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (listIdNum == null) {
      setApiItems([]);
      setApiTotal(0);
      return;
    }
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const response = await api.get<unknown>(API_ENDPOINTS.ADMIN.EMAIL_BROAD_ITEMS(listIdNum, page, perPage, debouncedSearch));
        const raw = response.data as Record<string, unknown> | unknown[] | undefined;
        let items: ApiContactItem[] = [];
        let total = 0;

        const getTotal = (obj: Record<string, unknown> | undefined, fallback: number): number => {
          if (!obj || typeof obj !== 'object') return fallback;
          const n = obj.total ?? obj.totalCount ?? obj.totalRecords ?? obj.count;
          if (typeof n === 'number' && !Number.isNaN(n)) return n;
          return fallback;
        };

        if (Array.isArray(raw)) {
          items = raw.map((row) => normalizeApiItem(row as Record<string, unknown>));
          total = items.length;
        } else if (raw && typeof raw === 'object') {
          const data = raw.data as Record<string, unknown> | unknown[] | undefined;
          if (Array.isArray(data)) {
            items = data.map((row) => normalizeApiItem(row as Record<string, unknown>));
            total = getTotal(raw as Record<string, unknown>, items.length);
          } else if (data && typeof data === 'object' && !Array.isArray(data)) {
            const d = data as Record<string, unknown>;
            const arr = (d.items ?? d.rows ?? d.data) as unknown[] | undefined;
            items = Array.isArray(arr) ? arr.map((row) => normalizeApiItem(row as Record<string, unknown>)) : [];
            total = getTotal(d, getTotal(raw as Record<string, unknown>, items.length));
          } else {
            const topLevelArray = (raw.items ?? raw.rows ?? raw.data) as unknown[] | undefined;
            if (Array.isArray(topLevelArray)) {
              items = topLevelArray.map((row) => normalizeApiItem(row as Record<string, unknown>));
              total = getTotal(raw as Record<string, unknown>, items.length);
            }
          }
          if (items.length === 0 && total === 0) {
            const topLevelArray = (raw.items ?? raw.rows ?? raw.data ?? raw) as unknown[] | undefined;
            if (Array.isArray(topLevelArray)) {
              items = topLevelArray.map((row) => normalizeApiItem(row as Record<string, unknown>));
              total = getTotal(raw as Record<string, unknown>, items.length);
            }
          }
        }
        setApiItems(items);
        setApiTotal(total);
      } catch {
        setApiItems([]);
        setApiTotal(0);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [listIdNum, page, perPage, debouncedSearch, refreshKey]);

  useEffect(() => {
    if (listIdNum != null) setPage(1);
  }, [listIdNum]);

  const isApiMode = listIdNum != null;
  const contactsData = contactsByList[listId] ?? { headers: [], contacts: [] };

  /** Dynamic column keys for API mode: from uploaded file mapping, list.metadata, or first item keys */
  const apiColumnKeys = useMemo(() => {
    if (!isApiMode) return ['email', 'firstName', 'phone'];
    const stored = listId ? listDisplayHeaders[listId] : undefined;
    if (stored?.labels?.length) return stored.keys;
    const meta = list?.metadata as { fields?: string[] } | undefined;
    if (meta?.fields && Array.isArray(meta.fields) && meta.fields.length > 0) {
      return meta.fields.some((f) => f.toLowerCase() === 'email') ? meta.fields : ['email', ...meta.fields];
    }
    if (apiItems.length > 0) {
      const keys = Object.keys(apiItems[0]).filter((k) => k !== 'id' && typeof (apiItems[0] as Record<string, unknown>)[k] !== 'object');
      return keys.length > 0 ? keys : ['email', 'firstName', 'phone'];
    }
    return ['email', 'firstName', 'phone'];
  }, [isApiMode, listId, listDisplayHeaders, list?.metadata, apiItems]);

  const apiColumnLabel = (key: string) => {
    const labels: Record<string, string> = {
      email: 'Email',
      firstName: 'Name',
      first_name: 'Name',
      phone: 'Phone',
    };
    return labels[key] ?? key.replace(/([A-Z_])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
  };

  /** Display labels for API columns: use stored file column names when available */
  const apiColumnLabels = useMemo(() => {
    const stored = listId ? listDisplayHeaders[listId] : undefined;
    if (stored?.labels?.length && stored.labels.length >= apiColumnKeys.length) return stored.labels;
    return apiColumnKeys.map((k) => apiColumnLabel(k));
  }, [listId, listDisplayHeaders, apiColumnKeys]);

  const getApiCellValue = (item: ApiContactItem, key: string): string | number | undefined => {
    const v = (item as Record<string, unknown>)[key];
    if (v == null) return undefined;
    return typeof v === 'object' ? String(v) : v;
  };
  const filteredContacts = useMemo(() => {
    let list_ = contactsData.contacts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list_ = list_.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return list_;
  }, [contactsData.contacts, search]);
  const totalPagesLocal = Math.max(1, Math.ceil(filteredContacts.length / perPage));
  const paginatedContacts = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredContacts.slice(start, start + perPage);
  }, [filteredContacts, page, perPage]);

  const totalPages = isApiMode ? Math.max(1, Math.ceil(apiTotal / perPage)) : totalPagesLocal;

  const getRowKey = (row: Record<string, string>) =>
    (row['Email'] ?? row['email'] ?? '').toLowerCase() || JSON.stringify(row);

  const toggleSelectAll = () => {
    if (isApiMode) {
      const ids = apiItems.map((i) => i.id);
      const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
      if (allSelected) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.add(id));
          return next;
        });
      }
      return;
    }
    const start = (page - 1) * perPage;
    const indices = paginatedContacts.map((_, i) => start + i);
    const allSelected = indices.every((i) => selectedIds.has(i));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        indices.forEach((i) => next.delete(i));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        indices.forEach((i) => next.add(i));
        return next;
      });
    }
  };

  const toggleSelectOne = (idOrIndex: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idOrIndex)) next.delete(idOrIndex);
      else next.add(idOrIndex);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (!listId || selectedIds.size === 0) return;
    if (isApiMode && listIdNum != null) {
      try {
        await api.delete(API_ENDPOINTS.ADMIN.EMAIL_BROAD_DELETE_EMAILS, {
          data: { listId: listIdNum, emailIds: Array.from(selectedIds) },
        });
        setSelectedIds(new Set());
        setDeleteModalOpened(false);
        setRefreshKey((k) => k + 1);
        notifications.show({ title: 'Success', message: 'Contacts deleted', color: 'green' });
      } catch {
        notifications.show({ title: 'Error', message: 'Failed to delete contacts', color: 'red' });
      }
      return;
    }
    const keysToDelete = new Set(
      Array.from(selectedIds).map((i) => getRowKey(filteredContacts[i]))
    );
    const next = contactsData.contacts.filter((r) => !keysToDelete.has(getRowKey(r)));
    setContactsByList((prev) => ({ ...prev, [listId]: { headers: contactsData.headers, contacts: next } }));
    setSelectedIds(new Set());
    setDeleteModalOpened(false);
    notifications.show({ title: 'Success', message: 'Contacts deleted', color: 'green' });
  };

  const handleFileChange = (file: File | null) => {
    setImportFile(file);
    setParsedHeaders([]);
    setParsedRows([]);
    setSelectedEmailColumn(null);
    setSelectedFirstNameColumn(null);
    setSelectedPhoneColumn(null);
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => {
          const rows = (r.data || []) as Record<string, string>[];
          if (rows.length > 0) {
            setParsedHeaders(Object.keys(rows[0]));
            setParsedRows(rows);
            const emailCol = Object.keys(rows[0]).find(
              (h) => h.toLowerCase().includes('email') || h.toLowerCase().includes('mail')
            );
            if (emailCol) setSelectedEmailColumn(emailCol);
          }
        },
      });
    } else if (ext === 'xlsx') {
      readXlsxFile(file).then((data) => {
        if (data.length > 0) {
          const headers = (data[0] as (string | number)[]).map((h) => String(h ?? '')) as string[];
          const rows = data.slice(1).map((row) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[h] = String((row as (string | number)[])[i] ?? '');
            });
            return obj;
          });
          setParsedHeaders(headers);
          setParsedRows(rows);
          const emailCol = headers.find(
            (h) => h.toLowerCase().includes('email') || h.toLowerCase().includes('mail')
          );
          if (emailCol) setSelectedEmailColumn(emailCol);
        }
      });
    }
  };

  const buildEmailsFromParsed = (): { email: string; firstName?: string; phone?: number }[] => {
    if (!selectedEmailColumn || parsedRows.length === 0) return [];
    return parsedRows
      .map((row) => {
        const email = row[selectedEmailColumn]?.trim();
        if (!email || !emailRegex.test(email)) return null;
        return {
          email,
          firstName: selectedFirstNameColumn ? (row[selectedFirstNameColumn]?.trim() || undefined) : undefined,
          phone: selectedPhoneColumn ? parsePhone(row[selectedPhoneColumn]) : undefined,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  };

  const buildEmailsFromPaste = (): { email: string; firstName?: string; phone?: number }[] => {
    const lines = pasteContent.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
    return lines
      .filter((e) => emailRegex.test(e))
      .filter((e, i, arr) => arr.indexOf(e) === i)
      .map((email) => ({ email }));
  };

  const handleUploadContacts = async () => {
    if (!list) return;
    let emails: { email: string; firstName?: string; phone?: number }[];
    if (importMethod === 'upload') {
      emails = buildEmailsFromParsed().map((e) => ({
        email: e.email,
        firstName: e.firstName,
        phone: e.phone,
      }));
    } else {
      emails = buildEmailsFromPaste().map((e) => ({ email: e.email, firstName: e.firstName, phone: e.phone }));
    }
    if (emails.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'No valid emails to upload',
        color: 'red',
      });
      return;
    }
    setImportLoading(true);
    try {
      if (isApiMode && listIdNum != null) {
        await api.post(API_ENDPOINTS.ADMIN.EMAIL_BROAD_UPLOAD, {
          listId: listIdNum,
          emails: emails.map((e) => ({
            email: e.email,
            firstName: e.firstName ?? undefined,
            phone: e.phone,
          })),
        });
        if (importMethod === 'upload' && (selectedEmailColumn || selectedFirstNameColumn || selectedPhoneColumn)) {
          const labels = [
            selectedEmailColumn ?? 'Email',
            selectedFirstNameColumn ?? 'Name',
            selectedPhoneColumn ?? 'Phone',
          ];
          const keys = ['email', 'firstName', 'phone'];
          setListDisplayHeaders((prev) => ({
            ...prev,
            [listId]: { labels, keys },
          }));
        }
        setRefreshKey((k) => k + 1);
        notifications.show({
          title: 'Success',
          message: `Uploaded ${emails.length} contact(s) to "${list.label}"`,
          color: 'green',
        });
        setImportModalOpened(false);
        setImportFile(null);
        setPasteContent('');
        setParsedHeaders([]);
        setParsedRows([]);
        setSelectedEmailColumn(null);
        setSelectedFirstNameColumn(null);
        setSelectedPhoneColumn(null);
      } else {
        await api.post(API_ENDPOINTS.ADMIN.EMAIL_BROAD_UPLOAD, {
          listId: list.listId && list.listId > 0 ? list.listId : undefined,
          label: list.label,
          emails,
        });
        const headers = ['Email', 'Name', 'Phone'];
        const newRows: Record<string, string>[] = emails.map((e) => ({
          Email: e.email,
          'Name': e.firstName ?? '',
          Phone: e.phone != null ? String(e.phone) : '',
        }));
        const prev = contactsByList[listId] ?? { headers: [], contacts: [] };
        const allHeaders = Array.from(new Set([...prev.headers, ...headers]));
        const merged = [...prev.contacts];
        const existingEmails = new Set(merged.map((r) => (r['Email'] ?? r['email'] ?? '').toLowerCase()));
        newRows.forEach((row) => {
          const email = (row['Email'] ?? row['email'] ?? '').toLowerCase();
          if (email && !existingEmails.has(email)) {
            existingEmails.add(email);
            merged.push(row);
          }
        });
        const normalized = merged.map((r) => {
          const out: Record<string, string> = {};
          allHeaders.forEach((h) => { out[h] = r[h] ?? ''; });
          return out;
        });
        setContactsByList((prevState) => ({
          ...prevState,
          [listId]: { headers: allHeaders, contacts: normalized },
        }));
        notifications.show({
          title: 'Success',
          message: `Uploaded ${emails.length} contact(s) to "${list.label}"`,
          color: 'green',
        });
        setImportHistory((hist) => [
          {
            date: new Date().toISOString(),
            newCount: emails.length,
            updatedCount: 0,
            unchangedCount: contactsData.contacts.length,
          },
          ...hist.slice(0, 4),
        ]);
        setImportModalOpened(false);
        setImportFile(null);
        setPasteContent('');
        setParsedHeaders([]);
        setParsedRows([]);
        setSelectedEmailColumn(null);
        setSelectedFirstNameColumn(null);
        setSelectedPhoneColumn(null);
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to upload contacts',
        color: 'red',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const getReadyToUploadCount = (): number => {
    if (importMethod === 'upload') return buildEmailsFromParsed().length;
    return buildEmailsFromPaste().length;
  };

  if (loading && listId) {
    return (
      <Box>
        <Text c="dimmed">Loading list...</Text>
      </Box>
    );
  }

  if (!list) {
    return (
      <Box>
        <Text c="dimmed">List not found.</Text>
        <Button
          variant="subtle"
          mt="md"
          onClick={() => navigate('/recruiter/email-broadcast/upload')}
        >
          Back to Your lists
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        variant="subtle"
        size="sm"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => navigate('/recruiter/email-broadcast/upload')}
        mb="md"
      >
        Back to Contacts
      </Button>

      <Title order={2} mb="lg">
        List Manager
      </Title>

     

      <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
        <TextInput
          placeholder="Search by name or email..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 320 }}
        />
        <Group>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => {
              setImportModalOpened(true);
              setImportFile(null);
              setPasteContent('');
              setImportMethod('upload');
              setParsedHeaders([]);
              setParsedRows([]);
              setSelectedEmailColumn(null);
              setSelectedFirstNameColumn(null);
              setSelectedPhoneColumn(null);
            }}
          >
            Add Contacts
          </Button>
          {selectedIds.size > 0 && (
            <Button color="red" variant="light" onClick={() => setDeleteModalOpened(true)}>
              Delete ({selectedIds.size})
            </Button>
          )}
        </Group>
      </Group>

      <Paper withBorder shadow="xs" radius="sm">
        {loadingItems && isApiMode ? (
          <Stack align="center" py="xl">
            <Text c="dimmed" size="sm">Loading contacts...</Text>
          </Stack>
        ) : (
        <Table striped highlightOnHover>
          {isApiMode ? (
            <>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={apiItems.length > 0 && apiItems.every((i) => selectedIds.has(i.id))}
                      indeterminate={selectedIds.size > 0 && !apiItems.every((i) => selectedIds.has(i.id))}
                      onChange={toggleSelectAll}
                    />
                  </Table.Th>
                  {apiColumnKeys.map((key, idx) => (
                    <Table.Th key={key}>{apiColumnLabels[idx] ?? apiColumnLabel(key)}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {apiItems.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={apiColumnKeys.length + 1}>
                      <Stack align="center" gap="xs" py={48}>
                        <Text ta="center" c="dimmed" size="sm">There are no contacts in this list.</Text>
                        <Text ta="center" c="dimmed" size="sm">You can import contacts by clicking the &apos;Add Contacts&apos; button.</Text>
                        <Button variant="light" size="sm" mt="sm" leftSection={<IconPlus size={16} />} onClick={() => setImportModalOpened(true)}>
                          Add Contacts
                        </Button>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  apiItems.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelectOne(item.id)}
                        />
                      </Table.Td>
                      {apiColumnKeys.map((key) => (
                        <Table.Td key={key}>
                          {getApiCellValue(item, key) ?? '—'}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </>
          ) : (
            <>
          {contactsData.headers.length > 0 && (
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>
                  <Checkbox
                    checked={
                      paginatedContacts.length > 0 &&
                      paginatedContacts.every((_, i) => selectedIds.has((page - 1) * perPage + i))
                    }
                    indeterminate={
                      selectedIds.size > 0 &&
                      !paginatedContacts.every((_, i) => selectedIds.has((page - 1) * perPage + i))
                    }
                    onChange={toggleSelectAll}
                  />
                </Table.Th>
                {contactsData.headers.map((h) => (
                  <Table.Th key={h}>{h}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
          )}
          <Table.Tbody>
            {paginatedContacts.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={(contactsData.headers.length || 1) + 1}>
                  <Stack align="center" gap="xs" py={48}>
                    <Text ta="center" c="dimmed" size="sm">
                      There are no contacts in this list.
                    </Text>
                    <Text ta="center" c="dimmed" size="sm">
                      You can import contacts by clicking the &apos;Add Contacts&apos; button.
                    </Text>
                    <Button
                      variant="light"
                      size="sm"
                      mt="sm"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => setImportModalOpened(true)}
                    >
                      Add Contacts
                    </Button>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedContacts.map((row, i) => {
                const globalIndex = (page - 1) * perPage + i;
                return (
                  <Table.Tr key={globalIndex}>
                    <Table.Td>
                      <Checkbox
                        checked={selectedIds.has(globalIndex)}
                        onChange={() => toggleSelectOne(globalIndex)}
                      />
                    </Table.Td>
                    {contactsData.headers.map((h) => (
                      <Table.Td key={h}>{row[h] ?? '—'}</Table.Td>
                    ))}
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
            </>
          )}
        </Table>
        )}
        {((isApiMode && (apiTotal > 0 || apiItems.length > 0)) || totalPages > 1) && (
          <Group justify="space-between" align="center" p="md" wrap="wrap" gap="sm">
            <Text size="sm" c="dimmed">
              {isApiMode
                ? `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, apiTotal)} of ${apiTotal}`
                : totalPages > 1
                  ? `Page ${page} of ${totalPages}`
                  : null}
            </Text>
            {(isApiMode || totalPages > 1) && (
              <Pagination
                total={Math.max(1, totalPages)}
                value={page}
                onChange={(p) => setPage(p)}
                size="sm"
                withEdges
              />
            )}
          </Group>
        )}
      </Paper>

      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Delete Contacts"
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete these contacts? This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setDeleteModalOpened(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteSelected}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={importModalOpened}
        onClose={() => {
          setImportModalOpened(false);
          setImportFile(null);
          setPasteContent('');
          if (modalFileInputRef.current) modalFileInputRef.current.value = '';
        }}
        title="Import Email List"
        size="lg"
        styles={{ title: { fontWeight: 600 } }}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Import contacts via file upload or by pasting email addresses and names below.
          </Text>
          <Select
            label="Method"
            data={[
              { value: 'upload', label: 'Upload' },
              { value: 'copy_paste', label: 'Copy Paste' },
            ]}
            value={importMethod === 'paste' ? 'copy_paste' : 'upload'}
            onChange={(v) => {
              setImportMethod(v === 'copy_paste' ? 'paste' : 'upload');
              setImportFile(null);
              setPasteContent('');
              setParsedHeaders([]);
              setParsedRows([]);
              if (modalFileInputRef.current) modalFileInputRef.current.value = '';
            }}
            allowDeselect={false}
          />

          {importMethod === 'upload' ? (
            <>
              <Box>
                <Text size="sm" fw={500} mb="xs" required>
                  File
                </Text>
                <Paper
                  withBorder
                  p="md"
                  radius="md"
                  style={{
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    cursor: 'pointer',
                    backgroundColor: importFile
                      ? 'var(--mantine-color-orange-0)'
                      : 'var(--mantine-color-gray-0)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => modalFileInputRef.current?.click()}
                >
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                  {importFile ? (
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                        <IconUpload size={20} color="var(--mantine-color-orange-6)" />
                        <Text size="sm" fw={500} truncate>
                          {importFile.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          ({(importFile.size / 1024).toFixed(1)} KB)
                        </Text>
                      </Group>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImportFile(null);
                          if (modalFileInputRef.current) modalFileInputRef.current.value = '';
                        }}
                        aria-label="Remove file"
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  ) : (
                    <Group gap="xs" justify="center">
                      <IconUpload size={24} color="var(--mantine-color-gray-5)" />
                      <Text size="sm" c="dimmed">
                        Click to choose CSV or Excel file
                      </Text>
                    </Group>
                  )}
                </Paper>
                <Text size="xs" c="dimmed" mt={4}>
                  Accepted: .csv, .xlsx
                </Text>
              </Box>
              {parsedHeaders.length > 0 && (
                <>
                  <Select
                    label="Email column"
                    data={parsedHeaders}
                    value={selectedEmailColumn}
                    onChange={setSelectedEmailColumn}
                    required
                  />
                  <Select
                    label="Optional: Name column"
                    data={[{ value: '', label: 'None' }, ...parsedHeaders.map((h) => ({ value: h, label: h }))]}
                    value={selectedFirstNameColumn ?? ''}
                    onChange={(v) => setSelectedFirstNameColumn(v || null)}
                  />
                  <Select
                    label="Optional: Phone column"
                    data={[{ value: '', label: 'None' }, ...parsedHeaders.map((h) => ({ value: h, label: h }))]}
                    value={selectedPhoneColumn ?? ''}
                    onChange={(v) => setSelectedPhoneColumn(v || null)}
                  />
                  {selectedEmailColumn && (
                    <Alert color="blue">
                      {getReadyToUploadCount()} valid email(s) will be uploaded
                    </Alert>
                  )}
                </>
              )}
              <Button
                color="orange"
                fullWidth
                size="md"
                loading={importLoading}
                disabled={
                  !importFile ||
                  (parsedHeaders.length > 0 && !selectedEmailColumn) ||
                  getReadyToUploadCount() === 0
                }
                onClick={() => handleUploadContacts()}
              >
                Upload and Map Fields
              </Button>
            </>
          ) : (
            <>
              <Textarea
                label="File Contents"
                placeholder="Include the email addresses and names of the subscribers here. Each subscriber should be on a new line."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                minRows={8}
                autosize
              />
              {getReadyToUploadCount() > 0 && (
                <Alert color="green">
                  {getReadyToUploadCount()} valid email(s) will be uploaded
                </Alert>
              )}
              <Button
                color="orange"
                fullWidth
                size="md"
                loading={importLoading}
                disabled={!pasteContent.trim() || getReadyToUploadCount() === 0}
                onClick={() => handleUploadContacts()}
              >
                Import
              </Button>
            </>
          )}

          <Box mt="lg" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Group justify="space-between" mb={4}>
              <Text fw={600} size="sm">
                History
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mb="sm">
              View the import history for this list, including status, new, updated, unchanged
              emails.
            </Text>
            {importHistory.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic">
                No import history yet. Start by importing a list of subscribers.
              </Text>
            ) : (
              <Stack gap="xs">
                {importHistory.slice(0, 5).map((entry, idx) => (
                  <Group key={idx} gap="sm" wrap="nowrap">
                    <Text size="sm">{new Date(entry.date).toLocaleString()}</Text>
                    <Text size="sm" c="dimmed">
                      New: {entry.newCount}, Updated: {entry.updatedCount}, Unchanged: {entry.unchangedCount}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Modal>
    </Box>
  );
};

export default EmailListContacts;
