import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { getOrCreateUserProfile } from '../services/firestoreService';
import { ensureDatabaseSeeded } from '../services/seedService';
import type { UserProfile } from '../types/domain';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  seeding: boolean;
  signInWithGoogle: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const syncProfile = async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return null;
    }
    try {
      const userProfile = await getOrCreateUserProfile(
        user.uid,
        user.email || '',
        user.displayName || ''
      );
      setProfile(userProfile);

      if (userProfile.role === 'admin') {
        setSeeding(true);
        try {
          await ensureDatabaseSeeded(user.uid, user.email || '');
        } finally {
          setSeeding(false);
        }
      }
      return userProfile;
    } catch (err) {
      console.error('Failed to sync profile:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      await syncProfile(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    setFirebaseUser(cred.user);
    return await syncProfile(cred.user);
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await syncProfile(auth.currentUser);
    }
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        seeding,
        signInWithGoogle,
        logout,
        refreshProfile,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
