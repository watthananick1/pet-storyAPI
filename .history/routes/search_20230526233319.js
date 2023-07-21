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
      .collection("Users")
      .where("firstName", ">=", searchTerm)
      .where("firstName", "<=", searchTerm + '\uf8ff')
      .get();

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const { password, updatedAt, ...other } = userData;
      // Exclude the user if already present in the results
      if (!users.some((user) => user.member_id === other.member_id)) {
        users.push(other);
      }
    });

    const lastNameSnapshot = await db
      .collection("Users")
      .where("lastName", ">=", searchTerm)
      .where("lastName", "<=", searchTerm + '\uf8ff')
      .get();

    lastNameSnapshot.forEach((doc) => {
      const userData = doc.data();
      const { password, updatedAt, ...other } = userData;
      // Exclude the user if already present in the results
      if (!users.some((user) => user.member_id === other.member_id)) {
        users.push(other);
      }
    });
    
    const contentSnapshot = await db
      .collection('Posts')
      .where('content', ">=", searchTerm)
      .where('content', "<=", searchTerm + '\uf8ff')
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
