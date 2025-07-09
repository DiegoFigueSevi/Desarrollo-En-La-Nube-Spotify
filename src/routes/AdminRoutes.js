import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from '../components/auth/PrivateRoute';
import AdminDashboard from '../pages/admin/AdminDashboard';
import GenresList from '../components/admin/GenresList';
import GenreForm from '../components/admin/GenreForm';
import ArtistsList from '../components/admin/ArtistsList';
import ArtistForm from '../components/admin/ArtistForm';
import SongsList from '../components/admin/SongsList';
import SongForm from '../components/admin/SongForm';

function AdminRoutes() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />
      
      {/* Genres Routes */}
      <Route 
        path="genres" 
        element={
          <PrivateRoute adminOnly={true}>
            <GenresList />
          </PrivateRoute>
        } 
      />
      <Route 
        path="genres/new" 
        element={
          <PrivateRoute adminOnly={true}>
            <GenreForm />
          </PrivateRoute>
        } 
      />
      <Route 
        path="genres/edit/:id" 
        element={
          <PrivateRoute adminOnly={true}>
            <GenreForm isEdit={true} />
          </PrivateRoute>
        } 
      />
      
      {/* Artists Routes */}
      <Route 
        path="artists" 
        element={
          <PrivateRoute adminOnly={true}>
            <ArtistsList />
          </PrivateRoute>
        } 
      />
      <Route 
        path="artists/new" 
        element={
          <PrivateRoute adminOnly={true}>
            <ArtistForm />
          </PrivateRoute>
        } 
      />
      <Route 
        path="artists/edit/:id" 
        element={
          <PrivateRoute adminOnly={true}>
            <ArtistForm isEdit={true} />
          </PrivateRoute>
        } 
      />
      
      {/* Songs Routes */}
      <Route 
        path="songs" 
        element={
          <PrivateRoute adminOnly={true}>
            <SongsList />
          </PrivateRoute>
        } 
      />
      <Route 
        path="songs/new" 
        element={
          <PrivateRoute adminOnly={true}>
            <SongForm />
          </PrivateRoute>
        } 
      />
      <Route 
        path="songs/edit/:id" 
        element={
          <PrivateRoute adminOnly={true}>
            <SongForm isEdit={true} />
          </PrivateRoute>
        } 
      />
      
      {/* Catch-all route for admin section */}
      <Route 
        path="*" 
        element={
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export default AdminRoutes;
