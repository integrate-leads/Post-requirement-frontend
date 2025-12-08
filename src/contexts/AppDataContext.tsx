import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface JobPosting {
  id: string;
  recruiterId: string;
  recruiterName: string;
  recruiterCompany: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary?: string;
  selectedQuestions: string[];
  daysActive: number;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  isPaid: boolean;
  isApproved: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  answers: Record<string, string>;
  resumeUrl?: string;
  submittedAt: Date;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'service' | 'job_posting' | 'renewal' | 'view_more';
  serviceId?: string;
  jobId?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface Recruiter {
  id: string;
  email: string;
  name: string;
  company: string;
  approvedServices: string[];
  createdAt: Date;
}

interface AppDataContextType {
  jobPostings: JobPosting[];
  applications: Application[];
  paymentRequests: PaymentRequest[];
  recruiters: Recruiter[];
  addJobPosting: (job: Omit<JobPosting, 'id' | 'createdAt' | 'expiresAt'>) => string;
  addApplication: (app: Omit<Application, 'id' | 'submittedAt'>) => void;
  addPaymentRequest: (req: Omit<PaymentRequest, 'id' | 'createdAt' | 'status'>) => string;
  approvePayment: (id: string) => void;
  rejectPayment: (id: string) => void;
  getJobById: (id: string) => JobPosting | undefined;
  getApplicationsByJobId: (jobId: string) => Application[];
  getJobsByRecruiterId: (recruiterId: string) => JobPosting[];
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Available questions for job postings
export const AVAILABLE_QUESTIONS = [
  'Full Name',
  'Email Address',
  'Phone Number',
  'Current Location',
  'Willing to Relocate?',
  'Years of Experience',
  'Current Company',
  'Current Designation',
  'Expected Salary',
  'Current Salary',
  'Notice Period',
  'Highest Education',
  'University/College',
  'Year of Graduation',
  'Skills',
  'Certifications',
  'Languages Known',
  'LinkedIn Profile',
  'Portfolio/GitHub URL',
  'Why do you want to join?',
  'Availability for Interview',
  'Preferred Work Mode',
  'Do you have a valid passport?',
  'Visa Status',
  'Reference Contact 1',
  'Reference Contact 2',
  'Previous Employers',
  'Reason for Leaving Current Job',
  'Career Goals',
  'Achievements',
  'Are you currently employed?',
  'Can you work in shifts?',
  'Do you have a vehicle?',
  'Emergency Contact',
  'Date of Birth',
  'Gender',
  'Marital Status',
  'Address',
  'Pincode',
  'State',
  'Country',
  'PAN Number',
  'Aadhaar Number',
  'Passport Number',
  'Driving License',
  'Blood Group',
  'Medical Conditions',
  'Hobbies',
  'Strengths',
  'Weaknesses',
  'Technical Skills',
  'Soft Skills',
  'Project Experience',
  'Team Size Handled',
  'Budget Managed',
  'Awards Received',
  'Publications',
  'Patents',
  'Volunteer Experience',
  'Professional Memberships',
  'Conferences Attended',
];

// Pricing
export const PRICING = {
  1: 99,
  2: 179,
  5: 399,
  10: 699,
  15: 899,
  30: 1499,
} as const;

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [recruiters] = useState<Recruiter[]>([
    {
      id: '1',
      email: 'recruiter@company.com',
      name: 'John Doe',
      company: 'Tech Corp',
      approvedServices: [],
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      email: 'hr@startup.com',
      name: 'Jane Smith',
      company: 'StartUp Inc',
      approvedServices: [],
      createdAt: new Date('2024-02-20'),
    },
  ]);

  const addJobPosting = (job: Omit<JobPosting, 'id' | 'createdAt' | 'expiresAt'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + job.daysActive * 24 * 60 * 60 * 1000);
    
    setJobPostings(prev => [...prev, { ...job, id, createdAt, expiresAt }]);
    return id;
  };

  const addApplication = (app: Omit<Application, 'id' | 'submittedAt'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setApplications(prev => [...prev, { ...app, id, submittedAt: new Date() }]);
  };

  const addPaymentRequest = (req: Omit<PaymentRequest, 'id' | 'createdAt' | 'status'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setPaymentRequests(prev => [...prev, { ...req, id, createdAt: new Date(), status: 'pending' }]);
    return id;
  };

  const approvePayment = (id: string) => {
    setPaymentRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'approved' as const } : req
    ));
    
    const request = paymentRequests.find(r => r.id === id);
    if (request?.type === 'job_posting' && request.jobId) {
      setJobPostings(prev => prev.map(job =>
        job.id === request.jobId ? { ...job, isPaid: true, isApproved: true, isActive: true } : job
      ));
    }
  };

  const rejectPayment = (id: string) => {
    setPaymentRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'rejected' as const } : req
    ));
  };

  const getJobById = (id: string) => jobPostings.find(j => j.id === id);
  
  const getApplicationsByJobId = (jobId: string) => applications.filter(a => a.jobId === jobId);
  
  const getJobsByRecruiterId = (recruiterId: string) => jobPostings.filter(j => j.recruiterId === recruiterId);

  return (
    <AppDataContext.Provider value={{
      jobPostings,
      applications,
      paymentRequests,
      recruiters,
      addJobPosting,
      addApplication,
      addPaymentRequest,
      approvePayment,
      rejectPayment,
      getJobById,
      getApplicationsByJobId,
      getJobsByRecruiterId,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
