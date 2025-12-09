import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  TextInput, 
  PasswordInput, 
  Button, 
  Text, 
  Stack, 
  Alert, 
  PinInput,
  Box,
  Group,
  SegmentedControl,
  Textarea,
  Divider
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle, IconArrowLeft, IconUser, IconPhone, IconBuilding, IconWorld, IconMapPin } from '@tabler/icons-react';
import { useAuth, SignupData } from '@/contexts/AuthContext';

type Step = 'credentials' | 'signup' | 'otp';

const Login: React.FC = () => {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Signup fields
  const [userType, setUserType] = useState<'recruiter' | 'freelancer'>('recruiter');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { login, signup, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      setStep('otp');
    } else {
      setError('Invalid email or password');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const signupData: SignupData = {
      userType,
      fullName,
      email: signupEmail,
      phone,
      password: signupPassword,
      company: userType === 'recruiter' ? company : undefined,
      companyWebsite: userType === 'recruiter' ? companyWebsite : undefined,
      postalAddress: userType === 'freelancer' ? postalAddress : undefined,
    };

    const success = await signup(signupData);
    setIsLoading(false);

    if (success) {
      setStep('otp');
    } else {
      setError('Email already exists. Please login instead.');
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError('');
    setIsLoading(true);

    const success = await verifyOtp(otp);
    setIsLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid OTP. Please try again.');
      setOtp('');
    }
  };

  const resetSignupForm = () => {
    setFullName('');
    setPhone('');
    setCompany('');
    setCompanyWebsite('');
    setPostalAddress('');
    setSignupEmail('');
    setSignupPassword('');
    setConfirmPassword('');
    setUserType('recruiter');
  };

  return (
    <Box 
      mih="calc(100vh - 120px)" 
      bg="gray.0" 
      py="xl"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <Container size="sm" w="100%">
        <Card shadow="md" padding="xl" radius="md">
          {step === 'credentials' && (
            <>
              <Stack align="center" mb="lg">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#0078D4',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text c="white" fw={700} size="xl">IL</Text>
                </Box>
                <Text size="xl" fw={700}>Welcome Back</Text>
                <Text size="sm" c="dimmed">Sign in to your Integrate Leads account</Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleCredentialsSubmit}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="your@email.com"
                    leftSection={<IconMail size={16} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    leftSection={<IconLock size={16} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <Button type="submit" fullWidth loading={isLoading}>
                    Continue
                  </Button>
                </Stack>
              </form>

              <Divider my="lg" label="OR" labelPosition="center" />

              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => {
                  resetSignupForm();
                  setStep('signup');
                  setError('');
                }}
              >
                Create New Account
              </Button>

              <Text size="xs" c="dimmed" mt="lg" ta="center">
                Demo accounts:<br />
                Super Admin: superadmin@integrateleads.com / admin123<br />
                Recruiter: recruiter@company.com / recruiter123
              </Text>
            </>
          )}

          {step === 'signup' && (
            <>
              <Stack align="center" mb="lg">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#0078D4',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text c="white" fw={700} size="xl">IL</Text>
                </Box>
                <Text size="xl" fw={700}>Create Account</Text>
                <Text size="sm" c="dimmed">Join Integrate Leads today</Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSignupSubmit}>
                <Stack gap="md">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">I am a</Text>
                    <SegmentedControl
                      fullWidth
                      value={userType}
                      onChange={(value) => setUserType(value as 'recruiter' | 'freelancer')}
                      data={[
                        { label: 'IT Recruiter', value: 'recruiter' },
                        { label: 'Freelancer', value: 'freelancer' },
                      ]}
                    />
                  </Box>

                  <TextInput
                    label="Full Name"
                    placeholder="Enter your full name"
                    leftSection={<IconUser size={16} />}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

                  <TextInput
                    label={userType === 'recruiter' ? 'Official Email ID' : 'Email ID'}
                    placeholder="your@email.com"
                    leftSection={<IconMail size={16} />}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    type="email"
                    required
                  />

                  <TextInput
                    label="Contact Number"
                    placeholder="Enter your phone number"
                    leftSection={<IconPhone size={16} />}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />

                  {userType === 'recruiter' ? (
                    <>
                      <TextInput
                        label="Company Name"
                        placeholder="Enter company name"
                        leftSection={<IconBuilding size={16} />}
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                      />
                      <TextInput
                        label="Company Website"
                        placeholder="https://company.com"
                        leftSection={<IconWorld size={16} />}
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                      />
                    </>
                  ) : (
                    <Textarea
                      label="Postal Address"
                      placeholder="Enter your postal address"
                      leftSection={<IconMapPin size={16} />}
                      value={postalAddress}
                      onChange={(e) => setPostalAddress(e.target.value)}
                      required
                      minRows={2}
                    />
                  )}

                  <PasswordInput
                    label="Password"
                    placeholder="Create a password"
                    leftSection={<IconLock size={16} />}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />

                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    leftSection={<IconLock size={16} />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <Button type="submit" fullWidth loading={isLoading}>
                    Create Account
                  </Button>

                  <Button
                    variant="subtle"
                    color="gray"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => {
                      setStep('credentials');
                      setError('');
                    }}
                  >
                    Back to Login
                  </Button>
                </Stack>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <Stack align="center" mb="lg">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#0078D4',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconLock size={24} color="white" />
                </Box>
                <Text size="xl" fw={700}>Verify OTP</Text>
                <Text size="sm" c="dimmed">Enter the 6-digit code to continue</Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              <Stack gap="lg" align="center">
                <PinInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  size="lg"
                  placeholder=""
                />

                <Text size="xs" c="dimmed">
                  For demo, use OTP: <strong>123456</strong>
                </Text>

                <Button
                  fullWidth
                  loading={isLoading}
                  onClick={handleOtpSubmit}
                  disabled={otp.length !== 6}
                >
                  Verify & Continue
                </Button>

                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => {
                    setStep('credentials');
                    setOtp('');
                    setError('');
                  }}
                >
                  Back to Login
                </Button>
              </Stack>
            </>
          )}
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
