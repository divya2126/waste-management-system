const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/wms')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// MongoDB Schemas and Models
// Report Schema
const reportSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  category: String,
  location: String,
  picture: String
});

const Report = mongoose.model('Report', reportSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  address: String,
  type: String,
  quantity: Number,
  date: Date,
  status: { type: String, default: 'pending' }, // pending, in-progress, verified
  verificationImage: String,
  reward: { type: Number, default: 0 }
});

const Task = mongoose.model('Task', taskSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: String, // earned, redeemed
  description: String,
  points: Number,
  date: { type: Date, default: Date.now }
});

// User Schema (updated with transactions)
const userSchema = new mongoose.Schema({
  email: String,
  points: { type: Number, default: 0 },
  transactions: [transactionSchema]
});

const User = mongoose.model('User', userSchema);

// Routes for Reports
app.post('/report', upload.single('pictures'), async (req, res) => {
  try {
    const report = new Report({
      name: req.body.name,
      mobile: req.body.mobile,
      email: req.body.email,
      category: req.body.category,
      location: req.body.location,
      picture: req.file ? req.file.path : null
    });

    await report.save();

    // Create a corresponding task for waste collection
    const task = new Task({
      address: req.body.location,
      type: req.body.category,
      quantity: 100,
      date: new Date()
    });

    await task.save();

    // Add points for reporting waste
    const userEmail = req.body.email;
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = new User({ email: userEmail });
    }
    user.points += 10; // 10 points for reporting waste
    user.transactions.push({
      type: 'earned',
      description: 'Points earned for reporting waste',
      points: 10,
      date: new Date()
    });
    await user.save();

    res.status(201).send('Report submitted successfully');
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).send('Error submitting report');
  }
});

// Routes for Tasks
app.get('/tasks', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const tasks = await Task.find().skip(skip).limit(limit);
    const totalTasks = await Task.countDocuments();
    const totalPages = Math.ceil(totalTasks / limit);

    res.json({ tasks, totalPages });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Error fetching tasks');
  }
});

app.patch('/tasks/:id/start', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).send('Task not found');
    }

    task.status = 'in-progress';
    await task.save();
    res.status(200).send('Collection started');
  } catch (error) {
    console.error('Error starting collection:', error);
    res.status(500).send('Error starting collection');
  }
});

app.patch('/tasks/:id/verify', upload.single('image'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).send('Task not found');
    }

    const isVerified = true;
    if (!isVerified) {
      return res.status(400).send('Verification failed');
    }

    task.status = 'verified';
    task.verificationImage = req.file ? req.file.path : null;
    task.reward = 56;
    await task.save();

    const userEmail = 'user@example.com';
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = new User({ email: userEmail });
    }
    user.points += task.reward;
    user.transactions.push({
      type: 'earned',
      description: 'Points earned for collecting waste',
      points: task.reward,
      date: new Date()
    });
    await user.save();

    res.status(200).json({ points: user.points });
  } catch (error) {
    console.error('Error verifying collection:', error);
    res.status(500).send('Error verifying collection');
  }
});

// Routes for User Data
app.get('/user', async (req, res) => {
  try {
    const userEmail = 'user@example.com'; // Replace with actual user email
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = new User({ email: userEmail });
      await user.save();
    }
    res.json({
      points: user.points,
      transactions: user.transactions.sort((a, b) => b.date - a.date).slice(0, 5) // Last 5 transactions
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Error fetching user data');
  }
});

app.patch('/user/redeem', async (req, res) => {
  try {
    const userEmail = 'user@example.com';
    let user = await User.findOne({ email: userEmail });
    if (!user || user.points <= 0) {
      return res.status(400).send('No points to redeem');
    }

    const pointsToRedeem = user.points;
    user.points = 0;
    user.transactions.push({
      type: 'redeemed',
      description: 'Redeemed all points',
      points: pointsToRedeem,
      date: new Date()
    });
    await user.save();

    res.status(200).send('Points redeemed successfully');
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).send('Error redeeming points');
  }
});

// Route for Leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 }).limit(10); // Top 10 users
    res.json(users);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).send('Error fetching leaderboard');
  }
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});