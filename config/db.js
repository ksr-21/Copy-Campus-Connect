const mongoose = require('mongoose');

let cachedDb = null;
let mongod = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose.connection;
  }

  const mongoURI = process.env.MONGO_URI;

  try {
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    cachedDb = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);

    if (process.env.NODE_ENV === 'development' && (error.message.includes('ECONNREFUSED') || error.message.includes('server selection timed out'))) {
      console.log('Local MongoDB not found. Starting in-memory MongoDB fallback...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        if (!mongod) {
          mongod = await MongoMemoryServer.create();
        }
        const uri = mongod.getUri();
        console.log(`In-memory MongoDB started at: ${uri}`);
        const conn = await mongoose.connect(uri);
        cachedDb = conn;
        return conn;
      } catch (innerError) {
        console.error(`Failed to start in-memory MongoDB: ${innerError.message}`);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      // Don't exit the process, let it continue so health checks can report the error
      console.warn('Continuing without database connection...');
    }
  }
};

module.exports = connectDB;
