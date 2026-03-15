
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


module.exports = attendance;