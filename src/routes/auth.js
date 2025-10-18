const express = require("express");
const authRouter = express.Router();
const Joi = require("joi");
const institutionService = require("../services/institutionService");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory for processing
const { uploadToS3 } = require("../S3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Validation schema
const signupSchema = Joi.object({
  firstName: Joi.string().min(2).max(30).required(),
  lastName: Joi.string().min(2).max(30).required(),
  emailId: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).max(128).required(),
  InstitutionName: Joi.string().min(2).max(100).required(),
  Role: Joi.string().valid("Dean", "HOD").required(),
});
// Signup route
authRouter.post("/signup", upload.single("document"), async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
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

    //upload document if provided
    // let documentUrl = null;
    // if (req.file) {
    //   documentUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    // }

    // upload document to S3 if file provided
    // let documentUrl = null;
    // if (req.file) {
    //   documentUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    // }

    // Upload document to S3 only if a file is provided
    let documentUrl = null;
    if (req.file) {
      documentUrl = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const newInstitution = await institutionService.createInstitution({
      firstName,
      lastName,
      emailId,
      phone,
      password,
      InstitutionName,
      Role,
      documentUrl, // include document URL if uploaded
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
});

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
    const institution = await institutionService.findByEmail(emailId);
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
      institution: {
        id: institution.institutionId,
        firstName: institution.firstName,
        lastName: institution.lastName,
        emailId: institution.emailId,
        InstitutionName: institution.InstitutionName,
        Role: institution.Role,
      },
    });
  } catch (err) {
    console.error("Error in /login:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

module.exports = authRouter;
