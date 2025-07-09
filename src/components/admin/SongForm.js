import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDocs, getDoc } from 'firebase/firestore';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

export default function SongForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [artists, setArtists] = useState([]);
  const [song, setSong] = useState({
    title: '',
    artistId: '',
    duration: 0,
    audioUrl: '',
    coverUrl: '',
    genreId: ''
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [previewAudio, setPreviewAudio] = useState('');
  const [previewCover, setPreviewCover] = useState('');

  const fetchArtists = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collections.ARTISTS));
      const artistsList = [];
      querySnapshot.forEach((doc) => {
        artistsList.push({ id: doc.id, ...doc.data() });
      });
      setArtists(artistsList);
    } catch (error) {
      console.error('Error fetching artists:', error);
      enqueueSnackbar('Error al cargar los artistas', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchSong = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const songDoc = await getDoc(doc(db, collections.SONGS, id));
      
      if (songDoc.exists()) {
        const songData = { id: songDoc.id, ...songDoc.data() };
        setSong(songData);
        if (songData.audioUrl) setPreviewAudio(songData.audioUrl);
        if (songData.coverUrl) setPreviewCover(songData.coverUrl);
      } else {
        enqueueSnackbar('Canción no encontrada', { variant: 'error' });
        navigate('/admin/songs');
      }
    } catch (error) {
      console.error('Error fetching song:', error);
      enqueueSnackbar('Error al cargar la canción', { variant: 'error' });
      navigate('/admin/songs');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, enqueueSnackbar]);

  useEffect(() => {
    fetchArtists();
    if (isEdit && id) {
      fetchSong();
    }
  }, [isEdit, id, fetchArtists, fetchSong]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSong(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      enqueueSnackbar('Por favor, sube un archivo de audio válido', { variant: 'error' });
      return;
    }

    setAudioFile(file);
    setPreviewAudio(URL.createObjectURL(file));
    
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => {
      setSong(prev => ({
        ...prev,
        duration: Math.round(audio.duration)
      }));
    };
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Por favor, sube un archivo de imagen válido', { variant: 'error' });
      return;
    }

    setCoverFile(file);
    setPreviewCover(URL.createObjectURL(file));
  };

  const uploadFile = async (file, path) => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!song.title || !song.artistId) {
      enqueueSnackbar('Por favor, completa todos los campos requeridos', { variant: 'error' });
      return;
    }

    try {
      setUploading(true);
      let audioUrl = song.audioUrl;
      let coverUrl = song.coverUrl;

      if (audioFile) {
        audioUrl = await uploadFile(audioFile, 'songs/audio');
      }

      if (coverFile) {
        coverUrl = await uploadFile(coverFile, 'songs/covers');
      }

      const songData = {
        ...song,
        audioUrl,
        coverUrl,
        updatedAt: serverTimestamp()
      };

      if (isEdit) {
        await setDoc(doc(db, collections.SONGS, id), songData, { merge: true });
        enqueueSnackbar('Canción actualizada exitosamente', { variant: 'success' });
      } else {
        songData.createdAt = serverTimestamp();
        const newSongRef = doc(collection(db, collections.SONGS));
        await setDoc(newSongRef, songData);
        enqueueSnackbar('Canción creada exitosamente', { variant: 'success' });
        navigate(`/admin/songs/edit/${newSongRef.id}`);
      }
    } catch (error) {
      console.error('Error saving song:', error);
      enqueueSnackbar('Error al guardar la canción', { variant: 'error' });
    } finally {
      setUploading(false);
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
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          {isEdit ? 'Editar Canción' : 'Nueva Canción'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box mb={3}>
              <input
                accept="audio/*"
                style={{ display: 'none' }}
                id="audio-upload"
                type="file"
                onChange={handleAudioChange}
              />
              <label htmlFor="audio-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Subir Audio
                </Button>
              </label>
              {previewAudio && (
                <audio controls style={{ width: '100%', marginTop: 8 }}>
                  <source src={previewAudio} type="audio/mpeg" />
                  Tu navegador no soporta el elemento de audio.
                </audio>
              )}
            </Box>

            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="cover-upload"
                type="file"
                onChange={handleCoverChange}
              />
              <label htmlFor="cover-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Subir Portada
                </Button>
              </label>
              {previewCover && (
                <Avatar
                  src={previewCover}
                  variant="rounded"
                  sx={{ width: '100%', height: 'auto', aspectRatio: '1' }}
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Título"
              name="title"
              value={song.title}
              onChange={handleChange}
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Artista</InputLabel>
              <Select
                name="artistId"
                value={song.artistId}
                onChange={handleChange}
                label="Artista"
              >
                {artists.map((artist) => (
                  <MenuItem key={artist.id} value={artist.id}>
                    {artist.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Duración (segundos)"
              name="duration"
              type="number"
              value={song.duration}
              onChange={handleChange}
              margin="normal"
              disabled
              helperText="La duración se calcula automáticamente al subir el archivo de audio"
            />

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/admin/songs')}
                sx={{ mr: 2 }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={uploading}
              >
                {uploading ? (
                  <CircularProgress size={24} />
                ) : isEdit ? (
                  'Actualizar Canción'
                ) : (
                  'Crear Canción'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
