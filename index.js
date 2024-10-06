// index.js
const express = require("express");
const path = require("path");
const router = require("./routes");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  "mongodb+srv://joshuamusyokar:rUq5amDDV6IZbt6h@cluster0.mviy5.mongodb.net/geojuice?retryWrites=true&w=majority&appName=Cluster0";

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(router);
app.use("/uploads", express.static("uploads"));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));
// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// API endpoint example
app.get("/api/jobs", (req, res) => {
  const jobs = [
    {
      id: 1,
      title: "Frontend Developer",
      description: "Work with React and Tailwind CSS",
    },
    {
      id: 2,
      title: "Backend Developer",
      description: "Work with Node.js and Express",
    },
    {
      id: 3,
      title: "Full Stack Developer",
      description: "Work with MERN stack",
    },
  ];
  res.json(jobs);
});

// The "catchall" handler: for any request that doesn't
// match one above, send back the React app.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
