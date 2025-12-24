import React, { useEffect, useState } from 'react';
import { Card, Text, Group, SimpleGrid, RingProgress, Badge, Box, Title, Stack, Skeleton } from '@mantine/core';
import { 
  IconBriefcase, 
  IconUsers, 
  IconClock, 
  IconFileText,
  IconTrendingUp,
  IconCreditCard,
  IconEye
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '@/hooks/useApi';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
  loading?: boolean;
}

interface DashboardCounts {
  totalRecruiters: number;
  totalJobPostings: number;
  pendingApproval: number;
}

interface RecentJob {
  id: string;
  _id?: string;
  title: string;
  recruiterCompany?: string;
  companyName?: string;
  isApproved?: boolean;
  isPaid?: boolean;
  status?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description, loading }) => (
  <Card shadow="sm" padding="lg" withBorder>
    <Box mb="sm" w={40} h={40} style={{ backgroundColor: `${color}20`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </Box>
    {loading ? (
      <Skeleton height={28} width={60} mb="xs" />
    ) : (
      <Text size="xl" fw={700}>{value}</Text>
    )}
    <Text size="sm" c="dimmed">{title}</Text>
    {description && <Text size="xs" c="dimmed" mt="xs">{description}</Text>}
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { jobPostings, applications, paymentRequests } = useAppData();
  const navigate = useNavigate();
  
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isSuperAdmin) {
        setLoading(false);
        setJobsLoading(false);
        return;
      }

      // Fetch counts
      try {
        const countsResponse = await api.get<{ success: boolean; data: DashboardCounts }>(
          API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_COUNTS
        );
        if (countsResponse.data?.success) {
          setCounts(countsResponse.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard counts:', error);
      } finally {
        setLoading(false);
      }

      // Fetch recent jobs (API shape: { data: { jobPosts: [...] } })
      try {
        const jobsResponse = await api.get<{
          success: boolean;
          data: { jobPosts: RecentJob[] };
        }>(API_ENDPOINTS.SUPER_ADMIN.LIST_JOBS);

        if (jobsResponse.data?.success) {
          setRecentJobs(jobsResponse.data.data?.jobPosts?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to fetch recent jobs:', error);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isSuperAdmin]);

  // For recruiter
  const myJobs = isSuperAdmin ? jobPostings : jobPostings.filter(j => j.recruiterId === user?.id);
  const myApplications = isSuperAdmin ? applications : applications.filter(a => myJobs.some(j => j.id === a.jobId));
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const activeJobs = myJobs.filter(j => j.isActive && j.isApproved);

  const handleViewJob = () => {
    navigate('/dashboard/recruiters');
  };

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Welcome back, {user?.name}!</Title>
        <Text c="dimmed">{isSuperAdmin ? 'Super Admin Dashboard' : 'Recruiter Dashboard'}</Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        {isSuperAdmin ? (
          <>
            <StatCard 
              title="Total Recruiters" 
              value={counts?.totalRecruiters ?? '--'} 
              icon={<IconUsers size={20} color="#0078D4" />} 
              color="#0078D4" 
              loading={loading}
            />
            <StatCard 
              title="Total Job Postings" 
              value={counts?.totalJobPostings ?? '--'} 
              icon={<IconBriefcase size={20} color="#107C10" />} 
              color="#107C10" 
              loading={loading}
            />
            <StatCard 
              title="Pending Approvals" 
              value={counts?.pendingApproval ?? '--'} 
              icon={<IconClock size={20} color="#D83B01" />} 
              color="#D83B01" 
              loading={loading}
            />
            <StatCard 
              title="Total Applications" 
              value={applications.length} 
              icon={<IconFileText size={20} color="#8764B8" />} 
              color="#8764B8" 
            />
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
          {jobsLoading ? (
            <Stack gap="sm">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} height={50} />
              ))}
            </Stack>
          ) : (isSuperAdmin ? recentJobs : myJobs.slice(0, 5)).length === 0 ? (
            <Text c="dimmed" size="sm">No recent activity</Text>
          ) : (
            <Stack gap="sm">
              {(isSuperAdmin ? recentJobs : myJobs.slice(0, 5)).map((job: RecentJob) => (
                <Group 
                  key={job._id || job.id} 
                  justify="space-between" 
                  py="xs" 
                  style={{ borderBottom: '1px solid #e9ecef', cursor: 'pointer' }}
                  onClick={handleViewJob}
                >
                  <Box>
                    <Text size="sm" fw={500}>{job.title}</Text>
                    <Text size="xs" c="dimmed">{job.recruiterCompany || job.companyName || 'N/A'}</Text>
                  </Box>
                  <Group gap="xs">
                    <Badge 
                      color={
                        job.isApproved || job.status === 'approved' ? 'green' : 
                        job.isPaid || job.status === 'pending' ? 'yellow' : 'gray'
                      } 
                      variant="light" 
                      size="sm"
                    >
                      {job.isApproved || job.status === 'approved' ? 'Active' : 
                       job.isPaid || job.status === 'pending' ? 'Pending' : 'Draft'}
                    </Badge>
                    <IconEye size={16} color="#868e96" />
                  </Group>
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
