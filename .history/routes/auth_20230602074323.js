import { Router } from 'express';
import { appFirebase, db, storage } from "../routes/firebase.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import validateToken from '../models/authMiddleware.js';

dotenv.config();

const secretKey = process.env.JWT_SECRET

const usersCollection = db.collection("Users");
const router = Router();

router.post('/register', async (req, res) => {
  try {
    console.log(req.body.email);
    console.log(req.body.password);
    // create new user with email and password
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, req.body.email, req.body.password);
      user = userCredential.user;
      console.log(user);
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log('errorCode', errorCode);
      console.log('errorMessage', errorMessage);
      throw error; // Throw the error to be caught in the catch block
    }

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
  
  con

  try {
    const userCredential = await appFirebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    // Generate a JWT token with the user's UID as the subject (sub) claim
    const token = jwt.sign({ uid: user.uid }, secretKey, { expiresIn: '1h' });

    // Return the token and user data
    res.status(200).json({ token, user });
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

// Protected route
router.get('/protected', validateToken, (req, res) => {
  // Access the user's information from req.user
  const userId = req.user.uid;
  console.log(`Accessing user with ID: ${userId}`);
  // Handle the protected route logic here
  res.send(`Protected route accessed by user with ID: ${userId}`);
});

router.get("/test", async (req, res) => {
  res.send('user');
});

export default router;
