import React from 'react';
import { Card, Text, Group, SimpleGrid, RingProgress, Badge, Box, Title, Stack } from '@mantine/core';
import { 
  IconBriefcase, 
  IconUsers, 
  IconCreditCard, 
  IconFileText,
  IconTrendingUp,
  IconClock
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description }) => (
  <Card shadow="sm" padding="lg" withBorder>
    <Box mb="sm" w={40} h={40} style={{ backgroundColor: `${color}20`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </Box>
    <Text size="xl" fw={700}>{value}</Text>
    <Text size="sm" c="dimmed">{title}</Text>
    {description && <Text size="xs" c="dimmed" mt="xs">{description}</Text>}
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { jobPostings, applications, paymentRequests, recruiters } = useAppData();

  const isSuperAdmin = user?.role === 'super_admin';
  const myJobs = isSuperAdmin ? jobPostings : jobPostings.filter(j => j.recruiterId === user?.id);
  const myApplications = isSuperAdmin ? applications : applications.filter(a => myJobs.some(j => j.id === a.jobId));
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const activeJobs = myJobs.filter(j => j.isActive && j.isApproved);

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Welcome back, {user?.name}!</Title>
        <Text c="dimmed">{isSuperAdmin ? 'Super Admin Dashboard' : 'Recruiter Dashboard'}</Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        {isSuperAdmin ? (
          <>
            <StatCard title="Total Recruiters" value={recruiters.length} icon={<IconUsers size={20} color="#0078D4" />} color="#0078D4" />
            <StatCard title="Total Job Postings" value={jobPostings.length} icon={<IconBriefcase size={20} color="#107C10" />} color="#107C10" />
            <StatCard title="Pending Approvals" value={pendingPayments.length} icon={<IconClock size={20} color="#D83B01" />} color="#D83B01" />
            <StatCard title="Total Applications" value={applications.length} icon={<IconFileText size={20} color="#8764B8" />} color="#8764B8" />
          </>
        ) : (
          <>
            <StatCard title="Active Job Postings" value={activeJobs.length} icon={<IconBriefcase size={20} color="#0078D4" />} color="#0078D4" />
            <StatCard title="Total Applications" value={myApplications.length} icon={<IconFileText size={20} color="#107C10" />} color="#107C10" />
            <StatCard title="Pending Payments" value={pendingPayments.filter(p => p.userId === user?.id).length} icon={<IconCreditCard size={20} color="#D83B01" />} color="#D83B01" />
            <StatCard title="Views This Week" value="--" icon={<IconTrendingUp size={20} color="#8764B8" />} color="#8764B8" description="Coming soon" />
          </>
        )}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card shadow="sm" padding="lg" withBorder>
          <Text fw={600} size="lg" mb="md">Recent Activity</Text>
          {myJobs.length === 0 ? (
            <Text c="dimmed" size="sm">No recent activity</Text>
          ) : (
            <Stack gap="sm">
              {myJobs.slice(0, 5).map(job => (
                <Group key={job.id} justify="space-between" py="xs" style={{ borderBottom: '1px solid #e9ecef' }}>
                  <Box>
                    <Text size="sm" fw={500}>{job.title}</Text>
                    <Text size="xs" c="dimmed">{job.recruiterCompany}</Text>
                  </Box>
                  <Badge color={job.isApproved ? 'green' : job.isPaid ? 'yellow' : 'gray'} variant="light" size="sm">
                    {job.isApproved ? 'Active' : job.isPaid ? 'Pending' : 'Draft'}
                  </Badge>
                </Group>
              ))}
            </Stack>
          )}
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Text fw={600} size="lg" mb="md">{isSuperAdmin ? 'Payment Status' : 'Application Stats'}</Text>
          <Group justify="center" py="md">
            <RingProgress
              size={180}
              thickness={20}
              sections={isSuperAdmin ? [
                { value: (paymentRequests.filter(p => p.status === 'approved').length / Math.max(paymentRequests.length, 1)) * 100, color: 'green' },
                { value: (pendingPayments.length / Math.max(paymentRequests.length, 1)) * 100, color: 'yellow' },
                { value: (paymentRequests.filter(p => p.status === 'rejected').length / Math.max(paymentRequests.length, 1)) * 100, color: 'red' },
              ] : [
                { value: myApplications.length > 0 ? 60 : 0, color: 'blue' },
                { value: myApplications.length > 0 ? 25 : 0, color: 'green' },
                { value: myApplications.length > 0 ? 15 : 0, color: 'violet' },
              ]}
              label={
                <Box ta="center">
                  <Text size="xl" fw={700}>{isSuperAdmin ? paymentRequests.length : myApplications.length}</Text>
                  <Text size="xs" c="dimmed">{isSuperAdmin ? 'Total Payments' : 'Applications'}</Text>
                </Box>
              }
            />
          </Group>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;