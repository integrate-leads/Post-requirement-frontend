import React from 'react';
import { Center, Loader } from '@mantine/core';
import { Navigate } from 'react-router-dom';
import { usePurchasedFeatures } from '@/contexts/PurchasedFeaturesContext';

interface RequireAnyRecruiterFeatureProps {
  children: React.ReactNode;
}

const RequireAnyRecruiterFeature: React.FC<RequireAnyRecruiterFeatureProps> = ({ children }) => {
  const { loading, hasAnyFeature } = usePurchasedFeatures();

  if (loading) {
    return (
      <Center mih={320} py="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (!hasAnyFeature) {
    return <Navigate to="/recruiter/pricing" replace />;
  }

  return <>{children}</>;
};

export default RequireAnyRecruiterFeature;

