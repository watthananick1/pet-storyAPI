import { initializeApp } from 'firebase/app';
import { getAuth,  } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';

import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);
const storage = getStorage(appFirebase);

export { appFirebase, db, storage, collection, ref, deleteObject, getAuth  };
