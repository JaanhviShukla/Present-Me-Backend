// app.js (API entry)
require("dotenv").config(); // ensure .env is loaded
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/admin/auth");
const dashboardrouter = require("./routes/admin/dashboard");
const sAdminRouter = require("./routes/sAdmin/sAdmin_institute");
const sAdminAuth = require("./routes/sAdmin/sauth");

const app = express();
app.use(express.json()); // or express.json()
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", dashboardrouter);
app.use("/", sAdminRouter);
app.use("/", sAdminAuth);

// Mount routes
// app.use('/api/institutions', institutionRoutes);

// Example root
app.get("/", (req, res) => res.send("PresentMe back running"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
