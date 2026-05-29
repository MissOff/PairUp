// firebase.js — Firebase Realtime Database connection
// Replace the placeholder values below with your own from the Firebase Console.
// (Project settings → General → Your apps → Web app → SDK setup and configuration)

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAHl3y4Wcw-30WgB4OQHuISluGNkU23hyU",
  authDomain: "pairup-56987.firebaseapp.com",
  databaseURL: "https://pairup-56987-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pairup-56987",
  storageBucket: "pairup-56987.firebasestorage.app",
  messagingSenderId: "284256088170",
  appId: "1:284256088170:web:d1ee153f63c50f62dc1a13"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);