const express = require("express");
const {
  getAllInstitutions,
  updateInstitutionStatus,
} = require("../../services/awsService");
const SAuth = require("../../middlewares/s_admin_auth");
const sAdminRouter = express.Router();

// ✅ Get all registered institutions
sAdminRouter.get("/sadmin/institutes", SAuth, async (req, res) => {
  try {
    // console.log("SAdmin accessing all institutions:", req.admin);

    const institutions = await getAllInstitutions();
    res.status(200).json({ success: true, data: institutions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Update institution status
sAdminRouter.patch(
  "/sadmin/institutes/:institutionId/status",
  SAuth,
  async (req, res) => {
    try {
      const { institutionId } = req.params;
      const { status } = req.body; // e.g., { "status": "verified" }

      const updated = await updateInstitutionStatus(institutionId, status,"Institutions","institutionId");
      res.status(200).json({
        success: true,
        message: `Institution status updated to '${status}'`,
        data: updated,
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

module.exports = sAdminRouter;
