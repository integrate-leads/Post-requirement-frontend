import React from 'react';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';

interface DatePickerProps {
  label: string;
  placeholder?: string;
  value: Date | null | undefined;
  onChange: (value: Date | null) => void;
  country?: string;
  clearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  placeholder = 'Select date',
  value,
  onChange,
  country = 'USA',
  clearable = true,
  minDate,
  maxDate,
  required = false,
}) => {
  // Determine date format based on country
  const getDateFormat = () => {
    switch (country) {
      case 'India':
        return 'DD/MM/YYYY';
      case 'USA':
      default:
        return 'MM/DD/YYYY';
    }
  };

  return (
    <DatePickerInput
      label={label}
      placeholder={placeholder}
      value={value ?? null}
      onChange={onChange}
      valueFormat={getDateFormat()}
      leftSection={<IconCalendar size={16} stroke={1.5} />}
      clearable={clearable}
      minDate={minDate}
      maxDate={maxDate}
      required={required}
      popoverProps={{
        withinPortal: true,
        zIndex: 1000,
        position: 'bottom-start',
      }}
      styles={{
        input: {
          height: '40px',
        },
      }}
    />
  );
};

export default DatePicker;
