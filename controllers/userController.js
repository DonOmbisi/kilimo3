const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
// Create a new user
// req.body: { wallet_address, name, basename, phone }
// res: { token }
exports.connectWallet = async (req, res) => {
  // Input validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { wallet_address, name, basename, phone } = req.body;
  
  // Validate required fields
  if (!wallet_address) {
    return res.status(400).json({ message: 'Wallet address is required' });
  }
  
  try {
    let user = await User.findOne({ wallet_address });
    if (!user) {
      // Additional validation for new user
      if (!name || !phone) {
        return res.status(400).json({ message: 'Name and phone are required for registration' });
      }
      
      user = new User({ wallet_address, name, basename, phone });
      await user.save();
    }
    
    // Generate access token (shorter lifespan)
    const accessToken = generateAccessToken(user);
    
    // Generate refresh token (longer lifespan)
    const refreshToken = jwt.sign(
      { _id: user._id, wallet_address },
      process.env.JWT_SECRET,
      { expiresIn: '60d' }
    );
    
    res.json({ 
      user, 
      token: accessToken, 
      refreshToken
    });
  } catch (error) {
    console.error('Connect wallet error:', error);
    res.status(500).json({ 
      message: 'Failed to create or authenticate user',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

// Helper function to generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, wallet_address: user.wallet_address },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // Shorter expiration for access tokens
  );
};
// Get user profile
// req.user: { _id, wallet_address }
// res: user
// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify the refresh token
    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }
      
      try {
        // Find the user
        const user = await User.findById(decoded._id);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate a new access token
        const accessToken = generateAccessToken(user);
        
        res.json({ token: accessToken });
      } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ 
          message: 'Failed to refresh token',
          error: process.env.NODE_ENV === 'production' ? null : error.message
        });
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      message: 'Failed to refresh token',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const id = req.user._id;

    const user = await User.findById(id)
      .populate({
        path: 'my_order',
        populate: [
          {
            path: 'listing',
            select: 'images title desc location',
            model: 'Listing'
          },
          {
            path: 'buyer',
            select: 'name',
            model: 'User'
          },
          {
            path: 'seller',
            select: 'name',
            model: 'User'
          }
        ]
      })
      .populate('my_listings')
      .populate({
        path: 'my_donations',
        populate: [
          {
            path: 'fundraiser',
            select: 'title target_funds images',
            model: 'Fundraiser',
            populate: {
              path: 'owner',
              select: 'name wallet_address',
              model: 'User'
            }
          }
        ]
      })
      .populate({
        path: 'my_fundraisers',
        select: 'title target_funds projectId donators deadline amt_collected images',
        populate: [
          {
            path: 'donators',
            model: 'Fundraiser',
            populate: {
              path: 'user',
              select: 'name wallet_address',
              model: 'User'
            }
          }
        ]
      })
      .populate('my_blogs')
      .lean();

    user.my_fundraisers = user.my_fundraisers.map(fundraiser => {
      return {...fundraiser,
      
      donatorsCount: fundraiser.donators ? fundraiser.donators.length : 0}
    });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve user profile',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};
// Get user
// req.user: { wallet_address }
// res: {exist, user}
exports.checkUser = async (req, res) => {
  try {
    const { wallet_address } = req.query;
    
    if (!wallet_address) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
    
    const user = await User.findOne({ wallet_address });

    if (user) {
      // Generate access token
      const accessToken = generateAccessToken(user);
      
      // Generate refresh token
      const refreshToken = jwt.sign(
        { _id: user._id, wallet_address },
        process.env.JWT_SECRET,
        { expiresIn: '60d' }
      );
      
      return res.json({ 
        exist: true, 
        user, 
        token: accessToken,
        refreshToken
      });
    } else {
      return res.json({ exist: false });
    }
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ 
      message: 'Failed to check user',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { name, basename, phone } = req.body;
    const updateData = {};
    
    // Only add fields that are provided
    if (name) updateData.name = name;
    if (basename) updateData.basename = basename;
    if (phone) updateData.phone = phone;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Failed to update user profile',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};
