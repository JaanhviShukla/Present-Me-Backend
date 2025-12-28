const express = require("express");
const studAuth = require("../../middlewares/student_auth");
const {
  addJoinRequest,
  getStudentJoinRequests,
  getStudentEnrollClasses,
  
} = require("../../services/studentService");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const studentClass = express.Router();
const { docClient } = require("../../dynamoDb");
const { ScanCommand } = require("@aws-sdk/client-dynamodb");

const TABLE_NAME = "classes";

studentClass.post("/students/joinRequests", studAuth, async (req, res) => {
  try {
    const student = req.student;
    const { classCode } = req.body;

    if (!student) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!classCode) {
      return res.status(400).json({ error: "Class code is required" });
    }

    const getCmd = new GetCommand({
      TableName: "classes",
      Key: { classCode },
    });
    const result = await docClient.send(getCmd);

    if (!result.Item) {
      return res.status(404).json({ error: "Class Code is Incorrect" });
    }

    const classItem = result.Item;

    //check if student already requested to join
    if (
      classItem.joinRequests &&
      classItem.joinRequests.includes(student.studentId)
    ) {
      return res.status(400).json({ error: "Join request already sent" });
    }

    await addJoinRequest(classCode, student.studentId);

    return res
      .status(200)
      .json({ success: true, message: "Join request sent successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

studentClass.get("/students/ViewJoinRequests", studAuth, async (req, res) => {
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

studentClass.get("/students/enrolledClasses", studAuth, async (req, res) => {
  try {
    const studentId = req.student?.studentId;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const result = await getStudentEnrollClasses(studentId);
    
    return res.status(200).json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error) {
    console.error("error fetching enrolled classes:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


module.exports = studentClass;
