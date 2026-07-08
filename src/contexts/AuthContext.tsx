import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore-errors';

export const normalizePhone = (phone: string) => {
  let clean = phone.trim().replace(/[^0-9]/g, '');
  if (clean.startsWith('255') && clean.length === 12) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('2550') && clean.length === 13) {
    clean = '0' + clean.slice(4);
  } else if (clean.length === 9) {
    clean = '0' + clean;
  }
  return clean;
};

export const formatEmailFromPhone = (phone: string) => {
  const norm = normalizePhone(phone);
  return `${norm}@sokapro.com`;
};

interface UserProfile {
  email: string;
  phoneNumber?: string;
  role: 'ADMIN' | 'TEAM_MANAGER';
  displayName: string;
  photoURL?: string;
  teamId?: string;
  pin?: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithPhone: (phone: string, pin: string) => Promise<any>;
  registerWithPhone: (phone: string, name: string, pin: string) => Promise<any>;
  logout: () => Promise<void>;
  setRole: (role: 'ADMIN' | 'TEAM_MANAGER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUid = localStorage.getItem('sokapro_uid');
        if (storedUid) {
          const userRef = doc(db, 'users', storedUid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${storedUid}`);
          }
          
          if (userSnap && userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setUser({
              uid: storedUid,
              email: data.email,
              displayName: data.displayName,
              phoneNumber: data.phoneNumber
            });
            setProfile(data);
          } else {
            localStorage.removeItem('sokapro_uid');
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginWithGoogle = async () => {
    // Simulated/Stubbed Google login
    const mockUid = 'google_user_' + Math.random().toString(36).substr(2, 9);
    const mockProfile: UserProfile = {
      email: 'chreesonlinemedia@gmail.com',
      role: 'ADMIN',
      displayName: 'Chrees Media',
      photoURL: ''
    };
    const userRef = doc(db, 'users', mockUid);
    try {
      await setDoc(userRef, mockProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${mockUid}`);
    }
    
    setUser({
      uid: mockUid,
      email: mockProfile.email,
      displayName: mockProfile.displayName,
    });
    setProfile(mockProfile);
    localStorage.setItem('sokapro_uid', mockUid);
  };

  const loginWithPhone = async (phone: string, pin: string) => {
    const normalized = normalizePhone(phone);
    const q = query(collection(db, 'users'), where('phoneNumber', '==', normalized));
    let snap;
    try {
      snap = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }

    if (snap.empty) {
      const err: any = new Error("User not found");
      err.code = 'auth/user-not-found';
      throw err;
    }

    const userDoc = snap.docs[0];
    const data = userDoc.data() as UserProfile;

    if (data.pin !== pin) {
      const err: any = new Error("Wrong PIN");
      err.code = 'auth/wrong-password';
      throw err;
    }

    const loggedInUser = {
      uid: userDoc.id,
      email: data.email,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber
    };

    setUser(loggedInUser);
    setProfile(data);
    localStorage.setItem('sokapro_uid', userDoc.id);

    return { user: loggedInUser };
  };

  const registerWithPhone = async (phone: string, name: string, pin: string) => {
    const normalized = normalizePhone(phone);
    const email = formatEmailFromPhone(phone);

    // Check if phone already registered
    const q = query(collection(db, 'users'), where('phoneNumber', '==', normalized));
    let snap;
    try {
      snap = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }

    if (snap && !snap.empty) {
      const err: any = new Error("Phone already registered");
      err.code = 'auth/email-already-in-use';
      throw err;
    }

    const userDocRef = doc(collection(db, 'users'));
    const userId = userDocRef.id;

    const isFirstUserAdmin = normalized === '0688092015' || normalized === '0712345678' || email === 'chreesonlinemedia@gmail.com';
    const newProfile: UserProfile = {
      email: email,
      phoneNumber: normalized,
      role: isFirstUserAdmin ? 'ADMIN' : 'TEAM_MANAGER',
      displayName: name,
      pin: pin
    };

    try {
      await setDoc(userDocRef, newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${userId}`);
    }

    const loggedInUser = {
      uid: userId,
      email: newProfile.email,
      displayName: newProfile.displayName,
      phoneNumber: newProfile.phoneNumber
    };

    setUser(loggedInUser);
    setProfile(newProfile);
    localStorage.setItem('sokapro_uid', userId);

    return { user: loggedInUser };
  };

  const logout = async () => {
    localStorage.removeItem('sokapro_uid');
    setUser(null);
    setProfile(null);
  };

  const setRole = async (newRole: 'ADMIN' | 'TEAM_MANAGER') => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { role: newRole }, { merge: true });
        setProfile(prev => prev ? { ...prev, role: newRole } : null);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, loginWithPhone, registerWithPhone, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
