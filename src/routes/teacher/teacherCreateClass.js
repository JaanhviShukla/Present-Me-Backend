const express = require("express");
const tAuth = require("../../middlewares/teacherAuth");
const {DynamoDBClient}= require("@aws-sdk/client-dynamodb");
const{GetCommand, UpdateCommand} = require("@aws-sdk/lib-dynamodb");
const client= new DynamoDBClient();
const TABLE_NAME="classes";
const {
  createClass,
  deleteClass,
  updateClassName,
  getClassesByTeacher,
} = require("../../services/teacherService");
const { validateClassName } = require("../../validations/validation");
const { data } = require("react-router-dom");
const teacherClass = express.Router();

teacherClass.post("/teachers/class", tAuth, async (req, res) => {
  try {
    const teacher = req.teacherId;
    
    if (!teacher) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const { error, value } = validateClassName.validate(req.body);
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

    const { error, value } = validateClassName.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { className } = value;

    if (!classCode) {
      return res.status(400).json({ message: "Class code is not found" });
    }

    if (!className) {
      return res.status(400).json({ message: "Enter the class name" });
    }

    const updatedClass = await updateClassName(classCode, className);

    if (updatedClass.success) {
      res
        .status(200)
        .json({ success: true, data: "New class name is " + className });
    } else {
      res.status(404).json({ success: false, message: updatedClass.message });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

teacherClass.get("/teachers/class", tAuth, async (req, res) => {
  const teacherId = req.teacherId.teacherId; // ✅ your login user id
  if (!teacherId) {
    return res.status(400).json({ message: "Teacher is not found" });
  }
  try {
    const classes = await getClassesByTeacher(teacherId);

    return res.status(200).json(classes);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


teacherClass.patch("/teachers/approve-student",tAuth,async(req,res)=>{
  try{
    const{classCode,studentId}=req.body;
    const teacherId=req.teacherId.teacherId;

    if(!classCode || !studentId){
      return res.status(400).json({message:"classId and studentId are required"});
    }

    //Fetch class details
    const classData= await client.send(new GetCommand({
      TableName:TABLE_NAME,
      Key:{classCode}
    }));
    if(!classData.Item){
      return res.status(404).json({message:"Class not found"});
    }
    if(classData.Item.createdBy !== teacherId){
      return res.status(403).json({message:"Unauthorized action"});
    }

    const joinRequests= classData.Item.joinRequests || [];
    const students= classData.Item.students || [];

    //check if studentId is in joinRequests
    if(!joinRequests.includes(studentId)){
      return res.status(400).json({message:"student not found in join request"});
    }
    //Remove studentId from joinRequests and add to students
    joinRequests.splice(joinRequests.indexOf(studentId),1);

    if(!students.includes(studentId)){
      students.push(studentId);}
    
  
    //Update class record
    await client.send(new UpdateCommand({
      TableName:TABLE_NAME,
      Key:{classCode},
      UpdateExpression:"SET joinRequests=:jr, students=:st",
      ExpressionAttributeValues:{
        ":jr":joinRequests,
        ":st":students,
},}));
    return res.status(200).json({
      message:"Student approved successfully",
      approvedStudent: studentId,
      classCode,
    });
  }catch(error){
    console.error("Error approving student",error);
  }
});


module.exports = teacherClass;
