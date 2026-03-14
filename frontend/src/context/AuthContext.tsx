import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';

export type Role = 'admin' | 'operator';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: Role;
  assignedDevices?: string[]; // Array of device IDs or types
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: Role, assignedDevices?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // We initialize a secondary Firebase app strictly to handle admin-driven registrations 
  // so the Admin doesn't get logged out of their primary session when they create an Operator.
  const register = async (email: string, password: string, name: string, role: Role, assignedDevices?: string[]) => {
    // Determine if this is the very first user (no one is logged in yet)
    const isInitialSetup = !auth.currentUser;

    if (isInitialSetup) {
      // Standard registration for the very first Admin
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userProfile: UserProfile = { uid: cred.user.uid, email, name, role, assignedDevices };
      await setDoc(doc(db, 'users', cred.user.uid), userProfile);
      setProfile(userProfile);
    } else {
      // Secondary App approach for Admins registering Operators/others
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
      
      const secondaryApp = initializeApp(auth.app.options, 'Secondary Registration App');
      const secondaryAuth = getAuth(secondaryApp);

      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      
      // Save the user profile to Firestore (using the primary db app)
      const userProfile: UserProfile = { uid: cred.user.uid, email, name, role, assignedDevices };
      await setDoc(doc(db, 'users', cred.user.uid), userProfile);

      // We immediately sign the purely newly created user out of the secondary app
      await secondaryAuth.signOut();
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      login, register, logout,
      isAdmin: profile?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
