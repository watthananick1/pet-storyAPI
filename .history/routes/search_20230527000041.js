import { Router } from 'express';
import { db } from "../routes/firebase.js";

// const thaiTransliterationMap = {
//   'ก': 'k', 'ข': 'kh', 'ฃ': 'kh', 'ค': 'kh', 'ฅ': 'kh', 'ฆ': 'kh',
//   'ง': 'ng', 'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch',
//   'ญ': 'y', 'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th', 'ฒ': 'th',
//   'ณ': 'n', 'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th', 'ธ': 'th',
//   'น': 'n', 'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph',
//   'ฟ': 'f', 'ภ': 'ph', 'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l',
//   'ว': 'w', 'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l',
//   'อ': 'x', 'ฮ': 'h', 'ะ': 'a', 'ั': 'a', 'า': 'a', 'ำ': 'am',
//   'ิ': 'i', 'ี': 'i', 'ึ': 'ue', 'ื': 'ue', 'ุ': 'u', 'ู': 'u',
//   'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai', 'ๅ': '',
//   '็': 'e', '์': '', 'ํ': 'am',
//   // Add more mappings as needed
// };

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    console.log(searchTerm);
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    // const transliteratedSearchTerm = transliterate(searchTerm);

    const users = await searchUsers(searchTerm);
    const contentResults = await searchPosts('content', searchTerm);
    const tagResults = await searchPosts('tagpet', searchTerm);

    const searchResults = [...users, ...contentResults, ...tagResults];

    res.json({ results: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

// Transliterate Thai characters to English
// function transliterate(term) {
//   const transliteratedTerm = Array.from(term, (char) => {
//     if (char in thaiTransliterationMap) {
//       return thaiTransliterationMap[char];
//     }
//     return char;
//   }).join('');
  
//   console.log('Trans=', transliteratedTerm);

//   return transliteratedTerm;
// }
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
