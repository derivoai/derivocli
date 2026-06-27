import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCNv8mVHs3LF3nNrU7dy0If3GESnilBtmM",
  authDomain: "auth.derivo.in",
  projectId: "derivo",
  storageBucket: "derivo.firebasestorage.app",
  messagingSenderId: "290795143643",
  appId: "1:290795143643:web:ca15a0ec196fcd4f50a7fe",
  measurementId: "G-PWPSX0Q08Q"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export {
  doc,
  getDoc,
  setDoc,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  PhoneAuthProvider,
  signInWithCredential
};
