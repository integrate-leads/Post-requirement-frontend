import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Card, Text, Alert, PinInput, Stack } from '@mantine/core';
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-secondary py-12 px-4">
      <Card shadow="md" padding="xl" radius="md" className="w-full max-w-md bg-card">
        {step === 'credentials' ? (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold text-xl">R</span>
              </div>
              <Text size="xl" fw={700} className="text-foreground">Welcome Back</Text>
              <Text size="sm" c="dimmed">Sign in to your RecruitPro account</Text>
            </div>

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
                  classNames={{
                    input: 'bg-background border-input focus:border-primary',
                    label: 'text-foreground'
                  }}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  leftSection={<IconLock size={16} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  classNames={{
                    input: 'bg-background border-input focus:border-primary',
                    label: 'text-foreground'
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Continue
                </Button>
              </Stack>
            </form>

            <Text size="xs" c="dimmed" mt="lg" ta="center">
              Demo accounts:<br />
              Super Admin: superadmin@recruitpro.com / admin123<br />
              Recruiter: recruiter@company.com / recruiter123
            </Text>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <IconLock size={24} className="text-primary-foreground" />
              </div>
              <Text size="xl" fw={700} className="text-foreground">Verify OTP</Text>
              <Text size="sm" c="dimmed">Enter the 6-digit code to continue</Text>
            </div>

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
                classNames={{
                  input: 'bg-background border-input focus:border-primary'
                }}
              />

              <Text size="xs" c="dimmed">
                For demo, use OTP: <strong>123456</strong>
              </Text>

              <Button
                fullWidth
                loading={isLoading}
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Verify & Login
              </Button>

              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => {
                  setStep('credentials');
                  setOtp('');
                  setError('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Back to Login
              </Button>
            </Stack>
          </>
        )}
      </Card>
    </div>
  );
};

export default Login;
