import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "dvc-tracker-app-2026",
  appId: "1:12436671808:web:6e6ad2d8b9ee36c66efea5",
  storageBucket: "dvc-tracker-app-2026.firebasestorage.app",
  apiKey: "AIzaSyA3woCUld7Fhf3NbKdMmF-txIhaTEAWjpI",
  authDomain: "dvc-tracker-app-2026.firebaseapp.com",
  messagingSenderId: "12436671808"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
