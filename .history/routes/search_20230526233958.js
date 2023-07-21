import { Router } from 'express';
import { db } from "../routes/firebase.js";

const thaiTransliterationMap = {
  // Thai-to-English transliteration mapping
  // ...
};

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const transliteratedSearchTerm = transliterate(searchTerm);

    const users = await searchUsers(transliteratedSearchTerm);
    const contentResults = await searchPosts('content', transliteratedSearchTerm);
    const tagResults = await searchPosts('tagpet', transliteratedSearchTerm);

    const searchResults = [...users, ...contentResults, ...tagResults];

    res.json({ results: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

// Transliterate Thai characters to English
function transliterate(term) {
  const transliteratedTerm = Array.from(term, (char) => {
    if (char in thaiTransliterationMap) {
      return thaiTransliterationMap[char];
    }
    return char;
  }).join('');

  return transliteratedTerm;
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
