'use client';

import React, { useRef } from 'react';
import { Box, Text, UnstyledButton, Group } from '@mantine/core';
import { IconPaperclip, IconUpload, IconX } from '@tabler/icons-react';

export interface FileUploaderProps {
  value: File[] | File | null;
  onValueChange: (files: File[] | File | null) => void;
  accept?: Record<string, string[]> | string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  children: React.ReactNode;
  dropzoneOptions?: {
    accept?: Record<string, string[]> | string;
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number;
  };
}

export function FileUploader({
  value,
  onValueChange,
  accept = { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
  multiple = false,
  maxFiles = 4,
  maxSize = 5 * 1024 * 1024,
  orientation = 'vertical',
  className,
  children,
  dropzoneOptions,
}: FileUploaderProps) {
  const opts = dropzoneOptions ?? { accept, multiple, maxFiles, maxSize };
  return (
    <Box className={className} data-orientation={orientation}>
      {children}
    </Box>
  );
}

export interface FileInputProps {
  className?: string;
  parentclass?: string;
  children: React.ReactNode;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: File[] | File | null) => void;
  disabled?: boolean;
}

export function FileInput({
  className,
  parentclass,
  children,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  multiple = false,
  onChange,
  disabled,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      onChange?.(null);
    } else {
      onChange?.(multiple ? Array.from(files) : (files[0] ?? null));
    }
    e.target.value = '';
  };
  return (
    <Box className={parentclass} component="span">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <UnstyledButton className={className} onClick={handleClick} disabled={disabled}>
        {children}
      </UnstyledButton>
    </Box>
  );
}

export interface FileUploaderContentProps {
  className?: string;
  children: React.ReactNode;
}

export function FileUploaderContent({ className, children }: FileUploaderContentProps) {
  return (
    <Group gap="xs" className={className} wrap="wrap">
      {children}
    </Group>
  );
}

export interface FileUploaderItemProps {
  index?: number;
  className?: string;
  file?: File;
  'aria-roledescription'?: string;
  onRemove?: () => void;
  children?: React.ReactNode;
}

export function FileUploaderItem({
  index = 0,
  className,
  file,
  'aria-roledescription': ariaRole,
  onRemove,
  children,
}: FileUploaderItemProps) {
  const isImage = file?.type.startsWith('image/');
  const url = file && isImage ? URL.createObjectURL(file) : null;
  return (
    <Box
      className={className}
      role="img"
      aria-roledescription={ariaRole}
      style={{
        position: 'relative',
        flexShrink: 0,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid #e9ecef',
        backgroundColor: 'var(--mantine-color-gray-0)',
      }}
    >
      {children ?? (
        <>
          {url ? (
            <img
              src={url}
              alt={file?.name ?? ''}
              style={{ width: 48, height: 48, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box
              style={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--mantine-color-blue-1)',
              }}
            >
              <IconUpload size={20} color="var(--mantine-color-blue-6)" />
            </Box>
          )}
          {onRemove && (
            <UnstyledButton
              onClick={onRemove}
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconX size={12} />
            </UnstyledButton>
          )}
        </>
      )}
    </Box>
  );
}

/** Single-file document block for India job application (Documents section). */
export interface DocumentUploadBlockProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  required?: boolean;
  uploading?: boolean;
  description?: string;
  error?: string;
  onTouch?: () => void;
}

export function DocumentUploadBlock({
  label,
  value,
  onChange,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  required,
  uploading,
  description,
  error,
  onTouch,
}: DocumentUploadBlockProps) {
  return (
    <Box>
      <Text size="sm" fw={500} mb={4} required={required}>
        {label}
      </Text>
      <Box
        style={{
          border: `1px solid ${error ? 'var(--mantine-color-red-6)' : '#e9ecef'}`,
          borderRadius: 8,
          padding: 8,
          backgroundColor: 'var(--mantine-color-gray-0)',
        }}
      >
        <Group gap="xs" wrap="nowrap">
          <FileInput
            accept={accept}
            multiple={false}
            onChange={(f) => {
              onTouch?.();
              onChange(f as File | null);
            }}
            disabled={uploading}
            className="file-upload-trigger"
            parentclass="file-upload-trigger-wrap"
          >
            <IconPaperclip
              size={value ? 24 : 20}
              style={{
                padding: value ? 6 : 4,
                borderRadius: 6,
                backgroundColor: value ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-blue-6)',
                color: value ? 'var(--mantine-color-blue-6)' : 'white',
              }}
            />
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>Select file</span>
          </FileInput>
          <FileUploaderContent className="flex-1">
            {value && (
              <FileUploaderItem
                file={value}
                onRemove={() => onChange(null)}
                aria-roledescription={`file: ${value.name}`}
              />
            )}
          </FileUploaderContent>
        </Group>
        {(description || error) && (
          <Text size="xs" c={error ? 'red' : 'dimmed'} mt={4}>
            {error ?? description}
          </Text>
        )}
      </Box>
    </Box>
  );
}
