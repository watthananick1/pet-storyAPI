import { Router } from 'express';
import {
  appFirebase, 
  auth, 
  db, 
  storage,
  FieldValue
} from "../routes/firebase.js";
import { getMetadata } from "firebase/storage";

const postsCollection = db.collection("Posts");
const usersCollection = db.collection("Users");

const router = Router();

// Like / Dislike a post
router.put("/:id/like", async (req, res) => {
  try {
    const postId = req.params.id;
    // console.log("Post ID:", postId);

    const postRef = doc(db, "Posts", postId);
    // console.log("Post Ref:", postRef);

    const postSnapshot = await getDoc(postRef); // Make sure to use getDoc here
    // console.log("Post Snapshot:", postSnapshot);

    if (!postSnapshot.exists()) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const postLikes = postSnapshot.data().likes || [];
    const memberId = req.body.member_id;

    // console.log("Post Likes:", postLikes);
    // console.log("Member ID:", memberId);

    if (postLikes.includes(memberId)) {
      await updateDoc(postRef, {
        likes: FieldValue.arrayRemove(memberId)
      });
      console.log("Post disliked");
      res.status(200).json("The post has been disliked");
    } else {
      await updateDoc(postRef, {
        likes: FieldValue.arrayUnion(memberId)
      });
      console.log("Post liked");
      res.status(200).json("The post has been liked");
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json(err);
  }
});
  
// Get posts for sorting options
router.get('/:sort', async (req, res) => {
  try {
    const sortParam = req.params.sort;

    const querySnapshot = await postsCollection.get();
    const posts = [];

    querySnapshot.forEach((doc) => {
      const post = doc.data();
        // console.log('user', user.typePets);
        // console.log('post', post.tagpet);
      if (post.status === 'normal') {
        posts.push(post);
      } else {
        console.log('Failed to get posts status');
      }
    });
    

    if (sortParam === 'date') {
      posts.sort((a, b) => {
        const date1 = a.createdAt.toDate();
        const date2 = b.createdAt.toDate();
        return date2.getTime() - date1.getTime();
      });
    } else if (sortParam === 'popularity') {
      posts.sort((a, b) => {
        const likesA = a.likes ? a.likes.length : 0;
        const likesB = b.likes ? b.likes.length : 0;
        return likesB - likesA;
      });
    } else if (sortParam === 'relevance') {
      posts.sort((a, b) => b.relevanceField - a.relevanceField);
    } else {
      posts.sort((a, b) => {
        const date1 = a.createdAt.toDate();
        const date2 = b.createdAt.toDate();
        return date2.getTime() - date1.getTime();
      });
    }

    res.status(200).json(posts);
  } catch (err) {
    console.error('Failed to get posts:', err);
    res.status(500).json({ message: 'Failed to get posts', error: err });
  }
});

// Get posts for a specific member with sorting options
router.get('/:id/:sort', async (req, res) => {
  try {
    const memberId = req.params.id;
    const sortParam = req.params.sort;

    const queryUserSnapshot = await usersCollection.where('member_id', '==', memberId).get();
    if (queryUserSnapshot.empty) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = queryUserSnapshot.docs[0].data();
    
    // console.log('user',user);

    const querySnapshot = await postsCollection.get();
    const posts = [];

    querySnapshot.forEach((doc) => {
      const post = doc.data();
    
      if (user.typePets.some((typePet) => post.tagpet.includes(typePet))) {
        // console.log('user', user.typePets);
        // console.log('post', post.tagpet);
        if (post.status === 'normal') {
          posts.push(post);
        } else {
          console.log('Failed to get posts status');
        }
      } else {
      }
    });
    

    if (sortParam === 'date') {
      posts.sort((a, b) => {
        const date1 = a.createdAt.toDate();
        const date2 = b.createdAt.toDate();
        return date2.getTime() - date1.getTime();
      });
    } else if (sortParam === 'popularity') {
      posts.sort((a, b) => {
        const likesA = a.likes ? a.likes.length : 0;
        const likesB = b.likes ? b.likes.length : 0;
        return likesB - likesA;
      });
    } else if (sortParam === 'relevance') {
      posts.sort((a, b) => b.relevanceField - a.relevanceField);
    } else {
      posts.sort((a, b) => {
        const date1 = a.createdAt.toDate();
        const date2 = b.createdAt.toDate();
        return date2.getTime() - date1.getTime();
      });
    }

    res.status(200).json(posts);
  } catch (err) {
    console.error('Failed to get posts:', err);
    res.status(500).json({ message: 'Failed to get posts', error: err });
  }
});

router.post("/", async (req, res) => {
  try {
    const postRef = doc(postsCollection);
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
    await setDoc(postRef, newPost);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post", error: err });
  }
});

//update a post
router.put("/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const postRef = doc(postsCollection, postId);
    const post = await getDoc(postRef);
    if (!post.exists()) {
      res.status(404).json({ message: "Post not found" });
    } else if (post.data().member_id !== req.body.member_id) {
      res.status(403).json({ message: "You can update only your post" });
    } else {
      await updateDoc(postRef, {
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

// Delete a post
router.delete("/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const postRef = doc(postsCollection, postId);
    const post = await getDoc(postRef);

    if (!post.exists()) {
      res.status(404).json({ message: "Post not found" });
    } else if (post.data().member_id !== req.body.member_id) {
      res.status(403).json({ message: "You can delete only your post" });
    } else {
      const imageUrls = post.data().img;

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
      await deleteDoc(postRef);
      res.status(200).json({ message: "Post deleted successfully" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to delete post", error: err });
  }
});

// Create report for a Post
router.post("/reportPost", async (req, res) => {
  try {
    const member_id = req.body.member_id;
    const postId = req.body.post_id;
    const comments = req.body.comments;
    const status = req.body.status;

    const reportRef = db.collection("Report_Post").doc();
    const reportId = reportRef.id
    const reportSnapshot = await reportRef.get();

    if (!reportSnapshot.exists) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const reportData = {
      report_id: reportId,
      member_id: member_id,
      postid: postId,
      comments: comments,
      status: status
    };

    // Save report data to the report document
    await reportRef.set(reportData);

    res.status(200).json({ message: "Post reported successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to report post", error: err });
  }
});




export default router;