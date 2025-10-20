// app.js (API entry)
require("dotenv").config(); // ensure .env is loaded
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth");
const dashboardrouter = require("./routes/dashboard");
const sAdminRouter = require("./routes/sAdmin_institute");

const app = express();
app.use(express.json()); // or express.json()
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", dashboardrouter);
app.use("/", sAdminRouter);

// Mount routes
// app.use('/api/institutions', institutionRoutes);

// Example root
app.get("/", (req, res) => res.send("PresentMe back running"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
