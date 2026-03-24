import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import {
  parsePurchasedFeaturesFromApi,
  purchasedCapabilityFlags,
} from '@/lib/recruiterFeatures';

export interface PurchasedFeaturesContextValue {
  /** Feature IDs from `GET /admin/purchased/features` (4 = post requirement, 2 = email broadcast) */
  purchasedFeatureIds: number[];
  loading: boolean;
  hasPostRequirement: boolean;
  hasEmailBroadcast: boolean;
  hasAnyFeature: boolean;
  /** While loading, show gated nav items to avoid flicker; after load, only if purchased */
  showPostRequirementNav: boolean;
  showEmailBroadcastNav: boolean;
  showDashboardSettingsNav: boolean;
  refreshPurchasedFeatures: () => Promise<void>;
}

const defaultValue: PurchasedFeaturesContextValue = {
  purchasedFeatureIds: [],
  loading: false,
  hasPostRequirement: false,
  hasEmailBroadcast: false,
  hasAnyFeature: false,
  showPostRequirementNav: true,
  showEmailBroadcastNav: true,
  showDashboardSettingsNav: true,
  refreshPurchasedFeatures: async () => undefined,
};

const PurchasedFeaturesContext = createContext<PurchasedFeaturesContextValue>(defaultValue);

export const PurchasedFeaturesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const [purchasedFeatureIds, setPurchasedFeatureIds] = useState<number[]>([]);
  const [legacyFeatureNames, setLegacyFeatureNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshPurchasedFeatures = async () => {
    if (!isAuthenticated || isSuperAdmin) {
      setPurchasedFeatureIds([]);
      setLegacyFeatureNames([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<{
        success?: boolean;
        features?: unknown[];
      }>(API_ENDPOINTS.ADMIN.PURCHASED_FEATURES);
      if (res.data?.success && Array.isArray(res.data.features)) {
        const { featureIds, legacyNames } = parsePurchasedFeaturesFromApi(res.data.features);
        setPurchasedFeatureIds(featureIds);
        setLegacyFeatureNames(legacyNames);
      } else {
        setPurchasedFeatureIds([]);
        setLegacyFeatureNames([]);
      }
    } catch {
      setPurchasedFeatureIds([]);
      setLegacyFeatureNames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPurchasedFeatures();
  }, [isAuthenticated, isSuperAdmin]);

  const { hasPostRequirement, hasEmailBroadcast } = useMemo(
    () => purchasedCapabilityFlags(purchasedFeatureIds, legacyFeatureNames),
    [purchasedFeatureIds, legacyFeatureNames]
  );
  const hasAnyFeature = hasPostRequirement || hasEmailBroadcast;

  const value = useMemo((): PurchasedFeaturesContextValue => ({
    purchasedFeatureIds,
    loading,
    hasPostRequirement,
    hasEmailBroadcast,
    hasAnyFeature,
    showPostRequirementNav: loading || hasPostRequirement,
    showEmailBroadcastNav: loading || hasEmailBroadcast,
    showDashboardSettingsNav: loading || hasAnyFeature,
    refreshPurchasedFeatures,
  }), [purchasedFeatureIds, loading, hasPostRequirement, hasEmailBroadcast, hasAnyFeature]);

  return (
    <PurchasedFeaturesContext.Provider value={value}>
      {children}
    </PurchasedFeaturesContext.Provider>
  );
};

export function usePurchasedFeatures(): PurchasedFeaturesContextValue {
  return useContext(PurchasedFeaturesContext);
}
