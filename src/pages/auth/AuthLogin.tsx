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
  Anchor,
  Paper
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle, IconArrowLeft, IconUser, IconPhone, IconBuilding, IconWorld, IconUpload, IconRefresh } from '@tabler/icons-react';
import { useAuth, SignupData } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { 
  validateEmail, 
  validateName, 
  validatePassword, 
  validatePhone, 
  validateCompanyName, 
  validateWebsite,
  validateAddress
} from '@/lib/validations';

type Step = 'credentials' | 'signup' | 'otp' | 'forgot-password' | 'reset-otp' | 'change-password';

const COUNTRY_CODES = [
  { value: '+1', label: 'USA (+1)' },
  { value: '+91', label: 'India (+91)' },
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
  
  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [signupEmailError, setSignupEmailError] = useState('');
  const [signupPasswordError, setSignupPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');
  
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

  // Real-time validation handlers
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) {
      const result = validateEmail(value);
      setEmailError(result.isValid ? '' : result.error);
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const result = validatePassword(value);
      setPasswordError(result.isValid ? '' : result.error);
    } else {
      setPasswordError('');
    }
  };

  const handleNameChange = (value: string) => {
    setFullName(value);
    if (value) {
      const result = validateName(value);
      setNameError(result.isValid ? '' : result.error);
    } else {
      setNameError('');
    }
  };

  // List of common social/personal email domains
  const SOCIAL_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com',
    'yandex.com', 'gmx.com', 'msn.com', 'me.com', 'inbox.com'
  ];

  const isCompanyEmail = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return !SOCIAL_EMAIL_DOMAINS.includes(domain);
  };

  const handleSignupEmailChange = (value: string) => {
    setSignupEmail(value);
    if (value) {
      const result = validateEmail(value);
      if (!result.isValid) {
        setSignupEmailError(result.error);
      } else {
        // Check email type based on user type
        const isCompany = isCompanyEmail(value);
        if (userType === 'recruiter' && !isCompany) {
          setSignupEmailError('Please enter official mail id');
        } else if (userType === 'freelancer' && isCompany) {
          setSignupEmailError('If you have official mail then Select the IT Recruiter option or enter personal mail');
        } else {
          setSignupEmailError('');
        }
      }
    } else {
      setSignupEmailError('');
    }
  };

  // Re-validate email when user type changes
  useEffect(() => {
    if (signupEmail) {
      handleSignupEmailChange(signupEmail);
    }
  }, [userType]);

  const handleSignupPasswordChange = (value: string) => {
    setSignupPassword(value);
    if (value) {
      const result = validatePassword(value);
      setSignupPasswordError(result.isValid ? '' : result.error);
    } else {
      setSignupPasswordError('');
    }
    // Also validate confirm password
    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && value !== signupPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setPhone(digitsOnly);
    if (digitsOnly) {
      const result = validatePhone(digitsOnly, countryCode);
      setPhoneError(result.isValid ? '' : result.error);
    } else {
      setPhoneError('');
    }
  };

  const handleCompanyChange = (value: string) => {
    setCompany(value);
    if (value) {
      const result = validateCompanyName(value);
      setCompanyError(result.isValid ? '' : result.error);
    } else {
      setCompanyError('');
    }
  };

  const handleWebsiteChange = (value: string) => {
    setCompanyWebsite(value);
    if (value) {
      const result = validateWebsite(value);
      setWebsiteError(result.isValid ? '' : result.error);
    } else {
      setWebsiteError('');
    }
  };

  const handleAddressChange = (value: string) => {
    setPostalAddress(value);
    if (value) {
      const result = validateAddress(value);
      setAddressError(result.isValid ? '' : result.error);
    } else {
      setAddressError('');
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (value) {
      const result = validatePassword(value);
      setNewPasswordError(result.isValid ? '' : result.error);
    } else {
      setNewPasswordError('');
    }
    if (confirmNewPassword && value !== confirmNewPassword) {
      setConfirmNewPasswordError('Passwords do not match');
    } else {
      setConfirmNewPasswordError('');
    }
  };

  const handleConfirmNewPasswordChange = (value: string) => {
    setConfirmNewPassword(value);
    if (value && value !== newPassword) {
      setConfirmNewPasswordError('Passwords do not match');
    } else {
      setConfirmNewPasswordError('');
    }
  };

  // Revalidate phone when country code changes
  useEffect(() => {
    if (phone) {
      const result = validatePhone(phone, countryCode);
      setPhoneError(result.isValid ? '' : result.error);
    }
  }, [countryCode, phone]);

  // Demo credentials based on route
  const getDemoCredentials = () => {
    if (isSuperAdminRoute) {
      return { email: 'superadmin@integrateleads.com', password: 'admin123' };
    }
    return { email: 'admin@integrateleads.com', password: 'admin123' };
  };

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
      if (isSuperAdminRoute) {
        navigate('/super-admin/dashboard');
      } else {
        navigate('/recruiter/dashboard');
      }
    }
  }, [isAuthenticated, navigate, isSuperAdminRoute]);

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
    
    // Validate before submit
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    
    if (!emailResult.isValid) {
      setEmailError(emailResult.error);
      return;
    }
    if (!passwordResult.isValid) {
      setPasswordError(passwordResult.error);
      return;
    }
    
    setIsLoading(true);

    const result = await login(email, password, isSuperAdminRoute);
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
    
    // Validate all fields
    const nameResult = validateName(fullName);
    const emailResult = validateEmail(signupEmail);
    const passwordResult = validatePassword(signupPassword);
    const phoneResult = validatePhone(phone, countryCode);
    
    let hasError = false;
    
    if (!nameResult.isValid) {
      setNameError(nameResult.error);
      hasError = true;
    }
    if (!emailResult.isValid) {
      setSignupEmailError(emailResult.error);
      hasError = true;
    }
    if (!passwordResult.isValid) {
      setSignupPasswordError(passwordResult.error);
      hasError = true;
    }
    if (!phoneResult.isValid) {
      setPhoneError(phoneResult.error);
      hasError = true;
    }
    
    if (signupPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }
    
    if (userType === 'recruiter') {
      const companyResult = validateCompanyName(company);
      if (!companyResult.isValid) {
        setCompanyError(companyResult.error);
        hasError = true;
      }
      if (companyWebsite) {
        const websiteResult = validateWebsite(companyWebsite);
        if (!websiteResult.isValid) {
          setWebsiteError(websiteResult.error);
          hasError = true;
        }
      }
    } else {
      const addressResult = validateAddress(postalAddress);
      if (!addressResult.isValid) {
        setAddressError(addressResult.error);
        hasError = true;
      }
      if (!idProof) {
        setError('Please upload an ID proof document');
        hasError = true;
      }
    }
    
    if (hasError) return;

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
      if (isSuperAdminRoute) {
        navigate('/super-admin/dashboard');
      } else {
        navigate('/recruiter/dashboard');
      }
    } else {
      setError(result.error || 'Invalid OTP. Please try again.');
      setOtp('');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setEmailError(emailResult.error);
      return;
    }
    
    setIsLoading(true);

    const result = await forgotPassword(email, isSuperAdminRoute);
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
    
    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      setNewPasswordError(passwordResult.error);
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setConfirmNewPasswordError('Passwords do not match');
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
    // Clear errors
    setNameError('');
    setPhoneError('');
    setCompanyError('');
    setWebsiteError('');
    setAddressError('');
    setSignupEmailError('');
    setSignupPasswordError('');
    setConfirmPasswordError('');
  };

  const getLoginPath = () => isSuperAdminRoute ? '/super-admin/login' : '/recruiter/login';
  const getTitle = () => isSuperAdminRoute ? 'Super Admin Login' : 'Recruiter Login';
  const getSubtitle = () => isSuperAdminRoute ? 'Sign in to admin dashboard' : 'Sign in to your Integrate Leads account';

  const getOtpEmail = () => {
    if (step === 'otp' || step === 'reset-otp') {
      return email || signupEmail || '';
    }
    return '';
  };

  const demoCredentials = getDemoCredentials();

  return (
    <Box 
      mih="calc(100vh - 200px)" 
      bg="gray.0" 
      py="xl"
      px="xs"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <Container size="sm" w="100%">
        <Card shadow="md" p="lg" radius="md">
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

              <Paper p="sm" bg="blue.0" radius="md" mb="md" withBorder style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                <Text size="xs" fw={600} c="blue.7" mb={4}>Demo Credentials:</Text>
                <Text size="xs" c="blue.6">Email: {demoCredentials.email}</Text>
                <Text size="xs" c="blue.6">Password: {demoCredentials.password}</Text>
              </Paper>

              <form onSubmit={handleCredentialsSubmit}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder={isSuperAdminRoute ? 'superadmin@integrateleads.com' : 'your@email.com'}
                    leftSection={<IconMail size={16} />}
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    error={emailError}
                    required
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    leftSection={<IconLock size={16} />}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    error={passwordError}
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
                        setEmailError('');
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
                    onChange={(e) => handleNameChange(e.target.value)}
                    error={nameError}
                    required
                  />

                  <TextInput
                    label={userType === 'recruiter' ? 'Official Email ID' : 'Email ID'}
                    placeholder="your@email.com"
                    leftSection={<IconMail size={16} />}
                    value={signupEmail}
                    onChange={(e) => handleSignupEmailChange(e.target.value)}
                    error={signupEmailError}
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
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        error={phoneError}
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
                        onChange={(e) => handleCompanyChange(e.target.value)}
                        error={companyError}
                        required
                      />
                      <TextInput
                        label="Company Website"
                        placeholder="https://company.com"
                        leftSection={<IconWorld size={16} />}
                        value={companyWebsite}
                        onChange={(e) => handleWebsiteChange(e.target.value)}
                        error={websiteError}
                      />
                    </>
                  ) : (
                    <>
                      <Textarea
                        label="Postal Address"
                        placeholder="Enter your postal address"
                        value={postalAddress}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        error={addressError}
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
                    onChange={(e) => handleSignupPasswordChange(e.target.value)}
                    error={signupPasswordError}
                    required
                  />

                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    leftSection={<IconLock size={16} />}
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    error={confirmPasswordError}
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
                <Text size="sm" c="dimmed" ta="center" px="xs">
                  Enter the 6-digit code sent to{' '}
                  <Text span fw={600} c="blue">
                    {getOtpEmail()}
                  </Text>
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

              <Stack gap="xl" align="center">
                <Box w="100%" style={{ display: 'flex', justifyContent: 'center' }}>
                  <PinInput
                    length={6}
                    type="number"
                    value={otp}
                    onChange={setOtp}
                    size="md"
                    oneTimeCode
                    styles={(theme) => ({
                      root: {
                        gap: 8,
                        '@media (max-width: 480px)': {
                          gap: 4,
                        },
                      },
                      input: {
                        width: 48,
                        minWidth: 48,
                        height: 56,
                        fontSize: 20,
                        fontWeight: 600,
                        borderRadius: 8,
                        [`@media (max-width: 480px)`]: {
                          width: 36,
                          minWidth: 36,
                          height: 44,
                          fontSize: 16,
                        },
                      },
                    })}
                  />
                </Box>

                <Group justify="center" w="100%">
                  <Button loading={isLoading} onClick={handleOtpSubmit} disabled={otp.length !== 6} style={{ minWidth: 200 }}>
                    Verify OTP
                  </Button>
                </Group>

                <Group justify="center" gap="xs" wrap="wrap">
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
                    onChange={(e) => handleEmailChange(e.target.value)}
                    error={emailError}
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
                      setEmailError('');
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
                <Text size="sm" c="dimmed" ta="center" px="xs">
                  Enter the 6-digit code sent to{' '}
                  <Text span fw={600} c="blue">
                    {getOtpEmail()}
                  </Text>
                </Text>
              </Stack>

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
                  {error}
                </Alert>
              )}

              <Stack gap="lg" align="center">
                <Box w="100%" style={{ display: 'flex', justifyContent: 'center' }}>
                  <PinInput
                    length={6}
                    type="number"
                    value={otp}
                    onChange={setOtp}
                    size="md"
                    oneTimeCode
                    styles={(theme) => ({
                      root: {
                        gap: 8,
                        '@media (max-width: 480px)': {
                          gap: 4,
                        },
                      },
                      input: {
                        width: 48,
                        minWidth: 48,
                        height: 56,
                        fontSize: 20,
                        fontWeight: 600,
                        borderRadius: 8,
                        [`@media (max-width: 480px)`]: {
                          width: 36,
                          minWidth: 36,
                          height: 44,
                          fontSize: 16,
                        },
                      },
                    })}
                  />
                </Box>

                <Group justify="center" w="100%">
                  <Button loading={isLoading} onClick={handleResetOtpVerify} disabled={otp.length !== 6} style={{ minWidth: 200 }}>
                    Verify Code
                  </Button>
                </Group>

                <Group justify="center" gap="xs" wrap="wrap">
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
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    error={newPasswordError}
                    required
                  />

                  <PasswordInput
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    leftSection={<IconLock size={16} />}
                    value={confirmNewPassword}
                    onChange={(e) => handleConfirmNewPasswordChange(e.target.value)}
                    error={confirmNewPasswordError}
                    required
                  />

                  <Group justify="center">
                    <Button type="submit" loading={isLoading} style={{ minWidth: 200 }}>
                      Reset Password
                    </Button>
                  </Group>
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
