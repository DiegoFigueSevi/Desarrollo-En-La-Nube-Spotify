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
      
      if (analytics) {
        logEvent(analytics, EVENTS.SIGN_UP, {
          method: 'email_password',
          email: email
        });
      }
      
      return { success: true };
    } catch (error) {
      if (analytics) {
        logEvent(analytics, 'sign_up_error', {
          error_code: error.code,
          error_message: error.message
        });
      }
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (analytics) {
        logEvent(analytics, EVENTS.LOGIN, {
          method: 'email_password',
          email: email
        });
      }
      
      return userCredential;
    } catch (error) {
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

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      client_id: '498716084799-l3s30a1p3i36fui7q20911t2kkd0n8pd.apps.googleusercontent.com'
    });
    try {
      if (analytics) {
        logEvent(analytics, 'google_sign_in_attempt');
      }
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, collections.USERS, user.uid));
      const isNewUser = !userDoc.exists();
      
      if (isNewUser) {
        await setDoc(doc(db, collections.USERS, user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: false,
          createdAt: new Date().toISOString()
        });
        
        if (analytics) {
          logEvent(analytics, EVENTS.SIGN_UP, {
            method: 'google',
            email: user.email
          });
        }
      }
      
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
      
      if (analytics) {
        logEvent(analytics, 'google_sign_in_error', {
          error_code: error.code,
          error_message: error.message
        });
      }
      
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
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
