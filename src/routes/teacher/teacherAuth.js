const express = require("express");
const { createTeacher } = require("../../services/teacherService");
const {
  teacherSignupSchema,
  teacherLoginSchema,
} = require("../../validations/teacherValidation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { findByEmail } = require("../../services/awsService");
const tAuth = require("../../middlewares/teacherAuth");
const awsService = require("../../services/awsService");

const teacherAuth = express.Router();

// Teacher Signup Route
teacherAuth.post("/teachers/signup", async (req, res) => {
  try {
    const { error } = teacherSignupSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const existing = await findByEmail(
      req.body.emailId.toLowerCase(),
      "teachers"
    );
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    const newTeacher = await createTeacher(req.body);
    res
      .status(201)
      .json({
        success: true,
        message: "Teacher registered successfully",
        teacherId: newTeacher.teacherId,
      });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Teacher Login Route
teacherAuth.post("/teachers/login", async (req, res) => {
  try {
    const { error } = teacherLoginSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const teacher = await findByEmail(
      req.body.emailId.toLowerCase(),
      "teachers"
    );
    if (!teacher) {
      return res
        .status(400)
        .json({ success: false, message: "EmailId not found" });
    }
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      teacher.passwordHash
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }
    //create JWT token
    const token = jwt.sign(
      {
        id: teacher.teacherId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    //set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 2 * 24 * 60 * 60 * 1000, //2 days
    });

    return res
      .status(200)
      .json({ success: true, message: "Login successful", token, teacher });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// logout route
teacherAuth.post("/teachers/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

//Change Password Route
teacherAuth.post("/teachers/change-password", tAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const teacher = req.teacherId;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old password and new password are required" });
    }

    // Check if old password matches
    const isMatch = await bcrypt.compare(oldPassword, teacher.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await awsService.updatePassword(
      teacher.teacherId,
      newHashedPassword,
      "teachers",
      "teacherId"
    );
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error in /change-password:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

module.exports = teacherAuth;
