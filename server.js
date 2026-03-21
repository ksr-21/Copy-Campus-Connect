const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const path = require('path');
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
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
        status: 'ok',
        database: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/dist')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
  );
} else {
  // Root route for health check
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Campus Connect API' });
  });
}

app.use(errorHandler);

// Only listen if not in a serverless environment or if explicitly told to
if (process.env.NODE_ENV !== 'production' || process.env.START_SERVER === 'true') {
  app.listen(port, () => console.log(`Server started on port ${port}`));
}

module.exports = app;
