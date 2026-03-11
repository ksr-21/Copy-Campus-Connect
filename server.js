const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const port = process.env.PORT || 5000;

// Connect to Database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));

// Root route for health check
app.get('/', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    message: 'Welcome to Campus Connect API',
    database: dbStatus,
  });
});

app.use(errorHandler);

// Only listen if not in a serverless environment or if explicitly told to
if (process.env.NODE_ENV !== 'production' || process.env.START_SERVER === 'true') {
  app.listen(port, () => console.log(`Server started on port ${port}`));
}

module.exports = app;
