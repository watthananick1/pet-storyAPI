import { Router } from 'express';
import {
  appFirebase, 
  auth, 
  db, 
  storage,
  FieldValue
} from "../routes/firebase.js";

const router = Router();



// Get report for a Post
router.get("/reportPost", async (req, res) => {
    try {
      const reportRef = db.collection("Report_Post");
      const reportSnapshot = await reportRef.get();
  
      if (reportSnapshot.empty) {
        res.status(404).json({ message: "No report found for the post" });
        return;
      }
  
      const reports = [];
      reportSnapshot.forEach((doc) => {
        const reportData = doc.data();
        reports.push(reportData);
      });
  
      res.status(200).json(reports);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ message: "Failed to get report for the post", error: err });
    }
  });
  

export default router;