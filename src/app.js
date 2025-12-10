// app.js (API entry)
require("dotenv").config(); // ensure .env is loaded
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/admin/auth");
const dashboardrouter = require("./routes/admin/dashboard");
const sAdminRouter = require("./routes/sAdmin/sAdmin_institute");
const sAdminAuth = require("./routes/sAdmin/SAuth");
const studentAuth = require("./routes/student/studentAuth");
const teacherAuth = require("./routes/teacher/teacherAuth");
const studentProfile = require("./routes/student/studentProfile");
const adminRouter = require("./routes/admin/updateTeacStatus");
const teacherProfile = require("./routes/teacher/teacherProfile");
const teacherClass = require("./routes/teacher/teacherCreateClass");
const studentJoin = require("./routes/student/studentJoinRequest");
const studentViewJoin = require("./routes/student/studentViewJoinRequests");

const app = express();
const cors = require("cors");

// Middleware
app.use(cors(
  {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }
));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use(cookieParser());


app.use("/", authRouter);
app.use("/", dashboardrouter);
app.use("/", sAdminRouter);
app.use("/", sAdminAuth);
app.use("/", studentAuth);
app.use("/", teacherAuth);
app.use("/", studentProfile);
app.use("/", adminRouter);
app.use("/", teacherProfile);
app.use("/", teacherClass);
app.use("/", studentJoin);
app.use("/", studentViewJoin);

// Mount routes
// app.use('/api/institutions', institutionRoutes);

// Example root
app.get("/", (req, res) => res.send("PresentMe back running"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
