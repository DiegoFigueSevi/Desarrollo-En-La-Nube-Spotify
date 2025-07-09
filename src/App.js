import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import GenrePage from './pages/GenrePage';
import ArtistPage from './pages/ArtistPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminRoutes from './routes/AdminRoutes';
import PrivateRoute from './components/auth/PrivateRoute';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1DB954', // Spotify green
      contrastText: '#fff',
    },
    secondary: {
      main: '#191414', // Spotify black
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          padding: '8px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        autoHideDuration={3000}
      >
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <Layout>
                  <HomePage />
                </Layout>
              } />
              
              <Route path="/genre/:genreId" element={
                <Layout>
                  <GenrePage />
                </Layout>
              } />
              
              <Route path="/artist/:artistId" element={
                <Layout>
                  <ArtistPage />
                </Layout>
              } />
              
              <Route path="/login" element={
                <Layout>
                  <Login />
                </Layout>
              } />
              
              <Route path="/register" element={
                <Layout>
                  <Register />
                </Layout>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <PrivateRoute adminOnly={true}>
                  <Layout>
                    <AdminRoutes />
                  </Layout>
                </PrivateRoute>
              } />
              
              {/* 404 - Not Found */}
              <Route path="*" element={
                <Layout>
                  <Box sx={{ textAlign: 'center', my: 8 }}>
                    <Typography variant="h3" gutterBottom>
                      404 - Página no encontrada
                    </Typography>
                    <Typography variant="body1" paragraph>
                      Lo sentimos, la página que estás buscando no existe.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      component={Link} 
                      to="/"
                      sx={{ mt: 2 }}
                    >
                      Volver al inicio
                    </Button>
                  </Box>
                </Layout>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
