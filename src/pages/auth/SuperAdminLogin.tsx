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
  Anchor
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle, IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

type Step = 'credentials' | 'otp' | 'forgot-password' | 'reset-otp' | 'change-password';

const RESEND_TIMER_SECONDS = 300;

const SuperAdminLogin: React.FC = () => {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  
  const { login, verifyOtp, resendOtp, forgotPassword, resetPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
                <Text size="xl" fw={700}>Super Admin Login</Text>
                <Text size="sm" c="dimmed">Sign in to admin dashboard</Text>
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
                    placeholder="superadmin@integrateleads.com"
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

export default SuperAdminLogin;
