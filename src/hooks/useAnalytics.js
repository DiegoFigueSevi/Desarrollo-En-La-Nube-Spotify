import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import { analytics } from '../firebase';

const DEBUG_ANALYTICS = true;

export function useAnalytics() {
  const location = useLocation();
  
  useEffect(() => {
    if (analytics && typeof setAnalyticsCollectionEnabled === 'function') {
      setAnalyticsCollectionEnabled(analytics, true);
    }
  }, []);

  useEffect(() => {
    const trackPageView = () => {
      if (!analytics) {
        if (DEBUG_ANALYTICS) {
          console.log('[Analytics] Analytics not initialized');
        }
        return;
      }

      const pagePath = location.pathname + location.search;
      const pageTitle = document.title;
      const pageLocation = window.location.href;

      if (DEBUG_ANALYTICS) {
        console.log('[Analytics] Page view:', { pagePath, pageTitle, pageLocation });
      }

      try {
        logEvent(analytics, 'page_view', {
          page_path: pagePath,
          page_title: pageTitle,
          page_location: pageLocation,
        });
      } catch (error) {
        console.error('[Analytics] Error logging page view:', error);
      }
    };

    const timer = setTimeout(trackPageView, 100);
    return () => clearTimeout(timer);
  }, [location]);

  const trackEvent = useCallback((eventName, eventParams = {}) => {
    if (!analytics) {
      if (DEBUG_ANALYTICS) {
        console.log(`[Analytics] Event not sent (analytics not ready): ${eventName}`, eventParams);
      }
      return;
    }

    if (DEBUG_ANALYTICS) {
      console.log(`[Analytics] Event: ${eventName}`, eventParams);
    }

    try {
      logEvent(analytics, eventName, eventParams);
    } catch (error) {
      console.error(`[Analytics] Error logging event ${eventName}:`, error);
    }
  }, []);

  return { trackEvent };
}

export const EVENTS = {
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  LOGOUT: 'logout',
  
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
