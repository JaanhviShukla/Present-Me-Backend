const express = require("express");
const dashboardrouter = express.Router();
//const userAuth = require("./middlewares/userAuth");
//const router = require("./auth");
const instituteAuth = require("../../middlewares/instituteAuth");
const { uploadProfileImage, patchInstitutionProfile } = require("../../controllers/institutionUpdateController");

dashboardrouter.get("/admin/dashboard", instituteAuth, (req, res) => {
  console.log(req.institute);
  res.json(req.institute);
});
dashboardrouter.patch("/admin/profile",instituteAuth,uploadProfileImage,patchInstitutionProfile);

module.exports = dashboardrouter;
