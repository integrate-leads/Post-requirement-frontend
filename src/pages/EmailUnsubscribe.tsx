import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconHelp,
  IconInfoCircle,
  IconMail,
  IconMailOff,
  IconShieldCheck,
} from '@tabler/icons-react';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/hooks/useApi';

/** App primary blue (matches Mantine theme `blue.6`) */
const PRIMARY = '#0078D4';
const PRIMARY_SOFT = 'rgba(0, 120, 212, 0.12)';
const PRIMARY_BORDER = 'rgba(0, 120, 212, 0.22)';

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
 * Public unsubscribe. Link: `/unsubscribe?email=` + encodeURIComponent(address)
 */
const EmailUnsubscribe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailFromUrl = useMemo(() => emailFromSearchParams(searchParams), [searchParams]);
  const urlEmailValid = simpleEmailRe.test(emailFromUrl);

  const [manualEmail, setManualEmail] = useState('');
  const effectiveEmail = urlEmailValid ? emailFromUrl : manualEmail.trim();
  const effectiveValid = simpleEmailRe.test(effectiveEmail);

  useEffect(() => {
    if (urlEmailValid) setManualEmail('');
  }, [urlEmailValid, emailFromUrl]);

  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'success' | 'error'>('ready');
  const [feedback, setFeedback] = useState('');

  const submit = async () => {
    if (!effectiveValid) return;
    setLoading(true);
    if (phase !== 'success') setPhase('ready');
    setFeedback('');
    try {
      const res = await api.post<{ success?: boolean; message?: string }>(
        API_ENDPOINTS.ADMIN.EMAIL_BROAD_UNSUBSCRIBE,
        { email: effectiveEmail }
      );
      if (res.data?.success) {
        setPhase('success');
        setFeedback(res.data.message ?? 'Your email has been removed from all marketing lists.');
      } else {
        setPhase('error');
        setFeedback(
          res.data?.message ?? 'We could not update your preferences right now. Please try again.'
        );
      }
    } catch (err: unknown) {
      setPhase('error');
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setFeedback(msg ?? 'We could not reach our servers. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const showManualEntry = !urlEmailValid;
  const showConfirmBlock = phase === 'ready' && (urlEmailValid || manualEmail.trim().length > 0);

  const accent =
    phase === 'success' ? 'var(--mantine-color-teal-6)' : phase === 'error' ? 'var(--mantine-color-red-6)' : PRIMARY;

  return (
    <Box
      component="section"
      aria-labelledby="unsubscribe-heading"
      bg="gray.0"
      py={{ base: 32, sm: 48 }}
      pb={56}
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* Same pattern as other public pages: centered column, capped width on desktop */}
      <Container
        fluid
        px="md"
        mx="auto"
        w="100%"
        style={{ maxWidth: 'calc(40rem * var(--mantine-scale))' }}
      >
        <Paper
          withBorder
          radius="lg"
          p={{ base: 'lg', sm: 'xl' }}
          shadow="sm"
          style={{ borderColor: 'var(--mantine-color-gray-3)' }}
        >
          <Box
            mb="lg"
            style={{
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, transparent 0%, ${accent} 45%, ${accent} 55%, transparent 100%)`,
              transition: 'opacity 0.35s ease',
            }}
          />

          <Stack gap="xl">
            <Stack gap="md" align="center" ta="center">
              <Box
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background:
                    phase === 'success'
                      ? 'var(--mantine-color-teal-0)'
                      : phase === 'error'
                        ? 'var(--mantine-color-red-0)'
                        : PRIMARY_SOFT,
                  border:
                    phase === 'success'
                      ? '1px solid var(--mantine-color-teal-3)'
                      : phase === 'error'
                        ? '1px solid var(--mantine-color-red-3)'
                        : `1px solid ${PRIMARY_BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {phase === 'success' ? (
                  <IconCheck size={34} color="var(--mantine-color-teal-6)" stroke={2} />
                ) : phase === 'error' ? (
                  <IconAlertCircle size={34} color="var(--mantine-color-red-6)" stroke={2} />
                ) : (
                  <IconMail size={32} color={PRIMARY} stroke={1.75} />
                )}
              </Box>

              <Box>
                <Title id="unsubscribe-heading" order={1} fz={{ base: 22, sm: 26 }} fw={700} c="gray.9" lh={1.25}>
                  {phase === 'success'
                    ? "You're unsubscribed"
                    : phase === 'error'
                      ? 'Something went wrong'
                      : 'Unsubscribe from emails'}
                </Title>
                <Text c="dimmed" size="sm" maw={400} mx="auto" mt="md" lh={1.65}>
                  {phase === 'success' ? (
                    <>
                      {feedback || 'Done — your address has been removed.'}{' '}
                      <Text span inherit fw={500} c="gray.7">
                        Changes usually apply within a few minutes.
                      </Text>{' '}
                      Contact us if anything still arrives.
                    </>
                  ) : phase === 'error' ? (
                    feedback
                  ) : (
                    <>
                      Remove your address from{' '}
                      <Text span fw={600} c="dark">
                        Integrate Leads
                      </Text>{' '}
                      job alerts, campaign updates, and broadcast messages. No account required.
                    </>
                  )}
                </Text>
              </Box>
            </Stack>

            {phase === 'ready' && (
              <>
                {showManualEntry && (
                  <Paper withBorder p="md" radius="md" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                    <Group gap={10} mb="sm" align="center">
                      <IconHelp size={18} color="var(--mantine-color-dimmed)" />
                      <Text fw={600} size="sm" c="gray.8">
                        Enter the email you want to remove
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" lh={1.6} mb="md">
                      Use the same address that received our messages so we can match it correctly.
                    </Text>
                    <TextInput
                      placeholder="you@company.com"
                      type="email"
                      autoComplete="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.currentTarget.value)}
                      leftSection={<IconMail size={18} />}
                      radius="md"
                      aria-label="Email address to unsubscribe"
                    />
                  </Paper>
                )}

                {urlEmailValid && (
                  <Box>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>
                      Removing this address
                    </Text>
                    <Paper withBorder p="md" radius="md" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                          <IconMail size={18} color={PRIMARY} style={{ flexShrink: 0 }} />
                          <Text fw={600} size="sm" style={{ wordBreak: 'break-all' }} component="span">
                            {emailFromUrl}
                          </Text>
                        </Group>
                      </Group>
                    </Paper>
                  </Box>
                )}

                {showConfirmBlock && effectiveValid && (
                  <>
                    <Divider
                      label={
                        <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                          What changes
                        </Text>
                      }
                      labelPosition="center"
                    />
                    <Stack gap="sm">
                      {(
                        [
                          {
                            icon: IconMailOff,
                            title: 'Marketing emails stop',
                            body: 'Job alerts, newsletters, and campaign broadcasts will no longer reach this inbox.',
                            tint: 'blue' as const,
                          },
                          {
                            icon: IconInfoCircle,
                            title: 'Account emails may continue',
                            body: 'Password resets, invoices, and security notices are not affected.',
                            tint: 'indigo' as const,
                          },
                          {
                            icon: IconShieldCheck,
                            title: 'Only Integrate Leads',
                            body: 'This opt-out applies only to us — other senders are unchanged.',
                            tint: 'teal' as const,
                          },
                        ] as const
                      ).map(({ icon: Icon, title, body, tint }) => (
                        <Paper key={title} withBorder p="sm" radius="md" bg="gray.0">
                          <Group align="flex-start" wrap="nowrap" gap="md">
                            <ThemeIcon variant="light" color={tint} size={40} radius="md" style={{ flexShrink: 0 }}>
                              <Icon size={18} stroke={1.75} />
                            </ThemeIcon>
                            <Box style={{ minWidth: 0 }}>
                              <Text fw={600} size="sm" mb={4}>
                                {title}
                              </Text>
                              <Text size="sm" c="dimmed" lh={1.6}>
                                {body}
                              </Text>
                            </Box>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>

                    <Button
                      size="md"
                      fullWidth
                      radius="md"
                      color="blue"
                      loading={loading}
                      onClick={submit}
                      rightSection={<IconArrowRight size={18} />}
                    >
                      Confirm unsubscribe
                    </Button>
                    <Text size="xs" c="dimmed" ta="center" lh={1.55}>
                      By confirming, you state that you control this inbox and want to opt out.
                    </Text>
                  </>
                )}

                {showManualEntry && manualEmail.trim().length > 0 && !effectiveValid && (
                  <Group gap={6} justify="center">
                    <IconAlertCircle size={14} color="var(--mantine-color-red-6)" />
                    <Text size="sm" c="red">
                      Please enter a valid email address.
                    </Text>
                  </Group>
                )}
              </>
            )}

            {phase === 'success' && (
              <Stack gap="sm">
                <Button component={Link} to="/" color="blue" fullWidth radius="md">
                  Back to home
                </Button>
                <Button
                  component={Link}
                  to="/jobs"
                  variant="default"
                  fullWidth
                  radius="md"
                  rightSection={<IconArrowRight size={16} />}
                >
                  Browse open roles
                </Button>
              </Stack>
            )}

            {phase === 'error' && effectiveValid && (
              <Stack gap="sm">
                <Button color="blue" fullWidth radius="md" loading={loading} onClick={submit}>
                  Try again
                </Button>
                <Text size="xs" c="dimmed" ta="center" lh={1.6}>
                  Still failing? Email{' '}
                  <Anchor href="mailto:sales@integrateleads.com?subject=Unsubscribe%20help" size="xs" fw={600}>
                    sales@integrateleads.com
                  </Anchor>{' '}
                  and we will help manually.
                </Text>
              </Stack>
            )}

            <Divider />

            <Group gap="xs" justify="center" wrap="wrap">
              <Anchor component={Link} to="/privacy-policy" size="xs" c="dimmed">
                Privacy policy
              </Anchor>
              <Text size="xs" c="dimmed">
                ·
              </Text>
              <Anchor href="mailto:sales@integrateleads.com" size="xs" c="dimmed">
                Contact support
              </Anchor>
              <Text size="xs" c="dimmed">
                ·
              </Text>
              <Text size="xs" c="dimmed">
                © {new Date().getFullYear()} Integrate Leads
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailUnsubscribe;
