import { Router } from 'express';
import {
  appFirebase, 
  auth, 
  db, 
  storage,
  FieldValue
} from "../routes/firebase.js";