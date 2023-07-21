import { Router } from 'express';
import { db } from "../routes/firebase.js";

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    console.log(searchTerm);
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const searchResults = await Promise.all([
      searchUsers(searchTerm),
      searchPosts('content', searchTerm),
      searchPosts('tagpet', searchTerm)
    ]);

    const formattedResults = [];

    // Format and combine search results of different types
    searchResults.forEach((results, index) => {
      const type = getTypeByIndex(index);
      const formatted = formatSearchResults(results, type);
      formattedResults.push(...formatted);
    });

    res.json({ results: formattedResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

// Determine the type based on the search results index
function getTypeByIndex(index) {
  switch (index) {
    case 0:
      return 'User';
    case 1:
      return 'Post';
    case 2:
      return 'Tag';
    default:
      return '';
  }
}

// Format search results with type
function formatSearchResults(results, type) {
  return results.map((result) => ({ ...result, type }));
}

// Search users by first name and last name
async function searchUsers(searchTerm) {
  const usersSnapshot = await db
    .collection('Users')
    .where('firstName', '>=', searchTerm)
    .where('firstName', '<=', searchTerm + '\uf8ff')
    .get();

  const users = [];
  usersSnapshot.forEach((doc) => {
    const userData = doc.data();
    const { password, updatedAt, ...other } = userData;
    if (!users.some((user) => user.member_id === other.member_id)) {
      users.push(other);
    }
  });

  const lastNameSnapshot = await db
    .collection('Users')
    .where('lastName', '>=', searchTerm)
    .where('lastName', '<=', searchTerm + '\uf8ff')
    .get();

  lastNameSnapshot.forEach((doc) => {
    const userData = doc.data();
    const { password, updatedAt, ...other } = userData;
    if (!users.some((user) => user.member_id === other.member_id)) {
      users.push(other);
    }
  });

  return users;
}

// Search posts by field and term
async function searchPosts(field, searchTerm) {
  const snapshot = await db
    .collection('Posts')
    .where(field, '>=', searchTerm)
    .where(field, '<=', searchTerm + '\uf8ff')
    .get();

  const results = snapshot.docs.map((doc) => doc.data());
  return results;
}

export default router;
