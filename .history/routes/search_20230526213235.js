import { Router } from 'express';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const snapshot = await db
      .collection('Users')
      .where('name-surname', '==', searchTerm)
      .get();

    const posts = snapshot.docs.map((doc) => doc.data());

    const titleSnapshot = await db
      .collection('Posts')
      .where('title', '==', searchTerm)
      .get();

    const titlePosts = titleSnapshot.docs.map((doc) => doc.data());

    const tagSnapshot = await db
      .collection('Posts')
      .where('tagpet', 'array-contains', searchTerm)
      .get();

    const tagPosts = tagSnapshot.docs.map((doc) => doc.data());

    const searchResults = [...posts, ...titlePosts, ...tagPosts];
    
    res.json({ results: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

export default router;
