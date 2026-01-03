import React from 'react';
import { Box, Text, ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

interface DatePickerProps {
    label: string;
    placeholder?: string;
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    country?: string;
    clearable?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
    label,
    placeholder = 'Select date',
    value,
    onChange,
    country = 'USA',
    clearable = true,
}) => {
    // Convert Date to YYYY-MM-DD format for input value
    const dateToInputValue = (date: Date | undefined): string => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Convert input value to Date
    const inputValueToDate = (value: string): Date | undefined => {
        if (!value) return undefined;
        return new Date(value);
    };

    // Format date for display
    const formatDateForDisplay = (date: Date | undefined): string => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return country === 'USA' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = inputValueToDate(e.target.value);
        onChange(newDate);
    };

    const handleClear = () => {
        onChange(undefined);
    };

    return (
        <Box style={{ position: 'relative' }}>
            <Text size="sm" fw={500} mb={4}>
                {label}
            </Text>
            <Box style={{ position: 'relative' }}>
                <input
                    type="date"
                    value={dateToInputValue(value)}
                    onChange={handleChange}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        paddingRight: clearable && value ? '36px' : '12px',
                        fontSize: '14px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        height: '40px',
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#228be6';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#ced4da';
                    }}
                />
                {clearable && value && (
                    <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        onClick={handleClear}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                        }}
                    >
                        <IconX size={16} />
                    </ActionIcon>
                )}
            </Box>
            {value && (
                <Text size="xs" c="dimmed" mt={4}>
                    Selected: {formatDateForDisplay(value)}
                </Text>
            )}
        </Box>
    );
};

export default DatePicker;
