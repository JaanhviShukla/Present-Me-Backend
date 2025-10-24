const express = require("express");
const tAuth = require("../../middlewares/teacherAuth");
const teacherProfile = express.Router();

teacherProfile.get("/teachers/profile", tAuth, async (req, res) => {
  try {
    const teacher = req.teacherId;
    if (!teacher){
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    res.status(200).json({ success: true, data: teacher.firstName});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = teacherProfile; 