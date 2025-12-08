import React, { useState } from 'react';
import { Card, Text, Table, Badge, Button, Modal, Stack, Group } from '@mantine/core';
import { IconEye, IconBriefcase, IconCalendar } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { format } from 'date-fns';

const Recruiters: React.FC = () => {
  const { recruiters, jobPostings, getApplicationsByJobId } = useAppData();
  const [viewingRecruiter, setViewingRecruiter] = useState<any>(null);

  const getRecruiterStats = (recruiterId: string) => {
    const jobs = jobPostings.filter(j => j.recruiterId === recruiterId);
    const applications = jobs.reduce((sum, job) => sum + getApplicationsByJobId(job.id).length, 0);
    return { jobs: jobs.length, applications };
  };

  const getRecruiterJobs = (email: string) => {
    return jobPostings.filter(j => j.recruiterName.toLowerCase().includes(email.split('@')[0].toLowerCase()));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Text size="2xl" fw={700} className="text-foreground">Recruiters</Text>
        <Text c="dimmed">Manage and view all registered recruiters</Text>
      </div>

      <Card shadow="sm" padding="md" className="bg-card border border-border overflow-x-auto">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="text-foreground">Name</Table.Th>
              <Table.Th className="text-foreground">Email</Table.Th>
              <Table.Th className="text-foreground">Company</Table.Th>
              <Table.Th className="text-foreground">Job Postings</Table.Th>
              <Table.Th className="text-foreground">Applications</Table.Th>
              <Table.Th className="text-foreground">Joined</Table.Th>
              <Table.Th className="text-foreground">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {recruiters.map((recruiter) => {
              const stats = getRecruiterStats(recruiter.id);
              return (
                <Table.Tr key={recruiter.id}>
                  <Table.Td>
                    <Text fw={500} className="text-foreground">{recruiter.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{recruiter.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue">{recruiter.company}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <IconBriefcase size={16} className="text-muted-foreground" />
                      <Text size="sm">{stats.jobs}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{stats.applications}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {format(new Date(recruiter.createdAt), 'MMM dd, yyyy')}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() => setViewingRecruiter(recruiter)}
                      className="bg-accent text-accent-foreground"
                    >
                      View Details
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Recruiter Details Modal */}
      <Modal
        opened={!!viewingRecruiter}
        onClose={() => setViewingRecruiter(null)}
        title={<Text fw={600}>Recruiter Details</Text>}
        size="lg"
      >
        {viewingRecruiter && (
          <Stack gap="lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text size="sm" c="dimmed">Name</Text>
                <Text fw={500}>{viewingRecruiter.name}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Email</Text>
                <Text fw={500}>{viewingRecruiter.email}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Company</Text>
                <Text fw={500}>{viewingRecruiter.company}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Joined</Text>
                <Text fw={500}>{format(new Date(viewingRecruiter.createdAt), 'MMM dd, yyyy')}</Text>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Text fw={600} mb="md">Job Postings</Text>
              {getRecruiterJobs(viewingRecruiter.email).length === 0 ? (
                <Text c="dimmed" size="sm">No job postings yet</Text>
              ) : (
                <Stack gap="sm">
                  {getRecruiterJobs(viewingRecruiter.email).map(job => (
                    <Card key={job.id} padding="sm" className="bg-secondary">
                      <Group justify="space-between">
                        <div>
                          <Text fw={500} size="sm">{job.title}</Text>
                          <Text size="xs" c="dimmed">{job.location}</Text>
                        </div>
                        <Badge 
                          color={job.isActive && job.isApproved ? 'green' : 'gray'}
                          variant="light"
                          size="sm"
                        >
                          {job.isActive && job.isApproved ? 'Active' : 'Inactive'}
                        </Badge>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </div>
          </Stack>
        )}
      </Modal>
    </div>
  );
};

export default Recruiters;
