const express = require("express");
const sAdminRouter = express.Router();
const institutionService = require("../services/institutionService");

sAdminRouter.get("/sadmin/institutes", async (req, res) => {
  try {
    const institutions = await institutionService.getAllInstitutions();
    res.status(200).json({ success: true, data: institutions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Update institution status
sAdminRouter.patch("/sadmin/institutes/:institutionId/status", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { status } = req.body; // e.g., { "status": "verified" }

    const updated = await institutionService.updateInstitutionStatus(institutionId, status);
    res.status(200).json({
      success: true,
      message: `Institution status updated to '${status}'`,
      data: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = sAdminRouter;
