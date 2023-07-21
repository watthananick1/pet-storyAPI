import { Router } from "express";
import { db } from "../routes/firebase.js";

const router = Router();

// Create report for a Post
router.post("/reportPost", async (req, res) => {
  try {
    // Extract data from the request body
    const { member_id, post_id, comment, status } = req.body;

    // Generate a new report ID
    const reportRef = db.collection("Report_Post").doc();
    const reportId = reportRef.id;

    // Check if the post exists
    const postRef = db.collection("Posts").doc(post_id);
    const postSnapshot = await postRef.get();
    if (!postSnapshot.exists) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // Save report data to the report document
    await reportRef.set({
      report_id: reportId,
      member_id,
      post_id,
      comment,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(200).json({ message: "Post reported successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to report post", error: err });
  }
});

// Create Report User
router.post("/reportUser", async (req, res) => {
  try {
    // Extract data from the request body
    const { reporter_id, reported_member_id, comment, status } = req.body;

    // Generate a new report ID
    const reportRef = db.collection("Report_User").doc();
    const reportId = reportRef.id;

    // Check if the reported user exists
    const reportedUserRef = db.collection("Users").doc(reported_member_id);
    const reportedUserSnapshot = await reportedUserRef.get();
    if (!reportedUserSnapshot.exists) {
      res.status(404).json({ message: "Reported user not found" });
      return;
    }

    // Save report data to the report document
    await reportRef.set({
      report_id: reportId,
      reporter_id,
      reported_member_id,
      comment,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(200).json({ message: "User reported successfully" });
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

// Delete Report Post
router.delete("/reportPost/:reportId", async (req, res) => {
  try {
    const reportId = req.params.reportId;

    const reportRef = db.collection("Report_Post").doc(reportId);
    const reportSnapshot = await reportRef.get();

    if (!reportSnapshot.exists) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    // Delete the report document
    await reportRef.delete();

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to delete report", error: err });
  }
});

// Delete Report User
router.delete("/reportUser/:reportId", async (req, res) => {
  try {
    const reportId = req.params.reportId;

    const reportRef = db.collection("Report_User").doc(reportId);
    const reportSnapshot = await reportRef.get();

    if (!reportSnapshot.exists) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    // Delete the report document
    await reportRef.delete();

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to delete report", error: err });
  }
});

// Update Report User Status
router.put("/reportUser/:reportId", async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const status = req.body.status;

    const reportRef = db.collection("Report_User").doc(reportId);
    const reportSnapshot = await reportRef.get();

    if (!reportSnapshot.exists) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    // Update the status field in the report document
    await reportRef.update({ status, updatedAt: new Date() });

    res.status(200).json({ message: "Report status updated successfully" });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ message: "Failed to update report status", error: err });
  }
});

// Update Report Post Status
router.put("/reportPost/:reportId", async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const status = req.body.status;

    const reportRef = db.collection("Report_Post").doc(reportId);
    const reportSnapshot = await reportRef.get();

    if (!reportSnapshot.exists) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    // Update the status field in the report document
    await reportRef.update({ status, updatedAt: new Date() });

    res.status(200).json({ message: "Report status updated successfully" });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ message: "Failed to update report status", error: err });
  }
});

export default router;
