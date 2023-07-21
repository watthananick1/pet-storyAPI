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

    const userSnapshot = await db
      .collection("Users")
      .where("firstName", "==", searchTerm)
      .get();

    userSnapshot.forEach((doc) => {
      const userData = doc.data();
      const { password, updatedAt, ...other } = userData;
      users.push(other);
    });

    const lastNameSnapshot = await db
      .collection("Users")
      .where("lastName", "==", searchTerm)
      .get();

    lastNameSnapshot.forEach((doc) => {
      const userData = doc.data();
      const { password, updatedAt, ...other } = userData;
      // Exclude the user if already present in the results
      if (!users.some((user) => user.member_id === other.member_id)) {
        users.push(other);
      }
    });

    const postSnapshot = await db
      .collection('Posts')
      .where('content', "==", searchTerm)
      .orderBy('createdAt', 'desc')
      .get();

    const postResults = postSnapshot.docs.map((doc) => doc.data());

    const searchResults = [...users, ...postResults];

    res.json({ results: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

export default router;
