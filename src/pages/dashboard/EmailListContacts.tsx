import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  Table,
  Select,
  Stack,
  Modal,
  Paper,
  Checkbox,
  ActionIcon,
  Pagination,
  Textarea,
} from '@mantine/core';
import { IconSearch, IconPlus, IconRefresh, IconArrowLeft, IconUpload, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import {
  getContactsWithFallback,
  setListContacts,
  getImportHistory,
  addImportHistory,
  type ListContactsData,
} from '@/lib/emailListStorage';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';

const DEFAULT_PER_PAGE = 25;

interface EmailLabel {
  id: string;
  label: string;
  emailCount: number;
  createdAt: string;
  emails?: string[];
}

const EmailListContacts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState<EmailLabel | null>(null);
  const [contactsData, setContactsData] = useState<ListContactsData>({ headers: [], contacts: [] });
  const [search, setSearch] = useState('');
  const [perPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [importMethod, setImportMethod] = useState<string>('upload');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importHistory, setImportHistory] = useState<ReturnType<typeof getImportHistory>>([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const listId = id ?? '';

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await api.get<{ success: boolean; data: EmailLabel[] }>(
          API_ENDPOINTS.ADMIN.EMAIL_LABELS
        );
        if (response.data?.success && response.data?.data) {
          const found = response.data.data.find((l) => l.id === listId);
          if (found) setList(found);
        }
      } catch {
        const stored = localStorage.getItem(`emailLabels_${user?.id}`);
        if (stored) {
          const labels: EmailLabel[] = JSON.parse(stored);
          const found = labels.find((l) => l.id === listId);
          if (found) setList(found);
        }
      }
    };
    fetchList();
  }, [listId, user?.id]);

  useEffect(() => {
    if (!listId) return;
    const data = getContactsWithFallback(user?.id, listId, list?.emails);
    setContactsData(data);
  }, [listId, user?.id, list?.emails, historyRefreshKey]);

  useEffect(() => {
    if (!listId) return;
    setImportHistory(getImportHistory(user?.id, listId));
  }, [listId, user?.id, importModalOpened, historyRefreshKey]);

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

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / perPage));
  const paginatedContacts = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredContacts.slice(start, start + perPage);
  }, [filteredContacts, page, perPage]);

  const handleImportFile = async (file: File | null) => {
    const fileToUse = file ?? modalFileInputRef.current?.files?.[0] ?? null;
    if (!fileToUse || !listId) return;
    const userId = user?.id ?? 'default';
    setImportLoading(true);
    try {
      const ext = fileToUse.name.split('.').pop()?.toLowerCase();
      let headers: string[] = [];
      let rows: Record<string, string>[] = [];

      if (ext === 'csv') {
        const result = await new Promise<{ data: Record<string, string>[] }>((res, rej) => {
          Papa.parse(fileToUse, {
            header: true,
            skipEmptyLines: true,
            complete: (r) => res({ data: (r.data || []) as Record<string, string>[] }),
            error: rej,
          });
        });
        if (result.data.length > 0) {
          headers = Object.keys(result.data[0]);
          rows = result.data.map((row) => {
            const out: Record<string, string> = {};
            headers.forEach((h) => {
              out[h] = String(row[h] ?? '').trim();
            });
            return out;
          });
        }
      } else if (ext === 'xlsx') {
        const jsonData = await readXlsxFile(fileToUse);
        if (jsonData.length > 0) {
          headers = (jsonData[0] as (string | number | boolean | Date)[]).map((x) =>
            String(x ?? '')
          ) as string[];
          rows = jsonData.slice(1).map((row) => {
            const rowObj: Record<string, string> = {};
            headers.forEach((header, i) => {
              rowObj[header] = String((row as (string | number | boolean | Date)[])[i] ?? '');
            });
            return rowObj;
          });
        }
      } else {
        notifications.show({
          title: 'Error',
          message: 'Unsupported format. Use CSV or XLSX.',
          color: 'red',
        });
        setImportLoading(false);
        return;
      }

      const prev = getContactsWithFallback(userId, listId, list?.emails);
      const existingEmails = new Set(
        prev.contacts
          .map((r) => (r['Email'] ?? r['email'] ?? '').toLowerCase())
          .filter(Boolean)
      );
      let newCount = 0;
      let updatedCount = 0;
      const merged = [...prev.contacts];
      const seen = new Set(existingEmails);

      rows.forEach((row) => {
        const email = (row['Email'] ?? row['email'] ?? '').toLowerCase();
        if (!email) return;
        if (seen.has(email)) {
          const idx = merged.findIndex(
            (m) => (m['Email'] ?? m['email'] ?? '').toLowerCase() === email
          );
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...row };
            updatedCount++;
          }
          return;
        }
        seen.add(email);
        merged.push(row);
        newCount++;
      });

      const allHeaders = Array.from(
        new Set([...prev.headers, ...headers])
      );
      const normalized = merged.map((r) => {
        const out: Record<string, string> = {};
        allHeaders.forEach((h) => {
          out[h] = r[h] ?? '';
        });
        return out;
      });

      setListContacts(user.id, listId, { headers: allHeaders, contacts: normalized });
      addImportHistory(user.id, listId, {
        status: 'completed',
        newCount,
        updatedCount,
        unchangedCount: prev.contacts.length - updatedCount,
        errorCount: 0,
      });
      setContactsData({ headers: allHeaders, contacts: normalized });
      setHistoryRefreshKey((k) => k + 1);
      setImportModalOpened(false);
      setImportFile(null);
      if (modalFileInputRef.current) {
        modalFileInputRef.current.value = '';
      }
      notifications.show({
        title: 'Success',
        message: `Imported ${rows.length} row(s). New: ${newCount}, Updated: ${updatedCount}`,
        color: 'green',
      });
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: 'Failed to parse file',
        color: 'red',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handlePasteImport = () => {
    const content = pasteContent.trim();
    if (!listId || !content) return;
    const userId = user?.id ?? 'default';
    setImportLoading(true);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const rows: Record<string, string>[] = [];
      const headersSet = new Set<string>(['Email', 'Full Name']);

      lines.forEach((line) => {
        const parts = line.split(/[\t,\s]+/).map((p) => p.trim()).filter(Boolean);
        let email = '';
        let name = '';
        const emailPart = parts.find((p) => emailRegex.test(p));
        if (emailPart) {
          email = emailPart;
          name = parts.filter((p) => p !== emailPart).join(' ').trim();
        } else if (parts.length === 1 && emailRegex.test(parts[0])) {
          email = parts[0];
        } else {
          return;
        }
        rows.push({ Email: email, 'Full Name': name || email });
      });

      if (rows.length === 0) {
        notifications.show({
          title: 'No valid emails',
          message: 'Could not find any valid email addresses in the pasted content.',
          color: 'red',
        });
        setImportLoading(false);
        return;
      }

      const prev = getContactsWithFallback(userId, listId, list?.emails);
      const existingEmails = new Set(
        prev.contacts.map((r) => (r['Email'] ?? r['email'] ?? '').toLowerCase()).filter(Boolean)
      );
      let newCount = 0;
      let updatedCount = 0;
      const merged = [...prev.contacts];
      const seen = new Set(existingEmails);

      rows.forEach((row) => {
        const email = (row['Email'] ?? row['email'] ?? '').toLowerCase();
        if (!email) return;
        if (seen.has(email)) {
          const idx = merged.findIndex(
            (m) => (m['Email'] ?? m['email'] ?? '').toLowerCase() === email
          );
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...row };
            updatedCount++;
          }
          return;
        }
        seen.add(email);
        merged.push(row);
        newCount++;
      });

      const allHeaders = Array.from(new Set([...prev.headers, ...Array.from(headersSet)]));
      const normalized = merged.map((r) => {
        const out: Record<string, string> = {};
        allHeaders.forEach((h) => {
          out[h] = r[h] ?? '';
        });
        return out;
      });

      setListContacts(userId, listId, { headers: allHeaders, contacts: normalized });
      addImportHistory(userId, listId, {
        status: 'completed',
        newCount,
        updatedCount,
        unchangedCount: Math.max(0, prev.contacts.length - updatedCount),
        errorCount: 0,
      });
      setContactsData({ headers: allHeaders, contacts: normalized });
      setHistoryRefreshKey((k) => k + 1);
      setImportModalOpened(false);
      setPasteContent('');
      notifications.show({
        title: 'Success',
        message: `Imported ${rows.length} row(s). New: ${newCount}, Updated: ${updatedCount}`,
        color: 'green',
      });
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: 'Failed to import pasted content',
        color: 'red',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const getRowKey = (row: Record<string, string>) =>
    (row['Email'] ?? row['email'] ?? '').toLowerCase() || JSON.stringify(row);

  const handleDeleteSelected = () => {
    if (!listId || !user?.id || selectedIds.size === 0) return;
    const keysToDelete = new Set(
      Array.from(selectedIds).map((i) => getRowKey(filteredContacts[i]))
    );
    const next = contactsData.contacts.filter((r) => !keysToDelete.has(getRowKey(r)));
    setListContacts(user.id, listId, { headers: contactsData.headers, contacts: next });
    setContactsData((prev) => ({ ...prev, contacts: next }));
    setSelectedIds(new Set());
    setDeleteModalOpened(false);
    setHistoryRefreshKey((k) => k + 1);
    notifications.show({ title: 'Success', message: 'Contacts deleted', color: 'green' });
  };

  const toggleSelectAll = () => {
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

  const toggleSelectOne = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (!list && listId) {
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
        <Button variant="subtle" mt="md" onClick={() => navigate('/recruiter/email-broadcast')}>
          Back to Email Broadcast
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
        onClick={() => navigate('/recruiter/email-broadcast')}
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
                  setImportFile(null);
                  setImportModalOpened(true);
                }}
              >
                Add Contacts
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  color="red"
                  variant="light"
                  onClick={() => setDeleteModalOpened(true)}
                >
                  Delete ({selectedIds.size})
                </Button>
              )}
            </Group>
          </Group>

          <Paper withBorder shadow="xs" radius="sm">
            <Table striped highlightOnHover>
              {contactsData.headers.length > 0 && (
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 40 }}>
                      <Checkbox
                        checked={
                          paginatedContacts.length > 0 &&
                          paginatedContacts.every((_, i) =>
                            selectedIds.has((page - 1) * perPage + i)
                          )
                        }
                        indeterminate={
                          selectedIds.size > 0 &&
                          !paginatedContacts.every((_, i) =>
                            selectedIds.has((page - 1) * perPage + i)
                          )
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
                          onClick={() => {
                            setImportFile(null);
                            setImportModalOpened(true);
                          }}
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
            </Table>
            {totalPages > 1 && (
              <Group justify="center" p="md">
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={setPage}
                  size="sm"
                  withEdges
                />
              </Group>
            )}
          </Paper>

      {/* Import Email List modal */}
      <Modal
        opened={importModalOpened}
        onClose={() => {
          setImportModalOpened(false);
          setImportFile(null);
          setPasteContent('');
          if (modalFileInputRef.current) {
            modalFileInputRef.current.value = '';
          }
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
            value={importMethod}
            onChange={(v) => {
              setImportMethod(v ?? 'upload');
              setImportFile(null);
              setPasteContent('');
            }}
            allowDeselect={false}
          />
          {importMethod === 'upload' ? (
            <>
              <Box>
                <Text size="sm" fw={500} mb="xs" required>File</Text>
                <Paper
                  withBorder
                  p="md"
                  radius="md"
                  style={{
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    cursor: 'pointer',
                    backgroundColor: importFile ? 'var(--mantine-color-orange-0)' : 'var(--mantine-color-gray-0)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => modalFileInputRef.current?.click()}
                >
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    style={{ display: 'none' }}
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
              <Button
                color="orange"
                fullWidth
                size="md"
                type="button"
                loading={importLoading}
                disabled={!importFile}
                onClick={() => handleImportFile(modalFileInputRef.current?.files?.[0] ?? importFile)}
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
              <Button
                color="orange"
                fullWidth
                size="md"
                type="button"
                loading={importLoading}
                disabled={!pasteContent.trim()}
                onClick={() => handlePasteImport()}
              >
                Import
              </Button>
            </>
          )}

          <Box mt="lg" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Group justify="space-between" mb={4}>
              <Text fw={600} size="sm">History</Text>
              <ActionIcon
                variant="subtle"
                size="sm"
                aria-label="Refresh history"
                onClick={() => setHistoryRefreshKey((k) => k + 1)}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>
            <Text size="xs" c="dimmed" mb="sm">
              View the import history for this list, including status, new, updated, unchanged
              emails, and any errors.
            </Text>
            {importHistory.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic">
                No import history found. Start by importing a list of subscribers.
              </Text>
            ) : (
              <Stack gap="xs">
                {importHistory.slice(0, 5).map((entry) => (
                  <Group key={entry.id} gap="sm" wrap="nowrap">
                    <Text size="sm">{new Date(entry.date).toLocaleString()}</Text>
                    <Text size="sm" c="dimmed">
                      New: {entry.newCount}, Updated: {entry.updatedCount}, Unchanged:{' '}
                      {entry.unchangedCount}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Modal>

      {/* Delete Contacts confirmation (Image 4) */}
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
    </Box>
  );
};

export default EmailListContacts;
