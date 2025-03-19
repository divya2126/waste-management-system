const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads")); // Serve uploaded images

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/complaintsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

// Define Schema & Model
const complaintSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  category: String,
  location: String,
  image: String, // Store image filename
  createdAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model("Complaint", complaintSchema);

// Multer Storage Configuration (For Images)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});
const upload = multer({ storage });

// API to Handle Complaint Submission
app.post("/submit-complaint", upload.single("pictures"), async (req, res) => {
  try {
    const newComplaint = new Complaint({
      name: req.body.name,
      mobile: req.body.mobile,
      email: req.body.email,
      category: req.body.category,
      location: req.body.location,
      image: req.file ? req.file.filename : null, // Store uploaded image filename
    });

    await newComplaint.save();
    res.status(201).json({ message: "Complaint Registered Successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error registering complaint", error });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

