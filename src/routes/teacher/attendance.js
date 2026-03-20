
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

attendance.get("/teachers/attendance-status/:classCode",
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

attendance.get("/teachers/student-attendance/:classCode/:studentId",
  
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

attendance.patch("/teachers/update-attendance", tAuth, async (req, res) => {
  try {
    const { classCode, date, studentId, status } = req.body;

    if (!classCode || !date || !studentId || status === undefined) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await dynamo.send(new GetCommand({
      TableName: "attendance",
      Key: { classCode, date }
    }));

    if (!existing.Item) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    let attendanceList = existing.Item.attendance;

    attendanceList = attendanceList.map((item) => {
      if (item.studentId === studentId) {
        return { ...item, status };
      }
      return item;
    });

    // 3️⃣ Save updated list
    await dynamo.send(new PutCommand({
      TableName: "attendance",
      Item: {
        ...existing.Item,
        attendance: attendanceList,
        updatedAt: new Date().toISOString(),
      }
    }));

    res.json({ message: "Attendance updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating attendance" });
  }
});


attendance.get("/teachers/class-attendance/:classCode", tAuth, async (req, res) => {
  try {

    const { classCode } = req.params;
    const { startDate, endDate } = req.query;

    /// 🔹 1. GET ATTENDANCE DATA
    const attendanceData = await dynamo.send(new QueryCommand({
      TableName: "attendance",
      KeyConditionExpression: "classCode = :cc",
      ExpressionAttributeValues: {
        ":cc": classCode,
      },
    }));

    let records = attendanceData.Items || [];

    /// 🔹 2. FILTER BY DATE
    if (startDate && endDate) {
      records = records.filter(item =>
        item.date >= startDate && item.date <= endDate
      );
    }

    /// 🔹 3. BUILD STUDENT MAP
    const studentMap = {};

    records.forEach(record => {
      record.attendance.forEach(a => {

        if (!studentMap[a.studentId]) {
          studentMap[a.studentId] = {
            studentId: a.studentId,
            attendance: [],
            present: 0,
            absent: 0,
          };
        }

        studentMap[a.studentId].attendance.push({
          date: record.date,
          status: a.status
        });

        if (a.status === 1) {
          studentMap[a.studentId].present++;
        } else {
          studentMap[a.studentId].absent++;
        }
      });
    });

    /// 🔹 4. FETCH STUDENT DETAILS (BATCH)
    const studentIds = Object.keys(studentMap);

    const studentDetails = {};

    await Promise.all(
      studentIds.map(async (id) => {
        const student = await dynamo.send(new GetCommand({
          TableName: "students",
          Key: { studentId: id },
        }));

        if (student.Item) {
          studentDetails[id] = student.Item;
        }
      })
    );

    /// 🔹 5. MERGE DATA
    const result = studentIds.map(id => {
      const s = studentMap[id];
      const info = studentDetails[id] || {};

      const total = s.present + s.absent;

      return {
        studentId: id,

        /// ✅ STUDENT DETAILS
        name: `${info.firstName || ""} ${info.lastName || ""}`.trim(),
        email: info.emailId || "",
        rollNo: info.rollNo || "",
        

        /// ✅ ATTENDANCE
        attendance: s.attendance,
        present: s.present,
        absent: s.absent,
        percentage: total > 0
          ? Math.round((s.present / total) * 100)
          : 0,
      };
    });

    res.json({
      classCode,
      totalDays: records.length,
      totalStudents: result.length,
      students: result,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching attendance" });
  }
});



module.exports = attendance;