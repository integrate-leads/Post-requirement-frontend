import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Title,
  Card,
  Text,
  Button,
  Group,
  Table,
  Stack,
  Modal,
  Paper,
  TextInput,
  ActionIcon,
  Tooltip,
  Badge,
  ThemeIcon,
  SimpleGrid,
  ScrollArea,
  Loader,
  Textarea,
  Select,
  Alert,
  Checkbox,
} from '@mantine/core';
import { DashboardPageHeader, DASHBOARD_TABLE_CARD_PROPS, DASHBOARD_TABLE_PROPS, DASHBOARD_TABLE_STYLES } from '@/components/dashboard';
import {
  IconUsers,
  IconPlus,
  IconTrash,
  IconUpload,
  IconMailOpened,
  IconChecklist,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAtom } from 'jotai';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { emailBroadcastCreatedListsAtom, type EmailBroadcastListEntry } from '@/store/emailBroadcastAtoms';
import { format } from 'date-fns';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';

interface ApiLabelItem {
  listId: number;
  label: string;
  validEmails?: number;
  totalEmails?: number;
  status?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

/** Display shape for Your lists table (from API) */
interface EmailLabel {
  id: string;
  listId: number;
  label: string;
  validEmails?: number;
  totalEmails?: number;
  status?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parsePhone = (val: string | undefined): number | undefined => {
  if (val == null || val === '') return undefined;
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 0) return undefined;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? undefined : n;
};
function headerToApiKey(header: string): string {
  const s = header.trim().replace(/\s+/g, ' ');
  if (!s) return header;
  const parts = s.split(/[\s_-]+/).filter(Boolean);
  return parts
    .map((p, i) =>
      i === 0
        ? p.charAt(0).toLowerCase() + p.slice(1).toLowerCase()
        : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    )
    .join('');
}

const EmailBroadcast: React.FC = () => {
  const [createdLists, setCreatedLists] = useAtom(emailBroadcastCreatedListsAtom);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [createListModalOpened, setCreateListModalOpened] = useState(false);
  const [createListName, setCreateListName] = useState('');
  const [createListSubmitting, setCreateListSubmitting] = useState(false);
  const [deleteConfirmLabel, setDeleteConfirmLabel] = useState<EmailLabel | null>(null);
  const [deleteListSubmitting, setDeleteListSubmitting] = useState(false);
  const [addContactsModalOpened, setAddContactsModalOpened] = useState(false);
  const [selectedListForContacts, setSelectedListForContacts] = useState<EmailLabel | null>(null);
  const [importMethod, setImportMethod] = useState<'upload' | 'paste'>('upload');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [selectedEmailColumn, setSelectedEmailColumn] = useState<string | null>(null);
  const [optionalColumnsIncluded, setOptionalColumnsIncluded] = useState<Record<string, boolean>>({});
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's labels on mount
  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    setLabelsLoading(true);
    try {
      const response = await api.get<{
        success: boolean;
        message?: string;
        data: ApiLabelItem[];
      }>(API_ENDPOINTS.ADMIN.EMAIL_BROAD_LIST_LABELS);
      if (response.data?.success && Array.isArray(response.data.data)) {
        setLabels(
          response.data.data.map((item) => ({
            id: String(item.listId),
            listId: item.listId,
            label: item.label,
            validEmails: item.validEmails,
            totalEmails: item.totalEmails,
            status: item.status,
            createdAt: item.createdAt,
            metadata: item.metadata,
          }))
        );
      } else {
        setLabels([]);
      }
    } catch {
      setLabels([]);
    } finally {
      setLabelsLoading(false);
    }
  };

  const displayLabels = useMemo((): EmailLabel[] => {
    const fromApi = labels.map((l) => ({
      id: l.id,
      listId: l.listId,
      label: l.label,
      validEmails: l.validEmails,
      totalEmails: l.totalEmails,
      status: l.status,
      createdAt: l.createdAt,
      metadata: l.metadata,
    }));
    const apiIds = new Set(fromApi.map((l) => l.id));
    const apiListIds = new Set(fromApi.map((l) => l.listId));
    for (const c of createdLists) {
      if (c.listId != null && apiListIds.has(c.listId)) continue;
      if (c.listId != null && !apiIds.has(String(c.listId))) {
        fromApi.push({
          id: String(c.listId),
          listId: c.listId,
          label: c.label,
          validEmails: undefined,
          totalEmails: undefined,
          status: undefined,
          createdAt: undefined,
          metadata: c.metadata,
        });
      } else if (c.listId == null && !apiIds.has(c.id)) {
        fromApi.push({
          id: c.id,
          listId: c.listId ?? 0,
          label: c.label,
          validEmails: undefined,
          totalEmails: undefined,
          status: undefined,
          createdAt: undefined,
          metadata: c.metadata,
        });
      }
    }
    return fromApi;
  }, [labels, createdLists]);

  const totalLists = displayLabels.length;
  const totalContacts = displayLabels.reduce((acc, item) => acc + (item.validEmails ?? 0), 0);

  const handleDeleteLabel = async (labelId: string, label: EmailLabel) => {
    if (label.listId == null || label.listId <= 0) {
      const fromCreated = createdLists.find((c) => c.id === labelId);
      if (fromCreated) {
        setCreatedLists((prev) => prev.filter((e) => e.id !== labelId));
        notifications.show({ title: 'Success', message: 'List removed', color: 'green' });
      }
      setDeleteConfirmLabel(null);
      return;
    }
    setDeleteListSubmitting(true);
    try {
      await api.delete(API_ENDPOINTS.ADMIN.EMAIL_BROAD_DELETE_LIST(label.listId));
      await fetchLabels();
      notifications.show({ title: 'Success', message: 'List deleted', color: 'green' });
      setDeleteConfirmLabel(null);
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to delete list', color: 'red' });
    } finally {
      setDeleteListSubmitting(false);
    }
  };

  const openDeleteConfirm = (label: EmailLabel) => setDeleteConfirmLabel(label);

  const openAddContacts = (label: EmailLabel) => {
    setSelectedListForContacts(label);
    setAddContactsModalOpened(true);
    setImportMethod('upload');
    setImportFile(null);
    setPasteContent('');
    setParsedHeaders([]);
    setParsedRows([]);
    setSelectedEmailColumn(null);
    setOptionalColumnsIncluded({});
    if (modalFileInputRef.current) modalFileInputRef.current.value = '';
  };

  const handleFileChange = (file: File | null) => {
    setImportFile(file);
    setParsedHeaders([]);
    setParsedRows([]);
    setSelectedEmailColumn(null);
    setOptionalColumnsIncluded({});
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => {
          const rows = (r.data || []) as Record<string, string>[];
          if (rows.length > 0) {
            const headers = Object.keys(rows[0]);
            setParsedHeaders(headers);
            setParsedRows(rows);
            const emailCol = headers.find(
              (h) => h.toLowerCase().includes('email') || h.toLowerCase().includes('mail')
            );
            if (emailCol) setSelectedEmailColumn(emailCol);
            const optional = headers
              .filter((h) => h !== emailCol)
              .reduce<Record<string, boolean>>((acc, h) => ({ ...acc, [h]: true }), {});
            setOptionalColumnsIncluded(optional);
          }
        },
      });
    } else if (ext === 'xlsx') {
      readXlsxFile(file).then((data) => {
        if (data.length > 0) {
          const headers = (data[0] as (string | number)[]).map((h) => String(h ?? ''));
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
          const optional = headers
            .filter((h) => h !== emailCol)
            .reduce<Record<string, boolean>>((acc, h) => ({ ...acc, [h]: true }), {});
          setOptionalColumnsIncluded(optional);
        }
      });
    }
  };

  const buildEmailsFromParsed = (): { email: string; [key: string]: string | number | undefined }[] => {
    if (!selectedEmailColumn || parsedRows.length === 0) return [];
    const optionalHeaders = parsedHeaders.filter(
      (h) => h !== selectedEmailColumn && optionalColumnsIncluded[h] !== false
    );
    return parsedRows
      .map((row) => {
        const email = row[selectedEmailColumn]?.trim();
        if (!email || !emailRegex.test(email)) return null;
        const item: { email: string; [key: string]: string | number | undefined } = { email };
        optionalHeaders.forEach((header) => {
          const key = headerToApiKey(header);
          const raw = row[header]?.trim();
          if (raw === '') return;
          const isPhone =
            header.toLowerCase().includes('phone') ||
            header.toLowerCase().includes('mobile') ||
            header.toLowerCase().includes('tel');
          item[key] = isPhone ? (parsePhone(raw) ?? raw) : raw;
        });
        return item;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  };

  const buildEmailsFromPaste = (): { email: string }[] => {
    const lines = pasteContent.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
    return lines
      .filter((e) => emailRegex.test(e))
      .filter((e, i, arr) => arr.indexOf(e) === i)
      .map((email) => ({ email }));
  };

  const getReadyToUploadCount = (): number => {
    if (importMethod === 'upload') return buildEmailsFromParsed().length;
    return buildEmailsFromPaste().length;
  };

  const handleUploadContacts = async () => {
    if (!selectedListForContacts?.listId) return;
    const emails = importMethod === 'upload' ? buildEmailsFromParsed() : buildEmailsFromPaste();
    if (emails.length === 0) {
      notifications.show({ title: 'Error', message: 'No valid emails to upload', color: 'red' });
      return;
    }
    const payloadEmails = emails.map((e) => {
      const { email, ...rest } = e;
      const out: Record<string, string | number> = { email };
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== undefined && v !== '') out[k] = v as string | number;
      });
      return out;
    });
    setImportLoading(true);
    try {
      await api.post(API_ENDPOINTS.ADMIN.EMAIL_BROAD_UPLOAD, {
        listId: selectedListForContacts.listId,
        emails: payloadEmails,
      });
      await fetchLabels();
      notifications.show({
        title: 'Success',
        message: `Uploaded ${emails.length} contact(s) to "${selectedListForContacts.label}"`,
        color: 'green',
      });
      setAddContactsModalOpened(false);
      setSelectedListForContacts(null);
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to upload contacts', color: 'red' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreateList = async () => {
    const name = createListName.trim();
    if (!name) {
      notifications.show({ title: 'Error', message: 'Please enter a list name', color: 'red' });
      return;
    }
    setCreateListSubmitting(true);
    try {
      const response = await api.post<{
        success?: boolean;
        message?: string;
        data?: { listId?: number; id?: number };
      }>(API_ENDPOINTS.ADMIN.EMAIL_BROAD_CREATE_LIST, { label: name });
      const msg = response.data?.message ?? '';
      const isSuccess =
        response.data?.success === true ||
        (response.status >= 200 && response.status < 300) ||
        (typeof msg === 'string' && /created successfully|success/i.test(msg));
      if (isSuccess) {
        setCreateListModalOpened(false);
        setCreateListName('');
        await fetchLabels();
        notifications.show({
          title: 'Success',
          message: typeof msg === 'string' && msg ? msg : `List "${name}" created. Open Contacts to add contacts.`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: typeof msg === 'string' && msg ? msg : 'Failed to create list',
          color: 'red',
        });
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      notifications.show({
        title: 'Error',
        message: msg ?? 'Failed to create list',
        color: 'red',
      });
    } finally {
      setCreateListSubmitting(false);
    }
  };

  return (
    <Box maw={1200} mx="auto" px={{ base: 'xs', sm: 0 }}>
      <DashboardPageHeader
        icon={<IconUpload size={24} stroke={1.75} />}
        title="Email Broadcast Upload"
        description="Create recipient lists and upload/manage contacts directly from Your lists."
      />

      <Box mb="xl">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" align="center">
              <Box>
                <Text size="xs" tt="uppercase" c="dimmed" fw={700}>Total Lists</Text>
                <Text fw={800} size="xl">{totalLists}</Text>
              </Box>
              <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                <IconChecklist size={18} />
              </ThemeIcon>
            </Group>
          </Paper>
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" align="center">
              <Box>
                <Text size="xs" tt="uppercase" c="dimmed" fw={700}>Total Valid Contacts</Text>
                <Text fw={800} size="xl">{totalContacts}</Text>
              </Box>
              <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                <IconMailOpened size={18} />
              </ThemeIcon>
            </Group>
          </Paper>
        </SimpleGrid>

        <Group justify="space-between" align="center" mb="md">
          <Box>
            <Title order={3}>Your lists</Title>
            <Text size="sm" c="dimmed">Upload CSV/Excel or paste contacts directly for each list.</Text>
          </Box>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => setCreateListModalOpened(true)}
          >
            Create New List
          </Button>
        </Group>
        {labelsLoading ? (
          <Paper p="xl" withBorder radius="md">
            <Stack align="center" gap="xs">
              <Loader size="sm" />
              <Text c="dimmed" ta="center">Loading your lists...</Text>
            </Stack>
          </Paper>
        ) : displayLabels.length === 0 ? (
          <Paper p="xl" withBorder radius="md">
            <Stack align="center" gap="xs">
              <ThemeIcon variant="light" color="gray" size="xl" radius="xl">
                <IconUsers size={20} />
              </ThemeIcon>
              <Text c="dimmed" ta="center">
              No lists yet. Click &quot;Create new list&quot; to get started.
              </Text>
            </Stack>
          </Paper>
        ) : (
          <Card {...DASHBOARD_TABLE_CARD_PROPS} p={0}>
            <ScrollArea type="auto" offsetScrollbars>
              <Table {...DASHBOARD_TABLE_PROPS} styles={DASHBOARD_TABLE_STYLES}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ textAlign: 'left' }}>List ID</Table.Th>
                    <Table.Th style={{ textAlign: 'left' }}>List Name</Table.Th>
                    <Table.Th style={{ textAlign: 'left' }}>Valid emails</Table.Th>
                    <Table.Th style={{ textAlign: 'left' }}>Total emails</Table.Th>
                    <Table.Th style={{ textAlign: 'left' }}>Status</Table.Th>
                    <Table.Th style={{ textAlign: 'left' }}>Created at</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {displayLabels.map((label) => (
                    <Table.Tr key={label.id}>
                      <Table.Td style={{ textAlign: 'left' }}>
                        <Text size="sm" c="dimmed">{label.listId || '—'}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'left' }}>
                        <Text fw={600}>{label.label}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'left' }}>
                        <Badge variant="light" color="teal">
                          {label.validEmails != null ? label.validEmails : '—'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'left' }}>
                        <Badge variant="light" color="gray">
                          {label.totalEmails != null ? label.totalEmails : '—'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'left' }}>
                        <Badge
                          variant="light"
                          color={
                            label.status?.toLowerCase() === 'completed'
                              ? 'green'
                              : label.status?.toLowerCase() === 'processing'
                                ? 'blue'
                                : 'gray'
                          }
                          tt="uppercase"
                        >
                          {label.status ?? '—'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'left' }}>
                        <Text size="sm" c="dimmed">
                          {label.createdAt
                            ? (() => {
                                try {
                                  const d = new Date(label.createdAt);
                                  return Number.isNaN(d.getTime()) ? '—' : format(d, 'd/M/yy');
                                } catch {
                                  return '—';
                                }
                              })()
                            : '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap="xs" justify="flex-end">
                          <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => openAddContacts(label)}
                          >
                            Add Contacts
                          </Button>
                          <Tooltip label="Delete list">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => openDeleteConfirm(label)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        )}
      </Box>

      {/* Create new list modal */}
      <Modal
        opened={createListModalOpened}
        onClose={() => {
          setCreateListModalOpened(false);
          setCreateListName('');
        }}
        title="Create New List"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="List name"
            placeholder="e.g. February Campaign"
            value={createListName}
            onChange={(e) => setCreateListName(e.target.value)}
          />
          <Text size="sm" c="dimmed">
            Create a list first, then upload contacts directly from this screen.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setCreateListModalOpened(false);
                setCreateListName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateList}
              loading={createListSubmitting}
              disabled={!createListName.trim()}
            >
              Create List
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete list confirmation modal */}
      <Modal
        opened={deleteConfirmLabel != null}
        onClose={() => setDeleteConfirmLabel(null)}
        title="Delete List"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this list{deleteConfirmLabel ? ` "${deleteConfirmLabel.label}"` : ''}? This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setDeleteConfirmLabel(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={deleteListSubmitting}
              disabled={deleteListSubmitting}
              onClick={() => deleteConfirmLabel && handleDeleteLabel(deleteConfirmLabel.id, deleteConfirmLabel)}
            >
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add contacts modal */}
      <Modal
        opened={addContactsModalOpened}
        onClose={() => {
          setAddContactsModalOpened(false);
          setSelectedListForContacts(null);
          setImportFile(null);
          setPasteContent('');
          setParsedHeaders([]);
          setParsedRows([]);
          setSelectedEmailColumn(null);
          setOptionalColumnsIncluded({});
          if (modalFileInputRef.current) modalFileInputRef.current.value = '';
        }}
        title={selectedListForContacts ? `Add Contacts — ${selectedListForContacts.label}` : 'Add Contacts'}
        size="lg"
        styles={{ title: { fontWeight: 600 } }}
      >
        <Stack gap="md">
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
              setSelectedEmailColumn(null);
              setOptionalColumnsIncluded({});
              if (modalFileInputRef.current) modalFileInputRef.current.value = '';
            }}
            allowDeselect={false}
          />

          {importMethod === 'upload' ? (
            <>
              <Box>
                <Text size="sm" fw={500} mb="xs">File</Text>
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
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                  <Group justify="center" gap="xs">
                    <IconUpload size={20} color="var(--mantine-color-gray-6)" />
                    <Text size="sm" c={importFile ? 'dark' : 'dimmed'}>
                      {importFile ? importFile.name : 'Click to choose CSV or Excel file'}
                    </Text>
                  </Group>
                </Paper>
                <Text size="xs" c="dimmed" mt={4}>Accepted: .csv, .xlsx</Text>
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
                  {parsedHeaders.filter((h) => h !== selectedEmailColumn).map((header) => (
                    <Checkbox
                      key={header}
                      label={`Optional: ${header} column`}
                      checked={optionalColumnsIncluded[header] !== false}
                      onChange={(e) =>
                        setOptionalColumnsIncluded((prev) => ({ ...prev, [header]: e.currentTarget.checked }))
                      }
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <Textarea
              label="Paste emails"
              placeholder="Paste emails separated by new lines, commas, or semicolons."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              minRows={8}
              autosize
            />
          )}

          {getReadyToUploadCount() > 0 && (
            <Alert color="green">{getReadyToUploadCount()} valid email(s) ready to upload</Alert>
          )}

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setAddContactsModalOpened(false);
                setSelectedListForContacts(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="orange"
              loading={importLoading}
              disabled={
                !selectedListForContacts ||
                (importMethod === 'upload' &&
                  (!importFile || (parsedHeaders.length > 0 && !selectedEmailColumn))) ||
                getReadyToUploadCount() === 0
              }
              onClick={handleUploadContacts}
            >
              Upload Contacts
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default EmailBroadcast;
