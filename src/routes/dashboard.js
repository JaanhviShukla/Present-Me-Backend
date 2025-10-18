const express = require("express");
const dashboardrouter = express.Router();
//const userAuth = require("./middlewares/userAuth");
//const router = require("./auth");
const userAuth = require("../middlewares/userAuth");


dashboardrouter.get("/dashboard", userAuth, (req, res) => {
  console.log(req.inst_id);
  res.json({ message: `Welcome to the dashboard, ${req.inst_id.firstName}` });
});

module.exports = dashboardrouter;