const mongoose = require('mongoose');

// Cache the database connection across serverless function invocations
let cachedDb = null;

/**
 * Connect to MongoDB with connection pooling for serverless functions
 * @returns {Promise<mongoose.Connection>} A promise that resolves to the database connection
 */
async function connectToDatabase() {
  // If the connection is already established, reuse it
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  // Check if we have the required environment variable
  if (!process.env.DATABASE_URL) {
    throw new Error('No DATABASE_URL environment variable defined');
  }

  try {
    // Configure mongoose connection options for optimal performance in serverless
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      // These parameters help optimize for serverless environments
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1,  // Keep at least 1 connection in the pool
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    // Connect to the database
    console.log('Connecting to MongoDB...');
    const db = await mongoose.connect(process.env.DATABASE_URL, options);
    
    // Cache the connection
    cachedDb = db.connection;
    
    // Add event listeners for connection status
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };

