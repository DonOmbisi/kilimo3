import { connect } from '../db';
import jwt from 'jsonwebtoken';
import User from '../models';

// Middleware to verify JWT token
const verifyToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided or invalid format');
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*', // Update this to your specific domain in production
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders).end();
    return;
  }
  
  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Verify JWT token
    const decoded = verifyToken(req);
    const userId = decoded.userId;
    
    // Connect to the database
    await connect();
    
    // Find user by id and populate necessary fields
    const user = await User.findById(userId)
      .populate('wallet')
      .populate('campaigns')
      .populate('investments')
      .populate('withdrawals')
      .populate({
        path: 'notifications',
        options: { sort: { createdAt: -1 } }
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the user data without password
    const userObj = user.toObject();
    delete userObj.password;
    
    return res.status(200).json({ user: userObj });
  } catch (error) {
    console.error('Profile endpoint error:', error);
    
    if (error.message.includes('Token verification failed')) {
      return res.status(401).json({ message: error.message });
    }
    
    return res.status(500).json({ 
      message: 'Server error retrieving user profile',
      error: error.message 
    });
  }
}

