const express = require("express");
const sAdminAuth = express.Router();
const institutionService = require("../../services/institutionService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Signin route
sAdminAuth.post("/sadmin/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    //validate input
    if (!emailId || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    // Find admin by email
    const admin = await institutionService.findByEmail(emailId, "admin");
    

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    //compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    
    //create JWT token
    const token = jwt.sign(
      { id: admin},
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

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
      admin,
    });
    
  } catch (err) {
    console.error("Error in /login:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});


module.exports = sAdminAuth;