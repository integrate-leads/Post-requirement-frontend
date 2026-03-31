import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Box, Container, Divider, List, SimpleGrid, Stack, Text, Title } from '@mantine/core';

const LAST_UPDATED = '31 March 2026';

const BULLETS = {
  type: 'unordered' as const,
  listStyleType: 'disc' as const,
  withPadding: true,
  spacing: 'xs' as const,
  size: 'md' as const,
  c: 'gray.7' as const,
  styles: {
    root: {
      listStylePosition: 'outside' as const,
    },
  },
};

function SectionRow({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box component="section">
      <SimpleGrid cols={{ base: 1, sm: 'minmax(10rem, 11rem) 1fr' }} spacing={{ base: 'sm', sm: 'lg' }}>
        <Title order={3} fz={{ base: 'lg', md: 'md' }} fw={600} c="gray.9" lh={1.35} style={{ alignSelf: 'flex-start' }}>
          {n}. {title}
        </Title>
        <Box>{children}</Box>
      </SimpleGrid>
    </Box>
  );
}

const TermsAndConditions: React.FC = () => {
  return (
    <Box py={{ base: 40, md: 60 }} bg="gray.0">
      <Container size="md">
        <Stack gap="xl">
          <Box>
            <Title order={1} fz={{ base: 28, md: 36 }} fw={700} c="gray.9">
              Terms &amp; Conditions
            </Title>
            <Text size="sm" c="dimmed" mt="sm">
              Last updated: {LAST_UPDATED}
            </Text>
          </Box>

          <Text size="md" lh={1.8} c="gray.7">
            Welcome to Integrate Leads. By accessing or using our platform and services, you agree to comply with and be
            bound by these Terms &amp; Conditions (&quot;Terms&quot;). If you do not agree, you must not use our services.
          </Text>

          <Divider />

          <SectionRow n={1} title="Definitions">
            <List {...BULLETS}>
              <List.Item>&quot;Platform&quot; refers to Integrate Leads&apos; website and services.</List.Item>
              <List.Item>&quot;User&quot; refers to any individual or organization using the platform.</List.Item>
              <List.Item>
                &quot;Services&quot; refers to email campaigns, broadcasting, and contact management features.
              </List.Item>
            </List>
          </SectionRow>

          <SectionRow n={2} title="Services">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              Integrate Leads provides:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Bulk email campaigns</List.Item>
              <List.Item>Email broadcasting</List.Item>
              <List.Item>Contact database management</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              We reserve the right to modify, suspend, or discontinue any part of the services at any time.
            </Text>
          </SectionRow>

          <SectionRow n={3} title="Eligibility">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              By using the platform, you confirm that:
            </Text>
            <List {...BULLETS}>
              <List.Item>You are legally capable of entering into a binding agreement.</List.Item>
              <List.Item>You will use a valid and authorized email account.</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={4} title="User Responsibilities">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              You agree that you will:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Send emails only to recipients who have explicitly opted in.</List.Item>
              <List.Item>Comply with all applicable laws (including CAN-SPAM, GDPR, and Indian IT laws).</List.Item>
              <List.Item>Not use purchased, rented, or scraped email lists.</List.Item>
              <List.Item>Ensure all information provided is accurate and lawful.</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              You are solely responsible for all activities conducted through your account.
            </Text>
          </SectionRow>

          <SectionRow n={5} title="Account Access &amp; Security">
            <List {...BULLETS}>
              <List.Item>You are responsible for maintaining the confidentiality of your login credentials.</List.Item>
              <List.Item>Integrate Leads may suspend or terminate accounts for suspicious or unauthorized activity.</List.Item>
              <List.Item>We reserve the right to restrict access if Terms are violated.</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={6} title="Data Ownership &amp; Privacy">
            <List {...BULLETS}>
              <List.Item>You retain ownership of all contact data uploaded to the platform.</List.Item>
              <List.Item>
                Integrate Leads does not sell or share your data with third parties, except as required by law.
              </List.Item>
              <List.Item>
                Use of the platform is also governed by our{' '}
                <Anchor component={Link} to="/privacy-policy" fw={500}>
                  Privacy Policy
                </Anchor>
                .
              </List.Item>
            </List>
          </SectionRow>

          <SectionRow n={7} title="Email Delivery &amp; Service Limitations">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              We strive to provide reliable email delivery; however, we do not guarantee:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Inbox placement</List.Item>
              <List.Item>Delivery success</List.Item>
              <List.Item>Absence of delays or interruptions</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              Emails may be delayed, blocked, or undelivered due to factors beyond our control (e.g., recipient server
              policies, network issues).
            </Text>
          </SectionRow>

          <SectionRow n={8} title="Unsubscribe &amp; Compliance">
            <List {...BULLETS}>
              <List.Item>All emails must include a valid unsubscribe option.</List.Item>
              <List.Item>Unsubscribed recipients must not be contacted again unless they re-consent.</List.Item>
              <List.Item>Users are responsible for maintaining compliant email practices.</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={9} title="Payments &amp; Refund Policy">
            <List {...BULLETS}>
              <List.Item>All fees paid for services are non-refundable, unless explicitly stated otherwise.</List.Item>
              <List.Item>Pricing may be updated at any time without prior notice.</List.Item>
              <List.Item>Continued use of services after changes implies acceptance of revised pricing.</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={10} title="Acceptable Use">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              Users must not use the platform to send or distribute:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Illegal, fraudulent, or misleading content</List.Item>
              <List.Item>Pornographic or adult material</List.Item>
              <List.Item>Abusive, defamatory, or offensive content</List.Item>
              <List.Item>Religious or political propaganda</List.Item>
              <List.Item>Any content that violates applicable laws</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              Violation may result in immediate suspension or termination of the account.
            </Text>
          </SectionRow>

          <SectionRow n={11} title="Suspension &amp; Termination">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              Integrate Leads reserves the right to suspend or terminate accounts if:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Terms are violated</List.Item>
              <List.Item>Complaints are received and validated</List.Item>
              <List.Item>Suspicious or harmful activity is detected</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">We may take such action without prior notice.</Text>
          </SectionRow>

          <SectionRow n={12} title="Limitation of Liability">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              To the fullest extent permitted by law:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Integrate Leads shall not be liable for any direct, indirect, incidental, or consequential damages.</List.Item>
              <List.Item>This includes loss of data, revenue, business opportunities, or reputational damage.</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              Failure to read or understand these Terms does not exempt users from compliance, and Integrate Leads shall
              not be responsible for any resulting loss.
            </Text>
          </SectionRow>

          <SectionRow n={13} title="Indemnification">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              You agree to indemnify and hold harmless Integrate Leads from any claims, damages, or liabilities arising from:
            </Text>
            <List {...BULLETS}>
              <List.Item>Your use of the platform</List.Item>
              <List.Item>Violation of these Terms</List.Item>
              <List.Item>Breach of applicable laws</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={14} title="Legal Compliance &amp; Disclosure">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              We may disclose user data, including email content and contact lists, if required by:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Law enforcement agencies</List.Item>
              <List.Item>Court orders</List.Item>
              <List.Item>Regulatory authorities</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">Such disclosures may occur without prior notice.</Text>
          </SectionRow>

          <SectionRow n={15} title="Modifications to Terms">
            <Text size="md" lh={1.8} c="gray.7" mb="md">
              We reserve the right to update or modify these Terms at any time. Updated Terms will be posted on this page
              with a revised date.
            </Text>
            <Text size="md" lh={1.8} c="gray.7">
              Continued use of the platform constitutes acceptance of the updated Terms.
            </Text>
          </SectionRow>

          <SectionRow n={16} title="Governing Law">
            <Text size="md" lh={1.8} c="gray.7">
              These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes shall be
              subject to the jurisdiction of courts located in Hyderabad.
            </Text>
          </SectionRow>

          <SectionRow n={17} title="Contact Us">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              For any questions or concerns regarding these Terms:
            </Text>
            <Text size="md" c="gray.7">
              Email:{' '}
              <Anchor href="mailto:hr@integrateleads.com" fw={500}>
                hr@integrateleads.com
              </Anchor>
            </Text>
            <Text size="md" c="gray.7" mt="xs">
              Company name: Integrate Leads
            </Text>
          </SectionRow>
        </Stack>
      </Container>
    </Box>
  );
};

export default TermsAndConditions;
