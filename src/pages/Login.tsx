import React, { useState, useEffect } from 'react';
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
  Divider,
  Select,
  FileInput,
  Anchor
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle, IconArrowLeft, IconUser, IconPhone, IconBuilding, IconWorld, IconMapPin, IconUpload, IconRefresh } from '@tabler/icons-react';
import { useAuth, SignupData } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

type Step = 'credentials' | 'signup' | 'otp' | 'forgot-password' | 'reset-otp';

const COUNTRY_CODES = [
  { value: '+1', label: '🇺🇸 USA (+1)' },
  { value: '+91', label: '🇮🇳 India (+91)' },
];

const Login: React.FC = () => {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Signup fields
  const [userType, setUserType] = useState<'recruiter' | 'freelancer'>('recruiter');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idProof, setIdProof] = useState<File | null>(null);
  
  // Forgot password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const { login, signup, verifyOtp, pendingEmail, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-submit OTP when complete
  useEffect(() => {
    if (otp.length === 6 && (step === 'otp' || step === 'reset-otp')) {
      if (step === 'otp') {
        handleOtpSubmit();
      } else {
        handleResetOtpSubmit();
      }
    }
  }, [otp]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      setStep('otp');
      setResendTimer(30);
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

    if (userType === 'freelancer' && !idProof) {
      setError('Please upload an ID proof document');
      return;
    }

    setIsLoading(true);

    const signupData: SignupData = {
      userType,
      fullName,
      email: signupEmail,
      phone: `${countryCode} ${phone}`,
      password: signupPassword,
      company: userType === 'recruiter' ? company : undefined,
      companyWebsite: userType === 'recruiter' ? companyWebsite : undefined,
      postalAddress: userType === 'freelancer' ? postalAddress : undefined,
    };

    const success = await signup(signupData);
    setIsLoading(false);

    if (success) {
      setStep('otp');
      setResendTimer(30);
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate sending OTP for password reset
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    setStep('reset-otp');
    setResendTimer(30);
  };

  const handleResetOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    // Simulate password reset
    if (otp === '123456') {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
      setSuccess('Password reset successfully! Please login with your new password.');
      setStep('credentials');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setIsLoading(false);
      setError('Invalid OTP. Please try again.');
      setOtp('');
    }
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setSuccess('OTP resent successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 6) {
      if (step === 'otp') {
        handleOtpSubmit();
      } else if (step === 'reset-otp') {
        handleResetOtpSubmit();
      }
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
    setCountryCode('+1');
    setIdProof(null);
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
                <Logo size="lg" showText={false} linkTo="" />
                <Text size="xl" fw={700}>Welcome Back</Text>
                <Text size="sm" c="dimmed">Sign in to your Integrate Leads account</Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert color="green" mb="md">
                  {success}
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

                  <Group justify="flex-end">
                    <Anchor 
                      size="sm" 
                      c="blue"
                      onClick={() => {
                        setStep('forgot-password');
                        setError('');
                        setSuccess('');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </Anchor>
                  </Group>

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
                  setSuccess('');
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
                <Logo size="lg" showText={false} linkTo="" />
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

                  <Box>
                    <Text size="sm" fw={500} mb={5}>Contact Number</Text>
                    <Group gap="xs" wrap="nowrap">
                      <Select
                        data={COUNTRY_CODES}
                        value={countryCode}
                        onChange={(v) => setCountryCode(v || '+1')}
                        w={140}
                        styles={{ input: { paddingLeft: 12 } }}
                      />
                      <TextInput
                        placeholder="Enter phone number"
                        leftSection={<IconPhone size={16} />}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        required
                        style={{ flex: 1 }}
                      />
                    </Group>
                  </Box>

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
                    <>
                      <Textarea
                        label="Postal Address"
                        placeholder="Enter your postal address"
                        value={postalAddress}
                        onChange={(e) => setPostalAddress(e.target.value)}
                        required
                        minRows={2}
                      />
                      <FileInput
                        label="ID Proof (PDF or Image)"
                        placeholder="Upload ID proof"
                        leftSection={<IconUpload size={16} />}
                        value={idProof}
                        onChange={setIdProof}
                        accept="image/*,.pdf"
                        required
                      />
                    </>
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
                <Logo size="lg" showText={false} linkTo="" />
                <Text size="xl" fw={700}>Verify OTP</Text>
                <Text size="sm" c="dimmed">
                  Enter the 6-digit code sent to {pendingEmail || email}
                </Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert color="green" mb="md">
                  {success}
                </Alert>
              )}

              <Stack gap="lg" align="center" onKeyDown={handleKeyDown} w="100%">
                <Group justify="center" gap="xs" w="100%">
                  <PinInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    size="xs"
                    placeholder=""
                    type="number"
                    style={{ gap: '4px' }}
                  />
                </Group>

                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    For demo, use OTP: <strong>123456</strong>
                  </Text>
                </Group>

                <Button
                  variant="subtle"
                  size="sm"
                  leftSection={<IconRefresh size={16} />}
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Button>

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
                    setSuccess('');
                  }}
                >
                  Back to Login
                </Button>
              </Stack>
            </>
          )}

          {step === 'forgot-password' && (
            <>
              <Stack align="center" mb="lg">
                <Logo size="lg" showText={false} linkTo="" />
                <Text size="xl" fw={700}>Reset Password</Text>
                <Text size="sm" c="dimmed">Enter your email to receive a reset code</Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleForgotPasswordSubmit}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="your@email.com"
                    leftSection={<IconMail size={16} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Button type="submit" fullWidth loading={isLoading}>
                    Send Reset Code
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

          {step === 'reset-otp' && (
            <>
              <Stack align="center" mb="lg">
                <Logo size="lg" showText={false} linkTo="" />
                <Text size="xl" fw={700}>Reset Password</Text>
                <Text size="sm" c="dimmed">Enter the code and your new password</Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert color="green" mb="md">
                  {success}
                </Alert>
              )}

              <Stack gap="lg" onKeyDown={handleKeyDown} w="100%">
                <Box>
                  <Text size="sm" fw={500} mb={5}>Enter OTP</Text>
                  <Group justify="center" gap="xs" w="100%">
                    <PinInput
                      length={6}
                      value={otp}
                      onChange={setOtp}
                      size="xs"
                      placeholder=""
                      type="number"
                      style={{ gap: '4px' }}
                    />
                  </Group>
                </Box>

                <Text size="xs" c="dimmed" ta="center">
                  For demo, use OTP: <strong>123456</strong>
                </Text>

                <Button
                  variant="subtle"
                  size="sm"
                  leftSection={<IconRefresh size={16} />}
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Button>

                <PasswordInput
                  label="New Password"
                  placeholder="Enter new password"
                  leftSection={<IconLock size={16} />}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  leftSection={<IconLock size={16} />}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />

                <Button
                  fullWidth
                  loading={isLoading}
                  onClick={handleResetOtpSubmit}
                  disabled={otp.length !== 6}
                >
                  Reset Password
                </Button>

                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => {
                    setStep('credentials');
                    setOtp('');
                    setError('');
                    setNewPassword('');
                    setConfirmNewPassword('');
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
