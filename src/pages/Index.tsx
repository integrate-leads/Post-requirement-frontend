import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Text, Badge } from '@mantine/core';
import { 
  IconBriefcase, 
  IconUsers, 
  IconSearch, 
  IconShieldCheck, 
  IconRocket,
  IconClock,
  IconArrowRight
} from '@tabler/icons-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-accent to-background py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="light" color="blue" size="lg" mb="lg" className="bg-primary/10 text-primary">
              #1 Recruitment Platform
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Streamline Your <span className="text-primary">Hiring Process</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Connect with top talent effortlessly. Post job requirements, screen candidates, 
              and manage applications all in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button 
                  size="lg" 
                  rightSection={<IconArrowRight size={18} />}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </Button>
              </Link>
              <Link to="/jobs">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Browse Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive recruitment solutions tailored for modern businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card shadow="sm" padding="lg" radius="md" className="border border-border bg-card hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <IconBriefcase size={24} className="text-primary" />
              </div>
              <Text fw={600} size="lg" mb="sm" className="text-card-foreground">
                Post Requirements
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Create detailed job postings with custom screening questions. 
                Reach qualified candidates instantly.
              </Text>
              <Badge color="green" variant="light">Available Now</Badge>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" className="border border-border bg-card opacity-75">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <IconSearch size={24} className="text-muted-foreground" />
              </div>
              <Text fw={600} size="lg" mb="sm" className="text-card-foreground">
                Resume Database
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Access our extensive database of pre-screened candidates 
                matching your requirements.
              </Text>
              <Badge color="gray" variant="light">Coming Soon</Badge>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" className="border border-border bg-card opacity-75">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <IconUsers size={24} className="text-muted-foreground" />
              </div>
              <Text fw={600} size="lg" mb="sm" className="text-card-foreground">
                Candidate Screening
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                AI-powered screening to shortlist the best candidates 
                based on your criteria.
              </Text>
              <Badge color="gray" variant="light">Coming Soon</Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose RecruitPro?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconRocket size={28} className="text-primary" />
              </div>
              <Text fw={600} mb="xs" className="text-foreground">Fast & Efficient</Text>
              <Text size="sm" c="dimmed">Post jobs and receive applications within minutes</Text>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconShieldCheck size={28} className="text-primary" />
              </div>
              <Text fw={600} mb="xs" className="text-foreground">Verified Candidates</Text>
              <Text size="sm" c="dimmed">All applicants are screened and verified</Text>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconClock size={28} className="text-primary" />
              </div>
              <Text fw={600} mb="xs" className="text-foreground">Flexible Posting</Text>
              <Text size="sm" c="dimmed">Choose posting duration from 1 to 30 days</Text>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconUsers size={28} className="text-primary" />
              </div>
              <Text fw={600} mb="xs" className="text-foreground">Wide Reach</Text>
              <Text size="sm" c="dimmed">Access thousands of job seekers daily</Text>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">About Us</h2>
            <p className="text-muted-foreground mb-6">
              RecruitPro is a modern recruitment platform designed to bridge the gap between 
              talented job seekers and forward-thinking employers. We understand the challenges 
              of hiring in today's competitive market, and we've built a solution that makes 
              the process seamless for everyone involved.
            </p>
            <p className="text-muted-foreground mb-8">
              Our mission is to simplify recruitment by providing powerful tools that help 
              recruiters find the right candidates quickly, while giving job seekers access 
              to opportunities that match their skills and aspirations.
            </p>
            <Link to="/login">
              <Button 
                size="md"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start Recruiting Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Find Your Next Great Hire?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of recruiters who trust RecruitPro for their hiring needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button 
                size="lg" 
                variant="white"
                className="bg-background text-primary hover:bg-background/90"
              >
                Get Started Free
              </Button>
            </Link>
            <Link to="/jobs">
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                View Open Positions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
