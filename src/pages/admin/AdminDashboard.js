import React from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PeopleIcon from '@mui/icons-material/People';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const adminCards = [
    {
      title: 'Géneros',
      description: 'Administrar géneros musicales',
      icon: <MusicNoteIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      path: '/admin/genres'
    },
    {
      title: 'Artistas',
      description: 'Gestionar artistas',
      icon: <PeopleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      path: '/admin/artists'
    },
    {
      title: 'Canciones',
      description: 'Administrar canciones',
      icon: <LibraryMusicIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      path: '/admin/songs'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Panel de Administración
      </Typography>
      
      <Typography variant="body1" paragraph>
        Bienvenido al panel de administración. Selecciona una opción para comenzar.
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {adminCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                },
              }}
            >
              <Box sx={{ mb: 2 }}>
                {card.icon}
              </Box>
              <Typography variant="h5" component="h2" gutterBottom>
                {card.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                {card.description}
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate(card.path)}
                fullWidth
              >
                Administrar
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
