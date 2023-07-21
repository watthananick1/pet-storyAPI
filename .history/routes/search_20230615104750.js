import { Router } from "express";
import { db } from "./firebase.js";
import validateToken from "../models/authMiddleware.js";

const router = Router();

router.post("/", validateToken, async (req, res) => {
  try {
    const isUserDoc = await db.collection("Users")
      .where("member_id", "==", req.user.userId)
      .get();
    const isUser = !isUserDoc.empty;
    console.log("isUser: ", isUser);
    if (isUser) {
      const { searchTerm } = req.body.searchTerm;
      console.log(searchTerm);
      if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
      } else {
        const searchResults = await Promise.all([
          search("Users", searchTerm, ["firstName", "lastName"]),
          search("Posts", searchTerm, ["content"]),
          search("Posts", searchTerm, ["tagpet"]),
        ]);

        const formattedResults = [];

        // Format and combine search results of different types
        searchResults.forEach((results, index) => {
          const type = getTypeByIndex(index);
          const formatted = formatSearchResults(results, type);
          formattedResults.push(...formatted);
        });

        res.json({ results: formattedResults });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while searching" });
  }
});

// Determine the type based on the search results index
function getTypeByIndex(index) {
  switch (index) {
    case 0:
      return "User";
    case 1:
    case 2:
      return "Post";
    default:
      return "";
  }
}

// Format search results with type
function formatSearchResults(results, type) {
  return results.map((result) => ({ ...result, type }));
}

// Search a collection for the given search term in the specified columns
async function search(collection, searchTerm, columns) {
  const querySnapshot = await db.collection(collection).get();

  const results = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    // Check each column for the search term
    columns.forEach((column) => {
      if (data[column] && data[column].includes(searchTerm)) {
        results.push(data);
      }
    });
  });

  return results;
}

export default router;
