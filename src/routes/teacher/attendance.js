
const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const tAuth = require("../../middlewares/teacherAuth");
const client = new DynamoDBClient({ region: "ap-south-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const attendance = express.Router();
const TABLE_NAME = "attendance";

attendance.post("/teachers/mark-attendance",tAuth, async (req, res) => {
  try {

    const { classCode, date, attendance, teacherId } = req.body;

    if (!classCode || !date || !attendance) {
      return res.status(400).json({ message: "classCode, date and attendance are required" });
    }
    

    // Check if attendance already exists
    const checkParams = {
      TableName: TABLE_NAME,
      Key: {
        classCode,
        date
      }
    };

    const existing = await dynamo.send(new GetCommand(checkParams));

    if (existing.Item) {
      return res.status(400).json({
        message: "Attendance already submitted for today"
      });
    }

    const params = {
      TableName: "attendance",
      Item: {
        classCode,
        date,
        attendance,
        createdAt: new Date().toISOString(),
        markedBy: req.teacherId.teacherId
      }
    };

    await client.send(new PutCommand(params));

    res.json({
      message: "Attendance saved successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving attendance" });
  }
});

attendance.get(
  "/teachers/attendance-status/:classCode",
  tAuth,
  async (req, res) => {
    try {

      const { classCode } = req.params;

      const today = new Date().toISOString().split("T")[0];

      const params = {
        TableName: "attendance",
        Key: {
          classCode,
          date: today
        }
      };

      const data = await dynamo.send(new GetCommand(params));

      if (!data.Item) {
        return res.json({
          submitted: false,
          attendance: []
        });
      }

      return res.json({
        submitted: true,
        attendance: data.Item.attendance
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching attendance status" });
    }
  }
);

attendance.get(
  "/teachers/student-attendance/:classCode/:studentId",
  tAuth,
  async (req, res) => {

    try {

      const { classCode, studentId } = req.params;

      const params = {
        TableName: "attendance",
        KeyConditionExpression: "classCode = :c",
        ExpressionAttributeValues: {
          ":c": classCode
        }
      };

      const data = await dynamo.send(new QueryCommand(params));

      const records = data.Items || [];

      const studentAttendance = [];

      for (const record of records) {

        const student = record.attendance.find(
          s => s.studentId === studentId
        );

        if (student) {
          studentAttendance.push({
            date: record.date,
            status: student.status
          });
        }

      }

      res.json({
        classCode,
        studentId,
        attendance: studentAttendance
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: "Error fetching student attendance"
      });

    }

  }
);


module.exports = attendance;