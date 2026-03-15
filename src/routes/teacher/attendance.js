
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

    const { classCode, date, attendance } = req.body;

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