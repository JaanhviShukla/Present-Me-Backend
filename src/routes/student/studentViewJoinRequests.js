const express = require("express");
const studAuth = require("../../middlewares/student_auth");
const { getStudentJoinRequests } = require("../../services/studentService");

const studentViewJoin = express.Router();

studentViewJoin.get("/students/ViewJoinRequests", studAuth, async (req, res) => {
  try {
    const student = req.student;
    if (!student) {
      return res.status(400).json({ message: "Student ID is required" });
    }
    const classes = await getStudentJoinRequests(student.studentId);

    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: "No join requests found" });
    }

    res.status(200).json({
      success: true,
      total: classes.length,
      data: classes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = studentViewJoin;
