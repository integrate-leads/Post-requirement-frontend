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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchasedFeatures } from '@/contexts/PurchasedFeaturesContext';
import {
  IconBolt,
  IconShieldCheck,
  IconReceipt,
  IconCalendar,
  IconCheck,
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

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  /** Public `/pricing` sits in PublicLayout with no main padding — add breathing room from header/footer */
  const isPublicPricing = location.pathname === '/pricing';
  const { refreshPurchasedFeatures } = usePurchasedFeatures();

  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<FeaturePlan | null>(null);

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

  const sortedFeatures = useMemo(() => {
    return [...features].sort((a, b) => a.id - b.id);
  }, [features]);

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
      } else {
        notifications.show({
          title: 'Error',
          message: res.data?.message || 'Failed to submit purchase request.',
          color: 'red',
        });
      }
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'response' in error
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
                          <Text size="xs" c="dimmed">Includes full feature access for selected duration</Text>
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

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        centered
        radius="md"
        size="lg"
        padding="xl"
        overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
        title={
          <Group gap="md" wrap="nowrap" align="flex-start">
            <ThemeIcon variant="light" color="blue" radius="md" size={48}>
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
                style={{
                  background: 'linear-gradient(135deg, #f8fbff 0%, #f1f8ff 100%)',
                  borderColor: '#dbeafe',
                }}
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

                  <Divider color="var(--mantine-color-blue-1)" />

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Paper p="md" radius="md" bg="white" withBorder style={{ borderColor: '#e7f0ff' }}>
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
                    <Paper p="md" radius="md" bg="white" withBorder style={{ borderColor: '#e7f0ff' }}>
                      <Group gap="xs" mb={6}>
                        <ThemeIcon variant="light" color="blue" size="sm" radius="sm">
                          <IconReceipt size={14} />
                        </ThemeIcon>
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                          Amount
                        </Text>
                      </Group>
                      <Text fw={800} size="xl" c="blue.8">
                        ${Number(selectedPlan.price).toFixed(2)}
                      </Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        One-time request price shown
                      </Text>
                    </Paper>
                  </SimpleGrid>
                </Stack>
              </Paper>
            </>
          )}

          <Group justify="flex-end" gap="sm" mt="xs" wrap="wrap">
            <Button variant="default" size="md" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              size="md"
              leftSection={<IconCheck size={18} />}
              onClick={handleBuy}
              loading={selectedPlan ? purchasingPlanId === selectedPlan.id : false}
            >
              {isAuthenticated ? 'Submit purchase request' : 'Continue to login'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Pricing;

