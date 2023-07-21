import { Router } from 'express';
import { appFirebase, db, storage, FieldValue } from "../routes/firebase.js";

const commentCollection = db.collection("Comments");

const router = Router();

router.get('/', function(req, res) {
    res.send('Comments');
});

router.get('/:postId/Comments', async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentsSnapshot = await commentCollection.where('postId', '==', postId).get();

    const comments = [];
    commentsSnapshot.forEach((doc) => {
      const comment = doc.data();
      comments.push(comment);
    });

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve comments', error: err });
  }
});


// Create a comment
router.post("/Comment/:postId", async (req, res) => {
  try {
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
    const commentsSnapshot = await commentCollection
      .where('postId', '==', postId)
      .get();

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
router.put("/:postId/Comments/:commentId", async (req, res) => {
    try {
      //const postId = req.params.postId;
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
  
router.delete("/:postId/comments/:commentId", (req, res) => {
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  const commentRef = commentCollection.doc(commentId);
  const postRef = db.collection("Posts").doc(postId);

  commentRef
    .delete()
    .then(() => {
      return postRef.update({
        comment: appFirebase.firestore.FieldValue.arrayRemove(commentId)
      });
    })
    .then(() => {
      return commentCollection
        .where("postId", "==", postId)
        .get();
    })
    .then((commentsSnapshot) => {
      const comments = [];
      commentsSnapshot.forEach((doc) => {
        const comment = doc.data();
        comments.push(comment);
      });

      res.status(200).json({
        message: "Comment deleted successfully",
        comments: comments // Include the comments array in the response
      });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to delete comment", error: err });
    });
});






export default router;