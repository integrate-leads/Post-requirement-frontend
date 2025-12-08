import React, { useState } from 'react';
import { Card, Text, Table, Badge, Button, Modal, Stack, Group, Box, Title, SimpleGrid } from '@mantine/core';
import { IconEye, IconBriefcase } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { format } from 'date-fns';

const Recruiters: React.FC = () => {
  const { recruiters, jobPostings, getApplicationsByJobId } = useAppData();
  const [viewingRecruiter, setViewingRecruiter] = useState<any>(null);

  const getRecruiterStats = (recruiterId: string) => { const jobs = jobPostings.filter(j => j.recruiterId === recruiterId); return { jobs: jobs.length, applications: jobs.reduce((sum, job) => sum + getApplicationsByJobId(job.id).length, 0) }; };
  const getRecruiterJobs = (email: string) => jobPostings.filter(j => j.recruiterName.toLowerCase().includes(email.split('@')[0].toLowerCase()));

  return (
    <Box maw={1200} mx="auto">
      <Box mb="xl"><Title order={2}>Recruiters</Title><Text c="dimmed">Manage and view all registered recruiters</Text></Box>

      <Card shadow="sm" padding="md" withBorder style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Email</Table.Th><Table.Th>Company</Table.Th><Table.Th>Job Postings</Table.Th><Table.Th>Applications</Table.Th><Table.Th>Joined</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>
            {recruiters.map((recruiter) => {
              const stats = getRecruiterStats(recruiter.id);
              return (
                <Table.Tr key={recruiter.id}>
                  <Table.Td><Text fw={500}>{recruiter.name}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{recruiter.email}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{recruiter.company}</Badge></Table.Td>
                  <Table.Td><Group gap="xs"><IconBriefcase size={16} color="#868e96" /><Text size="sm">{stats.jobs}</Text></Group></Table.Td>
                  <Table.Td><Text size="sm">{stats.applications}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{format(new Date(recruiter.createdAt), 'MMM dd, yyyy')}</Text></Table.Td>
                  <Table.Td><Button size="xs" variant="light" leftSection={<IconEye size={14} />} onClick={() => setViewingRecruiter(recruiter)}>View Details</Button></Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={!!viewingRecruiter} onClose={() => setViewingRecruiter(null)} title={<Text fw={600}>Recruiter Details</Text>} size="lg">
        {viewingRecruiter && (
          <Stack gap="lg">
            <SimpleGrid cols={2}><Box><Text size="sm" c="dimmed">Name</Text><Text fw={500}>{viewingRecruiter.name}</Text></Box><Box><Text size="sm" c="dimmed">Email</Text><Text fw={500}>{viewingRecruiter.email}</Text></Box><Box><Text size="sm" c="dimmed">Company</Text><Text fw={500}>{viewingRecruiter.company}</Text></Box><Box><Text size="sm" c="dimmed">Joined</Text><Text fw={500}>{format(new Date(viewingRecruiter.createdAt), 'MMM dd, yyyy')}</Text></Box></SimpleGrid>
            <Box pt="md" style={{ borderTop: '1px solid #e9ecef' }}><Text fw={600} mb="md">Job Postings</Text>
              {getRecruiterJobs(viewingRecruiter.email).length === 0 ? <Text c="dimmed" size="sm">No job postings yet</Text> : (
                <Stack gap="sm">{getRecruiterJobs(viewingRecruiter.email).map(job => <Card key={job.id} padding="sm" bg="gray.0"><Group justify="space-between"><Box><Text fw={500} size="sm">{job.title}</Text><Text size="xs" c="dimmed">{job.location}</Text></Box><Badge color={job.isActive && job.isApproved ? 'green' : 'gray'} variant="light" size="sm">{job.isActive && job.isApproved ? 'Active' : 'Inactive'}</Badge></Group></Card>)}</Stack>
              )}
            </Box>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

export default Recruiters;