import { Router } from "express";
import {
  appFirebase,
  auth,
  db,
  storage,
  FieldValue,
} from "../routes/firebase.js";

const router = Router();

// Create report for a Post
router.post("/reportPost", async (req, res) => {
  try {
    const memberId = req.body.member_id;
    const postId = req.body.post_id;
    const comment = req.body.comment;
    const status = req.body.status;

    const reportRef = db.collection("Report_Post").doc();
    const reportId = reportRef.id;
    const reportSnapshot = await reportRef.get();

    const postRef = db.collection("Posts").doc(postId);
    const postSnapshot = await postRef.get();

    if (!postSnapshot.exists) {
      res.status(404).json({ message: "Post not found" });
      return;
    } else {
      const reportData = {
        report_id: reportId,
        member_id: memberId,
        post_id: postId,
        comment: comment,
        status: status,
      };

      // Save report data to the report document
      await reportRef.set(reportData);

      res.status(200).json({ message: "Post reported successfully" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to report post", error: err });
  }
});

// Create Report User
router.post("/reportUser", async (req, res) => {
  try {
    const reporterId = req.body.reporter_id;
    const reportedMemberId = req.body.reported_member_id;
    const comments = req.body.comment;
    const status = req.body.status;

    const reportRef = db.collection("Report_User").doc();
    const reportId = reportRef.id;

    const reportedUserRef = db.collection("Users").doc(reportedMemberId);
    const reportedUserSnapshot = await reportedUserRef.get();

    if (!reportedUserSnapshot.exists) {
      res.status(404).json({ message: "Reported user not found" });
      return;
    } else {
      const reportData = {
        report_id: reportId,
        reporter_id: reporterId,
        reported_member_id: reportedMemberId,
        comment: comments,
        status: status,
      };

      // Save report data to the report document
      await reportRef.set(reportData);

      res.status(200).json({ message: "User reported successfully" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to report user", error: err });
  }
});

// Get All Report Users
router.get("/reportUser", async (req, res) => {
  try {
    const reportRef = db.collection("Report_User");
    const reportSnapshot = await reportRef.get();

    if (reportSnapshot.empty) {
      res.status(404).json({ message: "No report users found" });
      return;
    }

    const reportUsers = [];
    reportSnapshot.forEach((doc) => {
      const reportUserData = doc.data();
      reportUsers.push(reportUserData);
    });

    res.status(200).json(reportUsers);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to get report users", error: err });
  }
});

// Get All Report Post
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
    res
      .status(500)
      .json({ message: "Failed to get report for the post", error: err });
  }
});

export default router;
