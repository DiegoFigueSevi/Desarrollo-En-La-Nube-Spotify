import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

// Custom hook for tracking page views and events
export function useAnalytics() {
  const location = useLocation();
  
  // Track page views
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [location]);

  // Track custom events
  const trackEvent = (eventName, eventParams = {}) => {
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    } else {
      console.log(`[Analytics] ${eventName}`, eventParams);
    }
  };

  return { trackEvent };
}

// Predefined events for common actions
export const EVENTS = {
  // Auth events
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  LOGOUT: 'logout',
  
  // Content interaction
  PLAY_SONG: 'play_song',
  PAUSE_SONG: 'pause_song',
  SKIP_SONG: 'skip_song',
  VIEW_ARTIST: 'view_artist',
  VIEW_GENRE: 'view_genre',
  SEARCH: 'search',
  
  // Admin actions
  CREATE_GENRE: 'create_genre',
  UPDATE_GENRE: 'update_genre',
  DELETE_GENRE: 'delete_genre',
  CREATE_ARTIST: 'create_artist',
  UPDATE_ARTIST: 'update_artist',
  DELETE_ARTIST: 'delete_artist',
  CREATE_SONG: 'create_song',
  UPDATE_SONG: 'update_song',
  DELETE_SONG: 'delete_song',
};

export default useAnalytics;
