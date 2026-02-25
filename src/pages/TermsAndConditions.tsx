import React from 'react';
import { Box, Container, Title, Text, Stack, List, Divider } from '@mantine/core';

const TermsAndConditions: React.FC = () => {
  return (
    <Box py={{ base: 40, md: 60 }} bg="gray.0">
      <Container size="md">
        <Stack gap="xl">
          <Box>
            <Title order={1} fz={{ base: 28, md: 36 }} fw={700} c="gray.9">
              Terms & Conditions
            </Title>
          </Box>

          <Text size="md" lh={1.8} c="gray.7">
            Thanks for using Integrate Leads. By clicking on Your Organization / Individual / Whoever it is, you accept that
            you are bound by all the terms and conditions mentioned below.
          </Text>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Account and login
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              You will log in with your official mail ID only or registered email ID. Integrate Leads will respect your
              contacts' email IDs and will not share them with any other third-party vendors. If you attempt to log in with
              any inappropriate email ID, Integrate Leads has the right to hold or block your email account. Integrate Leads
              is not liable and will not refund any payments that have been made.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Unsubscribe and consent
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              If any recipient does not want to receive email from your email account via Integrate Leads, by clicking on
              UNSUBSCRIBE the email ID will be deleted permanently from your contacts/database. Recipients will not receive
              any emails from your end and vice versa. Before you add any email ID to your contacts/database, please ensure
              that the recipient will accept emails from you.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Charging and usage
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              Integrate Leads will charge for MASS/BROADCAST/E-MAILING only. This can be changed as per the policy of the
              company. Every company will have its own email database. You can upload the email IDs and send email to all
              recipients/contacts in your own distribution list.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Delivery and liability
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              Our application will make sure that all the email IDs you have entered are active and will reach the inbox. If
              any email does not reach the recipient's inbox, bounces back, is undelivered, or fails for any other reason,
              Integrate Leads is not responsible. We consider it an error. There may be delays in reaching the recipient's
              inbox due to technical issues. We are not liable to pay any damage charges for that. If any vendor tries to
              take advantage and blames or imposes on our organization, it will be considered disrespectful and punishable
              as per Indian penal law/code.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Data sharing
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              We respect and try to increase your sales and generate leads. In the future we may share the email
              database/distribution list with all our clients, with your confirmation. After your confirmation you will not
              have any right to question our working operations.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Prohibited content
            </Title>
            <Text size="md" lh={1.8} c="gray.7" mb="sm">
              Irrelevant or improper content/links/images must not be sent or distributed via email. If such content is found,
              Integrate Leads' team has the right to impose a fine, cancel membership, and report to cybercrime for further
              action. The contractor will be responsible for such actions. We request clients not to send any illegal
              content, porn content, abusive language, religious content, political party content, or disrespectful material
              to any person, religion, or entity. If such content is found in emails we will stop, block, or revoke
              membership.
            </Text>
          </Box>

          <Box>
            <Title order={2} fz="lg" fw={600} mb="sm" c="gray.9">
              Complaints and enforcement
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              If any recipient raises a complaint against your email message/list and we find it valid, Integrate Leads has
              the right to hold or block the account/membership until the matter is resolved. You and your company are
              responsible for all damages/claims. We are subject to the law; if any official requests it we are authorized to
              show your email messages/lists without prior consent or notice.
            </Text>
          </Box>

          <Text size="md" lh={1.8} c="gray.7">
            We welcome any further clarifications and respect your questions.
          </Text>

          <Divider my="md" />

          {/* Acceptable Use Policy */}
          <Title order={2} fz={{ base: 22, md: 28 }} fw={700} c="gray.9">
            Acceptable Use Policy
          </Title>
          <Text size="md" lh={1.8} c="gray.7">
            This Acceptable Use Policy ("Policy") governs the use of services provided by Integrate Leads, a company
            registered in India/Telangana ("Company", "we", "us", "our"), including its website, email broadcasting &
            campaign platform, applications, APIs, and related services ("Services"). This Policy applies to all users,
            clients, recruiters, partners, and entities accessing or using our Services globally, including users in the
            United States and India. By accessing or using our Services, you agree to comply with this Policy.
          </Text>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              1. Legal compliance
            </Title>
            <Text size="md" lh={1.8} c="gray.7" mb="xs">
              Users must comply with all applicable laws, including but not limited to:
            </Text>
            <List size="sm" spacing="xs" c="gray.7">
              <List.Item>India: Information Technology Act 2000, IT (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021, Indian Penal Code, data protection laws</List.Item>
              <List.Item>United States: CAN-SPAM Act 2003, FTC regulations, TCPA where applicable, state anti-spam and consumer protection laws</List.Item>
              <List.Item>International: GDPR where EU data subjects are involved, and applicable data privacy and electronic communication laws</List.Item>
            </List>
            <Text size="md" lh={1.8} c="gray.7" mt="sm">
              Failure to comply may result in immediate termination.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              2. Anti-spam policy
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              Integrate Leads maintains a zero-tolerance spam policy. You may NOT use our Services to: send unsolicited
              commercial email (UCE); send emails to purchased, rented, scraped, or third-party lists; send cold bulk emails
              without verifiable consent; send deceptive or misleading content; falsify sender identity or headers; or use
              misleading subject lines. All recipients must have provided clear, affirmative, and verifiable consent
              (opt-in). We reserve the right to request proof of consent at any time.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              3. Email compliance standards
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              All emails sent through Integrate Leads must: include accurate "From" and "Reply-To" information; clearly
              identify the sender; contain a valid physical business address/signature; include a functional one-click
              unsubscribe link; honor unsubscribe requests within 10 days (or sooner if required by law); and not
              misrepresent products or services. Non-compliance will result in suspension.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              4. Prohibited content
            </Title>
            <Text size="md" lh={1.8} c="gray.7" mb="xs">
              Strictly prohibited: illegal or fraudulent activities (phishing, identity theft, financial scams, Ponzi
              schemes, crypto fraud, fake job offers); harmful or offensive content (hate speech, harassment, discrimination,
              adult/explicit material, illegal gambling, weapons sales, drug-related promotions); technical abuse (bypassing
              sending limits, IP warming manipulation, circumventing bounce/complaint controls, reverse engineering,
              denial-of-service attacks, exploiting vulnerabilities).
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              5. List management and data responsibility
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              Users are fully responsible for: maintaining documented proof of consent; ensuring lawful collection of
              personal data; removing hard-bounced addresses; suppressing complained addresses; maintaining accurate
              recipient records; ensuring lawful cross-border data transfers. Integrate Leads acts as a service
              provider/intermediary and does not assume responsibility for client-acquired data.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              6. Bounce, complaint & reputation
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              Integrate Leads may automatically suspend accounts exceeding excessive hard bounce rate, excessive spam
              complaint rate, unusual sending patterns, or blacklisting triggers. We reserve sole discretion to determine
              acceptable thresholds.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              7. Enforcement
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              Integrate Leads may, without prior notice: suspend or restrict sending privileges; block campaigns; terminate
              accounts; permanently blacklist users; remove hosted content; report illegal activities to authorities. We are
              not liable for any business losses resulting from enforcement actions under this Policy.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              8. Indemnification
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              You agree to indemnify and hold harmless Integrate Leads, its directors, officers, employees, and affiliates
              from any claims, damages, penalties, fines, liabilities, or legal expenses arising from: your violation of this
              Policy; your violation of any law; unauthorized use of personal data; spam-related complaints; regulatory
              investigations; or third-party claims.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              9. Limitation of liability
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              To the maximum extent permitted by law, Integrate Leads shall not be liable for delivery failures, ISP
              blocking, blacklisting, loss of business, or indirect or consequential damages. Use of the Services is at your
              own risk.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              10. Termination and modifications
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              Violation of this Policy may result in immediate suspension, permanent account termination, forfeiture of
              prepaid amounts, legal action, or reporting to regulatory authorities. No refunds will be issued for accounts
              terminated due to Policy violations. We reserve the right to modify this Policy at any time. Continued use
              constitutes acceptance of revised terms.
            </Text>
          </Box>

          <Box>
            <Title order={3} fz="md" fw={600} mb="xs" c="gray.9">
              11. Governing law
            </Title>
            <Text size="md" lh={1.8} c="gray.7">
              This Policy shall be governed by and construed in accordance with the laws of India. Any disputes shall be
              subject to the exclusive jurisdiction of the courts located in India. Users operating in the United States
              remain responsible for compliance with applicable U.S. federal and state laws.
            </Text>
          </Box>

          <Text size="sm" c="dimmed" lh={1.7}>
            For questions about these Terms & Conditions or the Acceptable Use Policy, please contact us through the
            contact details on our website.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
};

export default TermsAndConditions;
