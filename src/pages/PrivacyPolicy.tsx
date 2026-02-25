import React from 'react';
import { Box, Container, Title, Text, Stack } from '@mantine/core';

const PrivacyPolicy: React.FC = () => {
  return (
    <Box py={{ base: 40, md: 60 }} bg="gray.0">
      <Container size="md">
        <Stack gap="xl">
          <Box>
            <Title order={1} fz={{ base: 28, md: 36 }} fw={700} c="gray.9">
              Privacy Policy
            </Title>
          </Box>

          <Text size="md" lh={1.8} c="gray.7">
            Integrate Leads respects your privacy and is committed to protecting your personal data and contact information.
            This policy describes how we collect, use, and safeguard information when you use our services.
          </Text>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Your data and contacts
            </Title>
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              Integrate Leads will respect your contacts and email IDs and will not share them with any other third-party vendors.
              You will log in with your official or registered email ID only. We do not sell or rent your contact lists.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Data responsibility and consent
            </Title>
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              Users are responsible for maintaining documented proof of consent, ensuring lawful collection of personal data,
              and complying with applicable data protection laws. Integrate Leads acts as a service provider and does not
              assume responsibility for client-acquired data. We may request proof of consent at any time.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Cross-border data
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              If you send emails to recipients in the United States, India, or other jurisdictions, you are solely responsible
              for ensuring compliance with applicable data protection laws (e.g. GDPR where EU data subjects are involved).
              Integrate Leads does not guarantee compliance for user-acquired data.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Disclosure to authorities
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              We are subject to the law. If any competent authority requests it, we are authorized to disclose your email
              messages or lists as required by law, which may be done without prior notice to you.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Changes
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              We may update this Privacy Policy from time to time. Continued use of our services after changes constitutes
              acceptance of the updated policy.
            </Text>
          </Box>

          <Text size="sm" c="dimmed" lh={1.7}>
            For questions about this Privacy Policy or our data practices, please contact us through the contact details
            provided on our website.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
