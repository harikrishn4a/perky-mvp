const { ethers } = require('ethers');
const ProofPerksABI = require('../frontend/src/utils/ProofPerks.json');

// Configuration
const config = {
  contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
  mintsPerCampaign: 40,
  burnPercentage: 50, // Percentage of minted NFTs to burn
  delayBetweenTx: 1000, // Delay between transactions in ms
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    // Connect to the network
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log('Connected with address:', await signer.getAddress());

    // Create contract instance
    const contract = new ethers.Contract(config.contractAddress, ProofPerksABI.abi, signer);

    // Get total number of campaigns
    const totalCampaigns = await contract.currentCampaignId();
    console.log(`Total campaigns available: ${totalCampaigns}`);

    if (totalCampaigns === 0) {
      console.log('No campaigns found. Please create some campaigns first.');
      return;
    }

    // Process each existing campaign
    for (let campaignId = 0; campaignId < totalCampaigns; campaignId++) {
      console.log(`\nProcessing campaign ${campaignId}...`);
      
      try {
        // Get current campaign stats
        const stats = await contract.getCampaignStats(campaignId);
        const currentMinted = Number(stats[1]);
        
        if (currentMinted < config.mintsPerCampaign) {
          const mintsNeeded = config.mintsPerCampaign - currentMinted;
          console.log(`Minting ${mintsNeeded} NFTs for campaign ${campaignId}...`);

          // Generate different addresses to simulate unique users
          const addresses = [];
          for (let i = 0; i < mintsNeeded; i++) {
            const wallet = ethers.Wallet.createRandom();
            addresses.push(wallet.address);
          }

          // Mint NFTs
          for (const address of addresses) {
            try {
              const tx = await contract.mintProof(address, campaignId);
              await tx.wait();
              console.log(`Minted NFT for ${address}`);
              await sleep(config.delayBetweenTx);
            } catch (error) {
              console.error(`Error minting for ${address}:`, error.message);
            }
          }
        } else {
          console.log(`Campaign ${campaignId} already has sufficient mints (${currentMinted})`);
        }

        // Calculate burns needed
        const targetBurns = Math.floor((config.mintsPerCampaign * config.burnPercentage) / 100);
        const currentBurned = Number(stats[3]);
        
        if (currentBurned < targetBurns) {
          const burnsNeeded = targetBurns - currentBurned;
          console.log(`\nSimulating ${burnsNeeded} redemptions for campaign ${campaignId}...`);

          // Burn tokens for addresses that have NFTs
          for (const address of addresses) {
            try {
              const balance = await contract.balanceOf(address, campaignId);
              if (balance > 0) {
                const tx = await contract.burnProof(address, campaignId);
                await tx.wait();
                console.log(`Burned NFT for ${address}`);
                await sleep(config.delayBetweenTx);
              }
            } catch (error) {
              console.error(`Error burning for ${address}:`, error.message);
            }
          }
        } else {
          console.log(`Campaign ${campaignId} already has sufficient burns (${currentBurned})`);
        }

      } catch (error) {
        console.error(`Error processing campaign ${campaignId}:`, error.message);
        continue;
      }
    }

    console.log('\nData population completed!');
    
  } catch (error) {
    console.error('Script failed:', error);
  }
}

main(); 