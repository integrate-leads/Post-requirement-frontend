import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Container, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconMail, IconMailOff } from '@tabler/icons-react';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/hooks/useApi';

function emailFromSearchParams(searchParams: URLSearchParams): string {
  const raw = searchParams.get('email') ?? searchParams.get('e') ?? '';
  if (!raw) return '';
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

const simpleEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public page: one-click unsubscribe from Integrate Leads email campaigns.
 * Link format: `/unsubscribe?email=user@example.com` (email should be URL-encoded if it contains special characters).
 */
const EmailUnsubscribe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = useMemo(() => emailFromSearchParams(searchParams), [searchParams]);
  const validEmail = simpleEmailRe.test(email);

  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'success' | 'error'>('ready');
  const [feedback, setFeedback] = useState('');

  const submit = async () => {
    if (!validEmail) return;
    setLoading(true);
    setPhase('ready');
    setFeedback('');
    try {
      const res = await api.post<{ success?: boolean; message?: string }>(
        API_ENDPOINTS.ADMIN.EMAIL_BROAD_UNSUBSCRIBE,
        { email }
      );
      if (res.data?.success) {
        setPhase('success');
        setFeedback(res.data.message ?? 'Unsubscribed successfully.');
      } else {
        setPhase('error');
        setFeedback(res.data?.message ?? 'We could not process this request.');
      }
    } catch (err: unknown) {
      setPhase('error');
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setFeedback(msg ?? 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="section"
      style={{
        minHeight: '60vh',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        background:
          'radial-gradient(900px 420px at 50% -10%, var(--mantine-color-blue-0), transparent 60%), var(--mantine-color-body)',
      }}
    >
      <Container size={480} py={{ base: 32, sm: 48 }} px="md" style={{ maxWidth: '100%' }}>
        <Paper
          withBorder
          shadow="sm"
          p={{ base: 'lg', sm: 'xl' }}
          radius="lg"
          style={{
            background: 'linear-gradient(180deg, var(--mantine-color-white) 0%, var(--mantine-color-gray-0) 100%)',
            borderColor: 'var(--mantine-color-blue-2)',
          }}
        >
          <Stack gap="lg" align="stretch">
            <Stack gap="xs" align="center" ta="center">
              <ThemeIcon
                size={56}
                radius="xl"
                variant="light"
                color={phase === 'success' ? 'teal' : phase === 'error' ? 'red' : 'blue'}
              >
                {phase === 'success' ? (
                  <IconCheck size={30} stroke={1.5} />
                ) : phase === 'error' ? (
                  <IconAlertCircle size={30} stroke={1.5} />
                ) : (
                  <IconMail size={30} stroke={1.5} />
                )}
              </ThemeIcon>
              <Title order={2} size="h3" fw={700}>
                {phase === 'success'
                  ? 'You’re unsubscribed'
                  : phase === 'error'
                    ? 'Could not unsubscribe'
                    : 'Unsubscribe from emails'}
              </Title>
              <Text c="dimmed" size="sm" maw={400} mx="auto" lh={1.6}>
                {phase === 'success'
                  ? feedback
                  : phase === 'error'
                    ? feedback
                    : 'If you received job alerts or updates from Integrate Leads and no longer wish to get them, you can opt out below. You don’t need an account.'}
              </Text>
            </Stack>

            {phase === 'ready' && !email && (
              <Alert color="orange" variant="light" title="Missing email in link" icon={<IconMailOff size={18} />}>
                This page needs a valid <Text span fw={600}>email</Text> query parameter. Use the unsubscribe link from
                your message, or contact support if the link looks broken.
              </Alert>
            )}

            {phase === 'ready' && email && !validEmail && (
              <Alert color="red" variant="light" title="Invalid email" icon={<IconAlertCircle size={18} />}>
                The address in the link doesn’t look like a valid email. Please use the original unsubscribe link from
                your email.
              </Alert>
            )}

            {phase === 'ready' && validEmail && (
              <>
                <Paper withBorder p="md" radius="md" bg="gray.0">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6}>
                    Email address
                  </Text>
                  <Text fw={600} style={{ wordBreak: 'break-all' }}>
                    {email}
                  </Text>
                </Paper>

                <Stack gap={6}>
                  <Text size="sm" c="dimmed" lh={1.55}>
                    • We will stop campaign and marketing-style messages to this address.
                  </Text>
                  <Text size="sm" c="dimmed" lh={1.55}>
                    • You may still receive transactional emails (e.g. password resets) if you use our services.
                  </Text>
                  <Text size="sm" c="dimmed" lh={1.55}>
                    • This action applies to Integrate Leads communications only.
                  </Text>
                </Stack>

                <Button
                  size="md"
                  fullWidth
                  loading={loading}
                  onClick={submit}
                  leftSection={<IconMailOff size={18} />}
                >
                  Confirm unsubscribe
                </Button>
              </>
            )}

            {phase === 'success' && (
              <Button component={Link} to="/" variant="light" fullWidth>
                Back to home
              </Button>
            )}

            {phase === 'error' && validEmail && (
              <Button size="md" fullWidth loading={loading} onClick={submit} variant="outline">
                Try again
              </Button>
            )}

            <Text size="xs" c="dimmed" ta="center" lh={1.5}>
              Questions?{' '}
              <Text component="a" href="mailto:support@integrateleads.com" c="blue" inherit span fw={500}>
                Contact support
              </Text>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailUnsubscribe;
