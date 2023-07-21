import { Router } from 'express';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const postCollection = db.collection("Posts");
const storage = firebase.storage();

const router = Router();


//like / dislike a post
router.put("/:id/like", async (req, res) => {
  try {
    const postId = req.params.id;
    const postRef = postCollection.doc(postId);
    const post = await postRef.get();
    if (!post.data().likes.includes(req.body.member_id)) {
      console.log(100);
      await postRef.update({
        likes: firebase.firestore.FieldValue.arrayUnion(req.body.member_id)
      });
      res.status(200).json("The post has been liked");
    } else {
      console.log(101);
      await postRef.update({
        likes: firebase.firestore.FieldValue.arrayRemove(req.body.member_id)
      });
      res.status(200).json("The post has been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//get a post
// router.get("/:id", async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const postRef = postCollection.doc(postId);
//     const post = await postRef.get();
//     if (!post.exists) {
//     res.status(404).json({ message: "Post not found" });
//     } else {
//     res.status(200).json(post.data());
//     }
//   } catch (err) {
//     res.status(500).json({ message: "Failed to get post", error: err });
//   }
//   });
  
  router.get('/:id', async (req, res) => {
    try {
      const memberId = req.params.id;
      const querySnapshot = await postCollection.where('member_id', '==', memberId).get();
      const posts = [];
      querySnapshot.forEach(doc => {
        posts.push(doc.data());
      });
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get posts', error: err });
    }
  });
  

//get comments for a post
router.get("/:id/comments", async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentsRef = db.collection("Comments").where("id", "==", postId);
    const commentsSnapshot = await commentsRef.get();
    const comments = commentsSnapshot.docs.map((doc) => doc.data());
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Failed to get comments", error: err });
  }
});


//create a post
router.post("/", async (req, res) => {
  try {
    const postRef = postCollection.doc();
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
      comment: req.body.comment
    };
    await postRef.set(newPost);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post", error: err });
  }
});

//update a post
router.put("/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const postRef = postCollection.doc(postId);
    const post = await postRef.get();
    if (!post.exists) {
      res.status(404).json({ message: "Post not found" });
    } else if (post.data().member_id !== req.body.member_id) {
      res.status(403).json({ message: "You can update only your post" });
    } else {
      await postRef.update({
        content: req.body.content,
        updatedAt: new Date(),
    });
      res.status(200).json({ message: "Post updated successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to update post", error: err });
  }
});



//delete a post
router.delete("/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const postRef = postCollection.doc(postId);
    const post = await postRef.get();
    if (!post.exists) {
      res.status(404).json({ message: "Post not found" });
    } else if (post.data().member_id !== req.body.member_id) {
      res.status(403).json({ message: "You can delete only your post" });
    } else {
      // Delete the associated files from Firebase Storage
      const imageUrls = post.data().img;
      const deletePromises = imageUrls.map((imageUrl) => {
        const fileRef = storage.refFromURL(imageUrl);
        return fileRef.delete();
      });
      await Promise.all(deletePromises);

      // Delete the post from Firestore
      await postRef.delete();

      res.status(200).json({ message: "Post deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post", error: err });
  }
});

export default router;