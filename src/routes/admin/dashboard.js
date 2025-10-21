const express = require("express");
const dashboardrouter = express.Router();
//const userAuth = require("./middlewares/userAuth");
//const router = require("./auth");
const instituteAuth = require("../../middlewares/instituteAuth");

dashboardrouter.get("/dashboard", instituteAuth, (req, res) => {
  console.log(req.inst_id);
  res.json({ message: `Welcome to the dashboard, ${req.inst_id.firstName}` });
  res.send
});

module.exports = dashboardrouter;
