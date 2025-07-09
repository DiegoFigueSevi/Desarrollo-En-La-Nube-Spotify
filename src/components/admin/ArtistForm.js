import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  FormHelperText
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function ArtistForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [genres, setGenres] = useState([]);
  const [artist, setArtist] = useState({
    name: '',
    description: '',
    genreId: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errors, setErrors] = useState({});

  // Fetch genres for the dropdown
  const fetchGenres = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collections.GENRES));
      const genresList = [];
      querySnapshot.forEach((doc) => {
        genresList.push({ id: doc.id, ...doc.data() });
      });
      setGenres(genresList);
    } catch (error) {
      console.error('Error fetching genres:', error);
      enqueueSnackbar('Error al cargar los géneros', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    const fetchArtist = async () => {
      if (!isEdit || !id) return;
      
      try {
        const artistDoc = await getDoc(doc(db, collections.ARTISTS, id));
        if (artistDoc.exists()) {
          const artistData = { id: artistDoc.id, ...artistDoc.data() };
          setArtist(artistData);
          if (artistData.imageUrl) {
            setPreviewUrl(artistData.imageUrl);
          }
        } else {
          enqueueSnackbar('Artista no encontrado', { variant: 'error' });
          navigate('/admin/artists');
        }
      } catch (error) {
        console.error('Error fetching artist:', error);
        enqueueSnackbar('Error al cargar el artista', { variant: 'error' });
        navigate('/admin/artists');
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
    if (isEdit) {
      fetchArtist();
    } else {
      setLoading(false);
    }
  }, [isEdit, id, navigate, enqueueSnackbar, fetchGenres]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!artist.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!artist.genreId) {
      newErrors.genreId = 'Selecciona un género';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setArtist(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar('Por favor, sube un archivo de imagen válido', { variant: 'error' });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        enqueueSnackbar('La imagen no debe superar los 2MB', { variant: 'error' });
        return;
      }
      
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `artists/${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteOldImage = async (imageUrl) => {
    if (!imageUrl) return;
    
    try {
      if (imageUrl.includes('firebasestorage')) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.warn('Error deleting old image:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      let imageUrl = artist.imageUrl;
      
      if (imageFile) {
        if (imageUrl) {
          await deleteOldImage(imageUrl);
        }
        imageUrl = await uploadImage(imageFile);
      }

      const artistData = {
        ...artist,
        imageUrl,
        updatedAt: serverTimestamp()
      };

      if (!isEdit) {
        const newArtistRef = doc(collection(db, collections.ARTISTS));
        await setDoc(newArtistRef, {
          ...artistData,
          createdAt: serverTimestamp(),
          genreId: artist.genreId
        });
        enqueueSnackbar('Artista creado exitosamente', { variant: 'success' });
      } else {
        await setDoc(doc(db, collections.ARTISTS, id), artistData, { merge: true });
        enqueueSnackbar('Artista actualizado exitosamente', { variant: 'success' });
      }
      
      navigate('/admin/artists');
    } catch (error) {
      console.error('Error saving artist:', error);
      enqueueSnackbar('Error al guardar el artista', { variant: 'error' });
      setLoading(false);
    }
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
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/admin/artists')}
        sx={{ mb: 2 }}
      >
        Volver a la lista
      </Button>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {isEdit ? 'Editar Artista' : 'Nuevo Artista'}
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
                  id="artist-image-upload"
                  type="file"
                  onChange={handleImageChange}
                  disabled={uploading}
                />
                <label htmlFor="artist-image-upload">
                  <IconButton 
                    color="primary" 
                    aria-label="upload picture" 
                    component="span"
                    disabled={uploading}
                  >
                    <Avatar
                      src={previewUrl || 'https://via.placeholder.com/200x200?text=Sin+imagen'}
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
                label="Nombre del artista"
                name="name"
                autoComplete="off"
                value={artist.name}
                onChange={handleChange}
                disabled={loading || uploading}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 2 }}
              />
              
              <FormControl 
                fullWidth 
                margin="normal"
                error={!!errors.genreId}
                disabled={loading || uploading || genres.length === 0}
              >
                <InputLabel id="genre-label">Género *</InputLabel>
                <Select
                  labelId="genre-label"
                  id="genreId"
                  name="genreId"
                  value={artist.genreId || ''}
                  label="Género *"
                  onChange={handleChange}
                >
                  {genres.length > 0 ? (
                    genres.map((genre) => (
                      <MenuItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      No hay géneros disponibles
                    </MenuItem>
                  )}
                </Select>
                {errors.genreId && (
                  <FormHelperText>{errors.genreId}</FormHelperText>
                )}
                {genres.length === 0 && (
                  <FormHelperText>
                    No hay géneros disponibles. Por favor, crea un género primero.
                  </FormHelperText>
                )}
              </FormControl>
              
              <TextField
                margin="normal"
                fullWidth
                id="description"
                label="Descripción"
                name="description"
                multiline
                rows={4}
                value={artist.description || ''}
                onChange={handleChange}
                disabled={loading || uploading}
                sx={{ mt: 2 }}
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/admin/artists')}
                  sx={{ mr: 2 }}
                  disabled={loading || uploading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!artist.name || !artist.genreId || loading || uploading || genres.length === 0}
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
