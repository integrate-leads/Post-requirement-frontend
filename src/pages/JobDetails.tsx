import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Text, Badge, Button, TextInput, Textarea, FileInput, Stack, Alert, Group } from '@mantine/core';
import { IconMapPin, IconBriefcase, IconClock, IconArrowLeft, IconCheck, IconUpload } from '@tabler/icons-react';
import { useAppData } from '@/contexts/AppDataContext';
import { formatDistanceToNow, format } from 'date-fns';

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getJobById, addApplication } = useAppData();
  const job = getJobById(id || '');

  const [isApplying, setIsApplying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [resume, setResume] = useState<File | null>(null);

  if (!job) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Card shadow="sm" padding="xl" className="text-center bg-card">
          <Text size="lg" fw={600} mb="md">Job not found</Text>
          <Link to="/jobs">
            <Button variant="light" leftSection={<IconArrowLeft size={16} />}>
              Back to Jobs
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleInputChange = (question: string, value: string) => {
    setFormData(prev => ({ ...prev, [question]: value }));
  };

  const handleSubmit = () => {
    addApplication({
      jobId: job.id,
      applicantName: formData['Full Name'] || formData['Name'] || 'Unknown',
      applicantEmail: formData['Email Address'] || formData['Email'] || '',
      applicantPhone: formData['Phone Number'] || formData['Phone'] || '',
      answers: formData,
      resumeUrl: resume ? URL.createObjectURL(resume) : undefined,
    });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-secondary py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card shadow="sm" padding="xl" className="text-center bg-card">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconCheck size={32} className="text-success" />
            </div>
            <Text size="xl" fw={600} mb="sm">Application Submitted!</Text>
            <Text c="dimmed" mb="lg">
              Thank you for applying. The recruiter will review your application and get back to you soon.
            </Text>
            <Link to="/jobs">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Browse More Jobs
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="container mx-auto px-4">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <IconArrowLeft size={18} />
          Back to Jobs
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Job Details */}
          <div className="lg:col-span-2">
            <Card shadow="sm" padding="xl" className="bg-card mb-6">
              <Group justify="space-between" mb="md">
                <div>
                  <Text size="xl" fw={700} className="text-foreground" mb="xs">
                    {job.title}
                  </Text>
                  <Text size="lg" c="dimmed">{job.recruiterCompany}</Text>
                </div>
                {job.salary && (
                  <Badge size="lg" color="green" variant="light">
                    {job.salary}
                  </Badge>
                )}
              </Group>

              <Group gap="lg" mb="lg">
                <Group gap="xs">
                  <IconMapPin size={18} className="text-muted-foreground" />
                  <Text size="sm">{job.location}</Text>
                </Group>
                <Group gap="xs">
                  <IconClock size={18} className="text-muted-foreground" />
                  <Text size="sm">
                    Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconBriefcase size={18} className="text-muted-foreground" />
                  <Text size="sm">
                    Expires {format(new Date(job.expiresAt), 'MMM dd, yyyy')}
                  </Text>
                </Group>
              </Group>

              <div className="border-t border-border pt-6">
                <Text fw={600} size="lg" mb="md">Job Description</Text>
                <Text className="whitespace-pre-wrap text-foreground">{job.description}</Text>
              </div>

              {job.requirements && (
                <div className="border-t border-border pt-6 mt-6">
                  <Text fw={600} size="lg" mb="md">Requirements</Text>
                  <Text className="whitespace-pre-wrap text-foreground">{job.requirements}</Text>
                </div>
              )}
            </Card>
          </div>

          {/* Apply Form */}
          <div>
            <Card shadow="sm" padding="lg" className="bg-card sticky top-24">
              {!isApplying ? (
                <div className="text-center">
                  <Text fw={600} size="lg" mb="md">Interested in this role?</Text>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => setIsApplying(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Apply Now
                  </Button>
                </div>
              ) : (
                <>
                  <Text fw={600} size="lg" mb="md">Apply for this position</Text>
                  <Stack gap="md">
                    {job.selectedQuestions.map((question) => (
                      <div key={question}>
                        {question.includes('?') || question.length > 40 ? (
                          <Textarea
                            label={question}
                            placeholder={`Enter ${question.toLowerCase()}`}
                            value={formData[question] || ''}
                            onChange={(e) => handleInputChange(question, e.target.value)}
                            required
                            classNames={{
                              input: 'bg-background border-input focus:border-primary',
                              label: 'text-foreground text-sm'
                            }}
                          />
                        ) : (
                          <TextInput
                            label={question}
                            placeholder={`Enter ${question.toLowerCase()}`}
                            value={formData[question] || ''}
                            onChange={(e) => handleInputChange(question, e.target.value)}
                            required
                            classNames={{
                              input: 'bg-background border-input focus:border-primary',
                              label: 'text-foreground text-sm'
                            }}
                          />
                        )}
                      </div>
                    ))}

                    <FileInput
                      label="Upload Resume/CV"
                      placeholder="Click to upload"
                      leftSection={<IconUpload size={16} />}
                      value={resume}
                      onChange={setResume}
                      accept=".pdf,.doc,.docx"
                      classNames={{
                        input: 'bg-background border-input focus:border-primary',
                        label: 'text-foreground text-sm'
                      }}
                    />

                    <Button
                      fullWidth
                      onClick={handleSubmit}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Submit Application
                    </Button>
                  </Stack>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
