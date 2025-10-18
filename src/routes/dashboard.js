const express = require("express");
const dashboardrouter = express.Router();
//const userAuth = require("./middlewares/userAuth");
//const router = require("./auth");
const userAuth = require("../middlewares/userAuth");


dashboardrouter.get("/dashboard", userAuth, (req, res) => {
  console.log("User in dashboard route:", req.user);

  res.json({ message: `Welcome to the dashboard, ${req.user.firstName}` });


});

module.exports = dashboardrouter;