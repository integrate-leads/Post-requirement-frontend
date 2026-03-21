import React from 'react';
import { Center, Loader } from '@mantine/core';
import { usePurchasedFeatures } from '@/contexts/PurchasedFeaturesContext';
import FeatureAccessDenied from '@/components/FeatureAccessDenied';

export type RecruiterGatedFeature = 'postRequirement' | 'emailBroadcast';

interface RequireRecruiterFeatureProps {
  feature: RecruiterGatedFeature;
  children: React.ReactNode;
}

/**
 * Blocks recruiter routes when the user’s purchased features (from API) don’t include the required feature.
 * Super-admin layout does not use this wrapper.
 */
const RequireRecruiterFeature: React.FC<RequireRecruiterFeatureProps> = ({ feature, children }) => {
  const { loading, hasPostRequirement, hasEmailBroadcast } = usePurchasedFeatures();

  if (loading) {
    return (
      <Center mih={320} py="xl">
        <Loader size="md" />
      </Center>
    );
  }

  const allowed =
    feature === 'postRequirement' ? hasPostRequirement : hasEmailBroadcast;

  if (!allowed) {
    return <FeatureAccessDenied />;
  }

  return <>{children}</>;
};

export default RequireRecruiterFeature;
