const { firestore } = require("firebase-admin");

const PostSchema = firestore().collection("posts").doc().set({
  userId: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    max: 500,
  },
  img: {
    type: String,
  },
  likes: {
    type: Array,
    default: [],
  },
  createdAt: firestore.FieldValue.serverTimestamp(),
  updatedAt: firestore.FieldValue.serverTimestamp(),
});

module.exports = PostSchema;