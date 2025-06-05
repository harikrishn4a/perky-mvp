import React, { useState } from 'react';
import { ethers } from 'ethers';
import ProofPerksABI from '../utils/ProofPerks.json';

const PopulateDataButton = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Configuration
  const config = {
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
    minMints: 20, // Minimum mints per campaign
    maxMints: 100, // Maximum mints per campaign
    minBurnPercentage: 30, // Minimum percentage to burn
    maxBurnPercentage: 80, // Maximum percentage to burn
    delayBetweenTx: 1000,
  };

  const addLog = (message) => {
    setLogs(prev => [...prev, message]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Generate random number between min and max (inclusive)
  const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const populateData = async () => {
    setLoading(true);
    setLogs([]);

    try {
      // Connect to the network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      addLog(`Connected with address: ${userAddress}`);

      // Create contract instance
      const contract = new ethers.Contract(config.contractAddress, ProofPerksABI.abi, signer);

      // Get total campaigns
      const totalCampaigns = await contract.currentCampaignId();
      addLog(`Total campaigns: ${totalCampaigns}`);

      // Process each campaign
      for (let campaignId = 0; campaignId < totalCampaigns; campaignId++) {
        addLog(`\nProcessing campaign ${campaignId}...`);
        
        try {
          // Get campaign details to verify it exists
          const campaign = await contract.getCampaignById(campaignId);
          if (!campaign) {
            addLog(`Campaign ${campaignId} does not exist, skipping...`);
            continue;
          }

          // Get current campaign stats
          const stats = await contract.getCampaignStats(campaignId);
          const currentMinted = Number(stats[1]);
          
          // Generate random target number of mints for this campaign
          const targetMints = getRandomNumber(config.minMints, config.maxMints);
          
          // Generate different addresses to simulate unique users
          const addresses = [];
          
          if (currentMinted < targetMints) {
            const mintsNeeded = targetMints - currentMinted;
            addLog(`Target mints for campaign ${campaignId}: ${targetMints}`);
            addLog(`Minting ${mintsNeeded} NFTs for campaign ${campaignId}...`);

            // Generate addresses for new mints
            for (let i = 0; i < mintsNeeded; i++) {
              const wallet = ethers.Wallet.createRandom();
              addresses.push(wallet.address);
            }

            // Mint NFTs
            for (const address of addresses) {
              try {
                const tx = await contract.mintProof(address, campaignId);
                await tx.wait();
                addLog(`Minted NFT for ${address.slice(0, 8)}...`);
                await sleep(config.delayBetweenTx);
              } catch (error) {
                addLog(`Error minting for ${address.slice(0, 8)}...: ${error.message}`);
              }
            }
          } else {
            addLog(`Campaign ${campaignId} already has sufficient mints (${currentMinted})`);
          }

          // Get updated stats after minting
          const updatedStats = await contract.getCampaignStats(campaignId);
          const totalMinted = Number(updatedStats[1]);
          const currentBurned = Number(updatedStats[3]);

          // Generate random burn percentage for this campaign
          const burnPercentage = getRandomNumber(config.minBurnPercentage, config.maxBurnPercentage);
          const targetBurns = Math.floor((totalMinted * burnPercentage) / 100);
          
          if (currentBurned < targetBurns && addresses.length > 0) {
            const burnsNeeded = targetBurns - currentBurned;
            addLog(`Target burns for campaign ${campaignId}: ${targetBurns} (${burnPercentage}% of mints)`);
            addLog(`Simulating ${burnsNeeded} redemptions for campaign ${campaignId}...`);

            // Burn tokens for each address that has an NFT
            for (const address of addresses) {
              try {
                // Check if address has an NFT to burn
                const balance = await contract.balanceOf(address, campaignId);
                if (balance > 0) {
                  const tx = await contract.burnProof(address, campaignId);
                  await tx.wait();
                  addLog(`Burned NFT for ${address.slice(0, 8)}...`);
                  await sleep(config.delayBetweenTx);
                }
              } catch (error) {
                addLog(`Error burning for ${address.slice(0, 8)}...: ${error.message}`);
              }
            }
          } else {
            addLog(`Campaign ${campaignId} already has sufficient burns (${currentBurned})`);
          }

        } catch (error) {
          addLog(`Error processing campaign ${campaignId}: ${error.message}`);
          continue;
        }
      }

      addLog('\nData population completed!');
      
    } catch (error) {
      addLog(`Script failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center">
        <button
          onClick={populateData}
          disabled={loading}
          className={`px-6 py-3 rounded-lg ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white transition-colors shadow-md'
          }`}
        >
          {loading ? 'Processing...' : 'Populate Test Data'}
        </button>
      </div>

      {/* Logs Display */}
      {logs.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Execution Logs</h3>
              <button 
                onClick={() => setLogs([])}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopulateDataButton; 