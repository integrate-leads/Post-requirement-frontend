import React, { useState, useEffect, useRef } from 'react';
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
  Loader,
  Center,
} from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import './SendEmail.css';

declare global {
  interface Window {
    $?: unknown;
    jQuery?: unknown;
  }
}

interface EmailLabel {
  id: string;
  label: string;
  emailCount: number;
  createdAt: string;
  emails: string[];
}

const CDN_BASE = 'https://cdn.jsdelivr.net/npm';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

const SendEmail: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [replyToEmail, setReplyToEmail] = useState(''); // full reply-to email from /recruiter/settings (profile email)
  const [fromName, setFromName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editorKey, setEditorKey] = useState(0);
  const [editorReady, setEditorReady] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const summernoteInitialized = useRef(false);

  // Load jQuery, Bootstrap, Summernote from CDN (no node_modules resolution)
  useEffect(() => {
    const linkBootstrap = document.createElement('link');
    linkBootstrap.rel = 'stylesheet';
    linkBootstrap.href = `${CDN_BASE}/bootstrap@4.6.2/dist/css/bootstrap.min.css`;
    linkBootstrap.crossOrigin = 'anonymous';
    document.head.appendChild(linkBootstrap);

    const linkSummernote = document.createElement('link');
    linkSummernote.rel = 'stylesheet';
    linkSummernote.href = `${CDN_BASE}/summernote@0.8.20/dist/summernote-bs4.min.css`;
    linkSummernote.crossOrigin = 'anonymous';
    document.head.appendChild(linkSummernote);

    let cancelled = false;
    (async () => {
      try {
        await loadScript(`${CDN_BASE}/jquery@3.7.1/dist/jquery.slim.min.js`);
        const jq = (window as Window & { jQuery?: unknown }).jQuery;
        if (!jq) {
          throw new Error('jQuery did not attach to window');
        }
        (window as Window & { $: unknown }).$ = jq;

        await loadScript(`${CDN_BASE}/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js`);
        await loadScript(`${CDN_BASE}/summernote@0.8.20/dist/summernote-bs4.min.js`);

        if (!cancelled) setEditorReady(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load editor';
        if (!cancelled) setEditorError(message);
        console.error('SendEmail editor load error:', err);
      }
    })();

    return () => {
      cancelled = true;
      linkBootstrap.remove();
      linkSummernote.remove();
    };
  }, []);

  // Initialize Summernote on the div when ready and ref is set
  useEffect(() => {
    if (!editorReady || !editorRef.current || summernoteInitialized.current) return;

    const win = window as Window & { jQuery?: { fn: { summernote?: unknown }; (el: HTMLElement): { length: number; summernote: (a: unknown) => void; summernote: (cmd: string, value?: string) => void } } };
    const JQ = win.jQuery;
    if (!JQ || typeof JQ.fn?.summernote !== 'function') return;

    const $el = JQ(editorRef.current);
    if ($el.length === 0) return;

    const options = {
      placeholder: 'Compose your email here...',
      height: 400,
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
        ['fontname', ['fontname']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'video', 'hr']],
        ['view', ['fullscreen', 'codeview', 'help']],
      ],
      callbacks: {
        onChange: (content: string) => setEmailContent(content),
      },
    };

    $el.summernote(options);
    $el.summernote('code', emailContent);
    summernoteInitialized.current = true;

    return () => {
      try {
        $el.summernote('destroy');
      } catch {
        // ignore
      }
      summernoteInitialized.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only init on ready/key; emailContent read at init time
  }, [editorReady, editorKey]);

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
      const response = await api.get<{ success: boolean; data: unknown }>(
        API_ENDPOINTS.ADMIN.GET_PROFILE
      );
      if (response.data?.success && response.data && typeof response.data === 'object') {
        const profile = response.data as { companyName?: string; name?: string; email?: string };
        if (profile.companyName) setCompanyName(profile.companyName);
        if (profile.name) setFromName(profile.name);
        if (profile.email) setReplyToEmail(profile.email);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
    // Fallback: reply-to email from logged-in user (same as /recruiter/settings)
    if (user?.email) setReplyToEmail((prev) => prev || user.email || '');
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

  const handleReplyToEmailChange = (value: string) => {
    setErrors((prev) => ({ ...prev, replyToEmail: validateField('replyToEmail', value) }));
    setReplyToEmail(value);
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!replyToEmail.trim()) {
      newErrors.replyToEmail = 'Reply to Email ID is required';
    } else if (!emailRegex.test(replyToEmail.trim())) {
      newErrors.replyToEmail = 'Enter a valid email address';
    } else {
      const e = validateField('replyToEmail', replyToEmail);
      if (e) newErrors.replyToEmail = e;
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
        fromEmailId: replyToEmail.trim(),
        replyToEmail: replyToEmail.trim(),
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
        setFromName('');
        setCompanyName('');
        setEmailContent('');
        setSelectedLabelId(null);
        setEditorKey((k) => k + 1);
      } catch {
        notifications.show({
          title: 'Email Prepared',
          message: `Email ready to send to ${selectedLabel.emailCount} recipients. Backend integration pending.`,
          color: 'blue',
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to send email',
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

      <Card shadow="sm" padding="lg" withBorder>
        <Stack gap="md">
          <TextInput
            label="Subject"
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            error={errors.subject}
            required
          />

          <TextInput
            label="Reply to Email ID"
            placeholder="Reply-to email address"
            value={replyToEmail}
            onChange={(e) => handleReplyToEmailChange(e.target.value)}
            error={errors.replyToEmail}
            required
          />

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
            label="Select Email Label"
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
              Email Content *
            </Text>
            {errors.content && (
              <Text size="xs" c="red" mb="xs">
                {errors.content}
              </Text>
            )}
            <Paper withBorder p={0} className="send-email-editor-wrap">
              {editorError ? (
                <Alert color="red" m="md">
                  Editor could not load: {editorError}. Check your network or try again later.
                </Alert>
              ) : !editorReady ? (
                <Center py="xl">
                  <Loader size="sm" />
                </Center>
              ) : (
                <div key={editorKey} ref={editorRef} />
              )}
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
