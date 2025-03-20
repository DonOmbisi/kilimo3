const mongoose = require('mongoose');
const { connectToDatabase } = require('../db');
const User = require('../models').User;

// Set CORS headers helper function
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
};

// Serverless function handler
module.exports = async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }
  
  // Set CORS headers for all requests
  setCorsHeaders(res);
  
  // This endpoint only accepts POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method Not Allowed' 
    });
  }

  try {
    // Connect to database
    await connectToDatabase();
    
    const { walletAddress } = req.body;
    
    // Validate input
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ walletAddress });
    
    if (user) {
      return res.status(200).json({
        success: true,
        message: 'User found',
        user
      });
    }
    
    // Create new user
    user = new User({
      walletAddress,
      createdAt: new Date()
    });
    
    await user.save();
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this wallet address already exists'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

