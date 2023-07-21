import { Router } from "express";
import { appFirebase, auth, db, FieldValue } from "../routes/firebase.js";
import { getStorage, ref, deleteObject } from "firebase/storage";
import validateToken from "../models/authMiddleware.js";
const storage = getStorage(appFirebase);
const postsCollection = db.collection("Posts");
const usersCollection = db.collection("Users");

const router = Router();

// Like / Dislike a post
router.put("/:id/like", async (req, res) => {
  try {
    const postId = req.params.id;
    const postRef = db.collection("Posts").doc(postId);

    const postSnapshot = await postRef.get();

    if (!postSnapshot.exists) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const postLikes = postSnapshot.data().likes || [];
    const memberId = req.body.member_id;

    if (postLikes.includes(memberId)) {
      await postRef.update({
        likes: FieldValue.arrayRemove(memberId),
      });
      const postLikes = await postRef.get();
      res.status(200).json(postLikes.data());
    } else {
      await postRef.update({
        likes: FieldValue.arrayUnion(memberId),
      });

      const postLikes = await postRef.get();
      res.status(200).json(postLikes.data());
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update post", error: err });
  }
});

router.get("/user/:firstName/:sort", validateToken, async (req, res) => {
  const sortParam = req.params.sort;
  const firstName = req.params.firstName;
  
  try {
    const isUserDoc = await usersCollection
      .where("member_id", "==", req.user.userId)
      .get();
    const isUser = isUserDoc.docs[0].data();
    consolelog("isUser: ", isUser);
    if (isUser) {
      console.log("user_id: ", isUser.uid);
      const querySnapshot = await usersCollection
        .where("firstName", "==", firstName)
        .get();

      if (querySnapshot.empty) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = querySnapshot.docs[0].data();

      const queryPostSnapshot = await postsCollection
        .where("member_id", "==", user.member_id)
        .get();

      let posts = [];
      for (const doc of queryPostSnapshot.docs) {
        const post = doc.data();
        const queryUserSnapshot = await usersCollection
          .where("member_id", "==", post.member_id)
          .get();
        const userOf = queryUserSnapshot.docs[0].data();
        posts.push({
          ...post,
          firstName: userOf.firstName,
          lastName: userOf.lastName,
          profilePicture: userOf.profilePicture,
        });
      }

      switch (sortParam) {
        case "date":
          posts.sort((a, b) => {
            const date1 = a.createdAt.toDate();
            const date2 = b.createdAt.toDate();
            return date2.getTime() - date1.getTime();
          });
          break;
        case "popularity":
          posts.sort((a, b) => {
            const likesA = a.likes ? a.likes.length : 0;
            const likesB = b.likes ? b.likes.length : 0;
            return likesB - likesA;
          });
          break;
        case "relevance":
          posts.sort((a, b) => b.relevanceField - a.relevanceField);
          break;
        default:
          posts.sort((a, b) => {
            const date1 = a.createdAt.toDate();
            const date2 = b.createdAt.toDate();
            return date2.getTime() - date1.getTime();
          });
          break;
      }

      res.status(200).json(posts);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Failed to get posts by first name:", err);
    res
      .status(500)
      .json({ message: "Failed to get posts by first name", error: err });
  }
});

// Get posts for sorting options
router.get("/:sort", validateToken, async (req, res) => {
  try {
    const sortParam = req.params.sort;
    const isUserDoc = await usersCollection.doc(req.user.userId).get();
    if (isUserDoc.exists) {
      const querySnapshot = await postsCollection
        .where("status", "==", "normal")
        .get();
      const posts = [];

      for (const doc of querySnapshot.docs) {
        const post = doc.data();

        const userRef = usersCollection.doc(post.member_id);
        const userSnapshot = await userRef.get();

        if (userSnapshot.exists) {
          const user = userSnapshot.data();
          const postWithUser = {
            ...post,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
          };
          posts.push(postWithUser);
        } else {
          console.log("User not found for post:", post.id);
        }
      }

      if (sortParam === "date") {
        posts.sort((a, b) => {
          const date1 = a.createdAt.toDate();
          const date2 = b.createdAt.toDate();
          return date2.getTime() - date1.getTime();
        });
      } else if (sortParam === "popularity") {
        posts.sort((a, b) => {
          const likesA = a.likes ? a.likes.length : 0;
          const likesB = b.likes ? b.likes.length : 0;
          return likesB - likesA;
        });
      } else if (sortParam === "relevance") {
        posts.sort((a, b) => b.relevanceField - a.relevanceField);
      } else {
        posts.sort((a, b) => {
          const date1 = a.createdAt.toDate();
          const date2 = b.createdAt.toDate();
          return date2.getTime() - date1.getTime();
        });
      }

      res.status(200).json(posts);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Failed to get posts:", err);
    res.status(500).json({ message: "Failed to get posts", error: err });
  }
});

// Get posts for a specific member with sorting options
router.get("/:id/:sort", validateToken, async (req, res) => {
  try {
    const memberId = req.params.id;
    const sortParam = req.params.sort;
    const data = req.user.userId;
    console.log("data", data); // Add this line
    const isUserDoc = await usersCollection
      .where("member_id", "==", data)
      .get();
    const isUser = isUserDoc.docs[0].data();
    if (isUser) {
      console.log("User", isUser.uid);
      const queryUserSnapshot = await usersCollection
        .where("member_id", "==", memberId)
        .get();
      if (queryUserSnapshot.empty) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const user = queryUserSnapshot.docs[0].data();

      const querySnapshot = await postsCollection.get();
      const posts = [];

      for (const doc of querySnapshot.docs) {
        const post = doc.data();

        if (user.typePets.some((typePet) => post.tagpet.includes(typePet))) {
          if (post.status === "normal") {
            const queryUserSnapshot = await usersCollection
              .where("member_id", "==", post.member_id)
              .get();
            const userOf = queryUserSnapshot.docs[0].data();

            const postWithUser = {
              ...post,
              firstName: userOf.firstName,
              lastName: userOf.lastName,
              profilePicture: userOf.profilePicture,
            };

            posts.push(postWithUser);
          } else {
            console.log("Failed to get posts status");
          }
        }
      }

      switch (sortParam) {
        case "date":
          posts.sort((a, b) => {
            const date1 = a.createdAt.toDate();
            const date2 = b.createdAt.toDate();
            return date2.getTime() - date1.getTime();
          });
          break;
        case "popularity":
          posts.sort((a, b) => {
            const likesA = a.likes ? a.likes.length : 0;
            const likesB = b.likes ? b.likes.length : 0;
            return likesB - likesA;
          });
          break;
        case "relevance":
          posts.sort((a, b) => b.relevanceField - a.relevanceField);
          break;
        default:
          posts.sort((a, b) => {
            const date1 = a.createdAt.toDate();
            const date2 = b.createdAt.toDate();
            return date2.getTime() - date1.getTime();
          });
          break;
      }

      res.status(200).json(posts);
    } else {
      console.log("User not found for data", data); // Add this line
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Failed to get posts:", err);
    res.status(500).json({ message: "Failed to get posts", error: err });
  }
});

//Create new post
router.post("/", validateToken, async (req, res) => {
  try {
    const isUserDoc = await usersCollection.doc(req.user.userId).get();
    const isUser = isUserDoc.data();
    if (isUser) {
      const postRef = postsCollection.doc();
      const postId = postRef.id;
      const newPost = {
        id: postId,
        title: req.body.title,
        content: req.body.content,
        member_id: req.body.member_id,
        likes: req.body.likes,
        tagpet: req.body.tagpet,
        img: req.body.img,
        createdAt: new Date(),
        updatedAt: new Date(),
        comment: req.body.comment,
        status: req.body.status,
      };

      await postRef.set(newPost);

      res.status(201).json(newPost);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create post", error: err });
  }
});

// update a post
router.put("/:id", validateToken, async (req, res) => {
  try {
    const isUserDoc = await usersCollection.doc(req.user.userId).get();
    const isUser = isUserDoc.data();
    if (isUser) {
      const postId = req.params.id;
      const postRef = postsCollection.doc(postId);
      const postSnapshot = await postRef.get();

      if (!postSnapshot.exists) {
        res.status(404).json({ message: "Post not found" });
      } else if (postSnapshot.data().member_id !== req.body.member_id) {
        res.status(403).json({ message: "You can update only your post" });
      } else {
        await postRef.update({
          content: req.body.content,
          status: req.body.status,
          updatedAt: new Date(),
        });

        // Fetch the updated post data from the server
        const updatedPostSnapshot = await postRef.get();
        const updatedPost = updatedPostSnapshot.data();

        res
          .status(200)
          .json({ message: "Post updated successfully", post: updatedPost });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update post", error: err });
  }
});

// Delete a post
router.delete("/:id", validateToken, async (req, res) => {
  try {
    const isUserDoc = await usersCollection.doc(req.user.userId).get();
    const isUser = isUserDoc.data();
    if (isUser) {
      const postId = req.params.id;
      const postRef = postsCollection.doc(postId);
      const postSnapshot = await postRef.get();

      if (!postSnapshot.exists) {
        res.status(404).json({ message: "Post not found" });
      } else if (postSnapshot.data().member_id !== req.body.member_id) {
        res.status(403).json({ message: "You can delete only your post" });
      } else {
        const imageUrls = postSnapshot.data().img;

        const deletePromises = imageUrls.map(async (imageUrl) => {
          const fileRef = ref(storage, imageUrl);
          try {
            await deleteObject(fileRef);
            console.log("File deleted:", imageUrl);
          } catch (error) {
            console.log("Failed to delete file:", imageUrl, error);
          }
        });

        await Promise.all(deletePromises);
        await postRef.delete();
        res.status(200).json({ message: "Post deleted successfully" });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete post", error: err });
  }
});

export default router;
