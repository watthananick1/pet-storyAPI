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
   
    let user;
    try {
      const userCredential = await appFirebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password);
      user = userCredential.user;
      console.log(user);
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log('errorCode', errorCode);
      console.log('errorMessage', errorMessage);
      throw error;
    }

   
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

   
    await setDoc(doc(usersCollection, user.uid), userData);

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await appFirebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate the JWT token
    const token = jwt.sign({ userId: user.uid }, process.env.JWT_SECRET, {
      expiresIn: '10s',
    });

    res.status(200).json({ token });
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