import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, collections } from '../../firebase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Box, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Chip,
  Avatar
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, MusicNote } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, deleteObject } from 'firebase/storage';

const storage = getStorage();

export default function SongsList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  const [artists, setArtists] = useState({});
  const [genres, setGenres] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchSongs();
    fetchArtists();
    fetchGenres();
  }, []);

  const fetchArtists = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collections.ARTISTS));
      const artistsMap = {};
      querySnapshot.forEach((doc) => {
        artistsMap[doc.id] = doc.data();
      });
      setArtists(artistsMap);
    } catch (error) {
      console.error("Error fetching artists: ", error);
    }
  };

  const fetchGenres = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collections.GENRES));
      const genresMap = {};
      querySnapshot.forEach((doc) => {
        genresMap[doc.id] = doc.data().name;
      });
      setGenres(genresMap);
    } catch (error) {
      console.error("Error fetching genres: ", error);
    }
  };

  const fetchSongs = async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, collections.SONGS), orderBy('title', 'asc'))
      );
      
      const songsList = [];
      for (const doc of querySnapshot.docs) {
        const songData = { id: doc.id, ...doc.data() };
        songsList.push(songData);
      }
      
      setSongs(songsList);
    } catch (error) {
      console.error("Error fetching songs: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (song) => {
    setSongToDelete(song);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!songToDelete) return;
    
    try {
      if (songToDelete.audioUrl) {
        try {
          const audioRef = ref(storage, songToDelete.audioUrl);
          await deleteObject(audioRef);
        } catch (error) {
          console.warn("Error deleting song audio:", error);
        }
      }
      
      await deleteDoc(doc(db, collections.SONGS, songToDelete.id));
      
      setSongs(songs.filter(song => song.id !== songToDelete.id));
    } catch (error) {
      console.error("Error deleting song: ", error);
    } finally {
      setDeleteDialogOpen(false);
      setSongToDelete(null);
    }
  };

  const handleEditClick = (songId) => {
    navigate(`/admin/songs/edit/${songId}`);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Lista de Canciones
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/songs/new')}
          disabled={Object.keys(artists).length === 0}
        >
          Agregar Canción
        </Button>
      </Box>

      {Object.keys(artists).length === 0 && (
        <Box mb={3} p={2} bgcolor="warning.light" borderRadius={1}>
          <Typography variant="body2">
            No hay artistas disponibles. Por favor, crea un artista antes de agregar canciones.
          </Typography>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Portada</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Artista</TableCell>
              <TableCell>Género</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {songs.length > 0 ? (
              songs.map((song) => {
                const artist = artists[song.artistId];
                const genreName = artist && artist.genreId ? genres[artist.genreId] : 'N/A';
                
                return (
                  <TableRow key={song.id}>
                    <TableCell>
                      <Avatar 
                        src={song.coverUrl || (artist ? artist.imageUrl : '')} 
                        variant="rounded"
                        sx={{ width: 50, height: 50 }}
                      >
                        <MusicNote />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {song.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {artist ? (
                        <Chip 
                          label={artist.name} 
                          size="small"
                          avatar={<Avatar src={artist.imageUrl} />}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Artista no encontrado
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {genreName && genreName !== 'N/A' ? (
                        <Chip 
                          label={genreName} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {genreName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDuration(song.duration)}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleEditClick(song.id)}
                        aria-label="editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(song)}
                        aria-label="eliminar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay canciones registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que deseas eliminar la canción "{songToDelete?.title}"? 
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
