import React from 'react';
import { Box } from '@mantine/core';

interface FormattedTextProps {
  text: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  c?: string;
  className?: string;
}

// Font size map
const SIZE_MAP: Record<string, string> = {
  xs: 'var(--mantine-font-size-xs)',
  sm: 'var(--mantine-font-size-sm)',
  md: 'var(--mantine-font-size-md)',
  lg: 'var(--mantine-font-size-lg)',
  xl: 'var(--mantine-font-size-xl)',
};

/**
 * Render inline markdown: **bold**, *italic*, `code`, ==highlight==
 */
function renderInline(text: string): React.ReactNode[] {
  // Pattern: **bold**, *italic*, `code`, ==highlight==
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|==(.+?)==)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2] !== undefined) {
      // **bold**
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // *italic*
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      // `code`
      parts.push(
        <code
          key={match.index}
          style={{
            background: 'var(--mantine-color-gray-1)',
            padding: '1px 5px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: '0.9em',
          }}
        >
          {match[4]}
        </code>
      );
    } else if (match[5] !== undefined) {
      // ==highlight==
      parts.push(
        <mark
          key={match.index}
          style={{
            background: 'var(--mantine-color-yellow-2)',
            borderRadius: 3,
            padding: '0 2px',
          }}
        >
          {match[5]}
        </mark>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length > 0 ? parts : [text];
}

type LineType =
  | { type: 'h1'; content: string }
  | { type: 'h2'; content: string }
  | { type: 'h3'; content: string }
  | { type: 'bullet'; content: string; depth: number }
  | { type: 'numbered'; content: string; num: number }
  | { type: 'hr' }
  | { type: 'table_row'; cells: string[]; isHeader: boolean }
  | { type: 'blank' }
  | { type: 'text'; content: string };

function parseLine(line: string): LineType {
  // Headings
  if (/^###\s+/.test(line)) return { type: 'h3', content: line.replace(/^###\s+/, '') };
  if (/^##\s+/.test(line)) return { type: 'h2', content: line.replace(/^##\s+/, '') };
  if (/^#\s+/.test(line)) return { type: 'h1', content: line.replace(/^#\s+/, '') };

  // Horizontal rule
  if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) return { type: 'hr' };

  // Bullet list — handles all real-world ODT/Word paste formats:
  //   "• text"          plain bullet + space
  //   "\t•\ttext"       tab + bullet + tab  (LibreOffice default)
  //   "\t\t• text"      indented bullet
  //   "- text"          markdown dash
  //   "* text"          markdown star
  // Unicode bullets covered: •·●◦‣⁃▪▸➤➢o (Word/LibreOffice variants)
  const BULLETS = '[\\u2022\\u00b7\\u25cf\\u25e6\\u2023\\u2043\\u25aa\\u25b8\\u27a4\\u27a2\\-\\*\\+o]';
  const bulletMatch = line.match(new RegExp(`^([ \\t]*?)${BULLETS}[ \\t]*(.+)$`));
  if (bulletMatch) {
    // Each tab or every 2 spaces = one indent level
    const indent = bulletMatch[1].replace(/\t/g, '  ');
    const depth = Math.floor(indent.length / 2);
    return { type: 'bullet', content: bulletMatch[2].trimStart(), depth };
  }

  // Numbered list
  const numberedMatch = line.match(/^[\t ]*(\d+)[.)]\s+(.+)/);
  if (numberedMatch) {
    return { type: 'numbered', content: numberedMatch[2], num: parseInt(numberedMatch[1]) };
  }

  // Table row
  if (line.includes('|') && line.split('|').length >= 3) {
    const isSeparator = /^\|?[\s\-:|]+\|/.test(line);
    if (isSeparator) return { type: 'blank' }; // skip separator
    const cleanedCells = line.split('|').slice(1, -1).map(c => c.trim());
    return { type: 'table_row', cells: cleanedCells, isHeader: false };
  }

  // Blank line
  if (line.trim() === '') return { type: 'blank' };

  // Regular text — strip any leading tab that isn't a bullet (ODT paragraph indent)
  return { type: 'text', content: line.trimStart() };
}



/**
 * Renders text with full markdown-like formatting:
 * - Headings: # H1, ## H2, ### H3
 * - Bold: **text**, Italic: *text*
 * - Inline code: `code`
 * - Highlight: ==text==
 * - Bullets: •, -, *, + at start of line
 * - Numbered lists: 1. 2. 3.
 * - Tables: | col | col |
 * - Dividers: ---
 */
const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  size = 'sm',
  c,
  className,
}) => {
  if (!text) return null;

  const fontSize = SIZE_MAP[size] || SIZE_MAP.sm;
  const color = c ? `var(--mantine-color-${c.replace('.', '-')})` : undefined;

  const lines = text.split('\n');
  const parsed = lines.map(parseLine);

  // Detect if first table row should be header (followed by separator)
  for (let i = 0; i < parsed.length; i++) {
    if (
      parsed[i].type === 'table_row' &&
      i + 1 < parsed.length &&
      parsed[i + 1].type === 'blank' // separator was converted to blank
    ) {
      // Check original line
      if (i + 1 < lines.length && /^\|?[\s\-:|]+\|/.test(lines[i + 1])) {
        (parsed[i] as { type: 'table_row'; cells: string[]; isHeader: boolean }).isHeader = true;
      }
    }
  }

  const elements: React.ReactNode[] = [];
  let tableRows: Array<{ cells: string[]; isHeader: boolean }> = [];
  let listItems: Array<{ content: string; depth: number }> = [];
  let numberedItems: Array<{ content: string; num: number }> = [];

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return;
    elements.push(
      <Box
        key={`table-${key}`}
        component="div"
        style={{ overflowX: 'auto', marginBottom: 12 }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize,
            color,
          }}
        >
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri}>
                {row.cells.map((cell, ci) => (
                  <Box
                    key={ci}
                    component={row.isHeader ? 'th' : 'td'}
                    style={{
                      padding: '7px 12px',
                      border: '1px solid var(--mantine-color-gray-3)',
                      background: row.isHeader
                        ? 'var(--mantine-color-gray-1)'
                        : 'transparent',
                      fontWeight: row.isHeader ? 600 : 400,
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {renderInline(cell)}
                  </Box>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    );
    tableRows = [];
  };

  const flushBullets = (key: number) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul
        key={`ul-${key}`}
        style={{
          margin: '4px 0 10px 0',
          paddingLeft: 24,
          fontSize,
          color,
          lineHeight: 1.7,
          listStyleType: 'disc',
        }}
      >
        {listItems.map((item, i) => (
          <li key={i} style={{ paddingLeft: item.depth * 12, marginBottom: 2, display: 'list-item' }}>
            {renderInline(item.content)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  const flushNumbered = (key: number) => {
    if (numberedItems.length === 0) return;
    elements.push(
      <ol
        key={`ol-${key}`}
        start={numberedItems[0].num}
        style={{
          margin: '4px 0 10px 0',
          paddingLeft: 24,
          fontSize,
          color,
          lineHeight: 1.7,
          listStyleType: 'decimal',
        }}
      >
        {numberedItems.map((item, i) => (
          <li key={i} style={{ marginBottom: 2, display: 'list-item' }}>
            {renderInline(item.content)}
          </li>
        ))}
      </ol>
    );
    numberedItems = [];
  };

  parsed.forEach((line, i) => {
    if (line.type !== 'bullet') flushBullets(i);
    if (line.type !== 'numbered') flushNumbered(i);
    if (line.type !== 'table_row') flushTable(i);

    switch (line.type) {
      case 'h1':
        elements.push(
          <div
            key={i}
            style={{
              fontSize: 'calc(' + fontSize + ' * 1.5)',
              fontWeight: 700,
              color,
              marginTop: 14,
              marginBottom: 4,
              lineHeight: 1.3,
            }}
          >
            {renderInline(line.content)}
          </div>
        );
        break;

      case 'h2':
        elements.push(
          <div
            key={i}
            style={{
              fontSize: 'calc(' + fontSize + ' * 1.25)',
              fontWeight: 700,
              color,
              marginTop: 12,
              marginBottom: 4,
              lineHeight: 1.4,
            }}
          >
            {renderInline(line.content)}
          </div>
        );
        break;

      case 'h3':
        elements.push(
          <div
            key={i}
            style={{
              fontSize: 'calc(' + fontSize + ' * 1.1)',
              fontWeight: 600,
              color,
              marginTop: 10,
              marginBottom: 4,
              lineHeight: 1.5,
            }}
          >
            {renderInline(line.content)}
          </div>
        );
        break;

      case 'hr':
        elements.push(
          <hr
            key={i}
            style={{
              border: 'none',
              borderTop: '1px solid var(--mantine-color-gray-3)',
              margin: '10px 0',
            }}
          />
        );
        break;

      case 'bullet':
        listItems.push({ content: line.content, depth: line.depth });
        break;

      case 'numbered':
        numberedItems.push({ content: line.content, num: line.num });
        break;

      case 'table_row':
        tableRows.push({ cells: line.cells, isHeader: line.isHeader });
        break;

      case 'blank':
        elements.push(<div key={i} style={{ height: 6 }} />);
        break;

      case 'text':
      default:
        elements.push(
          <div
            key={i}
            style={{
              fontSize,
              color,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {renderInline(line.content)}
          </div>
        );
        break;
    }
  });

  // Flush any remaining lists or tables
  flushBullets(parsed.length);
  flushNumbered(parsed.length + 1);
  flushTable(parsed.length + 2);

  return (
    <Box className={className} style={{ fontFamily: 'inherit' }}>
      {elements}
    </Box>
  );
};

export default FormattedText;
