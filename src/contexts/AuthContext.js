import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, analytics } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, collections } from '../firebase';
import { logEvent } from 'firebase/analytics';
import { EVENTS } from '../hooks/useAnalytics';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, collections.USERS, userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        displayName,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });
      
      // Track signup event
      if (analytics) {
        logEvent(analytics, EVENTS.SIGN_UP, {
          method: 'email_password',
          email: email
        });
      }
      
      return { success: true };
    } catch (error) {
      // Track signup error
      if (analytics) {
        logEvent(analytics, 'sign_up_error', {
          error_code: error.code,
          error_message: error.message
        });
      }
      return { success: false, error: error.message };
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Track login event
      if (analytics) {
        logEvent(analytics, EVENTS.LOGIN, {
          method: 'email_password',
          email: email
        });
      }
      
      return userCredential;
    } catch (error) {
      // Track login error
      if (analytics) {
        logEvent(analytics, 'login_error', {
          error_code: error.code,
          error_message: error.message,
          email: email
        });
      }
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Set the client ID explicitly
    provider.setCustomParameters({
      client_id: '498716084799-l3s30a1p3i36fui7q20911t2kkd0n8pd.apps.googleusercontent.com'
    });
    try {
      // Track Google sign-in attempt
      if (analytics) {
        logEvent(analytics, 'google_sign_in_attempt');
      }
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, collections.USERS, user.uid));
      const isNewUser = !userDoc.exists();
      
      if (isNewUser) {
        // Create user in Firestore if doesn't exist
        await setDoc(doc(db, collections.USERS, user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: false,
          createdAt: new Date().toISOString()
        });
        
        // Track signup event for new users
        if (analytics) {
          logEvent(analytics, EVENTS.SIGN_UP, {
            method: 'google',
            email: user.email
          });
        }
      }
      
      // Track successful login
      if (analytics) {
        logEvent(analytics, EVENTS.LOGIN, {
          method: 'google',
          email: user.email,
          is_new_user: isNewUser
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error signing in with Google:", error);
      
      // Track Google sign-in error
      if (analytics) {
        logEvent(analytics, 'google_sign_in_error', {
          error_code: error.code,
          error_message: error.message
        });
      }
      
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Track logout event
      if (analytics && currentUser) {
        logEvent(analytics, EVENTS.LOGOUT, {
          user_id: currentUser.uid
        });
      }
      
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  };

  // Check if user is admin
  const checkAdminStatus = async (uid) => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, collections.USERS, uid));
      if (userDoc.exists()) {
        setIsAdmin(userDoc.data().isAdmin || false);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await checkAdminStatus(user.uid);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    signup,
    login,
    logout,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
