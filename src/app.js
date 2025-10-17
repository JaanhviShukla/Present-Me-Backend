// app.js (API entry)
require("dotenv").config(); // ensure .env is loaded
const express = require("express");
const bodyParser = require("body-parser");
const cookieParsrer = require("cookie-parser");

const router = require("./routes/auth");

const app = express();
app.use(express.json()); // or express.json()
app.use(cookieParsrer());

app.use("/", router);

// Mount routes
// app.use('/api/institutions', institutionRoutes);

// Example root
app.get("/", (req, res) => res.send("PresentMe back running"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(3000, () => console.log(`Server listening on 3000`));
