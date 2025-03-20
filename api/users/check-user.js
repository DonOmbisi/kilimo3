import { connectToDatabase } from '../db';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import User from '../models';

// CORS middleware setup for serverless
const corsMiddleware = cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Helper function to run middleware
const runMiddleware = (req, res, middleware) => {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async (req, res) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apply CORS middleware
  await runMiddleware(req, res, corsMiddleware);

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to the database
    await connectToDatabase();

    // Extract wallet address from query params
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({ message: 'User does not exist', exists: false });
    }

    // User exists, generate JWT token
    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return success with token and user data
    return res.status(200).json({
      message: 'User exists',
      exists: true,
      token,
      user: {
        _id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Check user error:', error);
    return res.status(500).json({
      message: 'Server error while checking user',
      error: error.message
    });
  }
};

