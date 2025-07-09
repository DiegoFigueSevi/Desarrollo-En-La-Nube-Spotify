import React from 'react';
import { Box, Container, CssBaseline, Typography } from '@mui/material';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, py: 4, backgroundColor: 'background.default' }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Container maxWidth="xl">
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Spotify Clone - Todos los derechos reservados
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
