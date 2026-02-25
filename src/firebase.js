import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyD7ar333DhBTNuyO2gIM5_83jb6DnkcXpM',
  authDomain:        'vibewear-3ce26.firebaseapp.com',
  projectId:         'vibewear-3ce26',
  storageBucket:     'vibewear-3ce26.firebasestorage.app',
  messagingSenderId: '1050105977467',
  appId:             '1:1050105977467:web:bd750d88fa4a4022d8e0de',
  measurementId:     'G-RSJMVPEWWB',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
