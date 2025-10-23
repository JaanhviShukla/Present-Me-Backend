const express = require("express");
const authRouter = express.Router();
const { validateInstitutionSchema } = require("../../middlewares/validation");
const awsService = require("../../services/awsService");
const multer = require("multer");
const { uploadToS3 } = require("../../S3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory for processing

// Signup route
authRouter.post(
  "/signup",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "designationID", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { error, value } = validateInstitutionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const {
        firstName,
        lastName,
        emailId,
        phone,
        password,
        InstitutionName,
        Role,
      } = value;

      // Check for duplicate email BEFORE uploading files to S3
      const existingInstitution = await awsService.findByEmail(emailId, "Institutions");
      if (existingInstitution) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const files = req.files;
      let aadharUrl = null;
      let designationIDUrl = null;

      // Upload Aadhar
      if (files.aadhar?.[0]) {
        const file = files.aadhar[0];
        aadharUrl = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype
        );
      }

      // Upload Designation ID
      if (files.designationID?.[0]) {
        const file = files.designationID[0];
        designationIDUrl = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype
        );
      }

      const newInstitution = await awsService.createInstitution({
        firstName,
        lastName,
        emailId,
        phone,
        password,
        InstitutionName,
        Role,
        aadharUrl,
        designationIDUrl,
      });
      res.status(201).json({
        message: "Institution created successfully",
        institution: newInstitution,
      });
    } catch (err) {
      if (err.code === "DUPLICATE_EMAIL") {
        return res.status(409).json({ message: err.message });
      }
      console.error("Error in /signup:", err);
      res
        .status(500)
        .json({ message: "Internal server error", error: err.message });
    }
  }
);

// Signin route
authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    //validate input
    if (!emailId || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    // Find institution by email
    const institution = await awsService.findByEmail(emailId, "Institutions");
    //console.log("Institution found:", institution);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    //compare password
    const isMatch = await bcrypt.compare(password, institution.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //create JWT token    cccheckkk
    const token = jwt.sign(
      { id: institution.institutionId },
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
      institution,
    });
  } catch (err) {
    console.error("Error in /login:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

// logout route
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = authRouter;
