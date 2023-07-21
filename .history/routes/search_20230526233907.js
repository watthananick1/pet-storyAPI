import { Router } from 'express';
import { db } from "../routes/firebase.js";

const thaiTransliterationMap = {
  'ก': 'k', 'ข': 'kh', 'ฃ': 'kh', 'ค': 'kh', 'ฅ': 'kh', 'ฆ': 'kh',
  'ง': 'ng', 'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch',
  'ญ': 'y', 'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th', 'ฒ': 'th',
  'ณ': 'n', 'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th', 'ธ': 'th',
  'น': 'n', 'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph',
  'ฟ': 'f', 'ภ': 'ph', 'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l',
  'ว': 'w', 'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l',
  'อ': 'x', 'ฮ': 'h', 'ะ': 'a', 'ั': 'a', 'า': 'a', 'ำ': 'am',
  'ิ': 'i', 'ี': 'i', 'ึ': 'ue', 'ื': 'ue', 'ุ': 'u', 'ู': 'u',
  'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai', 'ๅ': '',
  '็': 'e', '์': '', 'ํ': 'am',
  // Add more mappings as needed
};

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
