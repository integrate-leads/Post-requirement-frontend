import React from 'react';
import { Box, Text } from '@mantine/core';

interface FormattedTextProps {
  text: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  c?: string;
  className?: string;
}

/**
 * Renders text with proper formatting for bullet points, numbered lists, and line breaks.
 * Supports:
 * - Bullet points: • or - at the start of a line
 * - Numbered lists: 1. 2. 3. etc.
 * - Line breaks preserved
 * - Tables (basic) using | separator
 */
const FormattedText: React.FC<FormattedTextProps> = ({ 
  text, 
  size = 'sm', 
  c,
  className 
}) => {
  if (!text) return null;

  // Split by lines and process
  const lines = text.split('\n');
  
  // Check if text contains table-like content (lines with | separators)
  const hasTable = lines.some(line => line.includes('|') && line.split('|').length >= 3);

  if (hasTable) {
    // Process as table
    const tableLines = lines.filter(line => line.includes('|'));
    const nonTableLines = lines.filter(line => !line.includes('|'));
    
    return (
      <Box className={className}>
        {nonTableLines.length > 0 && (
          <Text size={size} c={c} style={{ whiteSpace: 'pre-wrap' }} mb="sm">
            {nonTableLines.join('\n')}
          </Text>
        )}
        {tableLines.length > 0 && (
          <Box 
            component="table" 
            style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: 'var(--mantine-font-size-sm)',
              marginTop: '8px'
            }}
          >
            <tbody>
              {tableLines.map((line, idx) => {
                const cells = line.split('|').filter(cell => cell.trim());
                const isHeader = idx === 0 || line.includes('---');
                
                if (line.includes('---')) return null; // Skip separator line
                
                return (
                  <tr key={idx}>
                    {cells.map((cell, cellIdx) => (
                      <Box
                        component={isHeader && idx === 0 ? 'th' : 'td'}
                        key={cellIdx}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid var(--mantine-color-gray-3)',
                          backgroundColor: isHeader && idx === 0 ? 'var(--mantine-color-gray-0)' : 'transparent',
                          fontWeight: isHeader && idx === 0 ? 600 : 400,
                          textAlign: 'left'
                        }}
                      >
                        {cell.trim()}
                      </Box>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </Box>
        )}
      </Box>
    );
  }

  // Regular text with bullet points and formatting
  return (
    <Text 
      size={size} 
      c={c} 
      className={className}
      style={{ 
        whiteSpace: 'pre-wrap',
        lineHeight: 1.7
      }}
    >
      {text}
    </Text>
  );
};

export default FormattedText;
