import { Router } from 'express';
import { appFirebase, db, storage, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword  } from "../routes/firebase.js";

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

const auth = getAuth(appFirebase);
const usersCollection = collection(db, "Users");
const router = Router();

router.post('/register', async (req, res) => {
  try {
    console.log(req.body.password);
    const user
    // create new user with email and password
    createUserWithEmailAndPassword(auth, req.body.email, req.body.password)
    .then((userCredential) => {
      // Signed in 
       = userCredential.user;
      console.log(user.user);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ..
    });

    // create user data object
    const userData = {
      member_id: user.uid,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      followers: req.body.followers,
      followings: req.body.followings,
      email: req.body.email,
      dateOfBirth: req.body.dateOfBirth,
      status: req.body.status,
      statusUser: req.body.statusUser,
      typePets: req.body.typePets,
      profilePicture: "",
      coverPicture: ""
    };

    // save user data to Firestore database
    await setDoc(doc(usersCollection, user.uid), userData);

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
    
    console.log(req.body);
  
  try {
    const user = await appFirebase.auth().signInWithEmailAndPassword(email, password);

    // Generate a JWT token
    // const token = jwt.sign({ uid: user.uid }, jwtSecret, { expiresIn: '1h' });

    // Return the token and user data
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});


// Logout
router.get("/logout", (req, res) => {
  // Perform appFirebase logout
  appFirebase.auth().signOut()
    .then(() => {
      // Logout successful
      res.status(200).json({ message: "Logout successful" });
    })
    .catch((error) => {
      // Handle any errors
      res.status(500).json({ error: "Logout failed" });
    });
});


router.get("/test", async (req, res) => {
  res.send('user');
});

export default router;
