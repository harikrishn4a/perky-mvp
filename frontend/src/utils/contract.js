/* global BigInt */
import { ethers } from 'ethers';
import { isBytes } from '@ethersproject/bytes';
import ProofPerksABI from './ProofPerks.json';
import { encryptData as litEncrypt, decryptData as litDecrypt } from './lit';
import { getPublicClient, getWalletClient } from '@wagmi/core';
import { contractABI, contractAddress } from './constants';

console.log('Contract address from env:', contractAddress);

// XRPL EVM Sidechain Devnet configuration
const XRPL_NETWORK = {
  chainId: '0x15f902',  // 1440002 in decimal
  chainName: 'XRPL EVM Sidechain',
  nativeCurrency: {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 18
  },
  rpcUrls: ['https://rpc-evm-sidechain.xrpl.org'],
  blockExplorerUrls: ['https://evm-sidechain.xrpl.org']
};

// Get contract instance
export const getContract = async (withSigner = false) => {
  try {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    // First check if we're on the correct network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const targetChainId = '0x15f902'; // 1440002 in hex
    
    if (chainId !== targetChainId) {
      try {
        // Try to switch to the XRPL network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [XRPL_NETWORK],
            });
          } catch (addError) {
            console.error('Error adding network:', addError);
            throw new Error('Please add the XRPL EVM Sidechain network to your wallet');
          }
        } else {
          console.error('Error switching network:', switchError);
          throw new Error('Please switch to the XRPL EVM Sidechain network');
        }
      }
    }

    // Create provider using newer ethers syntax
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(contractAddress, contractABI, signer);
    }

    return new ethers.Contract(contractAddress, contractABI, provider);
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

// Encryption utilities
export const encryptData = async (data, publicKey) => {
  // Convert data to bytes
  const dataBytes = new TextEncoder().encode(JSON.stringify(data));
  
  // Generate a random symmetric key
  const symmetricKey = new Uint8Array(32);
  crypto.getRandomValues(symmetricKey);
  
  // Encrypt data with symmetric key (using AES)
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) },
    await window.crypto.subtle.importKey(
      "raw",
      symmetricKey,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    ),
    dataBytes
  );
  
  // Encrypt symmetric key with public key
  const encryptedKey = ethers.solidityPackedKeccak256(symmetricKey);
  
  // Combine encrypted data and key
  return ethers.concat([
    encryptedKey,
    new Uint8Array(encryptedData)
  ]);
};

export const decryptData = async (encryptedData, privateKey) => {
  try {
    // Split encrypted data into key and content
    const encryptedKey = encryptedData.slice(0, 32); // Adjust size based on your encryption
    const encryptedContent = encryptedData.slice(32);
    
    // Decrypt symmetric key using private key
    const symmetricKey = ethers.solidityPackedKeccak256(privateKey);
    
    // Decrypt data using symmetric key
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(12) },
      await window.crypto.subtle.importKey(
        "raw",
        symmetricKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      ),
      encryptedContent
    );
    
    // Convert bytes to JSON
    const decodedText = new TextDecoder().decode(decryptedData);
    return JSON.parse(decodedText);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Create campaign
export const createCampaign = async (title, category, reward, location, expiryDate, tags) => {
  try {
    const contract = await getContract(true);
    
    // Convert expiry date to timestamp
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000).toString();
    
    // Ensure all parameters are properly formatted
    const params = {
      title: String(title),
      category: String(category),
      reward: String(reward),
      location: String(location),
      expiryTimestamp,
      tags: tags.map(tag => String(tag))
    };

    console.log('Creating campaign with params:', params);
    
    const tx = await contract.createCampaign(
      params.title,
      params.category,
      params.reward,
      params.location,
      params.expiryTimestamp,
      params.tags,
      {
        gasLimit: ethers.getBigInt(500000)
      }
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return tx;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

// Get campaign details
export const getCampaignById = async (campaignId) => {
  try {
    const contract = await getContract();
    const result = await contract.getCampaignById(campaignId);
    
    // Initialize with default values from array response
    const campaign = {
      id: campaignId,
      title: result[0] || '',
      category: result[1] || '',
      reward: result[2] || '',
      location: result[3] || '',
      expiryTimestamp: result[4] ? Number(result[4].toString()) : null,
      tags: [], // Initialize with empty array
      minted: Number(result[6] || 0),
      claimed: Number(result[7] || 0),
      burned: Number(result[8] || 0),
      views: Number(result[9] || 0)
    };

    // Safely handle tags array
    try {
      if (result[5] && Array.isArray(result[5])) {
        campaign.tags = result[5];
      }
    } catch (tagError) {
      console.warn(`Warning: Could not process tags for campaign ${campaignId}:`, tagError);
    }
    
    return campaign;
  } catch (error) {
    console.error('Error getting campaign:', error);
    throw error;
  }
};

// Get campaign metrics
export const getCampaignMetrics = async (campaignId, userAddress) => {
  const contract = await getContract();
  const metrics = await contract.getCampaignMetrics(campaignId, userAddress);
  return {
    claimTime: metrics[0].toNumber(),
    burnTime: metrics[1].toNumber(),
    hasRedeemed: metrics[2],
    isUniqueClaimer: metrics[3],
  };
};

// Get campaign stats
export const getCampaignStats = async (campaignId) => {
  const contract = await getContract();
  const stats = await contract.getCampaignStats(campaignId);
  return {
    uniqueClaimers: stats[0].toNumber(),
    totalMinted: stats[1].toNumber(),
    totalClaimed: stats[2].toNumber(),
    totalBurned: stats[3].toNumber(),
  };
};

// Track campaign view
export const trackView = async (campaignId) => {
  try {
    const contract = await getContract(true);
    const tx = await contract.trackView(campaignId);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error tracking view:', error);
    throw error;
  }
};

// Calculate time-based metrics
export const getTimeMetrics = (timestamp) => {
  if (!timestamp) return 'N/A';
  const timeToRedeem = Number(timestamp) * 1000;
  const hour = 3600000;
  if (timeToRedeem < hour) return '0-1 hour';
  if (timeToRedeem < 6 * hour) return '1-6 hours';
  if (timeToRedeem < 24 * hour) return '6-24 hours';
  return '24+ hours';
};

// Get time of day for burn
export const getTimeOfBurn = (timestamp) => {
  if (!timestamp) return 'N/A';
  const hour = new Date(Number(timestamp) * 1000).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};

if (typeof window !== "undefined") {
  window.getContract = getContract;
}

// Get live campaign analytics
export const getLiveCampaignAnalytics = async (campaignId) => {
  try {
    const contract = await getContract();
    
    // First check if campaign exists by getting total campaigns
    const totalCampaigns = await contract.currentCampaignId();
    console.log('Total campaigns:', totalCampaigns.toString());
    
    // Convert campaignId to number first to handle string inputs
    const numericId = Number(campaignId);
    if (isNaN(numericId) || numericId < 0) {
      throw new Error('Invalid campaign ID');
    }
    
    // Convert to BigInt for comparison
    const id = BigInt(numericId);
    const total = BigInt(totalCampaigns);
    
    if (id >= total) {
      throw new Error(`Campaign ID ${id} does not exist. Total campaigns: ${total}`);
    }

    try {
      // Get campaign data
      const campaign = await contract.getCampaignById(id);
      if (!campaign) {
        throw new Error('Campaign not found');
      }
      console.log('Campaign verified:', campaign);

      // Get campaign stats
      const stats = await contract.getCampaignStats(id);
      console.log('Raw stats:', stats);

      const analytics = {
        uniqueClaimers: Number(stats[0]) || 0,
        totalMinted: Number(stats[1]) || 0,
        totalClaimed: Number(stats[2]) || 0,
        totalBurned: Number(stats[3]) || 0,
        claimRate: '0.0',
        burnRate: '0.0'
      };

      // Calculate rates if there are minted tokens
      if (analytics.totalMinted > 0) {
        analytics.claimRate = ((analytics.totalClaimed / analytics.totalMinted) * 100).toFixed(1);
        analytics.burnRate = ((analytics.totalBurned / analytics.totalMinted) * 100).toFixed(1);
      }

      console.log('Formatted analytics:', analytics);
      return analytics;
    } catch (err) {
      console.error('Campaign verification failed:', err);
      throw new Error('Invalid campaign ID or campaign does not exist');
    }
  } catch (err) {
    console.error('Error getting campaign analytics:', err);
    throw err;
  }
};

// Function to get all NFTs in user's wallet
export const getUserNFTs = async (address) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  
  // Get all NFT IDs owned by user
  const balance = await contract.balanceOf(address);
  const nfts = [];
  
  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(address, i);
    const metadata = await contract.getCampaignById(tokenId);
    nfts.push({
      tokenId,
      metadata
    });
  }
  
  return nfts;
};

// Function to store user preferences in database
export const storeUserPreferences = async (formData) => {
  try {
    const response = await fetch('http://localhost:5000/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to store preferences');
    }

    return await response.json();
  } catch (error) {
    console.error('Error storing preferences:', error);
    throw error;
  }
};

// Modified shareNFTData to handle the transaction part only
export const shareNFTData = async (formData) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Only handle the blockchain transaction
    const tx = await contract.storeUserPreferences(
      formData.email,
      formData.age,
      formData.interests,
      Object.values(formData.preferences)
    );

    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error in blockchain transaction:', error);
    throw error;
  }
};

// Function for Perky to pay user reward
export const payUserReward = async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Call the contract's reward function
    const tx = await contract.rewardUser({
      gasLimit: ethers.getBigInt(100000) // Set appropriate gas limit
    });

    console.log('Reward transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Reward transaction confirmed:', receipt);
    
    return tx;
  } catch (error) {
    console.error('Error paying reward:', error);
    throw new Error(error.message || 'Failed to process reward payment');
  }
};

// Get shared user data with Lit Protocol decryption
export const getSharedUserData = async (userAddress) => {
  try {
    const contract = await getContract(true);
    const encryptedPackage = await contract.getSharedData(userAddress);
    
    if (!encryptedPackage || encryptedPackage === '0x') {
      return null;
    }

    // Decode the data
    const decoder = new TextDecoder();
    const decodedData = decoder.decode(encryptedPackage);
    
    // Split into keyStore and encrypted data
    const separatorIndex = decodedData.indexOf('}') + 1;
    const keyStore = JSON.parse(decodedData.slice(0, separatorIndex));
    const encryptedData = decodedData.slice(separatorIndex);

    // Decrypt the data using Lit Protocol
    const decryptedData = await litDecrypt(encryptedData, keyStore, contractAddress);
    return decryptedData;
  } catch (error) {
    console.error('Error getting shared data:', error);
    throw error;
  }
};

// Check if user has already claimed
export const hasUserClaimed = async (campaignId, userAddress) => {
  try {
    const contract = await getContract();
    const balance = await contract.balanceOf(userAddress, campaignId);
    return balance > 0;
  } catch (error) {
    console.error('Error checking claim status:', error);
    throw error;
  }
};

// Get gas estimate for minting
export const estimateGas = async (to, campaignId, data = "0x") => {
  try {
    const contract = await getContract(true);
    const gasEstimate = await contract.mintProof.estimateGas(to, campaignId, data);
    // Add 20% buffer to gas estimate
    return (gasEstimate * BigInt(120)) / BigInt(100);
  } catch (error) {
    console.error('Error estimating gas:', error);
    // Return default gas limit if estimation fails
    return BigInt(200000);
  }
};

// Get current gas price
export const getCurrentGasPrice = async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const gasPrice = await provider.getGasPrice();
    // Add 10% buffer to gas price
    return (gasPrice * BigInt(110)) / BigInt(100);
  } catch (error) {
    console.error('Error getting gas price:', error);
    // Return default gas price if fetch fails
    return ethers.parseUnits("25", "gwei");
  }
};

// Mint proof
export const mintProof = async (campaignId) => {
  try {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Validate campaignId
    const numCampaignId = Number(campaignId);
    if (isNaN(numCampaignId)) {
      throw new Error('Invalid campaign ID');
    }

    // First try to estimate gas
    let gasLimit;
    try {
      gasLimit = await contract.mintProof.estimateGas(userAddress, numCampaignId);
      console.log('Estimated gas:', gasLimit.toString());
    } catch (gasError) {
      console.error('Gas estimation failed:', gasError);
      gasLimit = BigInt(300000); // Safe default
    }

    // Send transaction
    const tx = await contract.mintProof(
      userAddress,
      numCampaignId,
      {
        gasLimit: (gasLimit * BigInt(12)) / BigInt(10) // Add 20% buffer
      }
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return tx;
  } catch (error) {
    console.error('Error in mintProof:', error);
    throw error;
  }
};