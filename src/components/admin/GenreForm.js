import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, getDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, collections } from '../../firebase';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Grid,
  Avatar,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function GenreForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [genre, setGenre] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchGenre = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const genreDoc = await getDoc(doc(db, collections.GENRES, id));
      
      if (genreDoc.exists()) {
        const genreData = { id: genreDoc.id, ...genreDoc.data() };
        setGenre(genreData);
        if (genreData.imageUrl) {
          setPreviewUrl(genreData.imageUrl);
        }
      } else {
        enqueueSnackbar('Género no encontrado', { variant: 'error' });
        navigate('/admin/genres');
      }
    } catch (error) {
      console.error('Error fetching genre:', error);
      enqueueSnackbar('Error al cargar el género', { variant: 'error' });
      navigate('/admin/genres');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, enqueueSnackbar]);

  useEffect(() => {
    if (isEdit && id) {
      fetchGenre();
    }
  }, [id, isEdit, fetchGenre]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGenre(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    const storageRef = ref(storage, `genres/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Upload image if a new one was selected
      let imageUrl = genre.imageUrl;
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
      }

      const genreData = {
        ...genre,
        imageUrl,
        updatedAt: serverTimestamp()
      };

      if (!isEdit) {
        // Create new genre - let Firestore auto-generate the ID
        const docRef = doc(collection(db, collections.GENRES));
        await setDoc(docRef, {
          ...genreData,
          id: docRef.id,  // Store the auto-generated ID in the document
          createdAt: serverTimestamp()
        });
        enqueueSnackbar('Género creado exitosamente', { variant: 'success' });
      } else {
        // Update existing genre
        await setDoc(doc(db, collections.GENRES, id), genreData, { merge: true });
        enqueueSnackbar('Género actualizado exitosamente', { variant: 'success' });
      }
      
      navigate('/admin/genres');
    } catch (error) {
      console.error('Error saving genre:', error);
      enqueueSnackbar('Error al guardar el género', { variant: 'error' });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/admin/genres')}
        sx={{ mb: 2 }}
      >
        Volver a la lista
      </Button>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {isEdit ? 'Editar Género' : 'Nuevo Género'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box 
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="genre-image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="genre-image-upload">
                  <IconButton 
                    color="primary" 
                    aria-label="upload picture" 
                    component="span"
                    disabled={uploading}
                  >
                    <Avatar
                      src={previewUrl}
                      sx={{
                        width: 200,
                        height: 200,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      <CloudUploadIcon sx={{ fontSize: 60 }} />
                    </Avatar>
                  </IconButton>
                </label>
                <Typography variant="caption" display="block" gutterBottom>
                  Haz clic para {previewUrl ? 'cambiar' : 'subir'} la imagen
                </Typography>
                {uploading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="caption">Subiendo imagen...</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Nombre del género"
                name="name"
                autoComplete="off"
                value={genre.name}
                onChange={handleChange}
                disabled={loading || uploading}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="description"
                label="Descripción"
                name="description"
                multiline
                rows={4}
                value={genre.description}
                onChange={handleChange}
                disabled={loading || uploading}
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/admin/genres')}
                  sx={{ mr: 2 }}
                  disabled={loading || uploading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!genre.name || loading || uploading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
