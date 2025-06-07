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
  chainId: '0x15f002',  // 1440002 in decimal
  chainName: 'XRPL EVM Sidechain Devnet',
  nativeCurrency: {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 18
  },
  rpcUrls: [
    'https://rpc-evm-sidechain.xrpl.org',
    'https://rpc-evm-sidechain.peersyst.tech'
  ],
  blockExplorerUrls: ['https://evm-sidechain.xrpl.org/explorer'],
  timeout: 30000 // 30 seconds timeout
};

// Get contract instance
export const getContract = async (withSigner = false) => {
  try {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    const publicClient = getPublicClient();
    if (!publicClient) {
      throw new Error('No provider available. Please ensure your wallet is connected.');
    }

    // Check if we're on the correct network
    const chainId = await publicClient.getChainId();
    if (chainId !== 1440002) {
      throw new Error('Please switch to the XRPL EVM Sidechain (Chain ID: 1440002)');
    }

    if (withSigner) {
      const walletClient = await getWalletClient();
      if (!walletClient) {
        throw new Error('Please connect your wallet to continue');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new ethers.Contract(contractAddress, contractABI, signer);
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
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
export const createCampaign = async (title, category, reward, metadataUrl, location, expiryDate, tags) => {
  try {
    const contract = await getContract(true);
    
    // Request account access again just to be sure
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect your wallet.');
    }

    // Convert expiry date to timestamp and then to string
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000).toString();
    
    // Ensure all parameters are properly formatted
    const params = {
      title: String(title),
      category: String(category),
      reward: String(reward),
      metadataUrl: String(metadataUrl),
      location: String(location),
      expiryTimestamp,
      tags: tags.map(tag => String(tag))
    };

    console.log('Creating campaign with params:', params);
    
    // Create campaign with metadata URL
    console.log('Sending transaction with account:', accounts[0]);
    const tx = await contract.createCampaign(
      params.title,
      params.category,
      params.reward,
      params.metadataUrl,
      params.location,
      params.expiryTimestamp,
      params.tags,
      {
        from: accounts[0],
        gasLimit: ethers.getBigInt(500000)
      }
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return tx;
  } catch (error) {
    console.error('Error creating campaign:', error);
    if (error.message.includes('user rejected') || error.code === 4001) {
      throw new Error('Transaction was rejected. Please try again.');
    }
    throw error;
  }
};

// Get campaign details
export const getCampaign = async (campaignId) => {
  try {
    const contract = await getContract();
    const campaign = await contract.campaigns(campaignId);
    
    return {
      id: campaignId,
      title: campaign.title,
      category: campaign.category,
      reward: campaign.reward,
      metadataUrl: campaign.metadataUrl,
      location: campaign.location,
      expiryDate: new Date(campaign.expiryDate * 1000).toISOString(),
      tags: campaign.tags,
      owner: campaign.owner,
      active: campaign.active
    };
  } catch (error) {
    console.error('Error getting campaign:', error);
    throw error;
  }
};

export const mintProof = async (campaignId, optInData) => {
  try {
    const contract = await getContract(true);
    
    // Get the signer directly from the provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    if (!signer) {
      throw new Error('No wallet connected. Please connect your wallet to continue.');
    }
    
    // Get the signer's address
    const address = await signer.getAddress();
    if (!address) {
      throw new Error('No wallet address available. Please connect your wallet.');
    }

    // Convert campaignId to number first
    const campaignIdNum = Number(campaignId);
    if (isNaN(campaignIdNum)) {
      throw new Error('Invalid campaign ID');
    }

    // Get total campaigns to validate ID
    const totalCampaigns = await contract.currentCampaignId();
    if (campaignIdNum >= Number(totalCampaigns)) {
      throw new Error(`Campaign ${campaignId} does not exist. Total campaigns: ${totalCampaigns}`);
    }

    // Convert opt-in data to bytes
    const encodedData = ethers.toUtf8Bytes(JSON.stringify({
      ...optInData,
      timestamp: Date.now(),
      userAddress: address
    }));
    
    console.log('Minting with parameters:', {
      to: address,
      campaignId: campaignIdNum,
      encodedDataLength: encodedData.length,
      contractAddress: contract.target
    });

    // Create campaign with metadata URL
    console.log('Sending transaction with account:', address);
    const tx = await contract.mintProof(
      address,
      campaignIdNum,
      encodedData,
      {
        from: address,
        gasLimit: ethers.getBigInt(500000)
      }
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    return tx;
  } catch (error) {
    console.error('Error in mintProof:', error);
    if (error.code === 4001) {
      throw new Error('Transaction was rejected. Please try again.');
    } else if (error.message.includes('network')) {
      throw new Error('Network error. Please check your connection to the XRPL EVM Sidechain.');
    } else if (error.message.includes('campaign might not exist')) {
      throw new Error('This campaign does not exist or you may have already minted.');
    }
    throw error;
  }
};

export const burnProof = async (campaignId) => {
  const contract = await getContract(true);
  const tx = await contract.burnProof(await contract.signer.getAddress(), campaignId);
  await tx.wait();
  return tx;
};

// Get campaign with decrypted metadata
export const getCampaignById = async (campaignId) => {
  try {
    const contract = await getContract();
    console.log('Getting campaign with ID:', campaignId);
    
    // First check if campaign exists
    const totalCampaigns = await contract.currentCampaignId();
    console.log('Total campaigns:', totalCampaigns.toString());
    
    const numericId = Number(campaignId);
    if (isNaN(numericId) || numericId < 0) {
      throw new Error('Invalid campaign ID');
    }
    
    // Convert to BigInt for comparison
    const id = BigInt(numericId);
    const total = BigInt(totalCampaigns);
    
    // Campaign IDs start from 0, so we check if id is less than total
    if (id >= total) {
      throw new Error(`Campaign ID ${id} does not exist. Total campaigns: ${total}`);
    }

    // Get campaign data using getCampaignById since it returns all fields
    const campaignData = await contract.getCampaignById(id);
    console.log('Raw campaign data:', campaignData);

    // Process the campaign data - getCampaignById returns an array of values
    const processedData = {
      id: numericId,
      title: campaignData[0] || 'Untitled Campaign',
      description: campaignData[1] || '',
      imageUrl: campaignData[2] || '',
      category: campaignData[3] || 'General',
      location: campaignData[4] || 'Online',
      reward: campaignData[5] || 'NFT Proof',
      tags: Array.isArray(campaignData[6]) ? campaignData[6] : [],
      minted: Number(campaignData[7]) || 0,
      claimed: Number(campaignData[8]) || 0,
      burned: Number(campaignData[9]) || 0,
      views: Number(campaignData[10]) || 0
    };

    console.log('Processed campaign data:', processedData);
    return processedData;
  } catch (err) {
    console.error('Error in getCampaignById:', err);
    throw err;
  }
};

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

// Calculate time-based metrics
export const getTimeMetrics = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const timeToRedeem = Number(timestamp) * 1000; // Convert to milliseconds
  const hour = 3600000; // 1 hour in milliseconds
  
  // Categorize redemption time
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

// Share NFT data with Lit Protocol encryption
export const shareNFTData = async (companyAddress) => {
  try {
    const contract = await getContract(true);
    const userAddress = await contract.signer.getAddress();

    // Get user's NFT data
    const nftData = await getUserNFTs(userAddress);
    
    // Encrypt the NFT data using Lit Protocol
    const { encryptedData, encryptedKeyStore } = await litEncrypt(nftData, contractAddress);
    
    // Convert data to bytes and concatenate
    const keyStoreString = JSON.stringify(encryptedKeyStore);
    const encodedData = new TextEncoder().encode(keyStoreString + encryptedData);

    // Share the encrypted data
    const tx = await contract.shareData(companyAddress, encodedData);
    await tx.wait();

    // Pay the user their reward
    await payUserReward(userAddress, companyAddress);

    return tx;
  } catch (error) {
    console.error('Error sharing NFT data:', error);
    throw error;
  }
};

// Function for Perky to pay user reward
export const payUserReward = async (userAddress, companyAddress) => {
  const contract = await getContract(true);
  
  // Ensure caller is Perky wallet
  const signer = await contract.signer.getAddress();
  const perkyWallet = await contract.perkyWallet();
  
  if (signer !== perkyWallet) {
    throw new Error("Only Perky wallet can pay rewards");
  }
  
  // Pay 1 XRP to user
  const tx = await contract.payUserReward(
    userAddress,
    companyAddress,
    {
      value: ethers.parseEther("1.0")
    }
  );
  
  await tx.wait();
  return tx;
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