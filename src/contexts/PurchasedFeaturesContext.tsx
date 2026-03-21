import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import {
  hasEmailBroadcastFeature,
  hasPostRequirementFeature,
} from '@/lib/recruiterFeatures';

export interface PurchasedFeaturesContextValue {
  features: string[];
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
  features: [],
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
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshPurchasedFeatures = async () => {
    if (!isAuthenticated || isSuperAdmin) {
      setFeatures([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<{
        success?: boolean;
        features?: string[];
      }>(API_ENDPOINTS.ADMIN.PURCHASED_FEATURES);
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

  useEffect(() => {
    refreshPurchasedFeatures();
  }, [isAuthenticated, isSuperAdmin]);

  const hasPostRequirement = hasPostRequirementFeature(features);
  const hasEmailBroadcast = hasEmailBroadcastFeature(features);
  const hasAnyFeature = hasPostRequirement || hasEmailBroadcast;

  const value = useMemo((): PurchasedFeaturesContextValue => ({
    features,
    loading,
    hasPostRequirement,
    hasEmailBroadcast,
    hasAnyFeature,
    showPostRequirementNav: loading || hasPostRequirement,
    showEmailBroadcastNav: loading || hasEmailBroadcast,
    showDashboardSettingsNav: loading || hasAnyFeature,
    refreshPurchasedFeatures,
  }), [features, loading, hasPostRequirement, hasEmailBroadcast, hasAnyFeature]);

  return (
    <PurchasedFeaturesContext.Provider value={value}>
      {children}
    </PurchasedFeaturesContext.Provider>
  );
};

export function usePurchasedFeatures(): PurchasedFeaturesContextValue {
  return useContext(PurchasedFeaturesContext);
}
