import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export interface AuthState {
  user:             User | null;
  loading:          boolean;
  signInWithGoogle: () => Promise<void>;
  signOut:          () => Promise<void>;
  getToken:         () => Promise<string>;
}

export function useAuth(): AuthState {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  // Returns a fresh ID token (auto-refreshed by Firebase SDK)
  const getToken = async (): Promise<string> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    return auth.currentUser.getIdToken();
  };

  return { user, loading, signInWithGoogle, signOut, getToken };
}
