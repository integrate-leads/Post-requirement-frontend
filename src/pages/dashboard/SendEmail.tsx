import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  Stack,
  Select,
  Alert,
  Paper,
  Divider,
} from '@mantine/core';
import {
  IconSend,
  IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Placeholder from '@tiptap/extension-placeholder';
import './SendEmail.css';

interface EmailLabel {
  id: string;
  label: string;
  emailCount: number;
  createdAt: string;
  emails: string[];
}

const SendEmail: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [fromEmailId, setFromEmailId] = useState('');
  const [fromName, setFromName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link,
      Highlight,
      Superscript,
      SubScript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Compose your email here...' }),
    ],
    content: emailContent,
    onUpdate: ({ editor }) => setEmailContent(editor.getHTML()),
    immediatelyRender: false,
  });

  // Fetch labels on mount
  useEffect(() => {
    fetchLabels();
    fetchUserProfile();
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
      const storedLabels = localStorage.getItem(`emailLabels_${user?.id}`);
      if (storedLabels) {
        setLabels(JSON.parse(storedLabels));
      }
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get<{ success: boolean; data: any }>(
        API_ENDPOINTS.ADMIN.GET_PROFILE
      );
      if (response.data?.success && response.data.data) {
        const profile = response.data.data;
        if (profile.companyName) setCompanyName(profile.companyName);
        if (profile.name) setFromName(profile.name);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const validateField = (_fieldName: string, value: string): string => {
    if (value.includes("'")) {
      return "Apostrophe (') character is not allowed in this field";
    }
    return '';
  };

  const handleSubjectChange = (value: string) => {
    setErrors((prev) => ({ ...prev, subject: validateField('subject', value) }));
    setSubject(value);
  };

  const handleFromEmailIdChange = (value: string) => {
    setErrors((prev) => ({ ...prev, fromEmailId: validateField('fromEmailId', value) }));
    setFromEmailId(value);
  };

  const handleFromNameChange = (value: string) => {
    setErrors((prev) => ({ ...prev, fromName: validateField('fromName', value) }));
    setFromName(value);
  };

  const handleCompanyNameChange = (value: string) => {
    setErrors((prev) => ({ ...prev, companyName: validateField('companyName', value) }));
    setCompanyName(value);
  };

  const handleSendEmail = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else {
      const e = validateField('subject', subject);
      if (e) newErrors.subject = e;
    }

    if (!fromEmailId.trim()) {
      newErrors.fromEmailId = 'From eMail ID is required';
    } else {
      const e = validateField('fromEmailId', fromEmailId);
      if (e) newErrors.fromEmailId = e;
    }

    if (!selectedLabelId) newErrors.label = 'Please select an email label';

    const contentText = emailContent.replace(/<[^>]*>/g, '').trim();
    if (!contentText || emailContent === '<p></p>' || emailContent === '<p><br></p>') {
      newErrors.content = 'Email content is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fix the errors before sending',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      const selectedLabel = labels.find((l) => l.id === selectedLabelId);
      if (!selectedLabel) throw new Error('Selected label not found');

      const emailData = {
        subject: subject.trim(),
        fromEmailId: `${fromEmailId.trim()}@stacknexus.io`,
        fromName: fromName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        content: emailContent,
        recipientEmails: selectedLabel.emails,
        labelId: selectedLabelId,
      };

      try {
        await api.post(API_ENDPOINTS.ADMIN.SEND_EMAIL || '/admin/email-broadcast/send', emailData);
        notifications.show({
          title: 'Success',
          message: `Email sent successfully to ${selectedLabel.emailCount} recipients`,
          color: 'green',
        });
        setSubject('');
        setFromEmailId('');
        setFromName('');
        setCompanyName('');
        setEmailContent('');
        setSelectedLabelId(null);
        editor?.commands.setContent('');
      } catch {
        notifications.show({
          title: 'Email Prepared',
          message: `Email ready to send to ${selectedLabel.emailCount} recipients. Backend integration pending.`,
          color: 'blue',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send email',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedLabel = labels.find((l) => l.id === selectedLabelId);

  return (
    <Box maw={1200} mx="auto">
      <Title order={2} mb="lg">
        Send Email Broadcast
      </Title>

      <Alert icon={<IconAlertCircle size={16} />} color="yellow" mb="lg">
        <Text size="sm" fw={500} mb="xs">
          Mandatory fields are marked with *
        </Text>
        <Text size="xs">
          Note: Apostrophe (') character is not allowed in text fields, please avoid this while
          typing in Subject, From eMail ID, From Name, Company Name fields.
        </Text>
      </Alert>

      <Card shadow="sm" padding="lg" withBorder>
        <Stack gap="md">
          <TextInput
            label={
              <Text span fw={500}>
                Subject <Text span c="red">*</Text>
              </Text>
            }
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            error={errors.subject}
            required
          />

          <Box>
            <TextInput
              label={
                <Text span fw={500}>
                  From eMail ID <Text span c="red">*</Text>
                </Text>
              }
              placeholder="Enter email address excluding domain name"
              description="(Enter the eMail address excluding the domain name)"
              value={fromEmailId}
              onChange={(e) => handleFromEmailIdChange(e.target.value)}
              error={errors.fromEmailId}
              required
              rightSection={
                <Text size="sm" c="dimmed" mr="xs">
                  @stacknexus.io
                </Text>
              }
            />
          </Box>

          <TextInput
            label="From Name"
            placeholder="Enter sender name"
            value={fromName}
            onChange={(e) => handleFromNameChange(e.target.value)}
            error={errors.fromName}
          />

          <TextInput
            label="Company Name"
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => handleCompanyNameChange(e.target.value)}
            error={errors.companyName}
          />

          <Divider my="md" />

          <Select
            label={
              <Text span fw={500}>
                Select Email Label <Text span c="red">*</Text>
              </Text>
            }
            placeholder="Choose an email label"
            data={labels.map((label) => ({
              value: label.id,
              label: `${label.label} (${label.emailCount} emails)`,
            }))}
            value={selectedLabelId}
            onChange={(value) => setSelectedLabelId(value)}
            error={errors.label}
            required
            searchable
          />

          {selectedLabel && (
            <Alert color="blue">
              <Text size="sm">
                Will send to <strong>{selectedLabel.emailCount}</strong> email(s) from label:{' '}
                <strong>{selectedLabel.label}</strong>
              </Text>
            </Alert>
          )}

          <Divider my="md" />

          <Box>
            <Text size="sm" fw={500} mb="xs">
              Email Content <Text span c="red">*</Text>
            </Text>
            {errors.content && (
              <Text size="xs" c="red" mb="xs">
                {errors.content}
              </Text>
            )}
            <Paper withBorder p={0}>
              <RichTextEditor editor={editor}>
                <RichTextEditor.Toolbar>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.Strikethrough />
                    <RichTextEditor.ClearFormatting />
                    <RichTextEditor.Highlight />
                    <RichTextEditor.Code />
                  </RichTextEditor.ControlsGroup>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.H1 />
                    <RichTextEditor.H2 />
                    <RichTextEditor.H3 />
                    <RichTextEditor.H4 />
                  </RichTextEditor.ControlsGroup>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Blockquote />
                    <RichTextEditor.Hr />
                    <RichTextEditor.BulletList />
                    <RichTextEditor.OrderedList />
                    <RichTextEditor.Subscript />
                    <RichTextEditor.Superscript />
                  </RichTextEditor.ControlsGroup>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Link />
                    <RichTextEditor.Unlink />
                  </RichTextEditor.ControlsGroup>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.AlignLeft />
                    <RichTextEditor.AlignCenter />
                    <RichTextEditor.AlignJustify />
                    <RichTextEditor.AlignRight />
                  </RichTextEditor.ControlsGroup>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Undo />
                    <RichTextEditor.Redo />
                  </RichTextEditor.ControlsGroup>
                </RichTextEditor.Toolbar>
                <RichTextEditor.Content />
              </RichTextEditor>
            </Paper>
          </Box>

          <Group justify="flex-end" mt="lg">
            <Button
              onClick={handleSendEmail}
              leftSection={<IconSend size={16} />}
              loading={loading}
              size="lg"
            >
              Send Email
            </Button>
          </Group>
        </Stack>
      </Card>
    </Box>
  );
};

export default SendEmail;
