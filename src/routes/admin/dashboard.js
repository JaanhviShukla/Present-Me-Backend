const express = require("express");
const dashboardrouter = express.Router();
//const userAuth = require("./middlewares/userAuth");
//const router = require("./auth");
const instituteAuth = require("../../middlewares/instituteAuth");

dashboardrouter.get("/admin/dashboard", instituteAuth, (req, res) => {
  console.log(req.institute);
  res.json({ message: `Welcome to the dashboard, ${req.institute.firstName}` });
});

module.exports = dashboardrouter;
