import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, analytics, collections } from '../firebase';
import { logEvent } from 'firebase/analytics';
import { useAnalytics, EVENTS } from '../hooks/useAnalytics';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  IconButton
} from '@mui/material';
import { PlayArrow, Pause, ArrowBack } from '@mui/icons-material';

export default function ArtistPage() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [_, setError] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const fetchArtistAndSongs = async () => {
      try {
        setLoading(true);
        
        const artistDoc = await getDoc(doc(db, collections.ARTISTS, artistId));
        if (!artistDoc.exists()) {
          throw new Error('Artista no encontrado');
        }
        const artistData = { id: artistDoc.id, ...artistDoc.data() };
        setArtist(artistData);
        
        if (analytics) {
          logEvent(analytics, EVENTS.VIEW_ARTIST, {
            artist_id: artistId,
            artist_name: artistData.name
          });
        }
        
        const songsQuery = query(
          collection(db, collections.SONGS),
          where('artistId', '==', artistId)
        );
        const songsSnapshot = await getDocs(songsQuery);
        const songsList = [];
        songsSnapshot.forEach((doc) => {
          songsList.push({ id: doc.id, ...doc.data() });
        });
        setSongs(songsList);
        
        if (analytics) {
          logEvent(analytics, 'artist_songs_loaded', {
            artist_id: artistId,
            song_count: songsList.length
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistAndSongs();
  }, [artistId]);

  const handlePlayPause = (song) => {
    if (currentSong && currentSong.id === song.id) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      
      if (analytics) {
        logEvent(analytics, newIsPlaying ? EVENTS.PLAY_SONG : EVENTS.PAUSE_SONG, {
          song_id: song.id,
          song_title: song.title,
          artist_id: song.artistId,
          artist_name: artist?.name || 'Unknown',
          duration: song.duration || 0
        });
      }
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      
      if (analytics) {
        logEvent(analytics, EVENTS.PLAY_SONG, {
          song_id: song.id,
          song_title: song.title,
          artist_id: song.artistId,
          artist_name: artist?.name || 'Unknown',
          duration: song.duration || 0
        });
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!artist) {
    return (
      <Box textAlign="center" my={4}>
        <Typography variant="h5" color="error">Artista no encontrado</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Volver atrás
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>
      
      <Card sx={{ display: 'flex', mb: 4 }}>
        <CardMedia
          component="img"
          sx={{ width: 250, height: 250, objectFit: 'cover' }}
          image={artist.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
          alt={artist.name}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography component="div" variant="h4">
              {artist.name}
            </Typography>
            {artist.genreName && (
              <Typography variant="subtitle1" color="text.secondary" component="div" gutterBottom>
                Género: {artist.genreName}
              </Typography>
            )}
            {artist.description && (
              <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                {artist.description}
              </Typography>
            )}
          </CardContent>
        </Box>
      </Card>
      
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Canciones
      </Typography>
      
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <React.Fragment key={song.id}>
              <ListItem 
                alignItems="flex-start"
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    aria-label="play"
                    onClick={() => handlePlayPause(song)}
                  >
                    {currentSong?.id === song.id && isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                }
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    cursor: 'pointer'
                  },
                  borderRadius: 1
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    variant="square" 
                    src={song.coverUrl}
                    alt={song.title}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: currentSong?.id === song.id ? 'bold' : 'normal',
                        color: currentSong?.id === song.id ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {song.title}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {song.duration || 'Duración no disponible'}
                    </Typography>
                  }
                />
              </ListItem>
              {index < songs.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, ml: 2 }}>
            No hay canciones disponibles para este artista.
          </Typography>
        )}
      </List>
      
      {currentSong && (
        <Box 
          component="footer" 
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            boxShadow: 3,
            p: 2,
            zIndex: 1200
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <img 
                src={currentSong.coverUrl || 'https://via.placeholder.com/56x56?text=No+Image'} 
                alt={currentSong.title} 
                style={{ width: 56, height: 56, marginRight: 16, borderRadius: 4 }}
              />
              <Box>
                <Typography variant="subtitle1">{currentSong.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {artist.name}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 2, px: 2 }}>
              <audio
                src={currentSong.audioUrl}
                autoPlay={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                style={{ width: '100%' }}
                controls
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
