const express = require("express");
const tAuth = require("../../middlewares/teacherAuth");
const { createClass } = require("../../services/teacherService");
const { validateClassSchema } = require("../../validations/validation");
const teacherCreateClass = express.Router();

teacherCreateClass.post("/teachers/class", tAuth, async (req, res) => {
  try {
    const teacher = req.teacherId;
    if (!teacher) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const { error, value } = validateClassSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { className } = value;

    const newClass = await createClass({
      className,
      createdBy: teacher.teacherId,
    });
    
    res.status(201).json({ success: true, data: newClass });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = teacherCreateClass;
