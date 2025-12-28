import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Text, 
  TextInput, 
  Textarea,
  Button, 
  Stack, 
  Group, 
  Badge, 
  Box, 
  Title, 
  Divider, 
  Paper,
  FileInput,
  Image,
  SimpleGrid,
  Loader
} from '@mantine/core';
import { 
  IconUser, 
  IconMail, 
  IconBuilding, 
  IconLogout, 
  IconPhone, 
  IconWorld, 
  IconMapPin,
  IconUpload,
  IconEdit
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { API_ENDPOINTS, api } from '@/hooks/useApi';

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
  idProof: Array<{
    url: string;
    key: string;
    name: string;
    mimetype: string;
  }>;
  emailVerified: string;
}

const Settings: React.FC = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [idProofFiles, setIdProofFiles] = useState<File[]>([]);

  // Determine if this is recruiter settings
  const isRecruiterSettings = location.pathname.includes('/recruiter/');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isRecruiterSettings) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<{ success: boolean; data: AdminProfile }>(
          API_ENDPOINTS.ADMIN.GET_PROFILE
        );
        
        if (response.data?.success) {
          const profileData = response.data.data;
          setProfile(profileData);
          setName(profileData.name || '');
          setEmail(profileData.email || '');
          setContactNumber(profileData.mobile || '');
          setCompanyName(profileData.companyName || '');
          setCompanyWebsite(profileData.companyWebsite || '');
          setAddress(profileData.address || '');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isRecruiterSettings]);

  const handleLogout = async () => {
    await logout();
    navigate(isSuperAdmin ? '/super-admin/login' : '/recruiter/login');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('contactNumber', contactNumber);
      formData.append('companyName', companyName);
      formData.append('companyWebsite', companyWebsite || '');
      formData.append('address', address);
      
      idProofFiles.forEach((file) => {
        formData.append('idProof', file);
      });

      const response = await api.patch<{ success: boolean; message: string }>(
        API_ENDPOINTS.ADMIN.UPDATE_PROFILE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.success) {
        notifications.show({
          title: 'Success',
          message: 'Profile updated successfully',
          color: 'green',
        });
        setIsEditing(false);
        
        // Refresh profile data
        const profileResponse = await api.get<{ success: boolean; data: AdminProfile }>(
          API_ENDPOINTS.ADMIN.GET_PROFILE
        );
        if (profileResponse.data?.success) {
          setProfile(profileResponse.data.data);
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: 'Error',
        message: axiosError.response?.data?.message || 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return <Badge color="red" variant="light" size="lg">Super Admin</Badge>;
    }
    switch (user?.role) {
      case 'recruiter':
        return <Badge color="blue" variant="light" size="lg">IT Recruiter</Badge>;
      case 'freelancer':
        return <Badge color="green" variant="light" size="lg">Freelancer</Badge>;
      default:
        return <Badge color="gray" variant="light" size="lg">User</Badge>;
    }
  };

  if (loading) {
    return (
      <Box maw={600} mx="auto" py="xl">
        <Group justify="center">
          <Loader />
        </Group>
      </Box>
    );
  }

  const displayName = profile?.name || user?.name || '';
  const displayEmail = profile?.email || user?.email || '';
  const displayPhone = profile?.mobile || user?.phone || '';
  const displayCompany = profile?.companyName || user?.company || '';
  const displayWebsite = profile?.companyWebsite || user?.companyWebsite || '';
  const displayAddress = profile?.address || user?.postalAddress || '';

  return (
    <Box maw={600} mx="auto">
      <Box mb="xl">
        <Title order={2}>Account Settings</Title>
        <Text c="dimmed">Manage your account information</Text>
      </Box>

      <Card shadow="sm" padding="xl" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" mb="md">
            <Text fw={600} size="lg">Profile Information</Text>
            <Group gap="sm">
              {getRoleBadge()}
              {isRecruiterSettings && !isEditing && (
                <Button 
                  variant="light" 
                  size="xs" 
                  leftSection={<IconEdit size={14} />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </Group>
          </Group>

          {isEditing ? (
            <>
              <TextInput
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftSection={<IconUser size={16} />}
              />

              <TextInput
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftSection={<IconMail size={16} />}
              />

              <TextInput
                label="Phone Number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                leftSection={<IconPhone size={16} />}
              />

              <TextInput
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                leftSection={<IconBuilding size={16} />}
              />

              <TextInput
                label="Company Website"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                leftSection={<IconWorld size={16} />}
              />

              <Textarea
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                minRows={2}
              />

              <FileInput
                label="ID Proof Documents"
                placeholder="Upload ID proof files"
                multiple
                accept="image/*,.pdf"
                leftSection={<IconUpload size={16} />}
                value={idProofFiles}
                onChange={setIdProofFiles}
              />

              {profile?.idProof && profile.idProof.length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">Current ID Proofs</Text>
                  <SimpleGrid cols={3} spacing="xs">
                    {profile.idProof.map((proof, idx) => (
                      <Box key={idx} p="xs" bg="gray.0" style={{ borderRadius: 4 }}>
                        {proof.mimetype.startsWith('image/') ? (
                          <Image src={proof.url} alt={proof.name} height={60} fit="cover" />
                        ) : (
                          <Text size="xs" truncate>{proof.name}</Text>
                        )}
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              <Group justify="flex-end" gap="sm">
                <Button variant="light" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile} loading={saving}>Save Changes</Button>
              </Group>
            </>
          ) : (
            <>
              <TextInput
                label="Full Name"
                value={displayName}
                leftSection={<IconUser size={16} />}
                readOnly
                styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
              />

              <TextInput
                label="Email Address"
                value={displayEmail}
                leftSection={<IconMail size={16} />}
                readOnly
                styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
              />

              {displayPhone && (
                <TextInput
                  label="Phone Number"
                  value={displayPhone}
                  leftSection={<IconPhone size={16} />}
                  readOnly
                  styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
                />
              )}

              {displayCompany && (
                <TextInput
                  label="Company"
                  value={displayCompany}
                  leftSection={<IconBuilding size={16} />}
                  readOnly
                  styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
                />
              )}

              {displayWebsite && (
                <TextInput
                  label="Company Website"
                  value={displayWebsite}
                  leftSection={<IconWorld size={16} />}
                  readOnly
                  styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
                />
              )}

              {displayAddress && (
                <TextInput
                  label="Address"
                  value={displayAddress}
                  leftSection={<IconMapPin size={16} />}
                  readOnly
                  styles={{ input: { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } }}
                />
              )}

              {profile?.idProof && profile.idProof.length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">ID Proof Documents</Text>
                  <SimpleGrid cols={3} spacing="xs">
                    {profile.idProof.map((proof, idx) => (
                      <Box key={idx} p="xs" bg="gray.0" style={{ borderRadius: 4 }}>
                        {proof.mimetype.startsWith('image/') ? (
                          <Image src={proof.url} alt={proof.name} height={60} fit="cover" />
                        ) : (
                          <Text size="xs" truncate>{proof.name}</Text>
                        )}
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </>
          )}

          {!isRecruiterSettings && (
            <>
              <Divider my="md" />
              <Box>
                <Text size="sm" c="dimmed" mb="md">
                  To update your profile information, please contact support.
                </Text>
                <Button variant="outline">Contact Support</Button>
              </Box>
            </>
          )}

          <Divider my="md" />

          <Paper p="md" bg="red.0" radius="md">
            <Group justify="space-between">
              <Box>
                <Text fw={500} c="red.7">Sign Out</Text>
                <Text size="sm" c="dimmed">Sign out of your account on this device</Text>
              </Box>
              <Button 
                color="red" 
                variant="outline" 
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Group>
          </Paper>
        </Stack>
      </Card>
    </Box>
  );
};

export default Settings;