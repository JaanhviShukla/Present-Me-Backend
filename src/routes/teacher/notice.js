// routes/notice.js
const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const tAuth = require("../../middlewares/teacherAuth");
const studAuth = require("../../middlewares/student_auth");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({ region: "ap-south-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const notice = express.Router();

// ─── POST /teachers/send-notice ───────────────────────────────────────
// Teacher sends a notice to a class
notice.post("/teachers/send-notice", tAuth, async (req, res) => {
  try {
    const { classCode, className, title, message, priority } = req.body;
    const teacherId = req.teacherId.teacherId;
    const teacherName = `${req.teacherId.firstName} ${req.teacherId.lastName}`;

    if (!classCode || !title || !message) {
      return res.status(400).json({
        message: "classCode, title and message are required",
      });
    }

    const noticeId = uuidv4();
    const createdAt = new Date().toISOString();

    await dynamo.send(new PutCommand({
      TableName: "notices",
      Item: {
        noticeId,
        classCode,
        className:   className ?? "",
        teacherId,
        teacherName,
        title:       title.trim(),
        message:     message.trim(),
        priority:    priority ?? "normal", // normal | urgent | important
        createdAt,
        updatedAt:   createdAt,
      },
    }));

    res.status(200).json({
      message: "Notice sent successfully",
      noticeId,
      classCode,
      title,
      createdAt,
    });

  } catch (err) {
    console.error("send-notice error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ─── GET /teachers/notices/:classCode ─────────────────────────────────
// Teacher views all notices for a class
notice.get("/teachers/notices/:classCode", tAuth, async (req, res) => {
  try {
    const { classCode } = req.params;

    const result = await dynamo.send(new QueryCommand({
      TableName: "notices",
      IndexName: "classCode-createdAt-index",
      KeyConditionExpression: "classCode = :cc",
      ExpressionAttributeValues: { ":cc": classCode },
      ScanIndexForward: false, // latest first
    }));

    res.status(200).json({
      notices: result.Items ?? [],
      count: result.Count ?? 0,
    });

  } catch (err) {
    console.error("get-notices error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ─── DELETE /teachers/notice/:noticeId ────────────────────────────────
// Teacher deletes a notice
notice.delete("/teachers/notice/:noticeId", tAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { classCode } = req.query;

    if (!classCode) {
      return res.status(400).json({ message: "classCode query param required" });
    }

    await dynamo.send(new DeleteCommand({
      TableName: "notices",
      Key: { noticeId, classCode },
    }));

    res.status(200).json({ message: "Notice deleted successfully" });

  } catch (err) {
    console.error("delete-notice error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ─── GET /students/notices/:classCode ─────────────────────────────────
// Student views all notices for their class
notice.get("/students/notices/:classCode", studAuth, async (req, res) => {
  try {
    const { classCode } = req.params;

    const result = await dynamo.send(new QueryCommand({
      TableName: "notices",
      IndexName: "classCode-createdAt-index",
      KeyConditionExpression: "classCode = :cc",
      ExpressionAttributeValues: { ":cc": classCode },
      ScanIndexForward: false, // latest first
    }));

    res.status(200).json({
      notices: result.Items ?? [],
      count: result.Count ?? 0,
    });

  } catch (err) {
    console.error("student-notices error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH /teachers/notice/:noticeId
notice.patch("/teachers/notice/:noticeId", tAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { classCode, title, message, priority } = req.body;

    if (!classCode) {
      return res.status(400).json({ message: "classCode is required in body" });
    }

    if (!title && !message && !priority) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updateParts = [];
    const values = { ":now": new Date().toISOString() };
    const names = {};

    if (title) {
      updateParts.push("#t = :title");
      values[":title"] = title.trim();
      names["#t"] = "title";
    }
    if (message) {
      updateParts.push("#m = :message");
      values[":message"] = message.trim();
      names["#m"] = "message";
    }
    if (priority) {
      updateParts.push("#p = :priority");
      values[":priority"] = priority;
      names["#p"] = "priority";
    }

    updateParts.push("updatedAt = :now");

    await dynamo.send(new UpdateCommand({
      TableName: "notices",
      Key: { noticeId, classCode },
      UpdateExpression: `SET ${updateParts.join(", ")}`,
      ExpressionAttributeValues: values,
      ExpressionAttributeNames: names,
    }));

    res.status(200).json({ message: "Notice updated successfully" });

  } catch (err) {
    console.error("update-notice error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



module.exports = notice;
