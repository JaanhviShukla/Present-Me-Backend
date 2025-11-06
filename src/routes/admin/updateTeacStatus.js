const { updateInstitutionStatus } = require("../../services/awsService");
const express = require("express");
const instituteAuth = require("../../middlewares/instituteAuth");

const tableName="teachers";
const adminRouter = express.Router();


// ✅ Update teacher status
adminRouter.patch(
  "/admin/institutes/teachers/:teacherId/status",
  instituteAuth,
  async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { status } = req.body; // e.g., { "status": "verified" }

      const updated = await updateInstitutionStatus(teacherId, status, tableName,"teacherId");
      res.status(200).json({
        success: true,
        message: `teacher status updated to '${status}'`,
        data: updated,
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({ success: false, message: err.message });
    }
  }
);
module.exports = adminRouter;
