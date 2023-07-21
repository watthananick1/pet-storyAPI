import { Router } from 'express';
// import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import serviceAccount from "../pet-story-f51e3-firebase-adminsdk-wsths-b452f92272.json" assert { type: "json" };
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import crypto from 'crypto';


const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

const router = Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    console.log(req.body.password);
    // create new user with email and password
    const { user } = await firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password);

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

    // save user data to firestore database
    await db.collection('Users').doc(user.uid).set(userData);

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
    const user = await firebase.auth().signInWithEmailAndPassword(email, password);

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
  // Perform Firebase logout
  firebase.auth().signOut()
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
