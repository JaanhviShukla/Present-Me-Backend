const express = require("express");
const studAuth = require("../../middlewares/student_auth");
const{ addJoinRequest}= require("../../services/studentService");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const studentJoin = express.Router();
const { docClient } = require("../../dynamoDb");

studentJoin.post("/students/joinRequests", studAuth, async (req, res) => {
  try {
    const student = req.student;
    const { classCode } = req.body;

    if (!student) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!classCode) {
      return res.status(400).json({ error: "Class code is required" });
    }

    // Here  logic to handle the join request
    // const result= await DynamoDB.get({
    //   TableName:"classes",
    //   key:{ classCode },
    // })
    // .promise();

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

    // update joinRequests array

    // await dynamoDB.update({
    //   TableName:"classes",
    //   Key:{ classCode },
    //   UpdateExpression: "SET joinRequests = list_append(if_not_exists(joinRequests, :empty_list), :studentId)",
    //   ExpressionAttributeValues: {
    //     ":studentId": [student.studentId],
    //     ":empty_list": [],
    //   },
    //   ReturnValues: "UPDATED_NEW",
    // })
    // .promise();
    await addJoinRequest(classCode,student.studentId);

    return res.status(200).json({ success: true, message: "Join request sent successfully." }); 

   }catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = studentJoin;
