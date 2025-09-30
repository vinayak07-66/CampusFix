const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for /api/issues
app.use('/api/issues', (req, res, next) => {
  console.log('Request to /api/issues:', {
    method: req.method,
    path: req.originalUrl,
    body: req.body,
    userId: req.user && req.user.id
  });
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/uploads', require('./routes/uploads'));

// Default route
app.get('/', (req, res) => {
  res.send('CampusFix API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    const message = `MongoDB connection failed. Check MONGO_URI and network. Error: ${error.message}`;
    console.error(message);
    throw new Error(message);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});