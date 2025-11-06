const express = require("express");
const tAuth = require("../../middlewares/teacherAuth");
const { createClass, deleteClass, updateClassName } = require("../../services/teacherService");
const { validateClassSchema } = require("../../validations/validation");
const { data } = require("react-router-dom");
const teacherClass = express.Router();

teacherClass.post("/teachers/class", tAuth, async (req, res) => {
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

teacherClass.delete("/teachers/class/:classCode", tAuth, async (req, res) => {
  try {
    const { classCode } = req.params;
    if (!classCode) {
      return res.status(400).json({ message: "Class code is required" });
    }

    const result = await deleteClass(classCode);
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

teacherClass.patch("/teachers/class/:classCode", tAuth, async (req, res) => {
  try {
    const { classCode } = req.params;
    const { className } = req.body;

    if (!classCode) {
      return res.status(400).json({ message: "Class code is not found" });
    }

    if (!className) {
      return res.status(400).json({ message: "Enter the class name" });
    }

    const updatedClass = await updateClassName(classCode, className);
    
    if (updatedClass.success) {
      res.status(200).json({ success: true, data: "New class name is " + className });
    } else {
      res.status(404).json({ success: false, message: updatedClass.message });
    }

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = teacherClass;
