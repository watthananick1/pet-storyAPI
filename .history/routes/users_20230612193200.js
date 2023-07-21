import { Router } from "express";
import admin from "firebase-admin";
import { db, storage } from "./firebase.js";
import validateToken from "../models/authMiddleware.js";

const usersCollection = db.collection("Users");
const router = Router();
const FieldValue = admin.firestore.FieldValue;

// Update user
router.put("/updateUser", async (req, res) => {
  const user = await usersCollection.doc(req.body.member_id).get();

  if (!user.exists) {
    res.status(404).json({ message: "User not found" });
  } else if (user.id !== req.body.member_id) {
    res.status(403).json({ message: "You can update only your user" });
  } else {
    try {
      await usersCollection.doc(req.body.member_id).update({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        dateOfBirth: req.body.dateOfBirth,
        updatedAt: new Date(),
      });
      res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to update user", error: err });
    }
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  if (req.body.member_id === req.params.id) {
    try {
      await usersCollection.doc(req.params.id).delete();
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

// Get a user
router.get("/", validateToken, async (req, res) => {
  const member_id = req.query.member_id;
  const firstName = req.query.firstName;
  console.log(firstName);
  try {
    const isUserDoc = await usersCollection.doc(req.user.userId).get();
    const isUser = isUserDoc.data();
    if (isUser) {
      const user = member_id
        ? await usersCollection.doc(member_id).get()
        : await usersCollection.where("firstName", "==", firstName).get();

      if (user.exists) {
        const userData = user.data();
        const { password, updatedAt, ...other } = userData;
        res.status(200).json(other);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get a user by firstName
router.get("/user/:firstName", validateToken, async (req, res) => {
  const firstName = req.params.firstName;
  console.log(firstName);
  try {
    const isUserDoc = await usersCollection.doc(req.user.userId).get();
    const isUser = isUserDoc.data();
    if (isUser) {
      const userSnapshot = await usersCollection
        .where("firstName", "==", firstName)
        .get();
      const users = [];
      userSnapshot.forEach((doc) => {
        const userData = doc.data();
        const { password, updatedAt, ...other } = userData;
        users.push(other);
      });
      res.status(200).json(users);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get a user by ID
router.get("/GETuser/:id", validateToken, async (req, res) => {
  const member_id = req.params.id;
  const users = [];

  try {
    // Authenticate the request using the ID token from the user's login data
    const uid = req.user.userId;

    // Apply Firestore security rules by directly accessing the document
    const userSnapshot = await db.collection("Users").doc(member_id).get();

    if (userSnapshot.exists) {
      const userData = userSnapshot.data();
      const { password, updatedAt, ...other } = userData;
      users.push(other);

      // Check if the authenticated user ID matches the requested member ID
      if (uid === member_id) {
        res.status(200).json(users);
      } else {
        // Return an error if the authenticated user ID does not match the requested member ID
        res.status(403).json({ error: "Access denied" });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get friends of a user
router.get("/friends/:member_id", validateToken, async (req, res) => {
  const member_id = req.params.member_id;
  try {
    const isUserDoc = await usersCollection
      .where("member_id", "==", req.user.userId)
      .get();
    const isUser = !isUserDoc.empty;
    console.log("isUser: ", isUser);
    if (isUser) {
      console.log("user_id: ", isUserDoc.docs[0].id);
      const userDoc = await usersCollection.doc(member_id).get();
      const user = userDoc.data();
      const friends = await Promise.all(
        user.followings.map((friendId) => {
          return usersCollection
            .doc(friendId)
            .get()
            .then((doc) => doc.data());
        })
      );
      const friendList = friends.map((friend) => {
        const { member_id, firstName, profilePicture } = friend;
        return { member_id: member_id, firstName, profilePicture };
      });
      res.status(200).json(friendList);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Follow a user
router.put("/:id/follow", async (req, res) => {
  if (req.body.member_id !== req.params.id) {
    try {
      const userDoc = await usersCollection.doc(req.params.id).get();
      const currentUserDoc = await usersCollection
        .doc(req.body.member_id)
        .get();
      const user = userDoc.data();
      const currentUser = currentUserDoc.data();

      if (!user.followers.includes(req.body.member_id)) {
        await usersCollection.doc(req.params.id).update({
          followers: FieldValue.arrayUnion(req.body.member_id),
        });
        await usersCollection.doc(req.body.member_id).update({
          followings: FieldValue.arrayUnion(req.params.id),
        });
        res.status(200).json("User has been followed");
      } else {
        await usersCollection.doc(req.params.id).update({
          followers: FieldValue.arrayRemove(req.body.member_id),
        });
        await usersCollection.doc(req.body.member_id).update({
          followings: FieldValue.arrayRemove(req.params.id),
        });
        res.status(200).json("User has been unfollowed");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  } else {
    res.status(403).json("You can't follow yourself");
  }
});

// Unfollow a user
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.member_id !== req.params.id) {
    try {
      const userDoc = await usersCollection.doc(req.params.id).get();
      const currentUserDoc = await usersCollection
        .doc(req.body.member_id)
        .get();
      const user = userDoc.data();
      const currentUser = currentUserDoc.data();

      if (user.followers.includes(req.body.member_id)) {
        await usersCollection.doc(req.params.id).update({
          followers: user.followers.filter(
            (follower) => follower !== req.body.member_id
          ),
        });
        await usersCollection.doc(req.body.member_id).update({
          followings: currentUser.followings.filter(
            (following) => following !== req.params.id
          ),
        });
        res.status(200).json("User has been unfollowed");
      } else {
        res.status(403).json("You don't follow this user");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  } else {
    res.status(403).json("You can't unfollow yourself");
  }
});

// Update profile picture of a user
router.put("/:id/profilePicture",validateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const fileExtension = req.body.file.split(";")[0].split("/")[1];
    console.log(fileExtension);
    const base64EncodedImageString = req.body.file.split(";base64,").pop();
    const imageBuffer = Buffer.from(base64EncodedImageString, "base64");
    let contentType = "image/jpeg";
    if (fileExtension === "png") {
      contentType = "image/png";
    } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
      contentType = "image/jpeg";
    }
    const metadata = {
      contentType: contentType,
    };

    const storageRef = storage.ref();
    const fileRef = storageRef.child(
      `${req.params.id}/profilePicture/${Date.now()}_profile`
    );
    await fileRef.put(imageBuffer, metadata);
    const imgUrl = await fileRef.getDownloadURL();

    const user = await usersCollection.doc(id).get();
    if (!user.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    await usersCollection.doc(id).update({ profilePicture: imgUrl });

    res.status(200).json({
      message: "Profile picture updated successfully",
      imgUrl: imgUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update typepets of user
router.put("/:id/typePets",validateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const userRef = usersCollection.doc(userId);

    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updatedData = {
      updatedAt: new Date(),
      typePets: FieldValue.arrayUnion(...req.body.typePets), // Use FieldValue.arrayUnion to add elements
    };

    await userRef.update(updatedData);
    res.status(200).json({ message: "User data updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user data", error: err });
  }
});

export default router;
