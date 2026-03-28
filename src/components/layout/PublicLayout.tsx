import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mantine/core';
import Header from './Header';
import Footer from './Footer';

const PublicLayout: React.FC = () => {
  return (
    <Box
      mih="100vh"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      <Header />
      <Box component="main" style={{ flex: 1, minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default PublicLayout;