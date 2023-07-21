import { Router } from 'express';
import { appFirebase, db, storage } from "../routes/firebase.js";
import { 
collection, 
getDocs, 
query, 
where, 
doc, 
updateDoc, 
arrayRemove, 
arrayUnion, 
getDoc,
setDoc,
deleteDoc
} from 'firebase/firestore';



const postsCollection = collection(db, "Posts");
const usersCollection = collection(db, "Users");
// const storage = appFirebase.storage();

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
        likes: arrayRemove(memberId)
      });
      console.log("Post disliked");
      res.status(200).json("The post has been disliked");
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(memberId)
      });
      console.log("Post liked");
      res.status(200).json("The post has been liked");
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json(err);
  }
});
  
// Get posts for a specific member with sorting options
router.get('/:id/:sort', async (req, res) => {
  try {
    const memberId = req.params.id;
    const sortParam = req.params.sort;

    const queryUserSnapshot = await getDocs(query(usersCollection, where('member_id', '==', memberId)));
    if (queryUserSnapshot.empty) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = queryUserSnapshot.docs[0].data();

    const querySnapshot = await getDocs(postsCollection);
    const posts = [];

    querySnapshot.forEach((doc) => {
      const post = doc.data();

      if (user.typePets.some((typePet) => post.tagpet.includes(typePet))) {
        if (post.status === 'normal') {
          posts.push(post);
        } else {
          console.log('Failed to get posts status');
        }
      } else {
        console.log('Failed to get posts tagpet');
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

//delete a post
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
      // Delete the associated files from appFirebase Storage
      const imageUrls = post.data().img;
      const deletePromises = imageUrls.map((imageUrl) => {
        const fileRef = storage.refFromURL(imageUrl);
        return fileRef.delete();
      });
      if (imageUrls.length > 0) {
        await Promise.all(deletePromises);
      }

      // Delete the post from Firestore
      await deleteDoc(postRef);

      res.status(200).json({ message: "Post deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post", error: err });
  }
});

export default router;