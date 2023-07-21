import { Router } from 'express';
import { appFirebase, db, storage } from "../routes/firebase.js";

const commentCollection = db.collection("Comments");

const router = Router();

router.get('/', function(req, res) {
    res.send('Comments');
});

// GET comments by postId
router.get('/:postId/Comments', async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentsSnapshot = await commentCollection
      .where('postId', '==', postId)
      .get();
      
      console.log('Comment')

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
router.post("/comment/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentRef = commentCollection.doc();
    const commentId = commentRef.id;
    const postRef = db.collection("Posts").doc(postId);
    const post = await postRef.get();

    console.log(post.data());

    if (!post.exists) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      id: commentId,
      postId: postId,
      content: req.body.content,
      memberId: req.body.member_id,
      createdAt: new Date(),
    };

    await commentRef.set(newComment);
    console.log('res1', newComment);

    const res2 = await postRef.update({ comment: FieldValue.arrayUnion(removeSpaces(commentId)) });
    console.log('res2', res2);

    // Refresh the comments after successful creation
    const commentsSnapshot = await commentCollection
      .where('postId', '==', postId)
      .get();

    console.log('res3', commentsSnapshot.data());

    const comments = [];
    commentsSnapshot.forEach((doc) => {
      const comment = doc.data();
      console.log('comment', comment);
      comments.push(comment);
    });

    return res.status(200).json(comments);
    // return res.status(200).json({ message: "create comment", error: err });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to create comment", error: err });
  }
});

 

//update a comment
router.put("/:postId/comments/:commentId", async (req, res) => {
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