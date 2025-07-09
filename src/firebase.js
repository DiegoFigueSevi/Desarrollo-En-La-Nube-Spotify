import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA_V8tte9garBYhzlGnjApuWXcaeGxPcp8",
  authDomain: "desarrollo-en-la-nube-5ecf8.firebaseapp.com",
  projectId: "desarrollo-en-la-nube-5ecf8",
  storageBucket: "desarrollo-en-la-nube-5ecf8.firebasestorage.app",
  messagingSenderId: "498716084799",
  appId: "1:498716084799:web:8c99b9c8c3eba0bd6e068a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics;

// Initialize Analytics only in browser
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { auth, db, storage, analytics };

export const collections = {
  GENRES: 'genres_spotify',
  ARTISTS: 'artists_spotify',
  SONGS: 'songs_spotify',
  USERS: 'users_spotify'
};
