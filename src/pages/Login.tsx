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
  Center
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'credentials' | 'otp';

const Login: React.FC = () => {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, verifyOtp } = useAuth();
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

  return (
    <Box 
      mih="calc(100vh - 120px)" 
      bg="gray.0" 
      py="xl"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <Container size="xs" w="100%">
        <Card shadow="md" padding="xl" radius="md">
          {step === 'credentials' ? (
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

              <Text size="xs" c="dimmed" mt="lg" ta="center">
                Demo accounts:<br />
                Super Admin: superadmin@integrateleads.com / admin123<br />
                Recruiter: recruiter@company.com / recruiter123
              </Text>
            </>
          ) : (
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
                  Verify & Login
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