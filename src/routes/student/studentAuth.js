const express = require("express");
const { createStudent } = require("../../services/studentService");
const { validateStudentSchema } = require("../../middlewares/validation");
const studentAuth = express.Router();
const awsService = require("../../services/awsService");


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

module.exports = studentAuth;
