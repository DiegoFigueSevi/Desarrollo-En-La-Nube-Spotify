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
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, deleteObject } from 'firebase/storage';

const storage = getStorage();

export default function ArtistsList() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState(null);
  const [genres, setGenres] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchArtists();
    fetchGenres();
  }, []);

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

  const fetchArtists = async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, collections.ARTISTS), orderBy('name', 'asc'))
      );
      const artistsList = [];
      querySnapshot.forEach((doc) => {
        artistsList.push({ id: doc.id, ...doc.data() });
      });
      setArtists(artistsList);
    } catch (error) {
      console.error("Error fetching artists: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (artist) => {
    setArtistToDelete(artist);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!artistToDelete) return;
    
    try {
      // Delete the artist's image from storage if it exists
      if (artistToDelete.imageUrl) {
        try {
          const imageRef = ref(storage, artistToDelete.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn("Error deleting artist image:", error);
          // Continue with deletion even if image deletion fails
        }
      }
      
      // Delete the artist document
      await deleteDoc(doc(db, collections.ARTISTS, artistToDelete.id));
      
      // Update the UI
      setArtists(artists.filter(artist => artist.id !== artistToDelete.id));
    } catch (error) {
      console.error("Error deleting artist: ", error);
    } finally {
      setDeleteDialogOpen(false);
      setArtistToDelete(null);
    }
  };

  const handleEditClick = (artistId) => {
    navigate(`/admin/artists/edit/${artistId}`);
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
          Lista de Artistas
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/artists/new')}
        >
          Agregar Artista
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Género</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {artists.length > 0 ? (
              artists.map((artist) => (
                <TableRow key={artist.id}>
                  <TableCell>
                    <Box
                      component="img"
                      src={artist.imageUrl || 'https://via.placeholder.com/50?text=No+Image'}
                      alt={artist.name}
                      sx={{ 
                        width: 50, 
                        height: 50, 
                        borderRadius: '50%',
                        objectFit: 'cover' 
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {artist.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {artist.genreId ? (
                      <Chip 
                        label={genres[artist.genreId] || 'Género no encontrado'} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin género
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditClick(artist.id)}
                      aria-label="editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteClick(artist)}
                      aria-label="eliminar"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay artistas registrados
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
            ¿Estás seguro de que deseas eliminar al artista "{artistToDelete?.name}"? 
            Esta acción también eliminará todas las canciones asociadas y no se puede deshacer.
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
