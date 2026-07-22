import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

export const loginUser = (email: string, password: string, remember: boolean) =>
  setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence).then(() =>
    signInWithEmailAndPassword(auth, email, password),
  );

export const logoutUser = () => signOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);
