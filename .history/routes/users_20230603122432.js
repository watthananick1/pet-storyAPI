import { Router } from 'express';
import bcrypt from "bcrypt";
import {
  appFirebase, 
  auth, 
  db, 
  storage,
  FieldValue
} from "./firebase.js";

const usersCollection = db.collection("Users");


const router = Router();

//update user
router.put("/:id", async (req, res) => {
  const { userId, isAdmin, ...userData } = req.body;
  if (userId === req.params.id || isAdmin) {
    if (userData.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      await usersCollection.doc(req.params.id).update(userData);
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

//delete user
router.delete("/:id", async (req, res) => {
  if (req.body.member_id === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

//get a user
router.get("/", async (req, res) => {
  const member_id = req.query.member_id;
  const firstName = req.query.firstName;
  console.log(firstName);
  try {
    const user = member_id
      ? await usersCollection.doc(member_id).get()
      : await usersCollection.where("firstName", "==", firstName).get();
    const userData = user.data();
    const { password, updatedAt, ...other } = userData;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get a user by firstName
router.get("/user/:firstName", async (req, res) => {
  const firstName = req.params.firstName;
  console.log(firstName);
  try {
    const userSnapshot = await usersCollection.where("firstName", "==", firstName).get();
    const users = [];
    userSnapshot.forEach((doc) => {
      const userData = doc.data();
      const { password, updatedAt, ...other } = userData;
      users.push(other);
    });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get a user by Id
router.get("/GETuser/:id", async (req, res) => {
  const member_id = req.params.id;
  const users = [];
  console.log(member_id);
  try {
    const userSnapshot = await usersCollection.where('member_id', '==', member_id).get();
    userSnapshot.forEach((doc) => {
      const userData = doc.data();
      const { password, updatedAt, ...other } = userData;
      users.push(other);
    });
    
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});


// Get friends of a user
router.get("/friends/:member_id", async (req, res) => {
  const member_id = req.params.member_id;
  try {
    const userDoc = await usersCollection.doc(member_id).get();
    const user = userDoc.data();
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return usersCollection.doc(friendId).get().then(doc => doc.data());
      })
    );
    const friendList = friends.map((friend) => {
      const { member_id, firstName, profilePicture } = friend;
      return { member_id: member_id, firstName, profilePicture };
    });
    res.status(200).json(friendList);
  } catch (err) {
    res.status(500).json(err);
  }
});



// get friends
//  


// follow a user
router.put("/:id/follow", async (req, res) => {
  if (req.body.member_id !== req.params.id) {
    try {
      const userDoc = await usersCollection.doc(req.params.id).get();
      const currentUserDoc = await usersCollection.doc(req.body.member_id).get();
      const user = userDoc.data();
      console.log(user);
      const currentUser = currentUserDoc.data();
      if (!user.followers.includes(req.body.member_id)) {
        await usersCollection.doc(req.params.id).update({
          followers: [...user.followers, req.body.member_id]
        });
        await usersCollection.doc(req.body.member_id).update({
          followings: [...currentUser.followings, req.params.id]
        });
        res.status(200).json("user has been followed");
      } else {
        res.status(403).json("you already follow this user");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  } else {
    res.status(403).json("you can't follow yourself");
  }
});


// unfollow a user
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.member_id !== req.params.id) {
    try {
      const userDoc = await usersCollection.doc(req.params.id).get();
      const currentUserDoc = await usersCollection.doc(req.body.member_id).get();
      const user = userDoc.data();
      const currentUser = currentUserDoc.data();
      if (user.followers.includes(req.body.member_id)) {
        await usersCollection.doc(req.params.id).update({
          followers: user.followers.filter(follower => follower !== req.body.member_id)
        });
        await usersCollection.doc(req.body.member_id).update({
          followings: currentUser.followings.filter(following => following !== req.params.id)
        });
        res.status(200).json("user has been unfollowed");
      } else {
        res.status(403).json("you don't follow this user");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  } else {
    res.status(403).json("you can't unfollow yourself");
  }
});

// Update profile picture of a user
router.put("/:id/profilePicture", async (req, res) => {
  try {
    const id = req.params.id;
    const fileExtension = req.body.file.split(';')[0].split('/')[1];
    console.log(fileExtension);
    const base64EncodedImageString = req.body.file.split(';base64,').pop();
    const imageBuffer = Buffer.from(base64EncodedImageString, 'base64');
    let contentType = 'image/jpeg';
    if (fileExtension === 'png') {
      contentType = 'image/png';
    } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
      contentType = 'image/jpeg';
    }
    const metadata = {
      contentType: contentType
    };
    
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`${req.params.id}/profilePicture/${Date.now()}_profile`);
    await fileRef.put(imageBuffer, metadata);
    const imgUrl = await fileRef.getDownloadURL();
    
    const user = await usersCollection.doc(id).get();
    if (!user.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await usersCollection.doc(id).update({ profilePicture: imgUrl });
    
    res.status(200).json({ message: "Profile picture updated successfully", imgUrl: imgUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Update typepets of user
router.put('/:id/typePets', async (req, res) => {
  try {
    const userId = req.params.id;
    const userRef = usersCollection.doc(userId);
    
    const postSnapshot = await getDoc(postRef);
    
    if (!postSnapshot.exists()) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    
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
    
    const updatedData = {
      typePets: req.body.typePets // assuming typePets is an array of strings
    };
    await userRef.update(updatedData);
    res.status(200).json({ message: 'User data updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user data', error: err });
  }
});


export default router;
