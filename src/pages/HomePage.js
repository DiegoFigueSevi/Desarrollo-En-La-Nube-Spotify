import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, analytics, collections } from '../firebase';
import { logEvent } from 'firebase/analytics';
import { useAnalytics, EVENTS } from '../hooks/useAnalytics';
import { Grid, Card, CardMedia, CardContent, Typography, Box, CircularProgress } from '@mui/material';

export default function HomePage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  // Error state is kept for future error handling
  // eslint-disable-next-line no-unused-vars
  const [_, setError] = useState('');
  const navigate = useNavigate();
  // trackEvent is kept for future analytics events
  // eslint-disable-next-line no-unused-vars
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, collections.GENRES));
        const genresList = [];
        querySnapshot.forEach((doc) => {
          genresList.push({ id: doc.id, ...doc.data() });
        });
        setGenres(genresList);
        
        // Track genres loaded event
        if (analytics) {
          logEvent(analytics, 'genres_loaded', {
            count: genresList.length
          });
        }
      } catch (err) {
        setError('Error al cargar los géneros');
        console.error('Error fetching genres: ', err);
        
        // Track error event
        if (analytics) {
          logEvent(analytics, 'load_genres_error', {
            error: err.message,
            error_code: err.code
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const handleGenreClick = (genre) => {
    // Track genre click event
    if (analytics) {
      logEvent(analytics, EVENTS.VIEW_GENRE, {
        genre_id: genre.id,
        genre_name: genre.name
      });
    }
    
    navigate(`/genre/${genre.id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Géneros Musicales
      </Typography>
      
      <Grid container spacing={3}>
        {genres.length > 0 ? (
          genres.map((genre) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={genre.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.03)',
                    transition: 'transform 0.2s ease-in-out',
                  },
                }}
                onClick={() => handleGenreClick(genre)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={genre.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={genre.name}
                  sx={{
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease-in-out',
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {genre.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {genre.description || 'Descripción no disponible'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 4 }}>
              No hay géneros disponibles en este momento.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
