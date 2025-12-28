const express = require("express");
const studAuth = require("../../middlewares/student_auth");
const{ addJoinRequest}= require("../../services/studentService");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const studentClass = express.Router();
const { docClient } = require("../../dynamoDb");

studentClass.post("/students/joinRequests", studAuth, async (req, res) => {
  try {
    const student = req.student;
    const { classCode } = req.body;

    if (!student) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!classCode) {
      return res.status(400).json({ error: "Class code is required" });
    }


    const getCmd= new GetCommand({
      TableName:"classes",
      Key:{ classCode },
    });
    const result= await docClient.send(getCmd);

    if (!result.Item) {
      return res.status(404).json({ error: "Class not found" });
    }

    const classItem = result.Item;

    //check if student already requested to join
    if(classItem.joinRequests && classItem.joinRequests.includes(student.studentId)){
      return res.status(400).json({ error: "Join request already sent" });
    }

    await addJoinRequest(classCode,student.studentId);

    return res.status(200).json({ success: true, message: "Join request sent successfully." }); 

   }catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});



studentClass.get("/students/ViewJoinRequests", studAuth, async (req, res) => {
  try {
    const student = req.student;
    if (!student) {
      return res.status(400).json({ message: "Student ID is required" });
    }
    const classes = await getStudentJoinRequests(student.studentId);

    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: "No join requests found" });
    }

    res.status(200).json({
      success: true,
      total: classes.length,
      data: classes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


studentClass.get("/students/enrolledClasses",studAuth, async(req,res)=>{
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

module.exports = studentClass;
