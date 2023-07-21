import { Router } from 'express';
import { appFirebase, db, storage, FieldValue } from "../routes/firebase.js";
import validateToken from "../models/authMiddleware.js";
const commentCollection = db.collection("Comments");
const usersCollection = db.collection('Users');

const router = Router();

router.get('/', function(req, res) {
    res.send('Comments');
});

router.get('/:postId/Comments', validateToken, async (req, res) => {
  try {
    const isUserDoc = await usersCollection.doc(req.user.userId).get();
    const isUser = isUserDoc.data();
    if (isUser) {
    const postId = req.params.postId;
    const commentsSnapshot = await commentCollection.where('postId', '==', postId).get();

    const comments = [];
    const promises = []; // Array to store the promises for fetching user data

    commentsSnapshot.forEach((doc) => {
      const comment = doc.data();
      comments.push(comment);
      const userPromise = usersCollection.doc(comment.memberId).get(); // Fetch user data for each comment
      promises.push(userPromise);
    });

    const userSnapshots = await Promise.all(promises); // Wait for all user data promises to resolve

    userSnapshots.forEach((userSnapshot, index) => {
      const user = userSnapshot.data();
      comments[index].firstName = user.firstName; // Add firstName to comment
      comments[index].lastName = user.lastName; // Add lastName to comment
      comments[index].profilePicture = user.profilePicture; // Add profilePicture to comment
    });

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve comments', error: err });
  }
});

// Create a comment
router.post("/Comment/:postId", validateToken, async (req, res) => {
  try {
    const isUserDoc = await usersCollection.doc(req.user.userId).get();
    const isUser = isUserDoc.data();
    if (isUser) {
    const postId = req.params.postId;
    const commentRef = commentCollection.doc();
    const commentId = commentRef.id;
    const postRef = db.collection("Posts").doc(postId);

    const postSnapshot = await postRef.get();
    if (!postSnapshot.exists) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    console.log(`Snapshot`, postSnapshot.data());

    const newComment = {
      id: commentId,
      postId: postId,
      content: req.body.content,
      memberId: req.body.member_id,
      createdAt: new Date(),
    };

    await commentRef.set(newComment);

    // Update the post's comments array using FieldValue.arrayUnion()
    await postRef.update({ comments: FieldValue.arrayUnion(commentId) });

    // Refresh the comments after successful creation
    const commentsSnapshot = await commentCollection.where('postId', '==', postId).get();

    const comments = [];
    commentsSnapshot.forEach((doc) => {
      const comment = doc.data();
      comments.push(comment);
    });

    return res.status(200).json(comments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create comment", error: err });
  }
  
});

//update a comment
router.put("/:postId/Comments/:commentId", validateToken, async (req, res) => {
    try {
      //const postId = req.params.postId;
      const isUserDoc = await usersCollection.doc(req.user.userId).get();
    const isUser = isUserDoc.data();
    if (isUser) {
      const commentId = req.params.commentId;
      const commentRef = commentCollection.doc(commentId);
      const comment = await commentRef.get();
      if (!comment.exists) {
        res.status(404).json({ message: "Comment not found" });
      } else if (comment.data().memberId !== req.body.member_id) {
        res.status(403).json({ message: "You can update only your comment" });
      } else {
        await commentRef.update({
          content: req.body.content,
        });
        res.status(200).json({ message: "Comment updated successfully" });
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to update comment", error: err });
    }
});
  
router.delete("/:postId/comments/:commentId", validateToken, async (req, res) => {
  try {
    
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    const commentRef = commentCollection.doc(commentId);
    const postRef = db.collection("Posts").doc(postId);

    const postSnapshot = await postRef.get();
    if (!postSnapshot.exists) {
      res.status(404).json({ message: "Post not found" });
    } else {
      const commentSnapshot = await commentRef.get();
      if (!commentSnapshot.exists) {
        res.status(404).json({ message: "Comment not found" });
      } else if (commentSnapshot.data().memberId !== req.body.member_id) {
        res.status(403).json({ message: "You can delete only your comment" });
      } else {
        await commentRef.delete();

        await postRef.update({
          comment: FieldValue.arrayRemove(commentId)
        });

        const commentsSnapshot = await commentCollection
          .where("postId", "==", postId)
          .get();

        const comments = [];
        commentsSnapshot.forEach((doc) => {
          const comment = doc.data();
          comments.push(comment);
        });

        res.status(200).json({
          message: "Comment deleted successfully",
          comment: comments
        });
      }
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to delete comment", error: err });
  }
});

export default router;