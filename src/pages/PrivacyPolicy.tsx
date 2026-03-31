import React from 'react';
import { Anchor, Box, Container, Divider, List, SimpleGrid, Stack, Text, Title } from '@mantine/core';

const LAST_UPDATED = '28 March 2026';

/** Disc bullets, indented — Mantine’s default list styling is easy to miss. */
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
  headingOrder = 2,
  children,
}: {
  n: number;
  title: string;
  /** Use 3 under the Anti-Spam h2. */
  headingOrder?: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <Box component="section">
      <SimpleGrid cols={{ base: 1, sm: 'minmax(10rem, 11rem) 1fr' }} spacing={{ base: 'sm', sm: 'lg' }}>
        <Title
          order={headingOrder}
          fz={headingOrder === 2 ? 'lg' : 'md'}
          fw={600}
          c="gray.9"
          lh={1.35}
          style={{ alignSelf: 'flex-start' }}
        >
          {n}. {title}
        </Title>
        <Box>{children}</Box>
      </SimpleGrid>
    </Box>
  );
}

const PrivacyPolicy: React.FC = () => {
  return (
    <Box py={{ base: 40, md: 60 }} bg="gray.0">
      <Container size="md">
        <Stack gap="xl">
          <Box>
            <Title order={1} fz={{ base: 28, md: 36 }} fw={700} c="gray.9">
              Privacy Policy
            </Title>
            <Text size="sm" c="dimmed" mt="sm">
              Last updated: {LAST_UPDATED}
            </Text>
          </Box>

          <Text size="md" lh={1.8} c="gray.7">
            Integrate Leads (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy and
            ensuring transparency in how we collect, use, and safeguard your information. This Privacy Policy explains how
            we handle your data when you use our platform and services.
          </Text>

          <Divider />

          <SectionRow n={1} title="Information We Collect">
            <Text size="md" lh={1.8} c="gray.7" mb="md">
              We collect the following types of information:
            </Text>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.8">
              a. Personal Information
            </Title>
            <List {...BULLETS} mb="lg">
              <List.Item>Name</List.Item>
              <List.Item>Email address</List.Item>
              <List.Item>Phone number</List.Item>
              <List.Item>Billing details (if applicable)</List.Item>
              <List.Item>Postal address</List.Item>
            </List>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.8">
              b. Account &amp; usage data
            </Title>
            <List {...BULLETS} mb="lg">
              <List.Item>Login credentials</List.Item>
              <List.Item>IP address</List.Item>
              <List.Item>Browser and device information</List.Item>
              <List.Item>Activity logs within the platform</List.Item>
            </List>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.8">
              c. Contact data (uploaded by users)
            </Title>
            <List {...BULLETS}>
              <List.Item>Email addresses and contact details uploaded by users for campaign purposes</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={2} title="How We Use Your Information">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              We use your data to:
            </Text>
            <List {...BULLETS}>
              <List.Item>Provide and operate our services</List.Item>
              <List.Item>Manage email campaigns and communications</List.Item>
              <List.Item>Improve platform functionality and user experience</List.Item>
              <List.Item>Ensure compliance with legal and regulatory requirements</List.Item>
              <List.Item>Detect and prevent fraud, abuse, or misuse</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={3} title="Data Ownership">
            <List {...BULLETS}>
              <List.Item>You retain full ownership of the contact data you upload.</List.Item>
              <List.Item>Integrate Leads does not claim ownership of your email lists or campaign data.</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={4} title="Data Sharing &amp; Disclosure">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              We do not sell, rent, or trade your personal data. We may share data only in the following cases:
            </Text>
            <List {...BULLETS}>
              <List.Item>With service providers necessary to operate our platform (e.g. cloud or email infrastructure)</List.Item>
              <List.Item>To comply with legal obligations, regulations, or government requests</List.Item>
              <List.Item>To enforce our Terms &amp; Conditions or protect our rights</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={5} title="Data Security">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              We implement appropriate technical and organizational measures to protect your data from:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Unauthorized access</List.Item>
              <List.Item>Loss or misuse</List.Item>
              <List.Item>Disclosure or alteration</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              However, no system is completely secure, and we cannot guarantee absolute security.
            </Text>
          </SectionRow>

          <SectionRow n={6} title="Email Communication &amp; Consent">
            <List {...BULLETS}>
              <List.Item>
                Users are responsible for ensuring that all recipients have explicitly opted in to receive emails.
              </List.Item>
              <List.Item>We do not control or verify the legality of user-uploaded contact lists.</List.Item>
              <List.Item>All emails sent through our platform will include an unsubscribe option.</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={7} title="Data Retention">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              We retain your data:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>For as long as your account is active</List.Item>
              <List.Item>As necessary to provide services</List.Item>
              <List.Item>As required by legal or regulatory obligations</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              You may request deletion of your data, subject to legal requirements.
            </Text>
          </SectionRow>

          <SectionRow n={8} title="User Rights">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              Depending on applicable laws (such as GDPR), you may have the right to:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Access your data</List.Item>
              <List.Item>Correct inaccurate data</List.Item>
              <List.Item>Request deletion of your data</List.Item>
              <List.Item>Object to or restrict processing</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              To exercise these rights, please contact us.
            </Text>
          </SectionRow>

          <SectionRow n={9} title="Cookies &amp; Tracking">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              We may use cookies and similar technologies to:
            </Text>
            <List {...BULLETS} mb="md">
              <List.Item>Improve user experience</List.Item>
              <List.Item>Analyze platform usage</List.Item>
              <List.Item>Maintain session security</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7">
              You can control cookies through your browser settings.
            </Text>
          </SectionRow>

          <SectionRow n={10} title="Third-Party Services">
            <Text size="md" lh={1.8} c="gray.7">
              Our platform may rely on third-party services (such as email delivery providers or cloud hosting). These
              providers process data only as necessary to deliver services and are obligated to protect your data.
            </Text>
          </SectionRow>

          <SectionRow n={11} title="Limitation of Responsibility">
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              Integrate Leads is not responsible for:
            </Text>
            <List {...BULLETS}>
              <List.Item>The accuracy or legality of user-uploaded data</List.Item>
              <List.Item>Misuse of the platform by users</List.Item>
              <List.Item>Any damages resulting from unauthorized access beyond our reasonable control</List.Item>
            </List>
          </SectionRow>

          <SectionRow n={12} title="Changes to This Policy">
            <Text size="md" lh={1.8} c="gray.7">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
              &quot;Last updated&quot; date. Continued use of the platform constitutes acceptance of the updated policy.
            </Text>
          </SectionRow>

          <Divider my="md" labelPosition="center" />

          <Box component="section">
            <Title order={2} fz={{ base: 22, md: 26 }} fw={700} mb="sm" c="gray.9">
              Anti-Spam Policy (Acceptable Use Policy)
            </Title>
            <Text size="md" lh={1.8} c="gray.7" mb="xl">
              Integrate Leads is committed to maintaining a responsible and compliant email communication platform. This
              Anti-Spam Policy outlines the rules and standards that all users must follow when using our services.
            </Text>

            <Stack gap="xl">
              <SectionRow n={1} title="Zero Tolerance for Spam" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7">
                  Integrate Leads strictly prohibits the use of its platform for sending unsolicited or bulk commercial
                  emails (spam). Any violation of this policy may result in immediate suspension or termination of the
                  account.
                </Text>
              </SectionRow>

              <SectionRow n={2} title="Permission-Based Emailing" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7" mb="sm">
                  All users must ensure that:
                </Text>
                <List {...BULLETS} mb="md">
                  <List.Item>Emails are sent only to recipients who have explicitly opted in to receive communications</List.Item>
                  <List.Item>Consent is freely given, specific, informed, and unambiguous</List.Item>
                  <List.Item>Proof of consent can be provided upon request</List.Item>
                </List>
                <Text size="md" fw={600} c="gray.8" mb="xs">
                  Examples of valid consent:
                </Text>
                <List {...BULLETS}>
                  <List.Item>Website signup forms</List.Item>
                  <List.Item>Subscription forms</List.Item>
                  <List.Item>Customer opt-in during service purchase</List.Item>
                </List>
              </SectionRow>

              <SectionRow n={3} title="Prohibited Email Practices" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7" mb="sm">
                  Users are strictly prohibited from:
                </Text>
                <List {...BULLETS}>
                  <List.Item>Using purchased, rented, or scraped email lists</List.Item>
                  <List.Item>Sending emails without recipient consent</List.Item>
                  <List.Item>Sending misleading or deceptive content</List.Item>
                  <List.Item>Using false or misleading sender information</List.Item>
                  <List.Item>Sending repetitive or excessive emails that may be considered spam</List.Item>
                  <List.Item>Attempting to bypass spam filters or email security systems</List.Item>
                </List>
              </SectionRow>

              <SectionRow n={4} title="Mandatory Unsubscribe Mechanism" headingOrder={3}>
                <List {...BULLETS}>
                  <List.Item>All emails will include a clear and functional unsubscribe option.</List.Item>
                  <List.Item>
                    If a recipient unsubscribes, that email address will be deleted from your database permanently.
                  </List.Item>
                  <List.Item>Unsubscribe requests must be honored promptly.</List.Item>
                  <List.Item>
                    Once unsubscribed, recipients will not receive further emails unless they re-subscribe.
                  </List.Item>
                </List>
              </SectionRow>

              <SectionRow n={5} title="Content Restrictions" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7" mb="sm">
                  The following types of content are strictly prohibited:
                </Text>
                <List {...BULLETS}>
                  <List.Item>Illegal or fraudulent content</List.Item>
                  <List.Item>Pornographic or adult material</List.Item>
                  <List.Item>Abusive, hateful, or offensive language</List.Item>
                  <List.Item>Religious or political propaganda</List.Item>
                  <List.Item>Defamatory or misleading information</List.Item>
                </List>
              </SectionRow>

              <SectionRow n={6} title="Compliance with Laws" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7" mb="sm">
                  Users must comply with all applicable laws and regulations, including but not limited to:
                </Text>
                <List {...BULLETS} mb="md">
                  <List.Item>CAN-SPAM Act (USA)</List.Item>
                  <List.Item>GDPR (Europe)</List.Item>
                  <List.Item>Indian Information Technology Act</List.Item>
                </List>
                <Text size="md" lh={1.8} c="gray.7">
                  Failure to comply may result in legal consequences and account termination.
                </Text>
              </SectionRow>

              <SectionRow n={7} title="Monitoring &amp; Enforcement" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7" mb="sm">
                  Integrate Leads reserves the right to:
                </Text>
                <List {...BULLETS}>
                  <List.Item>Monitor email campaigns for compliance</List.Item>
                  <List.Item>Investigate complaints or suspicious activities</List.Item>
                  <List.Item>Request proof of consent from users</List.Item>
                  <List.Item>Suspend or terminate accounts without prior notice in case of violations</List.Item>
                </List>
              </SectionRow>

              <SectionRow n={8} title="Complaint Handling" headingOrder={3}>
                <List {...BULLETS}>
                  <List.Item>If recipients report emails as spam, we may investigate the matter.</List.Item>
                  <List.Item>Accounts with repeated complaints may be suspended or permanently blocked.</List.Item>
                  <List.Item>Users are responsible for resolving complaints related to their campaigns.</List.Item>
                </List>
              </SectionRow>

              <SectionRow n={9} title="Limitation of Responsibility" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7" mb="sm">
                  Integrate Leads acts as a service provider and does not control user-generated content or recipient lists.
                  Users are solely responsible for:
                </Text>
                <List {...BULLETS} mb="md">
                  <List.Item>The legality of their email lists</List.Item>
                  <List.Item>The content they send</List.Item>
                  <List.Item>Compliance with applicable laws</List.Item>
                </List>
                <Text size="md" lh={1.8} c="gray.7">
                  Integrate Leads shall not be held liable for misuse of the platform by users.
                </Text>
              </SectionRow>

              <SectionRow n={10} title="Policy Violations" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7" mb="sm">
                  Violations of this Anti-Spam Policy may result in:
                </Text>
                <List {...BULLETS}>
                  <List.Item>Immediate suspension or termination of account</List.Item>
                  <List.Item>Permanent restriction from using the platform</List.Item>
                  <List.Item>Reporting to relevant authorities, where required</List.Item>
                </List>
              </SectionRow>

              <SectionRow n={11} title="Updates to This Policy" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7">
                  We may update this Anti-Spam Policy at any time. Continued use of the platform constitutes acceptance of the
                  updated policy.
                </Text>
              </SectionRow>

              <SectionRow n={12} title="Contact Us" headingOrder={3}>
                <Text size="md" lh={1.8} c="gray.7" mb="sm">
                  For any questions regarding this policy, please contact:
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
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
