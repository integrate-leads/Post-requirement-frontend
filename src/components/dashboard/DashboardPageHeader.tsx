import { Box, Group, Paper, Text, Title, ThemeIcon, type MantineColor } from '@mantine/core';
import type { ReactNode } from 'react';

export interface DashboardPageHeaderProps {
  /** Icon size ~22–24px recommended */
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  /** Right side (e.g. primary button) */
  actions?: ReactNode;
  iconColor?: MantineColor;
  /** Default `lg` matches campaign / email broadcast pages */
  padding?: 'md' | 'lg';
  mb?: string | number;
}

/**
 * Shared page title strip for recruiter & super-admin dashboard routes
 * (gradient card, icon, title, subtitle).
 */
export function DashboardPageHeader({
  icon,
  title,
  description,
  actions,
  iconColor = 'blue',
  padding = 'lg',
  mb = 'xl',
}: DashboardPageHeaderProps) {
  return (
    <Paper
      withBorder
      p={padding}
      mb={mb}
      radius="md"
      style={{
        background: 'linear-gradient(135deg, #f8fbff 0%, #f1f8ff 100%)',
        borderColor: '#dbeafe',
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <ThemeIcon variant="light" color={iconColor} radius="md" size={48}>
            {icon}
          </ThemeIcon>
          <Box style={{ minWidth: 0 }}>
            <Title order={2} size="h2" fw={700} lh={1.2}>
              {title}
            </Title>
            {description != null && description !== '' && (
              <Text c="dimmed" size="sm" mt={10} maw={720} lh={1.55}>
                {description}
              </Text>
            )}
          </Box>
        </Group>
        {actions ? <Box style={{ flexShrink: 0 }}>{actions}</Box> : null}
      </Group>
    </Paper>
  );
}
