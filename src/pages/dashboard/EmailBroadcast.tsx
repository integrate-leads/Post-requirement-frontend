import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  Textarea,
  FileInput,
  Tabs,
  Table,
  Badge,
  Stack,
  Modal,
  Select,
  ActionIcon,
  Tooltip,
  Paper,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconUpload,
  IconFileSpreadsheet,
  IconDownload,
  IconTrash,
  IconMail,
  IconCopy,
  IconCheck,
  IconX,
  IconUsers,
  IconPlus,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';

interface EmailLabel {
  id: string;
  label: string;
  emailCount: number;
  createdAt: string;
  emails: string[];
}

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  emailColumn?: string;
}

const EmailBroadcast: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedEmails, setPastedEmails] = useState<string>('');
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [labelModalOpened, setLabelModalOpened] = useState(false);
  const [labelName, setLabelName] = useState('');
  const [selectedEmailColumn, setSelectedEmailColumn] = useState<string | null>(null);
  const [extractedEmails, setExtractedEmails] = useState<string[]>([]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  // Create new list modal (Image 1)
  const [createListModalOpened, setCreateListModalOpened] = useState(false);
  const [createListName, setCreateListName] = useState('');
  const [createListSubmitting, setCreateListSubmitting] = useState(false);

  // Fetch user's labels on mount
  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const response = await api.get<{ success: boolean; data: EmailLabel[] }>(
        API_ENDPOINTS.ADMIN.EMAIL_LABELS
      );
      if (response.data?.success) {
        setLabels(response.data.data || []);
      }
    } catch (error) {
      // If endpoint doesn't exist, use localStorage as fallback
      const storedLabels = localStorage.getItem(`emailLabels_${user?.id}`);
      if (storedLabels) {
        setLabels(JSON.parse(storedLabels));
      }
    }
  };

  const saveLabel = async (emails: string[], label: string) => {
    try {
      // Check if we're updating an existing label
      if (editingLabelId) {
        const updatedLabel: EmailLabel = {
          id: editingLabelId,
          label,
          emailCount: emails.length,
          createdAt: labels.find(l => l.id === editingLabelId)?.createdAt || new Date().toISOString(),
          emails,
        };

        // Try to update via API first
        try {
          await api.put(`${API_ENDPOINTS.ADMIN.CREATE_EMAIL_LABEL}/${editingLabelId}`, {
            label,
            emails,
          });
        } catch (apiError) {
          // Fallback to localStorage
          const storedLabels = localStorage.getItem(`emailLabels_${user?.id}`);
          if (storedLabels) {
            const existingLabels = JSON.parse(storedLabels) as EmailLabel[];
            const updatedLabels = existingLabels.map(l => 
              l.id === editingLabelId ? updatedLabel : l
            );
            localStorage.setItem(`emailLabels_${user?.id}`, JSON.stringify(updatedLabels));
          }
        }

        setLabels((prev) => prev.map(l => l.id === editingLabelId ? updatedLabel : l));
        notifications.show({
          title: 'Success',
          message: `Label "${label}" updated with ${emails.length} emails`,
          color: 'green',
        });
      } else {
        // Creating a new label
        const newLabel: EmailLabel = {
          id: Date.now().toString(),
          label,
          emailCount: emails.length,
          createdAt: new Date().toISOString(),
          emails,
        };

        // Try to save to API first
        try {
          await api.post(API_ENDPOINTS.ADMIN.CREATE_EMAIL_LABEL, {
            label,
            emails,
          });
        } catch (apiError) {
          // Fallback to localStorage
          const storedLabels = localStorage.getItem(`emailLabels_${user?.id}`);
          const existingLabels = storedLabels ? JSON.parse(storedLabels) : [];
          const updatedLabels = [...existingLabels, newLabel];
          localStorage.setItem(`emailLabels_${user?.id}`, JSON.stringify(updatedLabels));
        }

        setLabels((prev) => [...prev, newLabel]);
        notifications.show({
          title: 'Success',
          message: `Label "${label}" saved with ${emails.length} emails`,
          color: 'green',
        });
      }

      setLabelModalOpened(false);
      setLabelName('');
      setEditingLabelId(null);
      setFile(null);
      setPastedEmails('');
      setParsedData(null);
      setExtractedEmails([]);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: editingLabelId ? 'Failed to update label' : 'Failed to save label',
        color: 'red',
      });
    }
  };

  const handleFileUpload = async (uploadedFile: File | null) => {
    if (!uploadedFile) {
      setFile(null);
      setParsedData(null);
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    try {
      const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Parse CSV
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const firstRow = results.data[0] as Record<string, string>;
              const headers = Object.keys(firstRow);
              const rows = results.data as Record<string, string>[];

              setParsedData({ headers, rows });
              
              // Auto-detect email column
              const emailColumn = headers.find(
                (h) =>
                  h.toLowerCase().includes('email') ||
                  h.toLowerCase().includes('e-mail') ||
                  h.toLowerCase().includes('mail')
              );
              if (emailColumn) {
                setSelectedEmailColumn(emailColumn);
              }
            }
            setLoading(false);
          },
          error: (error) => {
            notifications.show({
              title: 'Error',
              message: 'Failed to parse CSV file',
              color: 'red',
            });
            setLoading(false);
          },
        });
      } else if (fileExtension === 'xlsx') {
        // Parse Excel (.xlsx only; .xls is not supported — use .xlsx or CSV)
        readXlsxFile(uploadedFile)
          .then((jsonData) => {
            if (jsonData.length > 0) {
              const headers = (jsonData[0] as (string | number | boolean | Date)[]).map((h) =>
                String(h ?? '')
              ) as string[];
              const rows = jsonData.slice(1).map((row) => {
                const rowObj: Record<string, string> = {};
                headers.forEach((header, index) => {
                  rowObj[header] = String((row as (string | number | boolean | Date)[])[index] ?? '');
                });
                return rowObj;
              });

              setParsedData({ headers, rows });

              const emailColumn = headers.find(
                (h) =>
                  h.toLowerCase().includes('email') ||
                  h.toLowerCase().includes('e-mail') ||
                  h.toLowerCase().includes('mail')
              );
              if (emailColumn) {
                setSelectedEmailColumn(emailColumn);
              }
            }
            setLoading(false);
          })
          .catch(() => {
            notifications.show({
              title: 'Error',
              message: 'Failed to parse Excel file',
              color: 'red',
            });
            setLoading(false);
          });
      } else {
        notifications.show({
          title: 'Error',
          message: 'Unsupported file format. Please upload CSV or Excel files.',
          color: 'red',
        });
        setLoading(false);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to process file',
        color: 'red',
      });
      setLoading(false);
    }
  };

  const extractEmailsFromColumn = () => {
    if (!parsedData || !selectedEmailColumn) {
      return;
    }

    const emails = parsedData.rows
      .map((row) => row[selectedEmailColumn]?.trim())
      .filter((email) => {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email && emailRegex.test(email);
      })
      .filter((email, index, self) => self.indexOf(email) === index); // Remove duplicates

    setExtractedEmails(emails);
  };

  useEffect(() => {
    if (selectedEmailColumn && parsedData) {
      extractEmailsFromColumn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmailColumn, parsedData]);

  const handlePasteEmails = () => {
    const emailList = pastedEmails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email && emailRegex.test(email);
      })
      .filter((email, index, self) => self.indexOf(email) === index); // Remove duplicates

    if (emailList.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'No valid emails found in pasted text',
        color: 'red',
      });
      return;
    }

    setExtractedEmails(emailList);
    setEditingLabelId(null);
    setLabelModalOpened(true);
  };

  const handleSaveLabel = () => {
    if (!labelName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a label name',
        color: 'red',
      });
      return;
    }

    if (extractedEmails.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'No emails to save',
        color: 'red',
      });
      return;
    }

    saveLabel(extractedEmails, labelName.trim());
  };

  const handleDownloadLabel = (label: EmailLabel) => {
    // Create CSV content
    const csvContent = label.emails.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.label.replace(/[^a-z0-9]/gi, '_')}_emails.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    notifications.show({
      title: 'Success',
      message: `Downloaded ${label.label}`,
      color: 'green',
    });
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      // Try to delete from API
      try {
        await api.delete(`${API_ENDPOINTS.ADMIN.DELETE_EMAIL_LABEL}/${labelId}`);
      } catch (apiError) {
        // Fallback to localStorage
        const storedLabels = localStorage.getItem(`emailLabels_${user?.id}`);
        if (storedLabels) {
          const existingLabels = JSON.parse(storedLabels) as EmailLabel[];
          const updatedLabels = existingLabels.filter((l) => l.id !== labelId);
          localStorage.setItem(`emailLabels_${user?.id}`, JSON.stringify(updatedLabels));
        }
      }

      setLabels((prev) => prev.filter((l) => l.id !== labelId));
      notifications.show({
        title: 'Success',
        message: 'Label deleted',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete label',
        color: 'red',
      });
    }
  };

  const handleReuploadLabel = (label: EmailLabel) => {
    setExtractedEmails([]);
    setFile(null);
    setPastedEmails('');
    setParsedData(null);
    setSelectedEmailColumn(null);
    setLabelModalOpened(true);
    setLabelName(label.label);
    setEditingLabelId(label.id);
  };

  const handleCreateList = async () => {
    const name = createListName.trim();
    if (!name) {
      notifications.show({ title: 'Error', message: 'Please enter a list name', color: 'red' });
      return;
    }
    const isDuplicate = labels.some((l) => l.label.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      notifications.show({
        title: 'Error',
        message: 'A list with this name already exists. The name should be unique.',
        color: 'red',
      });
      return;
    }
    setCreateListSubmitting(true);
    try {
      const newLabel: EmailLabel = {
        id: Date.now().toString(),
        label: name,
        emailCount: 0,
        createdAt: new Date().toISOString(),
        emails: [],
      };
      try {
        await api.post(API_ENDPOINTS.ADMIN.CREATE_EMAIL_LABEL, { label: name, emails: [] });
      } catch {
        const storedLabels = localStorage.getItem(`emailLabels_${user?.id}`);
        const existingLabels = storedLabels ? JSON.parse(storedLabels) : [];
        const updatedLabels = [...existingLabels, newLabel];
        localStorage.setItem(`emailLabels_${user?.id}`, JSON.stringify(updatedLabels));
      }
      setLabels((prev) => [...prev, newLabel]);
      notifications.show({ title: 'Success', message: `List "${name}" created`, color: 'green' });
      setCreateListModalOpened(false);
      setCreateListName('');
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to create list', color: 'red' });
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
            leftSection={<IconPlus size={18} />}
            onClick={() => setCreateListModalOpened(true)}
          >
            Create new list
          </Button>
        </Group>
        {labels.length === 0 ? (
          <Paper p="xl" withBorder>
            <Text c="dimmed" ta="center">
              No lists yet. Create a new list to get started.
            </Text>
          </Paper>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>List Name</Table.Th>
                <Table.Th>Email Count</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {labels.map((label) => (
                <Table.Tr key={label.id}>
                  <Table.Td>
                    <Text fw={500}>{label.label}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="blue" variant="light">{label.emailCount}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {new Date(label.createdAt).toLocaleDateString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
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
                      <Tooltip label="Re-upload">
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => handleReuploadLabel(label)}
                        >
                          <IconUpload size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteLabel(label.id)}
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

      {/* Create Email List modal (Image 1) */}
      <Modal
        opened={createListModalOpened}
        onClose={() => {
          setCreateListModalOpened(false);
          setCreateListName('');
        }}
        title="Create Email List"
      >
        <Stack gap="md">
          <TextInput
            label="List Name"
            placeholder="My List"
            value={createListName}
            onChange={(e) => setCreateListName(e.target.value)}
          />
          <Text size="sm" c="dimmed">
            Please enter the name of the list that you want to create. The name should be unique and
            should not be the same as any other list in your organization.
          </Text>
          <Group justify="flex-end" mt="md">
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
              color="orange"
              onClick={handleCreateList}
              loading={createListSubmitting}
              disabled={!createListName.trim()}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={labelModalOpened}
        onClose={() => {
          setLabelModalOpened(false);
          setLabelName('');
          setEditingLabelId(null);
          setExtractedEmails([]);
          setFile(null);
          setPastedEmails('');
          setParsedData(null);
          setSelectedEmailColumn(null);
        }}
        title={editingLabelId ? "Update Email Label" : "Save Email Label"}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Label Name"
            placeholder="Enter a name for this email list"
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
            required
          />

          {editingLabelId && (
            <Tabs defaultValue="upload">
              <Tabs.List>
                <Tabs.Tab value="upload" leftSection={<IconUpload size={16} />}>
                  Upload File
                </Tabs.Tab>
                <Tabs.Tab value="paste" leftSection={<IconCopy size={16} />}>
                  Paste Emails
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="upload" pt="md">
                <Stack gap="md">
                  <FileInput
                    label="Upload CSV or Excel File"
                    placeholder="Choose file..."
                    accept=".csv,.xlsx"
                    leftSection={<IconFileSpreadsheet size={16} />}
                    value={file}
                    onChange={handleFileUpload}
                  />

                  {parsedData && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">
                        Select Email Column
                      </Text>
                      <Select
                        placeholder="Choose email column"
                        data={parsedData.headers}
                        value={selectedEmailColumn}
                        onChange={(value) => setSelectedEmailColumn(value)}
                      />
                      {selectedEmailColumn && (
                        <Alert color="blue" mt="sm">
                          Found {extractedEmails.length} valid email(s) in "{selectedEmailColumn}" column
                        </Alert>
                      )}
                    </Box>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="paste" pt="md">
                <Stack gap="md">
                  <Textarea
                    label="Paste Emails"
                    placeholder="Enter emails separated by commas, semicolons, or new lines&#10;Example: email1@example.com, email2@example.com"
                    value={pastedEmails}
                    onChange={(e) => setPastedEmails(e.target.value)}
                    minRows={4}
                  />
                  <Button
                    onClick={handlePasteEmails}
                    leftSection={<IconMail size={16} />}
                    disabled={!pastedEmails.trim()}
                    variant="light"
                    size="sm"
                  >
                    Extract Emails
                  </Button>
                  {extractedEmails.length > 0 && (
                    <Alert color="green">
                      Extracted {extractedEmails.length} valid email(s)
                    </Alert>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          )}

          {extractedEmails.length > 0 && (
            <Alert color="blue">
              {extractedEmails.length} email(s) will be {editingLabelId ? 'updated' : 'saved'}
            </Alert>
          )}

          {!editingLabelId && extractedEmails.length === 0 && (
            <Alert color="yellow">
              Please upload a file or paste emails to continue
            </Alert>
          )}

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setLabelModalOpened(false);
                setLabelName('');
                setEditingLabelId(null);
                setExtractedEmails([]);
                setFile(null);
                setPastedEmails('');
                setParsedData(null);
                setSelectedEmailColumn(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveLabel} 
              leftSection={<IconCheck size={16} />}
              disabled={extractedEmails.length === 0}
            >
              {editingLabelId ? 'Update Label' : 'Save Label'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default EmailBroadcast;
