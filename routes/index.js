const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const Job = require("../models/job");
const User = require("../models/user");
const authMiddleware = require("../middlewares");
require("dotenv").config();
const router = express.Router();
// Multer setup for image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Change as per your setup
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const secret = process.env.JWT_SECRET || "secret";
const upload = multer({ storage });
// Retrieve job history for a specific user
router.get("/users/:userId/jobs", authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const jobs = await Job.find({ userId });
    if (!jobs) {
      return res.status(404).json({ message: "No jobs found for this user" });
    }

    return res.json(jobs);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to retrieve job history", error });
  }
});
// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user._id }, secret, {
    expiresIn: "1h",
  });
  return res.json({ token, user });
});

// Register Route
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = await User.create({ email, password: hashedPassword, name });
  console.log(newUser);

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return res.status(201).json({ token, user: newUser });
});
router.post("/jobs", upload.single("image"), async (req, res) => {
  console.log(req.body);
  const { title, description, lat, lng, image, userId } = req.body;

  // Validate the required fields
  if (!title || !description || !lat || !lng || !userId) {
    return res
      .status(400)
      .json({ message: "All required fields must be provided" });
  }

  try {
    // Optionally validate if the userId exists in your User model
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Handle the uploaded file
    let imagePath = "";
    if (req.file) {
      imagePath = req.file.path; // Get the path of the uploaded image
    }
    // Create the new job
    const newJob = new Job({
      title,
      description,
      lat,
      lng,
      image: imagePath, // This can be optional, or handle uploading logic
      userId,
    });

    // Save the job to the database
    const savedJob = await newJob.save();

    res
      .status(201)
      .json({ message: "Job created successfully", job: savedJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().populate("userId", "name"); // Assuming you have user references in Job
    res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/:jobId/upload-image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    const { jobId } = req.params;

    try {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      job.image = req.file.path; // Save the image path to the job
      await job.save();

      return res.json({ message: "Image uploaded successfully", job });
    } catch (error) {
      return res.status(500).json({ message: "Failed to upload image", error });
    }
  }
);
// Retrieve job history for a specific user
router.get("/users/:userId/jobs", authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const jobs = await Job.find({ userId });
    if (!jobs) {
      return res.status(404).json({ message: "No jobs found for this user" });
    }

    return res.json(jobs);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to retrieve job history", error });
  }
});
module.exports = router;
