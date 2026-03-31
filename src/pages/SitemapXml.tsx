import React, { useEffect, useMemo } from 'react';
import { Box } from '@mantine/core';
import { buildSitemapXml } from '@/config/sitemap';

/**
 * Renders the same URLs as `public/sitemap.xml` for client-side navigation to `/sitemap.xml`.
 * Direct requests usually receive the static file from `public/` first.
 */
const SitemapXml: React.FC = () => {
  const xml = useMemo(() => buildSitemapXml(), []);

  useEffect(() => {
    document.title = 'Sitemap';
  }, []);

  return (
    <Box
      component="main"
      p="md"
      mih="100vh"
      bg="white"
      aria-label="XML sitemap"
    >
      <Box
        component="pre"
        m={0}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {xml}
      </Box>
    </Box>
  );
};

export default SitemapXml;
