import React from 'react';
import { Card, Text, Group, SimpleGrid, RingProgress, Badge } from '@mantine/core';
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
  <Card shadow="sm" padding="lg" className="bg-card border border-border">
    <Group justify="space-between" mb="sm">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
    </Group>
    <Text size="2xl" fw={700} className="text-foreground">{value}</Text>
    <Text size="sm" c="dimmed">{title}</Text>
    {description && (
      <Text size="xs" c="dimmed" mt="xs">{description}</Text>
    )}
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { jobPostings, applications, paymentRequests, recruiters } = useAppData();

  const isSuperAdmin = user?.role === 'super_admin';

  const myJobs = isSuperAdmin 
    ? jobPostings 
    : jobPostings.filter(j => j.recruiterId === user?.id);
  
  const myApplications = isSuperAdmin
    ? applications
    : applications.filter(a => myJobs.some(j => j.id === a.jobId));

  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const activeJobs = myJobs.filter(j => j.isActive && j.isApproved);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Text size="2xl" fw={700} className="text-foreground">
          Welcome back, {user?.name}!
        </Text>
        <Text c="dimmed">
          {isSuperAdmin ? 'Super Admin Dashboard' : 'Recruiter Dashboard'}
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        {isSuperAdmin ? (
          <>
            <StatCard
              title="Total Recruiters"
              value={recruiters.length}
              icon={<IconUsers size={20} style={{ color: '#0078D4' }} />}
              color="#0078D4"
            />
            <StatCard
              title="Total Job Postings"
              value={jobPostings.length}
              icon={<IconBriefcase size={20} style={{ color: '#107C10' }} />}
              color="#107C10"
            />
            <StatCard
              title="Pending Approvals"
              value={pendingPayments.length}
              icon={<IconClock size={20} style={{ color: '#D83B01' }} />}
              color="#D83B01"
            />
            <StatCard
              title="Total Applications"
              value={applications.length}
              icon={<IconFileText size={20} style={{ color: '#8764B8' }} />}
              color="#8764B8"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Active Job Postings"
              value={activeJobs.length}
              icon={<IconBriefcase size={20} style={{ color: '#0078D4' }} />}
              color="#0078D4"
            />
            <StatCard
              title="Total Applications"
              value={myApplications.length}
              icon={<IconFileText size={20} style={{ color: '#107C10' }} />}
              color="#107C10"
            />
            <StatCard
              title="Pending Payments"
              value={pendingPayments.filter(p => p.userId === user?.id).length}
              icon={<IconCreditCard size={20} style={{ color: '#D83B01' }} />}
              color="#D83B01"
            />
            <StatCard
              title="Views This Week"
              value="--"
              icon={<IconTrendingUp size={20} style={{ color: '#8764B8' }} />}
              color="#8764B8"
              description="Coming soon"
            />
          </>
        )}
      </SimpleGrid>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card shadow="sm" padding="lg" className="bg-card border border-border">
          <Text fw={600} size="lg" mb="md" className="text-foreground">
            Recent Activity
          </Text>
          
          {myJobs.length === 0 ? (
            <Text c="dimmed" size="sm">No recent activity</Text>
          ) : (
            <div className="space-y-4">
              {myJobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <Text size="sm" fw={500} className="text-foreground">{job.title}</Text>
                    <Text size="xs" c="dimmed">{job.recruiterCompany}</Text>
                  </div>
                  <Badge 
                    color={job.isApproved ? 'green' : job.isPaid ? 'yellow' : 'gray'} 
                    variant="light"
                    size="sm"
                  >
                    {job.isApproved ? 'Active' : job.isPaid ? 'Pending' : 'Draft'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <Card shadow="sm" padding="lg" className="bg-card border border-border">
          <Text fw={600} size="lg" mb="md" className="text-foreground">
            {isSuperAdmin ? 'Payment Status' : 'Application Stats'}
          </Text>
          
          <div className="flex items-center justify-center py-4">
            <RingProgress
              size={180}
              thickness={20}
              sections={isSuperAdmin ? [
                { value: (paymentRequests.filter(p => p.status === 'approved').length / Math.max(paymentRequests.length, 1)) * 100, color: 'green' },
                { value: (pendingPayments.length / Math.max(paymentRequests.length, 1)) * 100, color: 'yellow' },
                { value: (paymentRequests.filter(p => p.status === 'rejected').length / Math.max(paymentRequests.length, 1)) * 100, color: 'red' },
              ] : [
                { value: myApplications.length > 0 ? 60 : 0, color: '#0078D4' },
                { value: myApplications.length > 0 ? 25 : 0, color: '#107C10' },
                { value: myApplications.length > 0 ? 15 : 0, color: '#8764B8' },
              ]}
              label={
                <div className="text-center">
                  <Text size="xl" fw={700} className="text-foreground">
                    {isSuperAdmin ? paymentRequests.length : myApplications.length}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {isSuperAdmin ? 'Total Payments' : 'Applications'}
                  </Text>
                </div>
              }
            />
          </div>

          <div className="flex justify-center gap-6 mt-4">
            {isSuperAdmin ? (
              <>
                <Group gap="xs">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <Text size="xs" c="dimmed">Approved</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <Text size="xs" c="dimmed">Pending</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <Text size="xs" c="dimmed">Rejected</Text>
                </Group>
              </>
            ) : (
              <>
                <Group gap="xs">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <Text size="xs" c="dimmed">Reviewed</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <Text size="xs" c="dimmed">Shortlisted</Text>
                </Group>
                <Group gap="xs">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#8764B8' }} />
                  <Text size="xs" c="dimmed">Pending</Text>
                </Group>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
