import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface JobPosting {
  id: string;
  recruiterId: string;
  recruiterName: string;
  recruiterCompany: string;
  title: string;
  description: string;
  workLocationCountry: 'USA' | 'India';
  workLocation: string;
  jobType: string;
  paymentType: string;
  payRate: string;
  domainKnowledge: string;
  mustHaveSkills: string;
  primarySkills: string;
  niceToHaveSkills: string;
  rolesResponsibilities: string;
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

// Application question categories
export const APPLICATION_QUESTIONS = {
  personalInfo: {
    label: 'Personal Information',
    questions: [
      'Full Name',
      'Contact Number',
      'Email ID',
      'Current Location',
      'Are you fine with Relocation?',
      'Last 4 Digit SSN (USA)',
      'LinkedIn ID',
      'Are you Authorized to work in USA? (USA)',
      'Current Visa Status (USA)',
      'Are you comfortable sharing Travel history? (USA)',
      'Are you comfortable sharing Passport Number? (USA)',
      'Best time to Answer phone call',
      'Are you fine with Video Interview?',
      'Notice Period for Video Interview',
      'Mention two convenient time Slots',
      'Are you fine with Face to Face interview?',
      'Heads-up required for Video Interview',
      'Expenses covered by client?',
    ],
  },
  workExperience: {
    label: 'Work & Experience Details',
    questions: [
      'Total Years of Experience',
      'Relevant Years of Experience (as per JD)',
      'Current Job Title',
      'Manager Name (Reference)',
      'Manager Mobile Number (Reference)',
      'Manager Email ID (Reference)',
      'Do you have Employer?',
      'Current Employer / Payroll Company',
      'Employer Company Name',
      'Employer Manager Name',
      'Employer Email ID',
      'Employer Contact Number',
      'Previous Employment Details',
      'Currently in project?',
      'Are you serving Notice Period?',
      'Notice Period to Join',
      'Last Working Day (if serving notice)',
      'Current Job Type',
    ],
  },
  technicalDetails: {
    label: 'Technical Details',
    questions: [
      'Primary Skills',
      'Secondary Skills',
      'Certifications',
      'Tools/Technologies Used',
      'Domain Experience',
      'Current Project Details',
      'Tech Stack - Hands-on or Theory only',
    ],
  },
  documentation: {
    label: 'Resume & Documentation',
    questions: [
      'Updated Resume (Mandatory)',
      'PAN Card (for background check)',
      'Aadhaar Card (for verification)',
      'Highest Education Details',
      'Payslips (Optional)',
      'Relieving Letter / Experience Letter',
    ],
  },
  employmentAvailability: {
    label: 'Employment Type & Availability',
    questions: [
      'Open to Permanent?',
      'Open to C2H?',
      'Open to Contract?',
      'Current Notice Period',
      'Earliest Joining Date',
      'Availability for Interview',
    ],
  },
  compensation: {
    label: 'Salary / Compensation Details',
    questions: [
      'Current CTC (Fixed + Variable)',
      'Expected CTC',
      'Minimum Acceptable CTC',
      'Reason for Job Change',
      'Any offers in hand?',
      'Buy-out option available?',
    ],
  },
  workPreferences: {
    label: 'Work Preferences',
    questions: [
      'Preferred Work Mode',
      'Shift Preference',
      'Open to Relocating?',
    ],
  },
  backgroundCheck: {
    label: 'Background Check & Compliance',
    questions: [
      'Willingness for Background Verification?',
      'Notice Period Negotiation Possible?',
      'Employment Gaps (if any)',
    ],
  },
  additionalInfo: {
    label: 'Additional Information',
    questions: [
      'Languages Known - Speak',
      'Languages Known - Read',
      'Languages Known - Write',
      'Expected Role or Job Title',
      'Open to Travelling for Work?',
      'Portfolio/GitHub URL',
    ],
  },
};

// Flatten all questions for easy access
export const ALL_APPLICATION_QUESTIONS = Object.values(APPLICATION_QUESTIONS).flatMap(
  (category) => category.questions
);

// Job type options
export const JOB_TYPES = ['Full Time', 'Contract', 'Contract to Hire', 'Freelancing'];

// Payment type options
export const PAYMENT_TYPES = ['Pay to Pay', 'Net 45 Days', 'Net 60 Days', 'Pay as you go'];

// Work location countries
export const WORK_COUNTRIES = ['USA', 'India'];

// Pricing
export const PRICING = {
  1: 99,
  2: 179,
  5: 399,
  10: 699,
  15: 899,
  30: 1499,
} as const;

// Dummy job data
const DUMMY_JOBS: JobPosting[] = [
  {
    id: 'demo-job-1',
    recruiterId: 'demo-recruiter',
    recruiterName: 'Sarah Johnson',
    recruiterCompany: 'TechVision Solutions',
    title: 'Senior React Developer',
    description: 'We are looking for an experienced React Developer to join our dynamic team. You will be working on cutting-edge web applications using modern technologies.',
    workLocationCountry: 'USA',
    workLocation: 'San Francisco, CA (Hybrid)',
    jobType: 'Full Time',
    paymentType: 'Net 45 Days',
    payRate: '$80 - $100/hour',
    domainKnowledge: 'FinTech, E-commerce',
    mustHaveSkills: 'React.js, TypeScript, Redux, Node.js',
    primarySkills: 'React.js, TypeScript, JavaScript ES6+',
    niceToHaveSkills: 'GraphQL, AWS, Docker, Kubernetes',
    rolesResponsibilities: '• Design and develop high-quality React applications\n• Collaborate with cross-functional teams\n• Code review and mentoring junior developers\n• Participate in agile ceremonies\n• Ensure application performance and optimization',
    selectedQuestions: [
      'Full Name',
      'Contact Number',
      'Email ID',
      'Current Location',
      'Are you fine with Relocation?',
      'Total Years of Experience',
      'Relevant Years of Experience (as per JD)',
      'Current Job Title',
      'Primary Skills',
      'Current CTC (Fixed + Variable)',
      'Expected CTC',
      'Current Notice Period',
      'Preferred Work Mode',
      'Updated Resume (Mandatory)',
    ],
    daysActive: 30,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    isActive: true,
    isPaid: true,
    isApproved: true,
  },
  {
    id: 'demo-job-2',
    recruiterId: 'demo-recruiter-2',
    recruiterName: 'Rahul Sharma',
    recruiterCompany: 'Innovate Tech India',
    title: 'Full Stack Developer',
    description: 'Join our growing team as a Full Stack Developer. Work on exciting projects with the latest technologies in a collaborative environment.',
    workLocationCountry: 'India',
    workLocation: 'Bangalore, Karnataka',
    jobType: 'Contract to Hire',
    paymentType: 'Pay as you go',
    payRate: '₹15L - ₹25L per annum',
    domainKnowledge: 'Healthcare, Banking',
    mustHaveSkills: 'Node.js, React, MongoDB, Express.js',
    primarySkills: 'MERN Stack, REST APIs, Git',
    niceToHaveSkills: 'Python, Machine Learning, Cloud Services',
    rolesResponsibilities: '• Develop and maintain web applications\n• Write clean, maintainable code\n• Work with databases and APIs\n• Collaborate with design team\n• Deploy and monitor applications',
    selectedQuestions: [
      'Full Name',
      'Contact Number',
      'Email ID',
      'Current Location',
      'Total Years of Experience',
      'Current Job Title',
      'Primary Skills',
      'Secondary Skills',
      'Current CTC (Fixed + Variable)',
      'Expected CTC',
      'Minimum Acceptable CTC',
      'Current Notice Period',
      'Earliest Joining Date',
      'Updated Resume (Mandatory)',
      'PAN Card (for background check)',
    ],
    daysActive: 15,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    isActive: true,
    isPaid: true,
    isApproved: true,
  },
];

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>(DUMMY_JOBS);
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
