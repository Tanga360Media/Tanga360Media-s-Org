import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const normalizePhone = (phone: string) => {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('255') && clean.length === 12) {
    clean = '0' + clean.slice(3);
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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithPhone: (phone: string, pin: string) => Promise<any>;
  registerWithPhone: (phone: string, name: string, pin: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        } else {
          // If first time login, check if they are the admin email or default to team manager
          const isAdmin = user.email === 'chreesonlinemedia@gmail.com'; // User from metadata
          const newProfile: UserProfile = {
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            role: isAdmin ? 'ADMIN' : 'TEAM_MANAGER',
            displayName: user.displayName || 'Mtumiaji',
            photoURL: user.photoURL || '',
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithPhone = async (phone: string, pin: string) => {
    const email = formatEmailFromPhone(phone);
    return await signInWithEmailAndPassword(auth, email, pin);
  };

  const registerWithPhone = async (phone: string, name: string, pin: string) => {
    const email = formatEmailFromPhone(phone);
    const cred = await createUserWithEmailAndPassword(auth, email, pin);
    
    // Create Profile in DB
    const userRef = doc(db, 'users', cred.user.uid);
    const isFirstUserAdmin = normalizePhone(phone) === '0712345678' || email === 'chreesonlinemedia@gmail.com'; // Escape hatch or specific admin phone
    const newProfile: UserProfile = {
      email: email,
      phoneNumber: normalizePhone(phone),
      role: isFirstUserAdmin ? 'ADMIN' : 'TEAM_MANAGER',
      displayName: name,
    };
    await setDoc(userRef, newProfile);
    setProfile(newProfile);
    return cred;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, loginWithPhone, registerWithPhone, logout }}>
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
