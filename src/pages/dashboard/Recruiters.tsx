import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Text,
  Title,
  Table,
  Badge,
  Button,
  Modal,
  Stack,
  Group,
  Box,
  SimpleGrid,
  TextInput,
  ActionIcon,
  Menu,
  Divider,
  ThemeIcon,
  Avatar,
  Paper,
  ScrollArea,
  Tabs,
  Loader,
  Skeleton,
  Select,
  Pagination,
  Tooltip,
  NumberInput,
  Progress,
  SegmentedControl,
} from '@mantine/core';
import {
  IconEye,
  IconBriefcase,
  IconTrash,
  IconDotsVertical,
  IconPlus,
  IconUser,
  IconMail,
  IconBuilding,
  IconPhone,
  IconWorld,
  IconCalendar,
  IconBan,
  IconCircleCheck,
  IconSearch,
  IconLock,
  IconSend,
  IconDownload,
  IconPlayerPause,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useMediaQuery } from '@mantine/hooks';
import { API_ENDPOINTS, api, apiRequest } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';
import { DashboardPageHeader, DASHBOARD_TABLE_CARD_PROPS, DASHBOARD_TABLE_PROPS, DASHBOARD_TABLE_STYLES } from '@/components/dashboard';
import { validateEmail, validateName, validatePhone, validatePassword, validateCompanyName, validateWebsite } from '@/lib/validations';
import FormattedText from '@/components/FormattedText';
import { parsePurchasedFeaturesFromApi, purchasedCapabilityFlags } from '@/lib/recruiterFeatures';

const COUNTRY_CODES = [
  { value: '+1', label: '+1' },
  { value: '+91', label: '+91' },
];

interface Admin {
  id: string;
  _id?: string;
  name: string;
  email: string;
  mobile?: string;
  companyName?: string;
  company?: string;
  companyWebsite?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  totalJobs?: string;
  activeJobs?: string;
  /** Purchased features from `GET /super-admin/view/admin/:id` (ids and/or legacy names) */
  features?: unknown[];
  purchasedFeatures?: unknown[];
}

function adminHasEmailBroadcastForLimits(admin: Admin | null): boolean {
  if (!admin) return false;
  const raw = admin.features ?? admin.purchasedFeatures;
  if (raw === undefined || raw === null) {
    return true;
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    return false;
  }
  const { featureIds, legacyNames } = parsePurchasedFeaturesFromApi(raw);
  return purchasedCapabilityFlags(featureIds, legacyNames).hasEmailBroadcast;
}

interface SendingLimitsPayload {
  adminId: number;
  limits: {
    dailyLimit: number;
    maxDailyLimit: number;
    monthlyLimit: number;
    absoluteMaxDaily: number;
    absoluteMaxMonthly: number;
  };
  usage: {
    sentToday: number;
    sentThisMonth: number;
    totalSent: number;
    remainingToday: number;
    remainingThisMonth: number;
  };
  warmup: {
    warmupEnabled: boolean;
    warmupDay: number;
  };
  health: {
    bounceRate: number | string;
    complaintRate: number | string;
    paused: boolean;
    lastSentAt: string | null;
  };
}

/** API may return rates as percent strings (e.g. `"0.00"`) or fractional numbers. */
function formatHealthRatePercent(raw: number | string | null | undefined): string {
  if (raw === null || raw === undefined) return '—';
  if (typeof raw === 'string') {
    const n = parseFloat(raw);
    return Number.isFinite(n) ? `${n.toFixed(2)}%` : '—';
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw >= 0 && raw <= 1) return `${(raw * 100).toFixed(2)}%`;
    return `${raw.toFixed(2)}%`;
  }
  return '—';
}

interface AdminJob {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  country?: string;
  clientName?: string;
  role?: string;
  workLocations?: Array<{ state: string; city: string[] }>;
  workType?: string;
  jobType?: string[];
  payRate?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  primarySkills?: string[];
  niceToHaveSkills?: string[];
  responsibilities?: string;
  applicationQuestions?: string[];
  requiredDocuments?: string[];
  expiryDate?: string;
  paymentStatus?: string;
  planAmount?: string;
  totalPayment?: string;
  isVerified?: string;
  status?: string;
  deleted?: string;
  createdAt?: string;
  updatedAt?: string;
  admin?: {
    id: number;
    name: string;
    email: string;
    companyName: string;
  };
}

/** Email broadcast campaign from super-admin recruiter activity API */
interface EmailCampaignAnalytics {
  Sent?: number;
  Bounced?: number;
  Complaint?: number;
  Failed?: number;
  Pending?: number;
}

/** Email broadcast campaign from super-admin recruiter activity API */
interface EmailCampaign {
  id: number;
  adminId: number;
  listId: number;
  campaignName: string;
  replyTo: string;
  subject: string;
  body: string;
  totalRecipients: number;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  deleted?: string;
  createdAt?: string;
  updatedAt?: string;
  analytics?: EmailCampaignAnalytics;
}

const Recruiters: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAdmin, setViewingAdmin] = useState<Admin | null>(null);
  const [viewingAdminDetails, setViewingAdminDetails] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [addingRecruiter, setAddingRecruiter] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Job postings tab
  const [activeTab, setActiveTab] = useState<string | null>('details');
  const [adminJobs, setAdminJobs] = useState<AdminJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsPage, setJobsPage] = useState(1);
  const [totalJobPages, setTotalJobPages] = useState(1);
  const [viewingJob, setViewingJob] = useState<AdminJob | null>(null);
  const [adminCampaigns, setAdminCampaigns] = useState<EmailCampaign[]>([]);
  /** Campaign `id` whose list download is in progress (per row, not adminId+listId). */
  const [downloadingCampaignId, setDownloadingCampaignId] = useState<number | null>(null);
  /** Campaign `id` while pause or resume request is in flight. */
  const [pauseResumeCampaignId, setPauseResumeCampaignId] = useState<number | null>(null);

  const [sendingLimits, setSendingLimits] = useState<SendingLimitsPayload | null>(null);
  const [sendingLimitsLoading, setSendingLimitsLoading] = useState(false);
  const [limitsPatchLoading, setLimitsPatchLoading] = useState(false);
  type LimitPatchMode = 'raise_daily' | 'raise_monthly' | 'set_both';
  const [limitPatchMode, setLimitPatchMode] = useState<LimitPatchMode>('raise_daily');
  const [limitFormDaily, setLimitFormDaily] = useState<number | string>('');
  const [limitFormMaxDaily, setLimitFormMaxDaily] = useState<number | string>('');
  const [limitFormMonthly, setLimitFormMonthly] = useState<number | string>('');

  const showSendingLimitsTab = useMemo(
    () => !!viewingAdminDetails && adminHasEmailBroadcastForLimits(viewingAdminDetails),
    [viewingAdminDetails]
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('+1');
  const [formPhone, setFormPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  
  // Form validation errors
  const [formNameError, setFormNameError] = useState('');
  const [formEmailError, setFormEmailError] = useState('');
  const [formPasswordError, setFormPasswordError] = useState('');
  const [formCompanyError, setFormCompanyError] = useState('');
  const [formPhoneError, setFormPhoneError] = useState('');
  const [formWebsiteError, setFormWebsiteError] = useState('');

  // Fetch admins
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      
      const url = `${API_ENDPOINTS.SUPER_ADMIN.LIST_ADMINS}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest<{ success: boolean; admins: Admin[] }>(url);

      if (response.data?.success) {
        setAdmins(response.data.admins || []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (activeTab === 'limits' && !showSendingLimitsTab) {
      setActiveTab('details');
    }
  }, [activeTab, showSendingLimitsTab]);

  // View admin details
  const handleViewAdmin = async (admin: Admin) => {
    setViewingAdmin(admin);
    setActiveTab('details');
    setDetailsLoading(true);
    
    try {
      const adminId = admin._id || admin.id;
      const response = await apiRequest<{ success: boolean; admin: Admin }>(
        API_ENDPOINTS.SUPER_ADMIN.VIEW_ADMIN(adminId)
      );

      if (response.data?.success) {
        setViewingAdminDetails(response.data.admin);
      } else {
        setViewingAdminDetails(admin);
      }
    } catch (error) {
      console.error('Failed to fetch admin details:', error);
      setViewingAdminDetails(admin);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Fetch admin jobs
  const fetchAdminJobs = async (adminId: string, page: number = 1) => {
    setJobsLoading(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          jobs: AdminJob[];
          campaigns?: EmailCampaign[];
          pagination?: { totalPages?: number; totalRecords?: number; currentPage?: number; pageSize?: number };
        };
      }>(API_ENDPOINTS.SUPER_ADMIN.ADMIN_JOBS(adminId, page, 10));

      if (response.data?.success) {
        const jobsData = response.data.data;
        setAdminJobs(jobsData?.jobs || []);
        setTotalJobPages(jobsData?.pagination?.totalPages || 1);
        if (Array.isArray(jobsData?.campaigns)) {
          setAdminCampaigns(jobsData.campaigns);
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  /** Download email list file for campaign row (adminId + listId from API). */
  const downloadEmailList = async (adminId: number, listId: number, campaignId: number) => {
    setDownloadingCampaignId(campaignId);
    try {
      const path = API_ENDPOINTS.SUPER_ADMIN.EMAIL_LIST_DOWNLOAD(adminId, listId);
      const response = await api.get(path, { responseType: 'blob' });
      const blob = response.data as Blob;
      const contentType = String(response.headers['content-type'] || '');

      if (contentType.includes('application/json')) {
        const text = await blob.text();
        try {
          const errBody = JSON.parse(text) as { message?: string };
          notifications.show({
            title: 'Download failed',
            message: errBody.message || 'Could not download this list.',
            color: 'red',
          });
        } catch {
          notifications.show({
            title: 'Download failed',
            message: 'Could not download this list.',
            color: 'red',
          });
        }
        return;
      }

      let filename = `email-list-${adminId}-${listId}`;
      const cd = response.headers['content-disposition'];
      if (cd && typeof cd === 'string') {
        const utfMatch = /filename\*=UTF-8''([^;\n]+)/i.exec(cd);
        const asciiMatch = /filename="([^"]+)"/i.exec(cd) || /filename=([^;\n]+)/i.exec(cd);
        const raw = utfMatch?.[1] ? decodeURIComponent(utfMatch[1].trim()) : asciiMatch?.[1]?.trim().replace(/^["']|["']$/g, '');
        if (raw) filename = raw;
      }

      if (!/\.\w{2,5}$/i.test(filename)) {
        if (contentType.includes('csv')) filename += '.csv';
        else if (contentType.includes('spreadsheet') || contentType.includes('excel')) filename += '.xlsx';
      }

      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);

      notifications.show({
        message: 'List downloaded',
        color: 'green',
      });
    } catch (e) {
      console.error('Email list download failed:', e);
      notifications.show({
        title: 'Download failed',
        message: 'Could not download this list. Try again.',
        color: 'red',
      });
    } finally {
      setDownloadingCampaignId(null);
    }
  };

  type CampaignPauseResumeResponse = {
    success: boolean;
    message?: string;
    data?: {
      campaignId: number;
      campaignName?: string;
      previousStatus?: string;
      currentStatus: string;
    };
  };

  const pauseCampaign = async (campaignId: number) => {
    setPauseResumeCampaignId(campaignId);
    try {
      const res = await apiRequest<CampaignPauseResumeResponse>(
        API_ENDPOINTS.SUPER_ADMIN.CAMPAIGN_PAUSE(campaignId),
        { method: 'PATCH' }
      );
      const payload = res.data;
      if (payload?.success && payload.data?.currentStatus != null) {
        const next = payload.data.currentStatus;
        setAdminCampaigns((prev) =>
          prev.map((x) => (x.id === campaignId ? { ...x, status: next } : x))
        );
        notifications.show({
          message: payload.message || 'Campaign paused',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Could not pause',
          message: res.error || payload?.message || 'Try again.',
          color: 'red',
        });
      }
    } catch (e) {
      console.error('Pause campaign failed:', e);
      notifications.show({
        title: 'Could not pause',
        message: 'Try again.',
        color: 'red',
      });
    } finally {
      setPauseResumeCampaignId(null);
    }
  };

  const resumeCampaign = async (campaignId: number) => {
    setPauseResumeCampaignId(campaignId);
    try {
      const res = await apiRequest<CampaignPauseResumeResponse>(
        API_ENDPOINTS.SUPER_ADMIN.CAMPAIGN_RESUME(campaignId),
        { method: 'PATCH' }
      );
      const payload = res.data;
      if (payload?.success && payload.data?.currentStatus != null) {
        const next = payload.data.currentStatus;
        setAdminCampaigns((prev) =>
          prev.map((x) => (x.id === campaignId ? { ...x, status: next } : x))
        );
        notifications.show({
          message: payload.message || 'Campaign resumed',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Could not resume',
          message: res.error || payload?.message || 'Try again.',
          color: 'red',
        });
      }
    } catch (e) {
      console.error('Resume campaign failed:', e);
      notifications.show({
        title: 'Could not resume',
        message: 'Try again.',
        color: 'red',
      });
    } finally {
      setPauseResumeCampaignId(null);
    }
  };

  const fetchSendingLimits = async (adminId: string) => {
    setSendingLimitsLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message?: string; data?: SendingLimitsPayload }>(
        API_ENDPOINTS.SUPER_ADMIN.SENDING_LIMITS(adminId),
        { method: 'GET' }
      );
      if (res.data?.success && res.data.data) {
        setSendingLimits(res.data.data);
        const L = res.data.data.limits;
        setLimitFormDaily(L.dailyLimit);
        setLimitFormMaxDaily(L.maxDailyLimit);
        setLimitFormMonthly(L.monthlyLimit);
      } else {
        setSendingLimits(null);
        notifications.show({
          title: 'Could not load limits',
          message: res.error || res.data?.message || 'Try again.',
          color: 'red',
        });
      }
    } catch (e) {
      console.error('fetchSendingLimits', e);
      setSendingLimits(null);
      notifications.show({ title: 'Could not load limits', message: 'Try again.', color: 'red' });
    } finally {
      setSendingLimitsLoading(false);
    }
  };

  const submitSendingLimitsPatch = async () => {
    if (!viewingAdmin) return;
    const adminId = viewingAdmin._id || viewingAdmin.id;

    let body: Record<string, number> | null = null;
    if (limitPatchMode === 'raise_daily') {
      const v = typeof limitFormDaily === 'string' ? Number(limitFormDaily) : limitFormDaily;
      if (!Number.isFinite(v)) {
        notifications.show({ message: 'Enter a valid daily limit.', color: 'red' });
        return;
      }
      body = { dailyLimit: v };
    } else if (limitPatchMode === 'raise_monthly') {
      const v = typeof limitFormMonthly === 'string' ? Number(limitFormMonthly) : limitFormMonthly;
      if (!Number.isFinite(v)) {
        notifications.show({ message: 'Enter a valid monthly quota.', color: 'red' });
        return;
      }
      body = { monthlyLimit: v };
    } else {
      const d = typeof limitFormDaily === 'string' ? Number(limitFormDaily) : limitFormDaily;
      const md = typeof limitFormMaxDaily === 'string' ? Number(limitFormMaxDaily) : limitFormMaxDaily;
      const m = typeof limitFormMonthly === 'string' ? Number(limitFormMonthly) : limitFormMonthly;
      if (!Number.isFinite(d) || !Number.isFinite(md) || !Number.isFinite(m)) {
        notifications.show({ message: 'Enter valid numbers for all three fields.', color: 'red' });
        return;
      }
      body = { dailyLimit: d, maxDailyLimit: md, monthlyLimit: m };
    }

    setLimitsPatchLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message?: string }>(
        API_ENDPOINTS.SUPER_ADMIN.SENDING_LIMITS(adminId),
        { method: 'PATCH', data: body }
      );
      if (res.data?.success) {
        notifications.show({
          message: res.data.message || 'Sending limits updated',
          color: 'green',
        });
        await fetchSendingLimits(adminId);
      } else {
        notifications.show({
          title: 'Update failed',
          message: res.error || res.data?.message || 'Try again.',
          color: 'red',
        });
      }
    } catch (e) {
      console.error('submitSendingLimitsPatch', e);
      notifications.show({ title: 'Update failed', message: 'Try again.', color: 'red' });
    } finally {
      setLimitsPatchLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    if (!viewingAdmin) return;
    const adminId = viewingAdmin._id || viewingAdmin.id;
    if (value === 'jobs' || value === 'email-broadcast') {
      fetchAdminJobs(adminId, 1);
      setJobsPage(1);
    }
    if (value === 'limits') {
      fetchSendingLimits(adminId);
    }
  };

  // Block admin
  const handleBlockAdmin = async (admin: Admin) => {
    const adminId = admin._id || admin.id;
    setActionLoading(adminId);
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.BLOCK_ADMIN(adminId),
        { method: 'PATCH' }
      );
      
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Admin blocked successfully', color: 'green' });
        fetchAdmins();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to block admin', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to block admin', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  // Unblock admin
  const handleUnblockAdmin = async (admin: Admin) => {
    const adminId = admin._id || admin.id;
    setActionLoading(adminId);
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.UNBLOCK_ADMIN(adminId),
        { method: 'PATCH' }
      );
      
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Admin unblocked successfully', color: 'green' });
        fetchAdmins();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to unblock admin', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to unblock admin', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  // Delete admin
  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;
    
    const adminId = deletingAdmin._id || deletingAdmin.id;
    setActionLoading(adminId);
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.DELETE_ADMIN(adminId),
        { method: 'DELETE' }
      );
      
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Admin deleted successfully', color: 'green' });
        fetchAdmins();
        setDeletingAdmin(null);
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to delete admin', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to delete admin', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  // Validation handlers
  const handleFormNameChange = (value: string) => {
    setFormName(value);
    if (value) {
      const result = validateName(value);
      setFormNameError(result.isValid ? '' : result.error);
    } else {
      setFormNameError('');
    }
  };

  const handleFormEmailChange = (value: string) => {
    setFormEmail(value);
    if (value) {
      const result = validateEmail(value);
      setFormEmailError(result.isValid ? '' : result.error);
    } else {
      setFormEmailError('');
    }
  };

  const handleFormPasswordChange = (value: string) => {
    setFormPassword(value);
    if (value) {
      const result = validatePassword(value);
      setFormPasswordError(result.isValid ? '' : result.error);
    } else {
      setFormPasswordError('');
    }
  };

  const handleFormCompanyChange = (value: string) => {
    setFormCompany(value);
    if (value) {
      const result = validateCompanyName(value);
      setFormCompanyError(result.isValid ? '' : result.error);
    } else {
      setFormCompanyError('');
    }
  };

  const handleFormPhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setFormPhone(digitsOnly);
    if (digitsOnly) {
      const result = validatePhone(digitsOnly, formCountryCode);
      setFormPhoneError(result.isValid ? '' : result.error);
    } else {
      setFormPhoneError('');
    }
  };

  const handleFormWebsiteChange = (value: string) => {
    setFormWebsite(value);
    if (value) {
      const result = validateWebsite(value);
      setFormWebsiteError(result.isValid ? '' : result.error);
    } else {
      setFormWebsiteError('');
    }
  };

  // Add recruiter
  const handleAddSubmit = async () => {
    // Validate all fields
    let hasError = false;

    if (!formName.trim()) {
      setFormNameError('Name is required');
      hasError = true;
    } else {
      const nameResult = validateName(formName);
      if (!nameResult.isValid) {
        setFormNameError(nameResult.error);
        hasError = true;
      }
    }

    if (!formEmail.trim()) {
      setFormEmailError('Email is required');
      hasError = true;
    } else {
      const emailResult = validateEmail(formEmail);
      if (!emailResult.isValid) {
        setFormEmailError(emailResult.error);
        hasError = true;
      }
    }

    if (!formPassword.trim()) {
      setFormPasswordError('Password is required');
      hasError = true;
    } else {
      const passwordResult = validatePassword(formPassword);
      if (!passwordResult.isValid) {
        setFormPasswordError(passwordResult.error);
        hasError = true;
      }
    }

    if (!formCompany.trim()) {
      setFormCompanyError('Company name is required');
      hasError = true;
    } else {
      const companyResult = validateCompanyName(formCompany);
      if (!companyResult.isValid) {
        setFormCompanyError(companyResult.error);
        hasError = true;
      }
    }

    if (formPhone) {
      const phoneResult = validatePhone(formPhone, formCountryCode);
      if (!phoneResult.isValid) {
        setFormPhoneError(phoneResult.error);
        hasError = true;
      }
    }

    if (formWebsite) {
      const websiteResult = validateWebsite(formWebsite);
      if (!websiteResult.isValid) {
        setFormWebsiteError(websiteResult.error);
        hasError = true;
      }
    }

    if (hasError) return;

    setActionLoading('add');
    
    try {
      const response = await apiRequest<{ success: boolean }>(
        API_ENDPOINTS.SUPER_ADMIN.CREATE_ADMIN,
        {
          method: 'POST',
          data: {
            email: formEmail,
            password: formPassword,
            name: formName,
            mobile: formPhone ? `${formCountryCode}-${formPhone}` : '',
            companyName: formCompany,
            companyWebsite: formWebsite,
          },
        }
      );
      
      if (response.data?.success) {
        notifications.show({ title: 'Success', message: 'Recruiter added successfully', color: 'green' });
        fetchAdmins();
        setAddingRecruiter(false);
        resetForm();
      } else {
        notifications.show({ title: 'Error', message: response.error || 'Failed to add recruiter', color: 'red' });
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to add recruiter', color: 'red' });
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormCompany('');
    setFormCountryCode('+1');
    setFormPhone('');
    setFormWebsite('');
    setFormNameError('');
    setFormEmailError('');
    setFormPasswordError('');
    setFormCompanyError('');
    setFormPhoneError('');
    setFormWebsiteError('');
  };

  const openAddModal = () => {
    resetForm();
    setAddingRecruiter(true);
  };

  const getAdminStatus = (admin: Admin) => {
    if (admin.status) return admin.status;
    return admin.isActive ? 'active' : 'inactive';
  };

  const isBlocked = (admin: Admin) => {
    const status = getAdminStatus(admin).toLowerCase();
    return status === 'blocked' || status === 'inactive';
  };

  /** Mobile cards — layout aligned with Alerts `MobileActivityCard` (super-admin/alerts). */
  const MobileRecruiterCard = ({ admin }: { admin: Admin }) => (
    <Card shadow="sm" padding="sm" withBorder mb="xs" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" gap="xs" align="flex-start">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Avatar color="blue" radius="xl" size="sm" style={{ flexShrink: 0 }}>
              {admin.name?.charAt(0) || 'A'}
            </Avatar>
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Text size="sm" fw={500} lineClamp={1}>
                {admin.name}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {admin.email}
              </Text>
            </Box>
          </Group>
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Badge color={isBlocked(admin) ? 'red' : 'green'} variant="light" size="xs">
              {getAdminStatus(admin)}
            </Badge>
            <Menu position="bottom-end" withArrow withinPortal>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="More actions"
                  loading={actionLoading === (admin._id || admin.id)}
                >
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconEye size={14} />} onClick={() => handleViewAdmin(admin)}>
                  View
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={isBlocked(admin) ? <IconCircleCheck size={14} /> : <IconBan size={14} />}
                  onClick={() => (isBlocked(admin) ? handleUnblockAdmin(admin) : handleBlockAdmin(admin))}
                >
                  {isBlocked(admin) ? 'Set active' : 'Set inactive'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => setDeletingAdmin(admin)}>
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Badge variant="light" color="blue" size="xs" w="fit-content">
          {admin.companyName || admin.company || 'N/A'}
        </Badge>

        {admin.mobile ? (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {admin.mobile}
          </Text>
        ) : null}

        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Text size="xs" c="dimmed" lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
            {admin.createdAt
              ? `Joined ${format(new Date(admin.createdAt), 'MMM dd, yyyy')}`
              : '—'}
          </Text>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconEye size={12} />}
            onClick={() => handleViewAdmin(admin)}
            styles={{ root: { height: 28, paddingLeft: 8, paddingRight: 10 } }}
          >
            View
          </Button>
        </Group>
      </Stack>
    </Card>
  );

  return (
    <Box maw={1200} mx="auto" px={{ base: 'xs', sm: 'md' }} pb={{ base: 'xl', sm: 0 }}>
      <DashboardPageHeader
        icon={<IconUser size={24} stroke={1.75} />}
        title="Recruiters"
        description="Manage and view all registered recruiters, their jobs, and email activity."
        actions={
          <Button
            fullWidth={isMobile}
            leftSection={<IconPlus size={16} />}
            onClick={openAddModal}
            size={isMobile ? 'sm' : 'md'}
          >
            Add Recruiter
          </Button>
        }
      />

      {/* Filters — full width stack on mobile */}
      {isMobile ? (
        <Stack gap="sm" mb="lg">
          <TextInput
            placeholder="Search by name or email..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'blocked', label: 'Blocked' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            size="sm"
          />
        </Stack>
      ) : (
        <Group mb="lg" gap="md" wrap="wrap" align="flex-end">
          <TextInput
            placeholder="Search by name or email..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, maxWidth: 300, minWidth: 200 }}
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'blocked', label: 'Blocked' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ width: 160 }}
          />
        </Group>
      )}

      {loading ? (
        <Stack gap="sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={isMobile ? 96 : 80} radius="md" />
          ))}
        </Stack>
      ) : isMobile ? (
        <Stack gap="xs">
          {admins.length === 0 ? (
            <Paper p="xl" radius="md" withBorder bg="gray.0" ta="center">
              <Text c="dimmed" size="sm">
                No recruiters match your filters.
              </Text>
            </Paper>
          ) : (
            admins.map((admin) => (
              <MobileRecruiterCard key={admin._id || admin.id} admin={admin} />
            ))
          )}
        </Stack>
      ) : (
        <Card {...DASHBOARD_TABLE_CARD_PROPS}>
          <ScrollArea type="auto" offsetScrollbars>
            <Table {...DASHBOARD_TABLE_PROPS} styles={DASHBOARD_TABLE_STYLES} miw={800}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Recruiter</Table.Th>
                  <Table.Th>Company</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {admins.map((admin) => (
                  <Table.Tr key={admin._id || admin.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color="blue" radius="xl" size="sm">
                          {admin.name?.charAt(0) || 'A'}
                        </Avatar>
                        <Box>
                          <Text fw={500} size="sm">{admin.name}</Text>
                          <Text size="xs" c="dimmed">{admin.email}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">{admin.companyName || admin.company || 'N/A'}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{admin.mobile || 'N/A'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={isBlocked(admin) ? 'red' : 'green'} variant="light">
                        {getAdminStatus(admin)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {admin.createdAt ? format(new Date(admin.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" leftSection={<IconEye size={14} />} onClick={() => handleViewAdmin(admin)}>
                          View
                        </Button>
                        <Menu position="bottom-end" withArrow>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" loading={actionLoading === (admin._id || admin.id)}>
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item 
                              leftSection={isBlocked(admin) ? <IconCircleCheck size={14} /> : <IconBan size={14} />}
                              onClick={() => isBlocked(admin) ? handleUnblockAdmin(admin) : handleBlockAdmin(admin)}
                            >
                              {isBlocked(admin) ? 'Active' : 'Inactive'}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => setDeletingAdmin(admin)}>
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* View Details Modal with Tabs */}
      <Modal 
        opened={!!viewingAdmin} 
        onClose={() => {
          setViewingAdmin(null);
          setViewingAdminDetails(null);
          setAdminJobs([]);
          setAdminCampaigns([]);
          setSendingLimits(null);
          setLimitPatchMode('raise_daily');
          setLimitFormDaily('');
          setLimitFormMaxDaily('');
          setLimitFormMonthly('');
          setActiveTab('details');
        }} 
        title={<Text fw={600} size="lg">Recruiter Details</Text>} 
        size="xl"
        styles={{ content: { maxWidth: 'min(1200px, calc(100vw - 2rem))' } }}
        fullScreen={isMobile}
      >
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List mb="md">
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="jobs">Job Postings</Tabs.Tab>
            <Tabs.Tab value="email-broadcast">Email Broadcast</Tabs.Tab>
            {showSendingLimitsTab ? <Tabs.Tab value="limits">Limit</Tabs.Tab> : null}
          </Tabs.List>

          <Tabs.Panel value="details">
            {detailsLoading ? (
              <Stack gap="md">
                <Skeleton height={100} />
                <Skeleton height={150} />
              </Stack>
            ) : viewingAdminDetails && (
              <Stack gap="lg">
                {/* Profile Header */}
                <Paper p="md" bg="gray.0" radius="md">
                  <Group gap="md" wrap="wrap">
                    <Avatar size="xl" color="blue" radius="xl">
                      {viewingAdminDetails.name?.charAt(0) || 'A'}
                    </Avatar>
                    <Box style={{ flex: 1, minWidth: 200 }}>
                      <Group justify="space-between" wrap="wrap" gap="sm">
                        <Box>
                          <Text size="xl" fw={600}>{viewingAdminDetails.name}</Text>
                          <Text size="sm" c="dimmed">{viewingAdminDetails.companyName || viewingAdminDetails.company}</Text>
                        </Box>
                        <Badge size="lg" color={isBlocked(viewingAdminDetails) ? 'red' : 'green'} variant="light">
                          {getAdminStatus(viewingAdminDetails)}
                        </Badge>
                      </Group>
                    </Box>
                  </Group>
                </Paper>

                {/* Contact Information */}
                <Box>
                  <Text fw={600} mb="sm">Contact Information</Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <IconMail size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">Email</Text>
                        <Text size="sm" fw={500}>{viewingAdminDetails.email}</Text>
                      </Box>
                    </Group>
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <IconPhone size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">Phone</Text>
                        <Text size="sm" fw={500}>{viewingAdminDetails.mobile || 'Not provided'}</Text>
                      </Box>
                    </Group>
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <IconBuilding size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">Company</Text>
                        <Text size="sm" fw={500}>{viewingAdminDetails.companyName || viewingAdminDetails.company || 'Not provided'}</Text>
                      </Box>
                    </Group>
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <IconWorld size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">Website</Text>
                        <Text size="sm" fw={500}>{viewingAdminDetails.companyWebsite || 'Not provided'}</Text>
                      </Box>
                    </Group>
                    {viewingAdminDetails.createdAt && (
                      <Group gap="sm">
                        <ThemeIcon variant="light" color="blue" size="md">
                          <IconCalendar size={16} />
                        </ThemeIcon>
                        <Box>
                          <Text size="xs" c="dimmed">Joined</Text>
                          <Text size="sm" fw={500}>{format(new Date(viewingAdminDetails.createdAt), 'MMMM dd, yyyy')}</Text>
                        </Box>
                      </Group>
                    )}
                  </SimpleGrid>
                </Box>
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="jobs">
            {jobsLoading ? (
              <Stack gap="sm">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} height={60} />
                ))}
              </Stack>
            ) : adminJobs.length === 0 ? (
              <Paper p="lg" bg="gray.0" radius="md" ta="center">
                <IconBriefcase size={32} color="#868e96" style={{ marginBottom: 8 }} />
                <Text c="dimmed" size="sm">No job postings yet</Text>
              </Paper>
            ) : (
              <>
                <Stack gap="sm">
                  {adminJobs.map(job => {
                    const locationDisplay = job.workLocations && job.workLocations.length > 0
                      ? `${job.workLocations[0].state}${job.workLocations[0].city?.length ? `, ${job.workLocations[0].city[0]}` : ''}`
                      : job.country || '';
                    const jobTypeDisplay = Array.isArray(job.jobType) ? job.jobType.join(', ') : (job.jobType || '');
                    
                    return (
                      <Paper 
                        key={job._id || job.id} 
                        p="md" 
                        withBorder 
                        radius="md" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setViewingJob(job)}
                      >
                        <Group justify="space-between" wrap="wrap" gap="sm">
                          <Box>
                            <Text fw={500}>{job.title}</Text>
                            <Group gap="xs" mt={4} wrap="wrap">
                              {locationDisplay && (
                                <>
                                  <Text size="xs" c="dimmed">{locationDisplay}</Text>
                                  {jobTypeDisplay && <Text size="xs" c="dimmed">•</Text>}
                                </>
                              )}
                              {jobTypeDisplay && (
                                <Text size="xs" c="dimmed">{jobTypeDisplay}</Text>
                              )}
                            </Group>
                          </Box>
                          <Badge 
                            color={job.status?.toLowerCase() === 'active' ? 'green' : 'gray'} 
                            variant="light" 
                            size="sm"
                            tt="uppercase"
                          >
                            {job.status || 'Draft'}
                          </Badge>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
                {totalJobPages > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination 
                      value={jobsPage} 
                      onChange={(page) => {
                        setJobsPage(page);
                        if (viewingAdmin) {
                          fetchAdminJobs(viewingAdmin._id || viewingAdmin.id, page);
                        }
                      }} 
                      total={totalJobPages} 
                    />
                  </Group>
                )}
              </>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="email-broadcast">
            {jobsLoading ? (
              <Stack gap="md">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={118} radius="md" />
                ))}
              </Stack>
            ) : adminCampaigns.length === 0 ? (
              <Paper p="lg" bg="gray.0" radius="md" ta="center">
                <IconSend size={32} color="#868e96" style={{ marginBottom: 8 }} />
                <Text c="dimmed" size="sm">No email broadcast campaigns yet</Text>
              </Paper>
            ) : (
              <Stack gap="md">
                {adminCampaigns.map((c) => {
                  const completedLabel = c.completedAt
                    ? format(new Date(c.completedAt), 'MMM d, yyyy · HH:mm')
                    : c.scheduledAt
                      ? `Scheduled ${format(new Date(c.scheduledAt), 'MMM d, yyyy · HH:mm')}`
                      : '—';
                  const analyticsRows = c.analytics
                    ? (
                        [
                          ['Sent', c.analytics.Sent],
                          ['Bounced', c.analytics.Bounced],
                          ['Complaint', c.analytics.Complaint],
                          ['Failed', c.analytics.Failed],
                          ['Pending', c.analytics.Pending],
                        ] as const
                      )
                    : [];
                  const statusKey = (c.status || '').toLowerCase();
                  const statusBadgeColor =
                    statusKey === 'completed'
                      ? 'green'
                      : statusKey === 'paused'
                        ? 'orange'
                        : statusKey === 'scheduled' || statusKey === 'processing'
                          ? 'blue'
                          : 'gray';
                  const canPauseCampaign = statusKey !== 'completed' && statusKey !== 'paused';
                  const canResumeCampaign = statusKey === 'paused';
                  return (
                    <Paper
                      key={c.id}
                      p="md"
                      radius="md"
                      withBorder
                      shadow="xs"
                      style={{ overflow: 'hidden' }}
                    >
                      <Stack gap="md">
                        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={600} lh={1.4}>
                              {c.campaignName}
                            </Text>
                            {c.subject && c.subject !== c.campaignName ? (
                              <Text size="xs" c="dimmed" mt={4} lineClamp={2} lh={1.35}>
                                {c.subject}
                              </Text>
                            ) : null}
                            <Text size="xs" c="dimmed" mt={6}>
                              List #{c.listId}
                            </Text>
                          </Box>
                          <Group gap="xs" wrap="wrap" justify="flex-end" style={{ flexShrink: 0 }}>
                            <Badge
                              size="md"
                              variant="light"
                              tt="uppercase"
                              color={statusBadgeColor}
                              styles={{
                                root: {
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                },
                              }}
                            >
                              {c.status || '—'}
                            </Badge>
                            {canPauseCampaign && (
                              <Button
                                size="xs"
                                variant="light"
                                color="orange"
                                leftSection={<IconPlayerPause size={14} />}
                                loading={pauseResumeCampaignId === c.id}
                                onClick={() => pauseCampaign(c.id)}
                              >
                                Pause
                              </Button>
                            )}
                            {canResumeCampaign && (
                              <Button
                                size="xs"
                                variant="light"
                                color="teal"
                                leftSection={<IconPlayerPlay size={14} />}
                                loading={pauseResumeCampaignId === c.id}
                                onClick={() => resumeCampaign(c.id)}
                              >
                                Resume
                              </Button>
                            )}
                            <Tooltip label="Download list" withArrow position="left">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="md"
                                aria-label="Download email list"
                                loading={downloadingCampaignId === c.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadEmailList(c.adminId, c.listId, c.id);
                                }}
                              >
                                <IconDownload size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Group>

                        <Group gap="xl" wrap="wrap" align="flex-start">
                          <Box>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.06em' }}>
                              Recipients
                            </Text>
                            <Text size="sm" fw={600} mt={2}>
                              {c.totalRecipients}
                            </Text>
                          </Box>
                          <Box>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.06em' }}>
                              Completed
                            </Text>
                            <Text size="sm" mt={2} lh={1.45}>
                              {completedLabel}
                            </Text>
                          </Box>
                        </Group>

                        {analyticsRows.length > 0 ? (
                          <Box>
                            <Text
                              size="xs"
                              c="dimmed"
                              tt="uppercase"
                              fw={600}
                              mb="sm"
                              style={{ letterSpacing: '0.06em' }}
                            >
                              Delivery analytics
                            </Text>
                            <Group gap="xs" wrap="wrap" align="stretch">
                              {analyticsRows.map(([label, val]) => (
                                <Paper
                                  key={label}
                                  px="sm"
                                  py={8}
                                  radius="md"
                                  withBorder
                                  bg="gray.0"
                                  style={{
                                    borderColor: 'var(--mantine-color-gray-3)',
                                    minWidth: '4.5rem',
                                  }}
                                >
                                  <Text size="10px" c="dimmed" tt="uppercase" lh={1.2}>
                                    {label}
                                  </Text>
                                  <Text size="md" fw={700} lh={1.2} mt={2}>
                                    {Number(val) || 0}
                                  </Text>
                                </Paper>
                              ))}
                            </Group>
                          </Box>
                        ) : null}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="limits">
            {sendingLimitsLoading ? (
              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <Skeleton height={88} radius="md" />
                  <Skeleton height={88} radius="md" />
                  <Skeleton height={88} radius="md" />
                </SimpleGrid>
                <Skeleton height={100} radius="md" />
                <Skeleton height={160} radius="md" />
              </Stack>
            ) : !sendingLimits ? (
              <Paper p="xl" radius="md" withBorder ta="center">
                <Text c="dimmed" size="sm">
                  No sending limit data for this recruiter.
                </Text>
              </Paper>
            ) : (
              <Stack gap="xl">
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                  <Paper p="md" radius="md" withBorder bg="gray.0">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.06em' }}>
                      Daily quota
                    </Text>
                    <Text size="xl" fw={700} mt={6} lh={1.2}>
                      {sendingLimits.limits.dailyLimit.toLocaleString()}
                    </Text>
                    <Text size="xs" c="dimmed" mt={8}>
                      Cap {sendingLimits.limits.maxDailyLimit.toLocaleString()} · max{' '}
                      {sendingLimits.limits.absoluteMaxDaily.toLocaleString()}
                    </Text>
                  </Paper>
                  <Paper p="md" radius="md" withBorder bg="gray.0">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.06em' }}>
                      Monthly quota
                    </Text>
                    <Text size="xl" fw={700} mt={6} lh={1.2}>
                      {sendingLimits.limits.monthlyLimit.toLocaleString()}
                    </Text>
                    <Text size="xs" c="dimmed" mt={8}>
                      Platform max {sendingLimits.limits.absoluteMaxMonthly.toLocaleString()}
                    </Text>
                  </Paper>
                  <Paper p="md" radius="md" withBorder bg="gray.0">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.06em' }}>
                      Warmup
                    </Text>
                    <Text size="lg" fw={600} mt={6}>
                      {sendingLimits.warmup.warmupEnabled ? 'On' : 'Off'}
                    </Text>
                    <Text size="xs" c="dimmed" mt={8}>
                      Day {sendingLimits.warmup.warmupDay}
                    </Text>
                  </Paper>
                </SimpleGrid>

                <Paper p="md" radius="md" withBorder>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md" style={{ letterSpacing: '0.06em' }}>
                    Usage
                  </Text>
                  <Stack gap="lg">
                    <Box>
                      <Group justify="space-between" gap="xs" mb={6}>
                        <Text size="sm" fw={500}>
                          Today
                        </Text>
                        <Text size="sm" c="dimmed">
                          {sendingLimits.usage.sentToday.toLocaleString()} sent ·{' '}
                          {sendingLimits.usage.remainingToday.toLocaleString()} left
                        </Text>
                      </Group>
                      <Progress
                        value={
                          sendingLimits.limits.dailyLimit > 0
                            ? Math.min(
                                100,
                                (sendingLimits.usage.sentToday / sendingLimits.limits.dailyLimit) * 100
                              )
                            : 0
                        }
                        size="sm"
                        radius="xl"
                        color="blue"
                      />
                    </Box>
                    <Box>
                      <Group justify="space-between" gap="xs" mb={6}>
                        <Text size="sm" fw={500}>
                          This month
                        </Text>
                        <Text size="sm" c="dimmed">
                          {sendingLimits.usage.sentThisMonth.toLocaleString()} sent ·{' '}
                          {sendingLimits.usage.remainingThisMonth.toLocaleString()} left
                        </Text>
                      </Group>
                      <Progress
                        value={
                          sendingLimits.limits.monthlyLimit > 0
                            ? Math.min(
                                100,
                                (sendingLimits.usage.sentThisMonth / sendingLimits.limits.monthlyLimit) * 100
                              )
                            : 0
                        }
                        size="sm"
                        radius="xl"
                        color="violet"
                      />
                    </Box>
                    <Group gap="xl" wrap="wrap">
                      <Box>
                        <Text size="xs" c="dimmed">
                          All-time sent
                        </Text>
                        <Text size="sm" fw={600}>
                          {sendingLimits.usage.totalSent.toLocaleString()}
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Paper>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="sm" style={{ letterSpacing: '0.06em' }}>
                      Delivery health
                    </Text>
                    <Group gap="lg" wrap="wrap">
                      <Box>
                        <Text size="xs" c="dimmed">
                          Bounce
                        </Text>
                        <Text size="sm" fw={600}>
                          {formatHealthRatePercent(sendingLimits.health.bounceRate)}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">
                          Complaints
                        </Text>
                        <Text size="sm" fw={600}>
                          {formatHealthRatePercent(sendingLimits.health.complaintRate)}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">
                          Sending
                        </Text>
                        <Badge size="sm" variant="light" color={sendingLimits.health.paused ? 'red' : 'green'}>
                          {sendingLimits.health.paused ? 'Paused' : 'Active'}
                        </Badge>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">
                          Last sent
                        </Text>
                        <Text size="sm" fw={500}>
                          {sendingLimits.health.lastSentAt
                            ? format(new Date(sendingLimits.health.lastSentAt), 'MMM d, yyyy · HH:mm')
                            : '—'}
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                </SimpleGrid>

                <Paper p="lg" radius="md" withBorder shadow="xs">
                  <Stack gap="lg">
                    <Box>
                      <Title order={5} fz="md" fw={600} mb={4}>
                        Adjust limits
                      </Title>
                      <Text size="sm" c="dimmed">
                        Pick what to change, enter values, then save. Caps from the platform still apply.
                      </Text>
                    </Box>

                    <SegmentedControl
                      fullWidth
                      size="sm"
                      value={limitPatchMode}
                      onChange={(v) => setLimitPatchMode((v as LimitPatchMode) || 'raise_daily')}
                      data={[
                        { label: 'Daily limit', value: 'raise_daily' },
                        { label: 'Monthly quota', value: 'raise_monthly' },
                        { label: 'Daily + cap + monthly', value: 'set_both' },
                      ]}
                    />

                    <Box>
                      {limitPatchMode === 'raise_daily' && (
                        <NumberInput
                          label="New daily limit"
                          description={`Up to ${sendingLimits.limits.absoluteMaxDaily.toLocaleString()} (platform max)`}
                          min={0}
                          max={sendingLimits.limits.absoluteMaxDaily}
                          value={limitFormDaily}
                          onChange={setLimitFormDaily}
                          thousandSeparator=","
                          radius="md"
                        />
                      )}

                      {limitPatchMode === 'raise_monthly' && (
                        <NumberInput
                          label="New monthly quota"
                          description={`Up to ${sendingLimits.limits.absoluteMaxMonthly.toLocaleString()}`}
                          min={0}
                          max={sendingLimits.limits.absoluteMaxMonthly}
                          value={limitFormMonthly}
                          onChange={setLimitFormMonthly}
                          thousandSeparator=","
                          radius="md"
                        />
                      )}

                      {limitPatchMode === 'set_both' && (
                        <SimpleGrid
                          cols={{ base: 1, sm: 3 }}
                          spacing="md"
                          styles={{
                            root: {
                              alignItems: 'start',
                            },
                          }}
                        >
                          {(
                            [
                              {
                                key: 'daily',
                                label: 'Daily limit',
                                max: sendingLimits.limits.absoluteMaxDaily,
                                value: limitFormDaily,
                                onChange: setLimitFormDaily,
                              },
                              {
                                key: 'maxDaily',
                                label: 'Max daily cap',
                                max: sendingLimits.limits.absoluteMaxDaily,
                                value: limitFormMaxDaily,
                                onChange: setLimitFormMaxDaily,
                              },
                              {
                                key: 'monthly',
                                label: 'Monthly limit',
                                max: sendingLimits.limits.absoluteMaxMonthly,
                                value: limitFormMonthly,
                                onChange: setLimitFormMonthly,
                              },
                            ] as const
                          ).map((field) => (
                            <NumberInput
                              key={field.key}
                              label={field.label}
                              min={0}
                              max={field.max}
                              value={field.value}
                              onChange={field.onChange}
                              thousandSeparator=","
                              radius="md"
                              styles={{
                                root: { width: '100%' },
                                label: { marginBottom: 6 },
                              }}
                            />
                          ))}
                        </SimpleGrid>
                      )}
                    </Box>

                    <Group justify="flex-end" gap="sm" mt="xs">
                      <Button
                        variant="default"
                        radius="md"
                        onClick={() => viewingAdmin && fetchSendingLimits(viewingAdmin._id || viewingAdmin.id)}
                        disabled={sendingLimitsLoading}
                      >
                        Reload data
                      </Button>
                      <Button radius="md" onClick={submitSendingLimitsPatch} loading={limitsPatchLoading}>
                        Save changes
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Modal>

      {/* Job Details Modal */}
      <Modal 
        opened={!!viewingJob} 
        onClose={() => setViewingJob(null)} 
        title={<Text fw={600} size="lg">Job Details</Text>} 
        size="lg"
        fullScreen={isMobile}
      >
        {viewingJob && (
          <Stack gap="lg">
            <Paper p="md" bg="gray.0" radius="md">
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Box>
                  <Text size="xl" fw={600}>{viewingJob.title}</Text>
                  <Text size="sm" c="dimmed">{viewingJob.clientName || viewingJob.admin?.companyName}</Text>
                </Box>
                <Badge 
                  color={viewingJob.status?.toLowerCase() === 'active' ? 'green' : 'gray'} 
                  variant="light" 
                  size="lg"
                  tt="uppercase"
                >
                  {viewingJob.status || 'Draft'}
                </Badge>
              </Group>
            </Paper>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconBriefcase size={16} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Role</Text>
                  <Text size="sm" fw={500}>{viewingJob.role || viewingJob.title}</Text>
                </Box>
              </Group>
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconWorld size={16} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Country</Text>
                  <Text size="sm" fw={500}>{viewingJob.country || 'Not specified'}</Text>
                </Box>
              </Group>
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconBuilding size={16} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Work Type</Text>
                  <Text size="sm" fw={500}>{viewingJob.workType || 'Not specified'}</Text>
                </Box>
              </Group>
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconCalendar size={16} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Job Type</Text>
                  <Text size="sm" fw={500}>{Array.isArray(viewingJob.jobType) ? viewingJob.jobType.join(', ') : (viewingJob.jobType || 'Not specified')}</Text>
                </Box>
              </Group>
              {viewingJob.payRate && (
                <Group gap="sm">
                  <ThemeIcon variant="light" color="green" size="md">
                    <IconBriefcase size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">Pay Rate</Text>
                    <Text size="sm" fw={500}>{viewingJob.payRate}</Text>
                  </Box>
                </Group>
              )}
              {viewingJob.createdAt && (
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" size="md">
                    <IconCalendar size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">Posted On</Text>
                    <Text size="sm" fw={500}>{format(new Date(viewingJob.createdAt), 'MMM dd, yyyy')}</Text>
                  </Box>
                </Group>
              )}
            </SimpleGrid>

            {viewingJob.workLocations && viewingJob.workLocations.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Work Locations</Text>
                <Group gap="xs" wrap="wrap">
                  {viewingJob.workLocations.map((loc, idx) => (
                    <Badge key={idx} variant="light" color="blue">
                      {loc.state}{loc.city?.length ? ` - ${loc.city.join(', ')}` : ''}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}

            {viewingJob.description && (
              <Box>
                <Text fw={600} mb="xs">Description</Text>
                <FormattedText text={viewingJob.description} />
              </Box>
            )}

            {viewingJob.primarySkills && viewingJob.primarySkills.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Primary Skills</Text>
                <Group gap="xs" wrap="wrap">
                  {viewingJob.primarySkills.map((skill, idx) => (
                    <Badge key={idx} variant="light" color="grape">{skill}</Badge>
                  ))}
                </Group>
              </Box>
            )}

            {viewingJob.niceToHaveSkills && viewingJob.niceToHaveSkills.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Nice to Have Skills</Text>
                <Group gap="xs" wrap="wrap">
                  {viewingJob.niceToHaveSkills.map((skill, idx) => (
                    <Badge key={idx} variant="light" color="gray">{skill}</Badge>
                  ))}
                </Group>
              </Box>
            )}

            {viewingJob.requiredDocuments && viewingJob.requiredDocuments.length > 0 && (
              <Box>
                <Text fw={600} mb="xs">Required Documents</Text>
                <Group gap="xs" wrap="wrap">
                  {viewingJob.requiredDocuments.map((doc, idx) => (
                    <Badge key={idx} variant="outline" color="dark">{doc}</Badge>
                  ))}
                </Group>
              </Box>
            )}

            <Divider />

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">Payment Status</Text>
                <Badge color={viewingJob.paymentStatus === 'Completed' ? 'green' : 'yellow'} variant="light">
                  {viewingJob.paymentStatus || 'Pending'}
                </Badge>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Verification</Text>
                <Badge color={viewingJob.isVerified === 'Approved' ? 'green' : 'yellow'} variant="light">
                  {viewingJob.isVerified || 'Pending'}
                </Badge>
              </Box>
              {viewingJob.expiryDate && (
                <Box>
                  <Text size="xs" c="dimmed">Expiry Date</Text>
                  <Text size="sm" fw={500}>{format(new Date(viewingJob.expiryDate), 'MMM dd, yyyy')}</Text>
                </Box>
              )}
            </SimpleGrid>
          </Stack>
        )}
      </Modal>


      {/* Add Modal */}
      <Modal 
        opened={addingRecruiter} 
        onClose={() => setAddingRecruiter(false)} 
        title={<Text fw={600}>Add New Recruiter</Text>}
        fullScreen={isMobile}
      >
        <Stack gap="md">
          <TextInput
            label="Full Name"
            leftSection={<IconUser size={16} />}
            value={formName}
            onChange={(e) => handleFormNameChange(e.target.value)}
            error={formNameError}
            required
          />
          <TextInput
            label="Email"
            leftSection={<IconMail size={16} />}
            value={formEmail}
            onChange={(e) => handleFormEmailChange(e.target.value)}
            error={formEmailError}
            required
          />
          <TextInput
            label="Password"
            leftSection={<IconLock size={16} />}
            type="password"
            value={formPassword}
            onChange={(e) => handleFormPasswordChange(e.target.value)}
            error={formPasswordError}
            required
          />
          <TextInput
            label="Company Name"
            leftSection={<IconBuilding size={16} />}
            value={formCompany}
            onChange={(e) => handleFormCompanyChange(e.target.value)}
            error={formCompanyError}
            required
          />
          <Box>
            <Text size="sm" fw={500} mb={4}>Phone</Text>
            <Group gap={6} wrap="nowrap">
              <Select
                data={COUNTRY_CODES}
                value={formCountryCode}
                onChange={(v) => setFormCountryCode(v || '+1')}
                w={120}
                styles={{ input: { textAlign: 'center', fontWeight: 500 } }}
              />
              <TextInput
                placeholder="9876543210"
                leftSection={<IconPhone size={16} />}
                value={formPhone}
                onChange={(e) => handleFormPhoneChange(e.target.value)}
                style={{ flex: 1 }}
              />
            </Group>
            {formPhoneError && <Text size="xs" c="red" mt={4}>{formPhoneError}</Text>}
          </Box>
          <TextInput
            label="Company Website"
            leftSection={<IconWorld size={16} />}
            value={formWebsite}
            onChange={(e) => handleFormWebsiteChange(e.target.value)}
            error={formWebsiteError}
            placeholder="https://example.com"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setAddingRecruiter(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit} loading={actionLoading === 'add'}>Add Recruiter</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        opened={!!deletingAdmin} 
        onClose={() => setDeletingAdmin(null)} 
        title={<Text fw={600} c="red">Delete Recruiter</Text>}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{deletingAdmin?.name}</strong>? 
            This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setDeletingAdmin(null)}>Cancel</Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={!!actionLoading}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default Recruiters;
