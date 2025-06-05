/* global BigInt */
import { ethers } from 'ethers';
import ProofPerksABI from './ProofPerks.json';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
console.log('Contract address from env:', contractAddress);

export const getContract = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('Please install MetaMask');
  }

  try {
    console.log('Requesting MetaMask account access...');
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log('Connected accounts:', accounts);
    
    // Create Web3Provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    console.log('Provider created');

    // Get network information
    const network = await provider.getNetwork();
    console.log('Current network:', {
      name: network.name,
      chainId: network.chainId.toString()
    });

    // Check if we're on the right network (XRPL EVM Sidechain)
    const targetChainId = BigInt(1440002);
    if (network.chainId !== targetChainId) {
      // Request network switch
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x15F902' }], // 1440002 in hex
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x15F902', // 1440002 in hex
                  chainName: 'XRPL EVM Sidechain',
                  nativeCurrency: {
                    name: 'XRP',
                    symbol: 'XRP',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc-evm-sidechain.xrpl.org'],
                  blockExplorerUrls: ['https://evm-sidechain.xrpl.org'],
                },
              ],
            });
          } catch (addError) {
            console.error('Error adding network:', addError);
            throw new Error('Please add and switch to the XRPL EVM Sidechain network in MetaMask');
          }
        } else {
          console.error('Error switching network:', switchError);
          throw new Error('Please switch to the XRPL EVM Sidechain network in MetaMask');
        }
      }

      // After switching/adding network, get the new provider and network
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      const updatedNetwork = await updatedProvider.getNetwork();
      console.log('Updated network:', {
        name: updatedNetwork.name,
        chainId: updatedNetwork.chainId.toString()
      });

      if (updatedNetwork.chainId !== targetChainId) {
        throw new Error('Failed to switch to XRPL EVM Sidechain network. Please try manually switching in MetaMask.');
      }
    }
    
    console.log('Getting signer...');
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log('Signer address:', signerAddress);
    
    if (!contractAddress) {
      throw new Error('Contract address is not configured. Please check your environment variables.');
    }
    
    // Create contract instance using the abi from the imported JSON
    console.log('Creating contract instance with address:', contractAddress);
    const contract = new ethers.Contract(contractAddress, ProofPerksABI.abi, signer);
    
    // Verify contract connection and deployment
    try {
      console.log('Verifying contract deployment...');
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        throw new Error('No contract deployed at the specified address');
      }
      console.log('Contract code found at address');

      console.log('Getting campaign count...');
      const campaignCount = await contract.currentCampaignId();
      console.log('Successfully connected to contract. Current campaign count:', campaignCount.toString());
      
      // Try a test call to verify contract interface
      try {
        console.log('Testing contract interface with campaign 0...');
        const testCampaign = await contract.getCampaignById(0);
        console.log('Test call successful:', testCampaign);
      } catch (testErr) {
        console.warn('Test call failed:', testErr);
        // Don't throw here, just log the warning
      }
    } catch (err) {
      console.error('Contract verification failed:', err);
      if (err.message.includes('No contract')) {
        throw new Error('Contract not deployed at the specified address. Please check your configuration.');
      } else {
        throw new Error('Failed to connect to contract: ' + err.message);
      }
    }
    
    return contract;
  } catch (error) {
    console.error('Error getting contract:', error);
    if (error.message.includes('user rejected')) {
      throw new Error('Please connect your MetaMask wallet to view campaign analytics');
    }
    throw error;
  }
};

if (typeof window !== "undefined") {
  window.getContract = getContract;
}

// Get campaign details by campaignId
export const getCampaignById = async (campaignId) => {
  try {
    const contract = await getContract();
    console.log('Getting campaign with ID:', campaignId);
    
    // First check if campaign exists by getting total campaigns
    const totalCampaigns = await contract.currentCampaignId();
    console.log('Total campaigns:', totalCampaigns.toString());
    
    // Convert campaignId to number first to handle string inputs
    const numericId = Number(campaignId);
    if (isNaN(numericId)) {
      throw new Error('Invalid campaign ID');
    }
    
    // Convert to BigInt for contract call
    const id = ethers.toBigInt(numericId);
    console.log('Converted ID:', id.toString());
    
    if (id >= totalCampaigns) {
      throw new Error(`Campaign ID ${id} does not exist. Total campaigns: ${totalCampaigns}`);
    }

    // Get campaign data directly from contract
    console.log('Fetching campaign data...');
    const campaign = await contract.getCampaignById(id);
    console.log('Raw campaign data:', campaign);

    if (!campaign || !Array.isArray(campaign)) {
      throw new Error('Invalid campaign data received');
    }

    // Transform array response to object (matching CustomerGallery approach)
    const formattedCampaign = {
      id: numericId, // Use the numeric ID for consistency
      title: campaign[0] || 'Untitled Campaign',
      category: campaign[1] || '',
      reward: campaign[2] || 'No description',
      imageUrl: campaign[3] || '',
      location: campaign[4] || '',
      expiry: campaign[5] ? Number(campaign[5]) : null,
      tags: campaign[6] || [],
      minted: Number(campaign[7]) || 0,
      claimed: Number(campaign[8]) || 0,
      burned: Number(campaign[9]) || 0,
      views: Number(campaign[10]) || 0
    };

    // Validate and clean up image URL
    if (formattedCampaign.imageUrl) {
      try {
        new URL(formattedCampaign.imageUrl);
      } catch (e) {
        console.warn(`Invalid image URL for campaign ${id}:`, formattedCampaign.imageUrl);
        formattedCampaign.imageUrl = '';
      }
    }

    // Add calculated metrics
    if (formattedCampaign.minted > 0) {
      formattedCampaign.claimRate = ((formattedCampaign.claimed / formattedCampaign.minted) * 100).toFixed(1);
      formattedCampaign.burnRate = ((formattedCampaign.burned / formattedCampaign.minted) * 100).toFixed(1);
    } else {
      formattedCampaign.claimRate = '0.0';
      formattedCampaign.burnRate = '0.0';
    }

    console.log('Formatted campaign:', formattedCampaign);
    return formattedCampaign;
  } catch (err) {
    console.error('Error in getCampaignById:', err);
    throw err;
  }
};

// Get live campaign analytics
export const getLiveCampaignAnalytics = async (campaignId) => {
  try {
    const contract = await getContract();
    
    // First check if campaign exists by getting total campaigns
    const totalCampaigns = await contract.currentCampaignId();
    console.log('Total campaigns:', totalCampaigns.toString());
    
    // Convert campaignId to number first to handle string inputs
    const numericId = Number(campaignId);
    if (isNaN(numericId)) {
      throw new Error('Invalid campaign ID');
    }
    
    // Convert to BigInt for contract call
    const id = ethers.toBigInt(numericId);
    console.log('Converted ID for analytics:', id.toString());
    
    if (id >= totalCampaigns) {
      throw new Error(`Campaign ID ${id} does not exist. Total campaigns: ${totalCampaigns}`);
    }

    // First verify the campaign exists by calling getCampaignById
    try {
      const campaign = await contract.getCampaignById(id);
      if (!campaign || !Array.isArray(campaign) || campaign.length === 0) {
        throw new Error('Campaign not found');
      }
      console.log('Campaign verified:', campaign);

      // If getCampaignStats fails, use the basic stats from getCampaignById
      try {
        const stats = await contract.getCampaignStats(id);
        console.log('Raw stats:', stats);

        if (!stats || !Array.isArray(stats)) {
          throw new Error('Invalid stats data received');
        }

        const analytics = {
          uniqueClaimers: Number(stats[0]) || 0,
          totalMinted: Number(stats[1]) || 0,
          totalClaimed: Number(stats[2]) || 0,
          totalBurned: Number(stats[3]) || 0
        };

        // Calculate rates
        if (analytics.totalMinted > 0) {
          analytics.claimRate = ((analytics.totalClaimed / analytics.totalMinted) * 100).toFixed(1);
          analytics.burnRate = ((analytics.totalBurned / analytics.totalMinted) * 100).toFixed(1);
        } else {
          analytics.claimRate = '0.0';
          analytics.burnRate = '0.0';
        }

        console.log('Formatted analytics:', analytics);
        return analytics;
      } catch (statsErr) {
        console.warn('Failed to get detailed stats, using basic stats:', statsErr);
        // Use basic stats from campaign data
        const basicAnalytics = {
          uniqueClaimers: 0, // Not available in basic data
          totalMinted: Number(campaign[7]) || 0,
          totalClaimed: Number(campaign[8]) || 0,
          totalBurned: Number(campaign[9]) || 0,
          claimRate: '0.0',
          burnRate: '0.0'
        };

        // Calculate rates
        if (basicAnalytics.totalMinted > 0) {
          basicAnalytics.claimRate = ((basicAnalytics.totalClaimed / basicAnalytics.totalMinted) * 100).toFixed(1);
          basicAnalytics.burnRate = ((basicAnalytics.totalBurned / basicAnalytics.totalMinted) * 100).toFixed(1);
        }

        console.log('Using basic analytics:', basicAnalytics);
        return basicAnalytics;
      }
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

// Mint proof NFT for a specific campaign
export const mintProof = async (campaignId) => {
  const contract = await getContract();
  const [user] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const tx = await contract.mintProof(user, campaignId);
  await tx.wait();
  return tx.hash;
};