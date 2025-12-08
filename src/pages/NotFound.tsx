import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Box, Container, Title, Text, Button, Stack } from '@mantine/core';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Box mih="100vh" bg="gray.0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container size="xs">
        <Stack align="center" ta="center">
          <Title order={1} size={80} c="blue">404</Title>
          <Title order={2}>Page not found</Title>
          <Text c="dimmed" mb="lg">
            Oops! The page you're looking for doesn't exist.
          </Text>
          <Button component={Link} to="/">
            Return to Home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default NotFound;