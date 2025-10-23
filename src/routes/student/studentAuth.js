const express = require("express");
const { createStudent } = require("../../services/studentService");
const { validateStudentSchema } = require("../../validations/validation");
const studentAuth = express.Router();
const awsService = require("../../services/awsService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//signup route
studentAuth.post("/students/signup", async (req, res) => {
  try {
    const { error, value } = validateStudentSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const {
      firstName,
      lastName,
      emailId,
      phone,
      institutionId,
      password,
      rollNo,
    } = value;

    const existingStudent = await awsService.findByEmail(emailId, "students");
    if (existingStudent) {
      return res
        .status(409)
        .json({ message: "Email already exists, Register with new account" });
    }

    const student = await createStudent({
      firstName,
      lastName,
      emailId,
      phone,
      institutionId,
      password,
      rollNo,
    });

    res.status(201).json({ success: true, data: student });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Signin route
studentAuth.post("/students/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    //validate input
    if (!emailId || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    // Find student by email
    const student = await awsService.findByEmail(emailId, "students");
    //console.log("Student found:", student);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    console.log("Student found:", student);
    //compare password
    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //create JWT token    cccheckkk
    const token = jwt.sign({ id: student.studentId }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });

    //set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", //set secure flag in production
      sameSite: "Strict",
      maxAge: 2 * 24 * 60 * 60 * 1000, //2 days
    });
    return res.status(200).json({
      message: "Login successful",
      token, //also send token in response body
      student,
    });
  } catch (err) {
    console.error("Error in /login:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

// logout route
studentAuth.post("/students/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = studentAuth;
