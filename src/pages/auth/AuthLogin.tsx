import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { IconMail, IconLock, IconAlertCircle, IconArrowLeft, IconUser, IconPhone, IconBuilding, IconWorld, IconUpload, IconRefresh } from '@tabler/icons-react';
import { useAuth, SignupData } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

type Step = 'credentials' | 'signup' | 'otp' | 'forgot-password' | 'reset-otp' | 'change-password';

const COUNTRY_CODES = [
  { value: '+1', label: '🇺🇸 USA (+1)' },
  { value: '+91', label: '🇮🇳 India (+91)' },
];

const RESEND_TIMER_SECONDS = 300;

const AuthLogin: React.FC = () => {
  const location = useLocation();
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Signup fields (only for recruiter)
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
  const [verifiedOtp, setVerifiedOtp] = useState('');
  
  const { login, signup, verifyOtp, resendOtp, forgotPassword, resetPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Set initial step based on route
  useEffect(() => {
    if (location.pathname.includes('/signup')) {
      setStep('signup');
    } else if (location.pathname.includes('/forgot-password')) {
      setStep('forgot-password');
    } else {
      setStep('credentials');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (otp.length === 6 && step === 'otp') {
      handleOtpSubmit();
    } else if (otp.length === 6 && step === 'reset-otp') {
      handleResetOtpVerify();
    }
  }, [otp]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      setStep('otp');
      setResendTimer(RESEND_TIMER_SECONDS);
    } else {
      setError(result.error || 'Invalid email or password');
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

    const result = await signup(signupData);
    setIsLoading(false);

    if (result.success) {
      setStep('otp');
      setResendTimer(RESEND_TIMER_SECONDS);
    } else {
      setError(result.error || 'Email already exists. Please login instead.');
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError('');
    setIsLoading(true);

    const result = await verifyOtp(otp);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid OTP. Please try again.');
      setOtp('');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await forgotPassword(email);
    setIsLoading(false);

    if (result.success) {
      setStep('reset-otp');
      setResendTimer(RESEND_TIMER_SECONDS);
    } else {
      setError(result.error || 'Failed to send reset code');
    }
  };

  const handleResetOtpVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifiedOtp(otp);
    setStep('change-password');
    setOtp('');
    setError('');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    const result = await resetPassword(verifiedOtp, newPassword, confirmNewPassword);
    setIsLoading(false);

    if (result.success) {
      setSuccess('Password reset successfully! Please login with your new password.');
      setStep('credentials');
      setVerifiedOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setError(result.error || 'Failed to reset password. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    const result = await resendOtp();
    setIsLoading(false);

    if (result.success) {
      setResendTimer(RESEND_TIMER_SECONDS);
      setSuccess('OTP resent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to resend OTP');
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

  const getLoginPath = () => isSuperAdminRoute ? '/super-admin/login' : '/recruiter/login';
  const getTitle = () => isSuperAdminRoute ? 'Super Admin Login' : 'Recruiter Login';
  const getSubtitle = () => isSuperAdminRoute ? 'Sign in to admin dashboard' : 'Sign in to your Integrate Leads account';

  return (
    <Box 
      mih="calc(100vh - 200px)" 
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
                <Text size="xl" fw={700}>{getTitle()}</Text>
                <Text size="sm" c="dimmed">{getSubtitle()}</Text>
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
                    placeholder={isSuperAdminRoute ? 'superadmin@integrateleads.com' : 'your@email.com'}
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

              {/* Only show signup option for recruiter route */}
              {!isSuperAdminRoute && (
                <>
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
                </>
              )}
            </>
          )}

          {step === 'signup' && !isSuperAdminRoute && (
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
                <Text size="sm" c="dimmed" ta="center">
                  Enter the 6-digit code sent to your email
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

              <Stack gap="lg" align="center">
                <PinInput
                  length={6}
                  type="number"
                  value={otp}
                  onChange={setOtp}
                  size="lg"
                  oneTimeCode
                />

                <Button fullWidth loading={isLoading} onClick={handleOtpSubmit} disabled={otp.length !== 6}>
                  Verify OTP
                </Button>

                <Group justify="center" gap="xs">
                  <Text size="sm" c="dimmed">Didn't receive OTP?</Text>
                  {resendTimer > 0 ? (
                    <Text size="sm" c="blue" fw={500}>Resend in {formatTimer(resendTimer)}</Text>
                  ) : (
                    <Button variant="subtle" size="sm" leftSection={<IconRefresh size={14} />} onClick={handleResendOtp} loading={isLoading}>
                      Resend OTP
                    </Button>
                  )}
                </Group>

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

          {step === 'forgot-password' && (
            <>
              <Stack align="center" mb="lg">
                <Logo size="lg" showText={false} linkTo="" />
                <Text size="xl" fw={700}>Forgot Password</Text>
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
                <Text size="xl" fw={700}>Enter Reset Code</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Enter the 6-digit code sent to your email
                </Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              <Stack gap="lg" align="center">
                <PinInput
                  length={6}
                  type="number"
                  value={otp}
                  onChange={setOtp}
                  size="lg"
                  oneTimeCode
                />

                <Button fullWidth loading={isLoading} onClick={handleResetOtpVerify} disabled={otp.length !== 6}>
                  Verify Code
                </Button>

                <Group justify="center" gap="xs">
                  <Text size="sm" c="dimmed">Didn't receive code?</Text>
                  {resendTimer > 0 ? (
                    <Text size="sm" c="blue" fw={500}>Resend in {formatTimer(resendTimer)}</Text>
                  ) : (
                    <Button variant="subtle" size="sm" leftSection={<IconRefresh size={14} />} onClick={handleResendOtp} loading={isLoading}>
                      Resend Code
                    </Button>
                  )}
                </Group>
              </Stack>
            </>
          )}

          {step === 'change-password' && (
            <>
              <Stack align="center" mb="lg">
                <Logo size="lg" showText={false} linkTo="" />
                <Text size="xl" fw={700}>Set New Password</Text>
                <Text size="sm" c="dimmed">Create a new password for your account</Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleChangePasswordSubmit}>
                <Stack gap="md">
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

                  <Button type="submit" fullWidth loading={isLoading}>
                    Reset Password
                  </Button>
                </Stack>
              </form>
            </>
          )}
        </Card>
      </Container>
    </Box>
  );
};

export default AuthLogin;
