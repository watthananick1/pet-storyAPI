import { Router } from 'express';
import { db } from "../routes/firebase.js";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const users = [];

    const snapshot = await db
      .collection("Users").where("firstName", "==", searchTerm).get();

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const { password, updatedAt, ...other } = userData;
      users.push(other);
    });
    

    const contentSnapshot = await db
      .collection('Posts')
      .where('content', "==", searchTerm)
      .get();

    const contentResults = contentSnapshot.docs.map((doc) => doc.data());

    const tagSnapshot = await db
      .collection('Posts')
      .where('tagpet', "array-contains", searchTerm)
      .get();

    const tagResults = tagSnapshot.docs.map((doc) => doc.data());

    const searchResults = [...users, ...contentResults, ...tagResults];

    res.json({ results: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

export default router;
