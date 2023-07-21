import { Router } from 'express';
// import appFirebase from 'appFirebase/compat/app';
// import 'appFirebase/compat/auth';
// import 'appFirebase/compat/firestore';

import { appFirebase, db, storage } from "../routes/firebase.js";


const postCollection = db.collection("Posts");
const userCollection = db.collection("Users");
// const storage = appFirebase.storage();

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
        likes: appFirebase.firestore.FieldValue.arrayUnion(req.body.member_id)
      });
      res.status(200).json("The post has been liked");
    } else {
      console.log(101);
      await postRef.update({
        likes: appFirebase.firestore.FieldValue.arrayRemove(req.body.member_id)
      });
      res.status(200).json("The post has been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
  
  // Get posts for a specific member with sorting options
router.get('/:id/:sort', async (req, res) => {
  try {
    const memberId = req.params.id;
    const sortParam = req.params.sort;
    
    let queryUser = userCollection.where('member_id', '==', memberId);
    let query = postCollection;
    
    const queryUserSnapshot = await queryUser.get();
    const querySnapshot = await query.get();
    
    const posts = [];
    const user = [];
    
    console.log(user.typePets);
    
    queryUserSnapshot.forEach((doc) => {
      user.push(doc.data());
    });
    
    querySnapshot.forEach((doc) => {
      // Filter posts based on user's interested pet type
      if (user.some(u => u.typePets === post.typePets)) {
        posts.push(post);
      }
    });

    if (sortParam === 'date') {
      // Sort by date in descending order
      posts.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortParam === 'popularity') {
      // Sort by number of likes in descending order
      posts.sort((a, b) => {
        const likesA = a.likes ? a.likes.length : 0;
        const likesB = b.likes ? b.likes.length : 0;
        return likesB - likesA;
      });
    } else if (sortParam === 'relevance') {
      // Sort by relevance in descending order
      posts.sort((a, b) => b.relevanceField - a.relevanceField);
    } else {
      // Invalid or no sorting parameter provided, default to sorting by date
      posts.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    

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
      comment: req.body.comment,
      status: req.body.status
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
        status: req.body.status,
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
      // Delete the associated files from appFirebase Storage
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