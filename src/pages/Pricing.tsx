import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  Text,
  Title,
  Stack,
  SimpleGrid,
  Button,
  Group,
  Badge,
  Loader,
  Center,
  Modal,
  Divider,
  ThemeIcon,
  Paper,
  Alert,
  Skeleton,
  Table,
  ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import { differenceInDays, format, isPast, parseISO } from 'date-fns';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchasedFeatures } from '@/contexts/PurchasedFeaturesContext';
import {
  IconBolt,
  IconShieldCheck,
  IconReceipt,
  IconCalendar,
  IconCheck,
  IconInfoCircle,
  IconCreditCard,
  IconMail,
  IconExternalLink,
  IconListDetails,
  IconChevronRight,
} from '@tabler/icons-react';
import { DashboardPageHeader } from '@/components/dashboard';

interface FeaturePlan {
  id: number;
  price: string;
  timePeriod: string;
}

interface FeatureItem {
  id: number;
  name: string;
  description: string;
  plans: FeaturePlan[];
}

interface CurrentPlanRow {
  id: number;
  featureId: number;
  subscriptionId: number;
  startDate: string;
  endDate: string;
  price: string;
  timePeriod: string;
  paymentStatus: string;
  status: string;
  feature?: { id: number; name: string; description: string };
}

const formatPlanDate = (iso: string) => {
  try {
    return format(parseISO(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
};

const subscriptionTimeLeft = (endIso: string) => {
  try {
    const end = parseISO(endIso);
    if (isPast(end)) return { label: 'Ended', color: 'gray' as const };
    const d = differenceInDays(end, new Date());
    if (d <= 0) return { label: 'Ends today', color: 'orange' as const };
    if (d === 1) return { label: '1 day left', color: 'teal' as const };
    return { label: `${d} days left`, color: 'teal' as const };
  } catch {
    return null;
  }
};

/** Approximate daily cost for comparing plans (₹). */
const pricePerDayLabel = (price: string | number, days: string | number): string | null => {
  const d = Number(days);
  const p = Number(price);
  if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(p) || p < 0) return null;
  const per = p / d;
  const decimals = per >= 100 ? 0 : 2;
  return `~₹${per.toFixed(decimals)}/day avg.`;
};

/** Longest duration wins; ties break on lower price — for a single “recommended” plan. */
const bestValuePlanId = (plans: FeaturePlan[]): number | null => {
  if (plans.length < 2) return null;
  const maxDays = Math.max(...plans.map((p) => Number(p.timePeriod) || 0));
  const candidates = plans.filter((p) => Number(p.timePeriod) === maxDays);
  const best = candidates.sort((a, b) => Number(a.price) - Number(b.price))[0];
  return best?.id ?? null;
};

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  /** Public `/pricing` sits in PublicLayout with no main padding — add breathing room from header/footer */
  const isPublicPricing = location.pathname === '/pricing';
  const isRecruiterPricing = location.pathname === '/recruiter/pricing';
  const isNarrowViewport = useMediaQuery('(max-width: 48em)');
  const { refreshPurchasedFeatures } = usePurchasedFeatures();

  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<FeaturePlan | null>(null);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlanRow[]>([]);
  const [currentPlanLoading, setCurrentPlanLoading] = useState(false);

  useEffect(() => {
    const fetchFeatures = async () => {
      setLoading(true);
      try {
        const res = await api.get<{
          success?: boolean;
          features?: FeatureItem[];
        }>(API_ENDPOINTS.ADMIN.FEATURES_LIST(1, 10));
        if (res.data?.success && Array.isArray(res.data.features)) {
          setFeatures(res.data.features);
        } else {
          setFeatures([]);
        }
      } catch {
        setFeatures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  useEffect(() => {
    if (!isRecruiterPricing || !isAuthenticated) {
      setCurrentPlan([]);
      return;
    }
    const run = async () => {
      setCurrentPlanLoading(true);
      try {
        const res = await api.get<{
          success?: boolean;
          data?: CurrentPlanRow[];
        }>(API_ENDPOINTS.ADMIN.CURRENT_PLAN);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCurrentPlan(res.data.data);
        } else {
          setCurrentPlan([]);
        }
      } catch {
        setCurrentPlan([]);
      } finally {
        setCurrentPlanLoading(false);
      }
    };
    run();
  }, [isRecruiterPricing, isAuthenticated]);

  const sortedFeatures = useMemo(() => {
    return [...features].sort((a, b) => a.id - b.id);
  }, [features]);

  const activeSubscriptions = useMemo(
    () => currentPlan.filter((r) => (r.status || '').toLowerCase() === 'active'),
    [currentPlan]
  );

  const nextRenewalSummary = useMemo(() => {
    const upcoming = activeSubscriptions.filter((r) => {
      try {
        return !isPast(parseISO(r.endDate));
      } catch {
        return false;
      }
    });
    if (upcoming.length === 0) return null;
    const sorted = [...upcoming].sort(
      (a, b) => parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime()
    );
    const row = sorted[0];
    return {
      endLabel: formatPlanDate(row.endDate),
      name: row.feature?.name ?? `Feature #${row.featureId}`,
    };
  }, [activeSubscriptions]);

  const currencySymbol = isRecruiterPricing ? '₹' : '$';

  const scrollToSubscriptions = () => {
    document.getElementById('recruiter-add-features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openConfirmPurchase = (feature: FeatureItem, plan: FeaturePlan) => {
    setSelectedFeature(feature);
    setSelectedPlan(plan);
    setConfirmOpen(true);
  };

  const handleBuy = async () => {
    if (!selectedFeature || !selectedPlan) return;
    if (!isAuthenticated) {
      setConfirmOpen(false);
      navigate('/recruiter/login', { state: { redirectTo: '/recruiter/pricing' } });
      return;
    }

    setPurchasingPlanId(selectedPlan.id);
    try {
      const payload = {
        features: [
          {
            id: selectedFeature.id,
            price: Number(selectedPlan.price),
            timePeriod: String(selectedPlan.timePeriod),
          },
        ],
      };
      const res = await api.post<{ success?: boolean; message?: string }>(
        API_ENDPOINTS.ADMIN.PURCHASE_FEATURE,
        payload
      );
      if (res.data?.success) {
        notifications.show({
          title: 'Success',
          message: res.data.message || 'Feature purchase request submitted.',
          color: 'green',
        });
        await refreshPurchasedFeatures();
        setConfirmOpen(false);
        if (isRecruiterPricing && isAuthenticated) {
          try {
            const cur = await api.get<{ success?: boolean; data?: CurrentPlanRow[] }>(
              API_ENDPOINTS.ADMIN.CURRENT_PLAN
            );
            if (cur.data?.success && Array.isArray(cur.data.data)) {
              setCurrentPlan(cur.data.data);
            }
          } catch {
            /* ignore refresh errors */
          }
        }
      } else {
        notifications.show({
          title: 'Error',
          message: res.data?.message || 'Failed to submit purchase request.',
          color: 'red',
        });
      }
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      notifications.show({
        title: 'Error',
        message: msg || 'Failed to submit purchase request.',
        color: 'red',
      });
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const recruiterFeatureCards = (
    <>
      {loading ? (
        <Stack gap="md">
          <Skeleton height={48} radius="sm" />
          <Skeleton height={180} radius="sm" />
          <Skeleton height={48} radius="sm" />
          <Skeleton height={180} radius="sm" />
        </Stack>
      ) : sortedFeatures.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center" style={{ borderStyle: 'dashed' }}>
          <Text fw={600} size="sm">
            No plans to show
          </Text>
          <Text c="dimmed" size="sm" maw={360} mx="auto" mt="xs" lh={1.55}>
            The catalog is empty right now. Refresh later or contact support if you expected options here.
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, lg: sortedFeatures.length > 1 ? 2 : 1 }} spacing="xl">
          {sortedFeatures.map((feature) => {
            const recommendedId = bestValuePlanId(feature.plans);
            const planCount = feature.plans.length;
            return (
              <Card
                key={feature.id}
                withBorder
                radius="lg"
                padding={0}
                shadow="sm"
                role="region"
                aria-label={`${feature.name} pricing options`}
                style={{
                  overflow: 'hidden',
                  borderTop: '3px solid var(--mantine-color-violet-6)',
                  height: '100%',
                }}
              >
                <Box
                  px="lg"
                  py="md"
                  style={{
                    background:
                      'linear-gradient(180deg, var(--mantine-color-violet-0) 0%, var(--mantine-color-body) 100%)',
                    borderBottom: '1px solid var(--mantine-color-violet-2)',
                  }}
                >
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                      <IconCreditCard size={20} stroke={1.5} />
                    </ThemeIcon>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs" align="center" wrap="wrap">
                        <Title order={5} fw={700}>
                          {feature.name}
                        </Title>
                        <Badge size="sm" variant="light" color="violet">
                          {feature.plans.length} option{feature.plans.length === 1 ? '' : 's'}
                        </Badge>
                      </Group>
                      {feature.description ? (
                        <Text size="sm" c="dimmed" mt={6} maw={680} lh={1.6}>
                          {feature.description}
                        </Text>
                      ) : null}
                    </Box>
                  </Group>
                </Box>
                <Box p="lg">
                  <SimpleGrid cols={{ base: 1, sm: planCount }} spacing="md">
                    {feature.plans.map((plan) => {
                      const isPick = recommendedId === plan.id;
                      return (
                        <Paper
                          key={plan.id}
                          withBorder
                          p="lg"
                          radius="md"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 184,
                            borderColor: isPick
                              ? 'var(--mantine-color-violet-4)'
                              : 'var(--mantine-color-gray-3)',
                            backgroundColor: isPick
                              ? 'var(--mantine-color-violet-0)'
                              : 'var(--mantine-color-body)',
                          }}
                          styles={{
                            root: {
                              transition: 'transform 0.12s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                              '&:hover': {
                                boxShadow: 'var(--mantine-shadow-md)',
                                borderColor: 'var(--mantine-color-violet-4)',
                                transform: 'translateY(-2px)',
                              },
                            },
                          }}
                        >
                          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                              {plan.timePeriod} days
                            </Text>
                            {isPick ? (
                              <Badge size="xs" variant="filled" color="violet">
                                Recommended
                              </Badge>
                            ) : null}
                          </Group>
                          <Text fw={800} fz={26} c="violet.8" mt={8} lh={1.15}>
                            {currencySymbol}
                            {Number(plan.price).toFixed(2)}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {pricePerDayLabel(plan.price, plan.timePeriod) ?? '—'}
                          </Text>
                          <Group gap={6} mt="auto" pt="md">
                            <IconShieldCheck size={14} color="var(--mantine-color-teal-6)" />
                            <Text size="xs" c="dimmed" lh={1.45}>
                              Reviewed before billing
                            </Text>
                          </Group>
                          <Button
                            fullWidth
                            mt="sm"
                            size="sm"
                            radius="md"
                            color="violet"
                            variant={isPick ? 'filled' : 'light'}
                            loading={purchasingPlanId === plan.id}
                            onClick={() => openConfirmPurchase(feature, plan)}
                          >
                            {isAuthenticated ? 'Request this plan' : 'Sign in to request'}
                          </Button>
                        </Paper>
                      );
                    })}
                  </SimpleGrid>
                  <Text size="xs" c="dimmed" mt="md">
                    Submitting sends a purchase request — nothing is charged until the team approves it.
                  </Text>
                </Box>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </>
  );

  const purchaseModal = (
    <Modal
      opened={confirmOpen}
      onClose={() => setConfirmOpen(false)}
      centered
      radius="lg"
      size="lg"
      padding="xl"
      transitionProps={{ transition: 'pop', duration: 200 }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      title={
        <Group gap="md" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="light" color={isRecruiterPricing ? 'violet' : 'blue'} radius="md" size={48}>
            <IconReceipt size={26} stroke={1.5} />
          </ThemeIcon>
          <Box style={{ minWidth: 0 }}>
            <Text fw={700} size="lg" lh={1.3}>
              Confirm your purchase
            </Text>
            <Text size="sm" c="dimmed" mt={6} lh={1.5}>
              Review the plan and price. Submitting sends a purchase request to the team.
            </Text>
          </Box>
        </Group>
      }
    >
      <Stack gap="lg">
        {selectedFeature && selectedPlan && (
          <>
            <Paper
              withBorder
              p="lg"
              radius="md"
              style={
                isRecruiterPricing
                  ? {
                      background:
                        'linear-gradient(145deg, var(--mantine-color-violet-0) 0%, var(--mantine-color-gray-0) 100%)',
                      borderColor: 'var(--mantine-color-violet-2)',
                    }
                  : {
                      background: 'linear-gradient(135deg, #f8fbff 0%, #f1f8ff 100%)',
                      borderColor: '#dbeafe',
                    }
              }
            >
              <Stack gap="md">
                <Box maw="100%">
                  <Title order={4} fw={700}>
                    {selectedFeature.name}
                  </Title>
                  {selectedFeature.description ? (
                    <Text size="sm" c="dimmed" mt={8} lineClamp={3} lh={1.55}>
                      {selectedFeature.description}
                    </Text>
                  ) : null}
                </Box>

                <Divider color="var(--mantine-color-gray-3)" />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Paper p="md" radius="md" bg="white" withBorder style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
                    <Group gap="xs" mb={6}>
                      <ThemeIcon variant="light" color="teal" size="sm" radius="sm">
                        <IconCalendar size={14} />
                      </ThemeIcon>
                      <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                        Access period
                      </Text>
                    </Group>
                    <Text fw={700} size="xl">
                      {selectedPlan.timePeriod} days
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Full feature access for this duration after approval.
                    </Text>
                  </Paper>
                  <Paper p="md" radius="md" bg="white" withBorder style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
                    <Group gap="xs" mb={6}>
                      <ThemeIcon
                        variant="light"
                        color={isRecruiterPricing ? 'violet' : 'gray'}
                        size="sm"
                        radius="sm"
                      >
                        <IconReceipt size={14} />
                      </ThemeIcon>
                      <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                        Amount
                      </Text>
                    </Group>
                    <Text fw={800} size="xl" c={isRecruiterPricing ? 'violet.8' : 'blue.8'}>
                      {currencySymbol}
                      {Number(selectedPlan.price).toFixed(2)}
                    </Text>
                    {isRecruiterPricing && pricePerDayLabel(selectedPlan.price, selectedPlan.timePeriod) ? (
                      <Text size="xs" c="dimmed" mt={6}>
                        {pricePerDayLabel(selectedPlan.price, selectedPlan.timePeriod)}
                      </Text>
                    ) : null}
                    <Text size="xs" c="dimmed" mt={4}>
                      Price for this purchase request
                    </Text>
                  </Paper>
                </SimpleGrid>
              </Stack>
            </Paper>
          </>
        )}

        {isRecruiterPricing ? (
          <Text size="xs" c="dimmed" lh={1.5}>
            The team reviews each request. If it is approved, the subscription appears on this page under
            Current plan.
          </Text>
        ) : null}

        <Group justify="flex-end" gap="sm" mt="xs" wrap="wrap">
          <Button variant="default" size="md" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            size="md"
            color={isRecruiterPricing ? 'violet' : undefined}
            leftSection={<IconCheck size={18} />}
            onClick={handleBuy}
            loading={selectedPlan ? purchasingPlanId === selectedPlan.id : false}
          >
            {isAuthenticated ? 'Submit purchase request' : 'Continue to login'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  if (isRecruiterPricing) {
    return (
      <Box
        maw={1200}
        w="100%"
        mx="auto"
        pb="xl"
        style={{
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          background:
            'radial-gradient(720px 320px at 100% 0%, var(--mantine-color-violet-0), transparent 55%)',
        }}
      >
        <Stack gap="xl" maw="100%">
          <DashboardPageHeader
            variant="violet"
            icon={<IconBolt size={24} stroke={1.75} />}
            title="Pricing & subscriptions"
            description="Check what is already active, then request new plan lengths. Charges apply only after approval."
            actions={
              isAuthenticated ? (
                <Button
                  variant="light"
                  color="violet"
                  size="sm"
                  radius="md"
                  rightSection={<IconChevronRight size={16} />}
                  onClick={scrollToSubscriptions}
                >
                  Browse plans
                </Button>
              ) : undefined
            }
          />

          {!isAuthenticated ? (
            <Alert
              variant="light"
              color="violet"
              icon={<IconInfoCircle size={20} />}
              title="Log in to continue"
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Text size="sm" c="dimmed" maw={520}>
                  Sign in to load your current plan from the server and submit purchase requests.
                </Text>
                <Button
                  size="sm"
                  color="violet"
                  onClick={() =>
                    navigate('/recruiter/login', { state: { redirectTo: '/recruiter/pricing' } })
                  }
                >
                  Log in
                </Button>
              </Group>
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper
              component="button"
              type="button"
              withBorder
              p="md"
              radius="md"
              onClick={() => navigate('/jobs')}
              aria-label="Open public job board"
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                background: 'var(--mantine-color-gray-0)',
              }}
              styles={{
                root: {
                  '&:hover': { boxShadow: 'var(--mantine-shadow-sm)' },
                  '&:focus-visible': {
                    outline: '2px solid var(--mantine-color-violet-6)',
                    outlineOffset: 2,
                  },
                },
              }}
            >
              <Group wrap="wrap" gap="md" justify="space-between" align="flex-start">
                <Group wrap="nowrap" gap="md" style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <ThemeIcon variant="light" color="gray" radius="md" size="lg">
                    <IconExternalLink size={20} stroke={1.5} />
                  </ThemeIcon>
                  <Box style={{ minWidth: 0 }}>
                    <Text fw={600} size="sm">
                      Public job board
                    </Text>
                    <Text size="xs" c="dimmed" mt={4} lh={1.5}>
                      Candidate-facing listings (separate from recruiter tools).
                    </Text>
                  </Box>
                </Group>
                <IconChevronRight size={18} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0, marginTop: 2 }} />
              </Group>
            </Paper>
            <Paper
              component="a"
              href="mailto:sales@integrateleads.com?subject=Enterprise%20inquiry"
              withBorder
              p="md"
              radius="md"
              aria-label="Email sales for enterprise hiring"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background:
                  'linear-gradient(135deg, var(--mantine-color-violet-0) 0%, var(--mantine-color-gray-0) 100%)',
                borderColor: 'var(--mantine-color-violet-2)',
              }}
              styles={{
                root: {
                  '&:hover': { boxShadow: 'var(--mantine-shadow-sm)' },
                  '&:focus-visible': {
                    outline: '2px solid var(--mantine-color-violet-6)',
                    outlineOffset: 2,
                  },
                },
              }}
            >
              <Group wrap="wrap" gap="md" justify="space-between" align="flex-start">
                <Group wrap="nowrap" gap="md" style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <ThemeIcon variant="light" color="violet" radius="md" size="lg">
                    <IconMail size={20} stroke={1.5} />
                  </ThemeIcon>
                  <Box style={{ minWidth: 0 }}>
                    <Text fw={600} size="sm" c="violet.8">
                      Enterprise & volume hiring
                    </Text>
                    <Text size="xs" c="dimmed" mt={4} lh={1.5}>
                      Email sales for custom terms and higher-volume needs.
                    </Text>
                  </Box>
                </Group>
                <IconChevronRight size={18} color="var(--mantine-color-violet-4)" style={{ flexShrink: 0, marginTop: 2 }} />
              </Group>
            </Paper>
          </SimpleGrid>

          {isAuthenticated ? (
            <Paper component="section" withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} shadow="xs">
              {currentPlanLoading ? null : currentPlan.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
                  <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon variant="light" color="teal" size="md" radius="md">
                        <IconCreditCard size={18} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Active now
                        </Text>
                        <Text fw={800} fz={22} lh={1.2} mt={4}>
                          {activeSubscriptions.length}
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                  <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                      <ThemeIcon variant="light" color="violet" size="md" radius="md">
                        <IconCalendar size={18} />
                      </ThemeIcon>
                      <Box style={{ minWidth: 0 }}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Next end date
                        </Text>
                        {nextRenewalSummary ? (
                          <>
                            <Text fw={700} size="sm" mt={4} lh={1.4}>
                              {nextRenewalSummary.endLabel}
                            </Text>
                            <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
                              {nextRenewalSummary.name}
                            </Text>
                          </>
                        ) : (
                          <Text size="sm" c="dimmed" mt={6}>
                            No upcoming end (all ended or none active)
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Paper>
                  <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={8}>
                      Need more?
                    </Text>
                    <Button
                      variant="filled"
                      color="violet"
                      size="sm"
                      fullWidth
                      radius="md"
                      rightSection={<IconChevronRight size={16} />}
                      onClick={scrollToSubscriptions}
                    >
                      Request a plan
                    </Button>
                  </Paper>
                </SimpleGrid>
              ) : null}

              <Group gap="sm" mb="md" wrap="wrap" align="center">
                <ThemeIcon variant="light" color="violet" size="md" radius="md">
                  <IconListDetails size={18} stroke={1.75} />
                </ThemeIcon>
                <Box>
                  <Title order={4} id="current-plan-heading" fw={700}>
                    Current plan
                  </Title>
                  <Text size="xs" c="dimmed" mt={4}>
                    Live data from your account — scroll the table if you have many columns.
                  </Text>
                </Box>
              </Group>

              {currentPlanLoading ? (
                <Stack gap="xs">
                  <Skeleton height={36} radius="sm" />
                  <Skeleton height={44} radius="sm" />
                  <Skeleton height={44} radius="sm" />
                  <Skeleton height={44} radius="sm" />
                </Stack>
              ) : currentPlan.length === 0 ? (
                <Paper withBorder p="xl" radius="md" ta="center" bg="var(--mantine-color-gray-0)">
                  <ThemeIcon variant="light" color="violet" size={52} radius="md" mx="auto" mb="md">
                    <IconReceipt size={26} stroke={1.5} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    No subscriptions yet
                  </Text>
                  <Text size="sm" c="dimmed" maw={400} mx="auto" mt="xs" lh={1.55}>
                    When a purchase is approved, rows will show here with dates and renewal status.
                  </Text>
                  <Button
                    mt="lg"
                    color="violet"
                    variant="filled"
                    size="sm"
                    radius="md"
                    rightSection={<IconChevronRight size={16} />}
                    onClick={scrollToSubscriptions}
                  >
                    View available plans
                  </Button>
                </Paper>
              ) : (
                <Card
                  withBorder
                  radius="md"
                  padding={0}
                  style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}
                >
                  <Text size="xs" c="dimmed" px="md" pt="sm" pb={4}>
                    Subscription rows from your account (updates after purchases are approved).
                  </Text>
                  <ScrollArea
                    type="scroll"
                    offsetScrollbars
                    style={{ maxHeight: 'min(52vh, 440px)' }}
                  >
                    <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md" miw={760}>
                      <Table.Thead
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          backgroundColor: 'var(--mantine-color-gray-0)',
                          boxShadow: '0 1px 0 var(--mantine-color-gray-3)',
                        }}
                      >
                        <Table.Tr>
                          <Table.Th style={{ whiteSpace: 'nowrap' }}>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                              Feature
                            </Text>
                          </Table.Th>
                          <Table.Th>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                              Status
                            </Text>
                          </Table.Th>
                          <Table.Th>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                              Payment
                            </Text>
                          </Table.Th>
                          <Table.Th>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                              Price
                            </Text>
                          </Table.Th>
                          <Table.Th>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                              Days
                            </Text>
                          </Table.Th>
                          <Table.Th>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                              Start
                            </Text>
                          </Table.Th>
                          <Table.Th>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                              End
                            </Text>
                          </Table.Th>
                          <Table.Th>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                              Time left
                            </Text>
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {currentPlan.map((row) => {
                          const time = subscriptionTimeLeft(row.endDate);
                          return (
                            <Table.Tr key={row.id}>
                              <Table.Td>
                                <Text size="sm" fw={600} maw={200} lineClamp={2}>
                                  {row.feature?.name ?? `Feature #${row.featureId}`}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge variant="light" color="teal" size="sm">
                                  {row.status}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Badge variant="outline" color="gray" size="sm">
                                  {row.paymentStatus}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={700}>
                                  ₹{Number(row.price).toFixed(2)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed">
                                  {row.timePeriod}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                  {formatPlanDate(row.startDate)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                  {formatPlanDate(row.endDate)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                {time ? (
                                  <Badge variant="light" color={time.color} size="sm">
                                    {time.label}
                                  </Badge>
                                ) : (
                                  <Text size="xs" c="dimmed">
                                    —
                                  </Text>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                  {isNarrowViewport ? (
                    <Text size="xs" c="dimmed" px="md" py="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                      Swipe horizontally to see all columns.
                    </Text>
                  ) : null}
                </Card>
              )}
            </Paper>
          ) : null}

          <Box id="recruiter-add-features">
            <Divider
              label={
                <Badge size="sm" variant="light" color="violet" radius="sm" tt="uppercase">
                  Catalog
                </Badge>
              }
              labelPosition="center"
              my="lg"
            />
            <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} mb="lg" bg="var(--mantine-color-gray-0)">
              <Group gap="md" mb="lg" wrap="wrap" align="flex-start">
                <ThemeIcon variant="filled" color="violet" size="lg" radius="md">
                  <IconCreditCard size={20} stroke={1.75} />
                </ThemeIcon>
                <Box style={{ flex: 1, minWidth: 200 }}>
                  <Title order={3} fw={800} fz={{ base: 20, sm: 22 }}>
                    Available plans
                  </Title>
                  <Text size="sm" c="dimmed" mt={8} maw={640} lh={1.6}>
                    One card per feature. Compare price and average daily cost, then use{' '}
                    <Text component="span" fw={600} c="gray.7">
                      Request this plan
                    </Text>{' '}
                    to open a confirmation dialog.
                  </Text>
                </Box>
              </Group>
              {recruiterFeatureCards}
            </Paper>
          </Box>
        </Stack>

        {purchaseModal}
      </Box>
    );
  }

  return (
    <Box
      maw={1200}
      w="100%"
      mx="auto"
      py={isPublicPricing ? { base: 'xl', sm: '2xl' } : undefined}
      px={isPublicPricing ? { base: 'md', sm: 'md', md: 0 } : undefined}
    >
      <DashboardPageHeader
        icon={<IconBolt size={24} stroke={1.75} />}
        title="Pricing & plans"
        description="Choose a feature and plan duration that fits your hiring workflow."
      />

      {loading ? (
        <Center py="xl">
          <Loader size="md" />
        </Center>
      ) : sortedFeatures.length === 0 ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            No feature plans are available right now.
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {sortedFeatures.map((feature) => (
            <Card key={feature.id} withBorder p="xl" style={{ height: '100%' }}>
              <Stack gap="md" style={{ height: '100%' }}>
                <Box>
                  <Title order={4}>{feature.name}</Title>
                  <Text c="dimmed" size="sm" mt={4}>
                    {feature.description}
                  </Text>
                </Box>

                <Divider />
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {feature.plans.map((plan) => (
                    <Card key={plan.id} withBorder p="md" style={{ backgroundColor: '#fcfdff' }}>
                      <Stack gap="sm">
                        <Group justify="space-between" align="center">
                          <Text fw={700} size="xl">
                            ${Number(plan.price).toFixed(2)}
                          </Text>
                          <Badge variant="dot" color="teal">
                            {plan.timePeriod} days
                          </Badge>
                        </Group>
                        <Group gap={6}>
                          <IconShieldCheck size={16} color="#2f9e44" />
                          <Text size="xs" c="dimmed">
                            Includes full feature access for selected duration
                          </Text>
                        </Group>
                        <Button
                          mt="xs"
                          loading={purchasingPlanId === plan.id}
                          onClick={() => openConfirmPurchase(feature, plan)}
                        >
                          {isAuthenticated ? 'Buy Subscription' : 'Login to Buy'}
                        </Button>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {purchaseModal}
    </Box>
  );
};

export default Pricing;
