'use client';

import React from 'react';
import { DateInput } from '@mantine/dates';
import { Box, Text } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';

export interface SmartDatetimeInputProps {
  value?: Date | null;
  showCalendar?: boolean;
  showTimePicker?: boolean;
  onValueChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
  /** Country for display format (USA: MM/dd/yyyy, India: dd/MM/yyyy) */
  country?: string;
}

export function SmartDatetimeInput({
  value,
  showCalendar = true,
  showTimePicker = false,
  onValueChange,
  placeholder = 'Enter a date',
  className,
  label,
  minDate,
  maxDate,
  clearable = true,
  country = 'USA',
}: SmartDatetimeInputProps) {
  const valueFormat = country === 'India' ? 'DD/MM/YYYY' : 'MM/DD/YYYY';

  const handleChange = (date: Date | null) => {
    onValueChange(date ?? undefined);
  };

  return (
    <Box className={className} style={{ width: '100%', minWidth: 0 }}>
      {label && (
        <Text size="sm" fw={500} mb={4}>
          {label}
        </Text>
      )}
      <DateInput
        value={value ?? null}
        onChange={handleChange}
        placeholder={placeholder}
        valueFormat={valueFormat}
        minDate={minDate}
        maxDate={maxDate}
        clearable={clearable}
        allowDeselect={clearable}
        leftSection={<IconCalendar size={18} style={{ color: 'var(--mantine-color-dimmed)' }} />}
        leftSectionPointerEvents="none"
        popoverProps={{ withinPortal: true, zIndex: 1000 }}
        size="md"
        style={{ width: '100%' }}
        styles={{
          input: {
            cursor: 'pointer',
            width: '100%',
          },
        }}
      />
    </Box>
  );
}

export default SmartDatetimeInput;
