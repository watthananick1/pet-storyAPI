import { Router } from 'express';
import { appFirebase, db, storage } from "../routes/firebase.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import validateToken from '../models/authMiddleware.js';

dotenv.config();

const usersCollection = db.collection('Users');
const router = Router();

router.post('/register', async (req, res) => {
  console.log(req.body.email);
  console.log(req.body.password);

  try {
    const userCredential = await appFirebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password);
    const user = userCredential.user;
    console.log(user);

    const userData = {
      member_id: user.uid,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      dateOfBirth: req.body.dateOfBirth,
      status: req.body.status,
      statusUser: req.body.statusUser,
      typePets: req.body.typePets,
      profilePicture: "",
      coverPicture: "",
      typePets: [],
      followings: [],
      followers: []
      status: "active",
      
    };

    // Remove undefined values from userData
    const cleanedUserData = Object.fromEntries(Object.entries(userData).filter(([_, value]) => value !== undefined));

    const userRef = usersCollection.doc(user.uid);
    await userRef.set(cleanedUserData);

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log('errorCode', errorCode);
    console.log('errorMessage', errorMessage);
    throw error;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await appFirebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log(`User ${user.uid}`);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate the JWT token
    const token = jwt.sign({ userId: user.uid }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get("/logout", (req, res) => {
 
  appFirebase.auth().signOut()
    .then(() => {
     
      res.status(200).json({ message: "Logout successful" });
    })
    .catch((error) => {
     
      res.status(500).json({ error: "Logout failed" });
    });
});

router.get('/protected', validateToken, (req, res) => {
 
  const userId = req.user.uid;
  console.log(`Accessing user with ID: ${userId}`);
 
  res.send(`Protected route accessed by user with ID: ${userId}`);
});

router.get("/test", async (req, res) => {
  res.send('user');
});

export default router;