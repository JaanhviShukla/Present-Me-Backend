const express = require("express");
const studentAuth = require("../../middlewares/student_auth");
const studentProfile = express.Router();


studentProfile.get("/students/profile", studentAuth, async (req, res) => {
  try {
    const student = req.student;

    if (!student){
      return res.status(400).json({ message: "Student ID is required" });
    }

    res.status(200).json({ success: true, data: student.firstName});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = studentProfile;
