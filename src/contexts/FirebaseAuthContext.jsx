/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else if (firebaseUser.isAnonymous) {
            // Create a minimal user document for anonymous users
            const anonymousUserData = {
              isAnonymous: true,
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), anonymousUserData);
            setUserData(anonymousUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // No user signed in, sign in anonymously
        try {
          console.log('No user found, signing in anonymously...');
          await signInAnonymously(auth);
          // The onAuthStateChanged will trigger again with the anonymous user
        } catch (error) {
          console.error('Anonymous sign-in failed:', error);
          setUser(null);
          setUserData(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up function (handles both anonymous upgrade and new signups)
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      let firebaseUser;
      let isUpgradeFromAnonymous = false;
      
      // Check if current user is anonymous
      if (user && user.isAnonymous) {
        // Link anonymous account with email/password
        try {
          const credential = EmailAuthProvider.credential(email, password);
          const userCredential = await linkWithCredential(user, credential);
          firebaseUser = userCredential.user;
          isUpgradeFromAnonymous = true;
          console.log('Successfully upgraded anonymous account');
        } catch (linkError) {
          // If linking fails (e.g., email already exists), create new account
          console.log('Linking failed, creating new account:', linkError.message);
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          firebaseUser = userCredential.user;
        }
      } else {
        // Regular signup for non-anonymous users
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
      }

      // Update display name
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }

      // Update user document in Firestore
      const existingDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        displayName: displayName || null,
        createdAt: existingDoc.exists() ? existingDoc.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'user',
        emailVerified: false,
        isAnonymous: false,
        wasAnonymous: isUpgradeFromAnonymous
      }, { merge: true });

      // Send verification email
      await sendEmailVerification(firebaseUser);

      return { success: true, user: firebaseUser, upgraded: isUpgradeFromAnonymous };
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Google sign in (handles both anonymous upgrade and new signins)
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      let firebaseUser;
      let isUpgradeFromAnonymous = false;
      
      // Check if current user is anonymous
      if (user && user.isAnonymous) {
        // Try to link with Google
        try {
          const result = await linkWithPopup(user, provider);
          firebaseUser = result.user;
          isUpgradeFromAnonymous = true;
          console.log('Successfully upgraded anonymous account with Google');
        } catch (linkError) {
          // If linking fails, sign in normally
          console.log('Linking failed, signing in with Google:', linkError.message);
          const result = await signInWithPopup(auth, provider);
          firebaseUser = result.user;
        }
      } else {
        // Regular Google sign-in
        const result = await signInWithPopup(auth, provider);
        firebaseUser = result.user;
      }

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists() || isUpgradeFromAnonymous) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          createdAt: userDoc.exists() ? userDoc.data().createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
          role: 'user',
          emailVerified: true,
          isAnonymous: false,
          wasAnonymous: isUpgradeFromAnonymous
        }, { merge: true });
      }

      return { success: true, user: firebaseUser, upgraded: isUpgradeFromAnonymous };
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Password reset
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Update profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      
      // Update auth profile if displayName is provided
      if (updates.displayName && user) {
        await updateProfile(user, { displayName: updates.displayName });
      }

      // Update Firestore document
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, updates, { merge: true });
        
        // Refresh user data
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
          setUserData(updatedDoc.data());
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };


  const value = {
    user,
    userData,
    loading,
    error,
    signup,
    login,
    signInWithGoogle,
    logout,
    resetPassword,
    updateProfile: updateUserProfile,
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};