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
import { migrateAnonymousData, checkAnonymousData } from '../services/dataMigration';

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
        // No user signed in - do NOT auto-create anonymous sessions
        setUser(null);
        setUserData(null);
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
        } catch (linkError) {
          // If linking fails due to email already existing, return appropriate error
          if (linkError.code === 'auth/email-already-in-use' || 
              linkError.code === 'auth/credential-already-in-use' ||
              linkError.code === 'auth/provider-already-linked') {
            return { 
              success: false, 
              error: 'This email is already registered. Please sign in instead.' 
            };
          }
          // For other errors, throw to be caught by outer try-catch
          throw linkError;
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
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Login function - handles both anonymous and regular users
  const login = async (email, password) => {
    try {
      setError(null);
      
      // If current user is anonymous, save their UID for potential data migration
      let anonymousUid = null;
      if (user && user.isAnonymous) {
        anonymousUid = user.uid;
        
        // Store in sessionStorage for potential migration
        sessionStorage.setItem('anonymousUid', anonymousUid);
        
        // Sign out the anonymous user first
        await signOut(auth);
      }
      
      // Regular sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Automatically migrate anonymous data if exists
      if (anonymousUid) {
        try {
          const hasData = await checkAnonymousData(anonymousUid);
          if (hasData.hasData) {
            const migrationResult = await migrateAnonymousData(anonymousUid, userCredential.user.uid);
            if (migrationResult.success) {
              console.log(`Successfully migrated ${migrationResult.migratedCount} items from anonymous account`);
            }
          }
        } catch (migrationError) {
          console.error('Error during data migration:', migrationError);
          // Don't fail the login if migration fails
        }
      }
      
      return { success: true, user: userCredential.user, previousAnonymousUid: anonymousUid };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Google sign in - properly handles sign-in vs sign-up
  const signInWithGoogle = async (isSignUp = false) => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      let firebaseUser;
      let isUpgradeFromAnonymous = false;
      let anonymousUid = null;
      
      // Check if current user is anonymous
      if (user && user.isAnonymous) {
        if (isSignUp) {
          // SIGN UP: Try to link/upgrade anonymous account
          try {
            const result = await linkWithPopup(user, provider);
            firebaseUser = result.user;
            isUpgradeFromAnonymous = true;
          } catch (linkError) {
            // If linking fails due to credential already in use
            if (linkError.code === 'auth/credential-already-in-use') {
              return { 
                success: false, 
                error: 'This Google account is already registered. Please sign in instead.' 
              };
            }
            throw linkError;
          }
        } else {
          // SIGN IN: Save anonymous UID and sign out first
          anonymousUid = user.uid;
          sessionStorage.setItem('anonymousUid', anonymousUid);
          
          // Sign out anonymous user
          await signOut(auth);
          
          // Regular Google sign-in
          const result = await signInWithPopup(auth, provider);
          firebaseUser = result.user;
        }
      } else {
        // Not anonymous - regular Google sign-in
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
      
      // Automatically migrate anonymous data if exists
      if (anonymousUid && !isUpgradeFromAnonymous) {
        try {
          const hasData = await checkAnonymousData(anonymousUid);
          if (hasData.hasData) {
            const migrationResult = await migrateAnonymousData(anonymousUid, firebaseUser.uid);
            if (migrationResult.success) {
              console.log(`Successfully migrated ${migrationResult.migratedCount} items from anonymous account`);
            }
          }
        } catch (migrationError) {
          console.error('Error during data migration:', migrationError);
          // Don't fail the login if migration fails
        }
      }

      return { success: true, user: firebaseUser, upgraded: isUpgradeFromAnonymous, previousAnonymousUid: anonymousUid };
    } catch (error) {
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
      setError(error.message);
      return { success: false, error: error.message };
    }
  };


  // Create anonymous session explicitly when needed
  const createAnonymousSession = async () => {
    try {
      if (user) {
        return { success: false, error: 'User already authenticated' };
      }
      
      const userCredential = await signInAnonymously(auth);
      return { success: true, user: userCredential.user };
    } catch (error) {
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
    createAnonymousSession,
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};