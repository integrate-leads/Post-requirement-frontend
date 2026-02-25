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

interface ApiLabelItem {
  listId: number;
  label: string;
  metadata?: Record<string, unknown>;
}

/** Display shape for Your lists table (from API) */
interface EmailLabel {
  id: string;
  listId: number;
  label: string;
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
          metadata: c.metadata,
        });
      } else if (c.listId == null && !apiIds.has(c.id)) {
        fromApi.push({
          id: c.id,
          listId: c.listId ?? 0,
          label: c.label,
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

  const handleDeleteLabel = (labelId: string, label: EmailLabel) => {
    const fromCreated = createdLists.find((c) => c.id === labelId);
    if (fromCreated) {
      setCreatedLists((prev) => prev.filter((e) => e.id !== labelId));
      notifications.show({ title: 'Success', message: 'List removed', color: 'green' });
    } else {
      notifications.show({
        title: 'Not available',
        message: 'Delete is not supported for lists from the server.',
        color: 'gray',
      });
    }
  };

  const handleCreateList = async () => {
    const name = createListName.trim();
    if (!name) {
      notifications.show({ title: 'Error', message: 'Please enter a list name', color: 'red' });
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const newEntry: EmailBroadcastListEntry = { id: tempId, label: name };
    setCreatedLists((prev) => [...prev, newEntry]);
    setCreateListModalOpened(false);
    setCreateListName('');
    notifications.show({ title: 'Success', message: `List "${name}" created. Open Contacts to upload contacts.`, color: 'green' });
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
                <Table.Th style={{ textAlign: 'left' }}>Metadata</Table.Th>
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
                    {label.metadata && Object.keys(label.metadata).length > 0 ? (
                      <Text size="sm" c="dimmed">
                        {JSON.stringify(label.metadata)}
                      </Text>
                    ) : (
                      '—'
                    )}
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
                          onClick={() => handleDeleteLabel(label.id, label)}
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
    </Box>
  );
};

export default EmailBroadcast;
