import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Text, Badge, Button, TextInput, Select, Group } from '@mantine/core';
import { IconSearch, IconMapPin, IconBriefcase, IconClock } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { formatDistanceToNow } from 'date-fns';

const Jobs: React.FC = () => {
  const { jobPostings } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  const activeJobs = jobPostings.filter(
    job => job.isActive && job.isApproved && job.isPaid && new Date(job.expiresAt) > new Date()
  );

  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || job.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const uniqueLocations = [...new Set(activeJobs.map(job => job.location))];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Search Header */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary-foreground text-center mb-8">
            Find Your Dream Job
          </h1>
          
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <TextInput
                placeholder="Search jobs by title or keyword..."
                leftSection={<IconSearch size={18} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                size="lg"
                classNames={{
                  input: 'bg-background border-none'
                }}
              />
              <Select
                placeholder="Location"
                leftSection={<IconMapPin size={18} />}
                data={uniqueLocations}
                value={locationFilter}
                onChange={setLocationFilter}
                clearable
                size="lg"
                className="md:w-48"
                classNames={{
                  input: 'bg-background border-none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="container mx-auto px-4 py-8">
        {filteredJobs.length === 0 ? (
          <Card shadow="sm" padding="xl" className="text-center bg-card">
            <IconBriefcase size={48} className="mx-auto mb-4 text-muted-foreground" />
            <Text size="lg" fw={600} className="text-foreground" mb="sm">
              No jobs available
            </Text>
            <Text c="dimmed">
              {searchQuery || locationFilter 
                ? 'Try adjusting your search filters'
                : 'Check back later for new opportunities'}
            </Text>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <Text c="dimmed">{filteredJobs.length} jobs found</Text>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} shadow="sm" padding="lg" className="bg-card border border-border hover:border-primary/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <Group gap="sm" mb="xs">
                        <Text size="lg" fw={600} className="text-foreground">
                          {job.title}
                        </Text>
                        <Badge color="blue" variant="light">
                          {job.daysActive} days left
                        </Badge>
                      </Group>

                      <Group gap="lg" mb="sm">
                        <Group gap="xs">
                          <IconBriefcase size={16} className="text-muted-foreground" />
                          <Text size="sm" c="dimmed">{job.recruiterCompany}</Text>
                        </Group>
                        <Group gap="xs">
                          <IconMapPin size={16} className="text-muted-foreground" />
                          <Text size="sm" c="dimmed">{job.location}</Text>
                        </Group>
                        <Group gap="xs">
                          <IconClock size={16} className="text-muted-foreground" />
                          <Text size="sm" c="dimmed">
                            Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                          </Text>
                        </Group>
                      </Group>

                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {job.description}
                      </Text>
                    </div>

                    <div className="flex flex-col gap-2">
                      {job.salary && (
                        <Badge size="lg" variant="light" color="green">
                          {job.salary}
                        </Badge>
                      )}
                      <Link to={`/jobs/${job.id}`}>
                        <Button 
                          fullWidth
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          View & Apply
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Jobs;
