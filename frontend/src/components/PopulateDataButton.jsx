import React, { useState } from 'react';
import { ethers } from 'ethers';
import ProofPerksABI from '../utils/ProofPerks.json';

const PopulateDataButton = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Configuration
  const config = {
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
    minMints: 5,
    maxMints: 10,
    minBurnPercentage: 30,
    maxBurnPercentage: 50,
    delayBetweenTx: 500,
    // Use your private key here - NEVER commit this to git
    privateKey: process.env.REACT_APP_PRIVATE_KEY,
    rpcUrl: process.env.REACT_APP_RPC_URL || "https://rpc-evm-sidechain.xrpl.org"
  };

  const addLog = (message) => {
    setLogs(prev => [...prev, message]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const populateData = async () => {
    setLoading(true);
    setLogs([]);

    try {
      // Debug logging for environment variables
      addLog(`Contract Address: ${config.contractAddress}`);
      addLog(`RPC URL: ${config.rpcUrl}`);
      // Log private key length and format (safely)
      const pk = config.privateKey || '';
      addLog(`Private Key length: ${pk.length}`);
      addLog(`Private Key starts with: ${pk.slice(0, 4)}...`);
      addLog(`Has 0x prefix: ${pk.startsWith('0x')}`);

      // Validate private key format
      if (!pk || pk.length !== 66 || !pk.startsWith('0x')) {
        throw new Error('Invalid private key format. Must be a 32-byte hex string with 0x prefix (66 characters total)');
      }

      // Connect using private key
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const wallet = new ethers.Wallet(config.privateKey, provider);
      const userAddress = await wallet.getAddress();
      addLog(`Connected with address: ${userAddress}`);

      // Create contract instance
      const contract = new ethers.Contract(config.contractAddress, ProofPerksABI.abi, wallet);

      // Get total campaigns
      const totalCampaigns = await contract.currentCampaignId();
      addLog(`Total campaigns: ${totalCampaigns}`);

      if (totalCampaigns === 0) {
        addLog('No campaigns found. Please create some campaigns first.');
        return;
      }

      // Process each campaign
      for (let campaignId = 0; campaignId < totalCampaigns; campaignId++) {
        addLog(`\nProcessing campaign ${campaignId}...`);
        
        try {
          const targetMints = getRandomNumber(config.minMints, config.maxMints);
          addLog(`Target mints for campaign ${campaignId}: ${targetMints}`);

          // Generate addresses and track successful mints
          const mintedAddresses = [];
          const addresses = [];
          for (let i = 0; i < targetMints; i++) {
            const wallet = ethers.Wallet.createRandom();
            addresses.push(wallet.address);
          }

          // Mint NFTs
          for (const address of addresses) {
            try {
              const tx = await contract.mintProof(address, campaignId);
              await tx.wait();
              mintedAddresses.push(address); // Track successful mints
              addLog(`✓ Minted NFT for ${address.slice(0, 8)}...`);
              await sleep(config.delayBetweenTx);
            } catch (error) {
              addLog(`❌ Error minting for ${address.slice(0, 8)}...: ${error.message}`);
              continue;
            }
          }

          // Calculate burns from successful mints only
          const burnPercentage = getRandomNumber(config.minBurnPercentage, config.maxBurnPercentage);
          const targetBurns = Math.floor((mintedAddresses.length * burnPercentage) / 100);
          addLog(`Target burns for campaign ${campaignId}: ${targetBurns} (${burnPercentage}% of mints)`);

          // Burn tokens only for addresses we know were minted successfully
          for (let i = 0; i < targetBurns && i < mintedAddresses.length; i++) {
            const address = mintedAddresses[i];
            try {
              const tx = await contract.burnProof(address, campaignId);
              await tx.wait();
              addLog(`✓ Burned NFT for ${address.slice(0, 8)}...`);
              await sleep(config.delayBetweenTx);
            } catch (error) {
              addLog(`❌ Error burning for ${address.slice(0, 8)}...: ${error.message}`);
              continue;
            }
          }

          addLog(`✓ Completed campaign ${campaignId}`);

        } catch (error) {
          addLog(`❌ Error processing campaign ${campaignId}: ${error.message}`);
          continue;
        }
      }

      addLog('\n✨ Data population completed!');
      
    } catch (error) {
      addLog(`❌ Script failed: ${error.message}`);
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