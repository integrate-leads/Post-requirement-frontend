import React, { useEffect, useState } from 'react';
import { Card, Text, Group, SimpleGrid, RingProgress, Badge, Box, Title, Stack, Skeleton } from '@mantine/core';
import { 
  IconBriefcase, 
  IconUsers, 
  IconClock, 
  IconFileText,
  IconCreditCard,
  IconEye,
  IconCheck
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

interface SuperAdminDashboardCounts {
  totalRecruiters: number;
  totalJobPostings: number;
  pendingApproval: number;
}

interface AdminDashboardCounts {
  totalJobPostings: number;
  activeJobPostings: number;
  totalApplications: number;
  pendingPayments: number;
  activeApplications: number;
}

interface AdminProfile {
  id: number;
  name: string;
  email: string;
  mobile: string;
  profileImage: string | null;
  status: string;
  companyName: string;
  companyWebsite: string;
  address: string;
  idProof: string[];
  emailVerified: string;
}

interface RecentJob {
  id: number;
  _id?: string;
  title: string;
  recruiterCompany?: string;
  companyName?: string;
  isApproved?: boolean;
  isPaid?: boolean;
  status?: string;
  isVerified?: string;
  paymentStatus?: string;
  admin?: {
    companyName?: string;
  };
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
  const { user, isSuperAdmin } = useAuth();
  const { jobPostings, applications, paymentRequests } = useAppData();
  const navigate = useNavigate();
  
  const [superAdminCounts, setSuperAdminCounts] = useState<SuperAdminDashboardCounts | null>(null);
  const [adminCounts, setAdminCounts] = useState<AdminDashboardCounts | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setJobsLoading(true);

      if (isSuperAdmin) {
        // Super Admin API calls
        try {
          const countsResponse = await api.get<{ success: boolean; data: SuperAdminDashboardCounts }>(
            API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_COUNTS
          );
          if (countsResponse.data?.success) {
            setSuperAdminCounts(countsResponse.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch super admin dashboard counts:', error);
        } finally {
          setLoading(false);
        }

        // Fetch recent jobs for Recent Activity section
        try {
          const jobsResponse = await api.get<{
            success: boolean;
            data: { jobPosts: RecentJob[] };
          }>(`${API_ENDPOINTS.SUPER_ADMIN.LIST_JOBS}?page=1&limit=5`);

          if (jobsResponse.data?.success) {
            setRecentJobs(jobsResponse.data.data?.jobPosts || []);
          }
        } catch (error) {
          console.error('Failed to fetch recent jobs:', error);
        } finally {
          setJobsLoading(false);
        }
      } else {
        // Admin/Recruiter - Fetch profile for name
        try {
          const profileResponse = await api.get<{ success: boolean; data: AdminProfile }>(
            API_ENDPOINTS.ADMIN.GET_PROFILE
          );
          if (profileResponse.data?.success) {
            setAdminProfile(profileResponse.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch admin profile:', error);
        }

        // Admin/Recruiter API calls
        try {
          const countsResponse = await api.get<{ success: boolean; data: AdminDashboardCounts }>(
            API_ENDPOINTS.ADMIN.DASHBOARD_COUNTS
          );
          if (countsResponse.data?.success) {
            setAdminCounts(countsResponse.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch admin dashboard counts:', error);
        } finally {
          setLoading(false);
        }

        // Fetch recent jobs for Recent Activity section
        try {
          const jobsResponse = await api.get<{
            success: boolean;
            data: { jobs: RecentJob[] };
          }>(API_ENDPOINTS.ADMIN.JOB_POSTS(1, 5));

          if (jobsResponse.data?.success) {
            setRecentJobs(jobsResponse.data.data?.jobs || []);
          }
        } catch (error) {
          console.error('Failed to fetch recent jobs:', error);
        } finally {
          setJobsLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [isSuperAdmin]);

  // For recruiter - fallback to local data
  const myJobs = isSuperAdmin ? jobPostings : jobPostings.filter(j => j.recruiterId === user?.id);
  const myApplications = isSuperAdmin ? applications : applications.filter(a => myJobs.some(j => j.id === a.jobId));
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');

  const handleViewJob = () => {
    navigate(isSuperAdmin ? '/super-admin/recruiters' : '/recruiter/my-jobs');
  };

  // Get display name from API or fallback
  const displayName = adminProfile?.name || user?.name || 'User';

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl">
        <Title order={2}>Welcome back, {displayName}!</Title>
        <Text c="dimmed">{isSuperAdmin ? 'Super Admin Dashboard' : 'Recruiter Dashboard'}</Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: isSuperAdmin ? 4 : 3 }} spacing="md" mb="xl">
        {isSuperAdmin ? (
          <>
            <StatCard 
              title="Total Recruiters" 
              value={superAdminCounts?.totalRecruiters ?? '--'} 
              icon={<IconUsers size={20} color="#0078D4" />} 
              color="#0078D4" 
              loading={loading}
            />
            <StatCard 
              title="Total Job Postings" 
              value={superAdminCounts?.totalJobPostings ?? '--'} 
              icon={<IconBriefcase size={20} color="#107C10" />} 
              color="#107C10" 
              loading={loading}
            />
            <StatCard 
              title="Pending Approvals" 
              value={superAdminCounts?.pendingApproval ?? '--'} 
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
            <StatCard 
              title="Total Job Postings" 
              value={adminCounts?.totalJobPostings ?? '--'} 
              icon={<IconBriefcase size={20} color="#0078D4" />} 
              color="#0078D4" 
              loading={loading}
            />
            <StatCard 
              title="Active Job Postings" 
              value={adminCounts?.activeJobPostings ?? '--'} 
              icon={<IconCheck size={20} color="#107C10" />} 
              color="#107C10" 
              loading={loading}
            />
            <StatCard 
              title="Total Applications" 
              value={adminCounts?.totalApplications ?? '--'} 
              icon={<IconFileText size={20} color="#8764B8" />} 
              color="#8764B8" 
              loading={loading}
            />
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
          ) : recentJobs.length === 0 ? (
            <Text c="dimmed" size="sm">No recent activity</Text>
          ) : (
            <Stack gap="sm">
              {recentJobs.map((job) => (
                <Group 
                  key={job._id || job.id} 
                  justify="space-between" 
                  py="xs" 
                  style={{ borderBottom: '1px solid #e9ecef', cursor: 'pointer' }}
                  onClick={handleViewJob}
                >
                  <Box>
                    <Text size="sm" fw={500}>{job.title}</Text>
                    <Text size="xs" c="dimmed">{job.admin?.companyName || job.recruiterCompany || job.companyName || 'N/A'}</Text>
                  </Box>
                  <Group gap="xs">
                    <Badge 
                      color={
                        job.isVerified === 'Approved' || job.status === 'Active' ? 'green' : 
                        job.isVerified === 'Pending' || job.paymentStatus === 'Pending' ? 'yellow' : 'gray'
                      } 
                      variant="light" 
                      size="sm"
                    >
                      {job.isVerified === 'Approved' || job.status === 'Active' ? 'Active' : 
                       job.isVerified === 'Pending' ? 'Pending' : job.status || 'Draft'}
                    </Badge>
                    <IconEye size={16} color="#868e96" />
                  </Group>
                </Group>
              ))}
            </Stack>
          )}
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Text fw={600} size="lg" mb="md">{isSuperAdmin ? 'Payment Status' : 'Application Status'}</Text>
          <Group justify="center" py="md">
            <RingProgress
              size={180}
              thickness={20}
              sections={isSuperAdmin ? [
                { value: (paymentRequests.filter(p => p.status === 'approved').length / Math.max(paymentRequests.length, 1)) * 100, color: 'green' },
                { value: (pendingPayments.length / Math.max(paymentRequests.length, 1)) * 100, color: 'yellow' },
                { value: (paymentRequests.filter(p => p.status === 'rejected').length / Math.max(paymentRequests.length, 1)) * 100, color: 'red' },
              ] : [
                { value: adminCounts?.totalJobPostings ? ((adminCounts.activeJobPostings / adminCounts.totalJobPostings) * 100) : 0, color: 'green' },
                { value: adminCounts?.totalJobPostings ? (((adminCounts.totalJobPostings - adminCounts.activeJobPostings) / adminCounts.totalJobPostings) * 100) : 0, color: 'blue' },
              ]}
              label={
                <Box ta="center">
                  <Text size="xl" fw={700}>{isSuperAdmin ? paymentRequests.length : adminCounts?.totalJobPostings ?? 0}</Text>
                  <Text size="xs" c="dimmed">{isSuperAdmin ? 'Total Payments' : 'Total Jobs'}</Text>
                </Box>
              }
            />
          </Group>
          {isSuperAdmin && (
            <Group justify="center" gap="xl" mt="md">
              <Group gap="xs">
                <Box w={12} h={12} bg="green" style={{ borderRadius: '50%' }} />
                <Text size="sm">Approved: {paymentRequests.filter(p => p.status === 'approved').length}</Text>
              </Group>
              <Group gap="xs">
                <Box w={12} h={12} bg="yellow" style={{ borderRadius: '50%' }} />
                <Text size="sm">Pending: {pendingPayments.length}</Text>
              </Group>
              <Group gap="xs">
                <Box w={12} h={12} bg="red" style={{ borderRadius: '50%' }} />
                <Text size="sm">Rejected: {paymentRequests.filter(p => p.status === 'rejected').length}</Text>
              </Group>
            </Group>
          )}
          {!isSuperAdmin && adminCounts && (
            <Group justify="center" gap="xl" mt="md">
              <Group gap="xs">
                <Box w={12} h={12} bg="green" style={{ borderRadius: '50%' }} />
                <Text size="sm">Active: {adminCounts.activeJobPostings}</Text>
              </Group>
              <Group gap="xs">
                <Box w={12} h={12} bg="blue" style={{ borderRadius: '50%' }} />
                <Text size="sm">Inactive: {adminCounts.totalJobPostings - adminCounts.activeJobPostings}</Text>
              </Group>
            </Group>
          )}
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;
