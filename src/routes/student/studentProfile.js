const express = require("express");
const studAuth = require("../../middlewares/student_auth");
const studentProfile = express.Router();
const {DynamoDBClient}= require("@aws-sdk/client-dynamodb");
const {ScanCommand}= require("@aws-sdk/lib-dynamodb");
const {uploadStudentProfileImage, patchStudentProfile}= require("../../controllers/studentController");

const client= new DynamoDBClient();
const TABLE_NAME="classes";

studentProfile.get("/students/profile", studAuth, async (req, res) => {
  try {
    const student = req.student;

    if (!student){
      return res.status(400).json({ message: "Student ID is required" });
    }

    res.status(200).json({ success: true, data: student.firstName});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});


studentProfile.patch(
  "/students/profile",
  studAuth,
  uploadStudentProfileImage,  // multer
  patchStudentProfile         // controller
);

studentProfile.get("/students/enrolledClasses",studAuth, async(req,res)=>{
  try{
    const student= req.student;

    const studentId= student.studentId;

    if(!studentId){
      return res.status(400).json({ message: "Student ID is required" });
    }
    //scan all classes
    const response=await client.send(new ScanCommand({
      TableName:TABLE_NAME,
    }));

    const classes=response.Items || [];
    //filter classes where student exist in students array
    const joinedClasses= classes.filter(cls => cls.students?.includes(studentId)).map(cls => ({
      classCode:cls.classCode,
      className:cls.className,
      createdBy:cls.createdBy,
    }));

    return res.status(200).json({
      message:"joined classes fetched successfully",
      studentId,
      joinedClasses
    });

  }catch(error){
    console.error("error fetching enrolled classes:",error);
    return res.status(500).json({ success: false, message: error.message });
  }

});



module.exports = studentProfile;
