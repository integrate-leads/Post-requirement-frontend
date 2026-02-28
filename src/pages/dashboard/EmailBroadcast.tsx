import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Title,
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
} from '@mantine/core';
import {
  IconUsers,
  IconPlus,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAtom } from 'jotai';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { emailBroadcastCreatedListsAtom, emailBroadcastContactsAtom, type EmailBroadcastListEntry } from '@/store/emailBroadcastAtoms';
import { format } from 'date-fns';

interface ApiLabelItem {
  listId: number;
  label: string;
  emailCount?: number;
  status?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

/** Display shape for Your lists table (from API) */
interface EmailLabel {
  id: string;
  listId: number;
  label: string;
  emailCount?: number;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

const EmailBroadcast: React.FC = () => {
  const navigate = useNavigate();
  const [createdLists, setCreatedLists] = useAtom(emailBroadcastCreatedListsAtom);
  const [contactsByList] = useAtom(emailBroadcastContactsAtom);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [createListModalOpened, setCreateListModalOpened] = useState(false);
  const [createListName, setCreateListName] = useState('');
  const [createListSubmitting, setCreateListSubmitting] = useState(false);
  const [deleteConfirmLabel, setDeleteConfirmLabel] = useState<EmailLabel | null>(null);
  const [deleteListSubmitting, setDeleteListSubmitting] = useState(false);

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
            emailCount: item.emailCount,
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
      emailCount: l.emailCount,
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
          emailCount: undefined,
          createdAt: undefined,
          metadata: c.metadata,
        });
      } else if (c.listId == null && !apiIds.has(c.id)) {
        fromApi.push({
          id: c.id,
          listId: c.listId ?? 0,
          label: c.label,
          emailCount: undefined,
          createdAt: undefined,
          metadata: c.metadata,
        });
      }
    }
    return fromApi;
  }, [labels, createdLists]);

  const handleDownloadLabel = (label: EmailLabel) => {
    const data = contactsByList[label.id];
    if (!data || data.contacts.length === 0) {
      notifications.show({
        title: 'No data',
        message: 'Open Contacts to add contacts, then you can download.',
        color: 'gray',
      });
      return;
    }
    const headers = data.headers.length > 0 ? data.headers : ['Email', 'First Name', 'Phone'];
    const headerRow = headers.join(',');
    const rows = data.contacts.map((r) => headers.map((h) => `"${(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headerRow, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.label.replace(/[^a-z0-9]/gi, '_')}_contacts.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    notifications.show({ title: 'Success', message: `Downloaded ${label.label}`, color: 'green' });
  };

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
    <Box maw={1200} mx="auto">
      <Title order={2} mb="lg">
        Email Broadcast
      </Title>

      <Box mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Your lists</Title>
          <Button
            variant="light"
            leftSection={<IconPlus size={18} />}
            onClick={() => setCreateListModalOpened(true)}
          >
            Create new list
          </Button>
        </Group>
        {labelsLoading ? (
          <Paper p="xl" withBorder>
            <Text c="dimmed" ta="center">Loading lists...</Text>
          </Paper>
        ) : displayLabels.length === 0 ? (
          <Paper p="xl" withBorder>
            <Text c="dimmed" ta="center">
              No lists yet. Click &quot;Create new list&quot; to create one, then open Contacts to upload contacts.
            </Text>
          </Paper>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ textAlign: 'left' }}>List ID</Table.Th>
                <Table.Th style={{ textAlign: 'left' }}>List Name</Table.Th>
                <Table.Th style={{ textAlign: 'left' }}>Email count</Table.Th>
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
                    <Text fw={500}>{label.label}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'left' }}>
                    <Text size="sm">{label.emailCount != null ? label.emailCount : '—'}</Text>
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
                        leftSection={<IconUsers size={14} />}
                        onClick={() => navigate(`/recruiter/email-broadcast/contact/${label.id}`)}
                      >
                        Contacts
                      </Button>
                      <Tooltip label="Download">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleDownloadLabel(label)}
                        >
                          <IconDownload size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
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
        )}
      </Box>

      {/* Create new list modal */}
      <Modal
        opened={createListModalOpened}
        onClose={() => {
          setCreateListModalOpened(false);
          setCreateListName('');
        }}
        title="Create new list"
      >
        <Stack gap="md">
          <TextInput
            label="List name"
            placeholder="e.g. February Campaign"
            value={createListName}
            onChange={(e) => setCreateListName(e.target.value)}
          />
          <Text size="sm" c="dimmed">
            Create a list first, then open Contacts to upload contacts (file or paste).
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
              Create
</Button>
        </Group>
        </Stack>
      </Modal>

      {/* Delete list confirmation modal */}
      <Modal
        opened={deleteConfirmLabel != null}
        onClose={() => setDeleteConfirmLabel(null)}
        title="Delete list"
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
    </Box>
  );
};

export default EmailBroadcast;
