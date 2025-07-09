import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, collections } from '../firebase';
import { Grid, Card, CardMedia, CardContent, Typography, CardActionArea, Box, CircularProgress, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function GenrePage() {
  const { genreId } = useParams();
  const [genre, setGenre] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGenreAndArtists = async () => {
      try {
        // Fetch genre details
        const genreDoc = await getDoc(doc(db, collections.GENRES, genreId));
        if (!genreDoc.exists()) {
          throw new Error('Género no encontrado');
        }
        setGenre({ id: genreDoc.id, ...genreDoc.data() });

        // Fetch artists for this genre
        const artistsQuery = query(
          collection(db, collections.ARTISTS),
          where('genreId', '==', genreId)
        );
        
        const querySnapshot = await getDocs(artistsQuery);
        const artistsList = [];
        querySnapshot.forEach((doc) => {
          artistsList.push({ id: doc.id, ...doc.data() });
        });
        
        setArtists(artistsList);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenreAndArtists();
  }, [genreId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!genre) {
    return (
      <Box textAlign="center" my={4}>
        <Typography variant="h5" color="error">Género no encontrado</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Volver al inicio
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Volver a géneros
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom>
        {genre.name}
      </Typography>
      
      {genre.description && (
        <Typography variant="body1" paragraph>
          {genre.description}
        </Typography>
      )}
      
      <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 3 }}>
        Artistas
      </Typography>
      
      <Grid container spacing={3}>
        {artists.length > 0 ? (
          artists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea 
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={artist.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={artist.name}
                    sx={{
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.03)',
                      },
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {artist.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {artist.description || 'Sin descripción disponible'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 4 }}>
              No hay artistas disponibles en este género.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
