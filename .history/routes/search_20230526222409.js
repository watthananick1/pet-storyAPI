import { Router } from 'express';
import { db } from "../routes/firebase.js";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const snapshot = await db
      .collection('Users')
      .where('firstName', '==', searchTerm)
      .where('lastName', '==', searchTerm)
      .get();

    const userResults = snapshot.docs.map((doc) => doc.data());

    const contentSnapshot = await db
      .collection('Posts')
      .where('content', '==', searchTerm)
      .get();

    const contentResults = contentSnapshot.docs.map((doc) => doc.data());

    const tagSnapshot = await db
      .collection('Posts')
      .where('tagpet', 'array-contains', searchTerm)
      .get();

    const tagResults = tagSnapshot.docs.map((doc) => doc.data());

    const searchResults = [...userResults, ...contentResults, ...tagResults];

    res.json({ results: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

export default router;
