const userAuth = require("../middlewares/userAuth");
const router = require("./auth");

router.get("/dashboard", userAuth, (req, res) => {
  res.json({ message: `Welcome to the dashboard, ${req.user.emailId}` });
});

module.exports = router;