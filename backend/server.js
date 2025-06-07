const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();

// Simple CORS setup
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Business wallet setup
let businessWallet;
try {
  const BUSINESS_PRIVATE_KEY = process.env.BUSINESS_PRIVATE_KEY;
  if (!BUSINESS_PRIVATE_KEY) {
    console.error('Business wallet private key not found in environment variables');
  } else {
    // Make sure private key has 0x prefix
    const formattedKey = BUSINESS_PRIVATE_KEY.startsWith('0x') 
      ? BUSINESS_PRIVATE_KEY 
      : `0x${BUSINESS_PRIVATE_KEY}`;
    
    const provider = new ethers.JsonRpcProvider('https://rpc-evm-sidechain.xrpl.org');
    businessWallet = new ethers.Wallet(formattedKey, provider);
    console.log('Business wallet setup successful. Address:', businessWallet.address);
  }
} catch (error) {
  console.error('Failed to setup business wallet:', error);
}

// Simple preferences schema with unique email
const PreferenceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  preferences: {
    email: Boolean,
    sms: Boolean,
    push: Boolean
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Preference = mongoose.model('Preference', PreferenceSchema);

// Endpoint to send XRP reward
app.post('/api/send-reward', async (req, res) => {
  try {
    console.log('\n🚀 Starting reward transaction...');
    
    if (!businessWallet) {
      console.error('❌ Business wallet not configured');
      return res.status(500).json({
        success: false,
        error: 'Business wallet not configured'
      });
    }

    const { toAddress } = req.body;
    console.log('\n📍 Transaction details:');
    console.log('From (Business wallet):', businessWallet.address);
    console.log('To (User wallet):', toAddress);
    
    if (!toAddress) {
      console.error('❌ No recipient address provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient address is required' 
      });
    }

    // Validate the address format
    if (!ethers.isAddress(toAddress)) {
      console.error('❌ Invalid wallet address format');
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    // Make sure we're not sending to the business wallet
    if (toAddress.toLowerCase() === businessWallet.address.toLowerCase()) {
      console.error('❌ Cannot send reward to business wallet');
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address - Cannot send to business wallet'
      });
    }

    // Get business wallet balance
    const balance = await businessWallet.provider.getBalance(businessWallet.address);
    console.log('💰 Business wallet balance:', ethers.formatEther(balance), 'XRP');
    
    // Check if we have enough balance
    const requiredAmount = ethers.parseEther("2.0");
    if (balance < requiredAmount) {
      console.error('❌ Insufficient balance in business wallet');
      return res.status(500).json({
        success: false,
        error: 'Insufficient balance in business wallet'
      });
    }

    // Send 2 XRP from business wallet to user
    console.log('💸 Sending 2 XRP from', businessWallet.address, 'to:', toAddress);
    const tx = await businessWallet.sendTransaction({
      to: toAddress,
      value: requiredAmount,
      gasLimit: 100000
    });

    console.log('📤 Transaction sent! Hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed! Block:', receipt.blockNumber);

    res.json({ 
      success: true, 
      transactionHash: receipt.hash,
      amount: "2.0",
      blockNumber: receipt.blockNumber,
      from: businessWallet.address,
      to: toAddress
    });
  } catch (error) {
    console.error('❌ Error sending reward:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Preferences endpoint
app.post('/api/preferences', async (req, res) => {
  console.log('Received request:', {
    headers: req.headers,
    body: req.body
  });
  
  try {
    // Check if email already exists
    const existingPreference = await Preference.findOne({ email: req.body.email });
    if (existingPreference) {
      // If exists, update instead of create
      const updated = await Preference.findOneAndUpdate(
        { email: req.body.email },
        { 
          $set: {
            phone: req.body.phone,
            preferences: req.body.preferences,
            walletAddress: req.body.walletAddress
          }
        },
        { new: true }
      );
      console.log('Updated existing preference:', updated);
      return res.json({ success: true, message: 'Preferences updated' });
    }

    // Create new preference if email doesn't exist
    const preference = new Preference(req.body);
    await preference.save();
    console.log('Saved new preference:', preference);
    res.json({ success: true, message: 'Preferences saved' });
  } catch (error) {
    console.error('Error saving preference:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.code === 11000 ? 'Email already registered' : 'Server error'
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 