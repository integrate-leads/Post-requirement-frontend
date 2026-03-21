import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, Text, Title, Stack, SimpleGrid, Button, Group, Badge, Loader, Center, ThemeIcon, Modal, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchasedFeatures } from '@/contexts/PurchasedFeaturesContext';
import { IconBolt, IconShieldCheck } from '@tabler/icons-react';

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
  const { refreshPurchasedFeatures } = usePurchasedFeatures();

  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<FeaturePlan | null>(null);

  const inRecruiterArea = location.pathname.startsWith('/recruiter');

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
    <Box maw={1200} w="100%" mx="auto">
      <Card withBorder mb="xl" p="xl" style={{ background: 'linear-gradient(135deg, #f8fbff 0%, #f1f8ff 100%)', borderColor: '#dbeafe' }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="sm" mb={6}>
              <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                <IconBolt size={18} />
              </ThemeIcon>
              <Title order={2}>Pricing & Plans</Title>
            </Group>
            <Text c="dimmed">
              Choose a feature and plan duration that fits your hiring workflow.
            </Text>
          </Box>
          <Group gap="xs">
            <Badge variant="light" color="blue">{sortedFeatures.length} features</Badge>
            <Badge variant="light" color={isAuthenticated ? 'green' : 'gray'}>
              {isAuthenticated ? 'Logged in' : 'Login required to buy'}
            </Badge>
          </Group>
        </Group>
      </Card>

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
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Box>
                    <Title order={4}>{feature.name}</Title>
                    <Text c="dimmed" size="sm" mt={4}>
                      {feature.description}
                    </Text>
                  </Box>
                  <Badge variant="light" color="blue" ml="sm">
                    ID {feature.id}
                  </Badge>
                </Group>

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

      {!inRecruiterArea && (
        <Group justify="center" mt="xl">
          <Button variant="light" onClick={() => navigate('/recruiter/login', { state: { redirectTo: '/recruiter/pricing' } })}>
            Recruiter Login
          </Button>
        </Group>
      )}

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Purchase"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to purchase this plan?
          </Text>
          {selectedFeature && selectedPlan && (
            <Card withBorder p="sm">
              <Group justify="space-between">
                <Text fw={600}>{selectedFeature.name}</Text>
                <Badge color="blue" variant="light">ID {selectedFeature.id}</Badge>
              </Group>
              <Text size="sm" mt={6}>
                Price: <strong>${Number(selectedPlan.price).toFixed(2)}</strong> for {selectedPlan.timePeriod} days
              </Text>
            </Card>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBuy}
              loading={selectedPlan ? purchasingPlanId === selectedPlan.id : false}
            >
              Yes, Purchase
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Pricing;

