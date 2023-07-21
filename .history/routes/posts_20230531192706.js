import { Router } from 'express';
// import appFirebase from 'appFirebase/compat/app';
// import 'appFirebase/compat/auth';
// import 'appFirebase/compat/firestore';

import { appFirebase, db, storage } from "../routes/firebase.js";


const postCollection = db.collection("Posts");
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
      const sortParam = req.params.sort; // Retrieve the sorting parameter from query string
      
      console.log('sortParam = ',sortParam);
  
      let query = postCollection.where('member_id', '==', memberId);
      const querySnapshot1 = await query.get();
      const posts1 = [];
      const likes = [];
      querySnapshot1.forEach((doc) => {
        if (doc.data().likes){
          likes.push
          console.log('query = ',doc.data().likes.length);
        }
        posts1.push(doc.data());
      });
      
      // console.log('query = ',posts1);
  
      if (sortParam === 'date') {
        query = query.orderBy('createdAt', 'desc');
      } else if (sortParam === 'popularity') {
        query = query.where('likes');
        const querySnapshot = await query.get();
        const posts = [];
        querySnapshot.forEach((doc) => {
          console.log(doc.data());
          posts.push(doc.data());
          res.status(200).json(posts);
        });
      } else if (sortParam === 'relevance') {
        // Implement your relevance sorting logic here based on relevance scores
        // Replace the field and sorting order with your actual relevance criteria
        query = query.orderBy('relevanceField', 'desc');
      } else {
        // Invalid or no sorting parameter provided, default to sorting by date
        query = query.orderBy('createdAt', 'desc');
      }
  
      const querySnapshot = await query.get();
      const posts = [];
      querySnapshot.forEach((doc) => {
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