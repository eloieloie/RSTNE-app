import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDRiWJ4_XKB3gVosl8ArhrpVBSedLEaai8',
  authDomain: 'rstne-app-2025.firebaseapp.com',
  projectId: 'rstne-app-2025',
  storageBucket: 'rstne-app-2025.firebasestorage.app',
  messagingSenderId: '212458038004',
  appId: '1:212458038004:web:71d04003d41faad8fef4a1',
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
