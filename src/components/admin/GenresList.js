import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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
  Typography
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function GenresList() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collections.GENRES));
      const genresList = [];
      querySnapshot.forEach((doc) => {
        genresList.push({ id: doc.id, ...doc.data() });
      });
      setGenres(genresList);
    } catch (error) {
      console.error("Error fetching genres: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (genre) => {
    setGenreToDelete(genre);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!genreToDelete) return;
    
    try {
      await deleteDoc(doc(db, collections.GENRES, genreToDelete.id));
      setGenres(genres.filter(genre => genre.id !== genreToDelete.id));
    } catch (error) {
      console.error("Error deleting genre: ", error);
    } finally {
      setDeleteDialogOpen(false);
      setGenreToDelete(null);
    }
  };

  const handleEditClick = (genreId) => {
    navigate(`/admin/genres/edit/${genreId}`);
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
          Lista de Géneros
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/genres/new')}
        >
          Agregar Género
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {genres.length > 0 ? (
              genres.map((genre) => (
                <TableRow key={genre.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {genre.imageUrl && (
                        <Box
                          component="img"
                          src={genre.imageUrl}
                          alt={genre.name}
                          sx={{ width: 50, height: 50, borderRadius: 1, mr: 2, objectFit: 'cover' }}
                        />
                      )}
                      <Typography variant="body1">{genre.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 300 }}>
                      {genre.description || 'Sin descripción'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditClick(genre.id)}
                      aria-label="editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteClick(genre)}
                      aria-label="eliminar"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No hay géneros registrados
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
            ¿Estás seguro de que deseas eliminar el género "{genreToDelete?.name}"? Esta acción no se puede deshacer.
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
