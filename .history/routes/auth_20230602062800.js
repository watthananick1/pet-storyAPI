import { Router } from 'express';
import {
  appFirebase, 
  auth, 
  db, 
  storage
} from "../routes/firebase.js";

// const auth = getAuth(appFirebase);
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

  try {
    console.log(`'login'`)
    const user = await appFirebase.auth().signInWithEmailAndPassword(email, password);
    // Login successful
    res.status(200).json({ message: 'Login successful',user: user.user });
  } catch (error) {
    // Handle login errors
    console.log(error);
    let errorMessage = 'Login failed';

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Wrong password';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found';
    }

    res.status(500).json({ error: errorMessage });
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
