import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import NFTCard from './NFTCard';
import { getContract, getCampaignById } from '../utils/contract';

const UserDashboard = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const navigate = useNavigate();
  const walletAddress = localStorage.getItem('walletAddress');

  useEffect(() => {
    if (!walletAddress) {
      navigate('/connect');
      return;
    }
    
    fetchNFTs();
  }, [walletAddress, navigate]);

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      
      const contract = await getContract();
      const campaignCount = await contract.currentCampaignId();
      
      if (Number(campaignCount) === 0) {
        setNfts([]);
        return;
      }

      const fetchedNFTs = [];
      for (let i = 0; i < Number(campaignCount); i++) {
        try {
          const campaign = await getCampaignById(i);
          if (campaign) {
            // Check if the user has minted this campaign
            const hasMinted = await contract.hasMinted(walletAddress, i);
            if (hasMinted) {
              fetchedNFTs.push({
                ...campaign,
                id: i,
                minted: true
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching campaign ${i}:`, err);
        }
      }

      setNfts(fetchedNFTs);
      
      // Calculate total earnings
      const totalEarnings = fetchedNFTs.reduce((acc, nft) => {
        // Add 1 XRP for each minted NFT
        return acc + (nft.minted ? 1 : 0);
      }, 0);
      
      setEarnings(totalEarnings);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptIn = async (campaignId) => {
    try {
      const contract = await getContract(true);
      
      // Mint the NFT for this campaign
      const tx = await contract.mintProof(campaignId);
      await tx.wait();
      
      // Update earnings and refresh NFTs
      setEarnings(prev => prev + 1);
      await fetchNFTs();
    } catch (error) {
      console.error('Error processing opt-in:', error);
    }
  };

  const handleBackToHome = () => {
    // Clear wallet address and user role when going back to home
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const handleDiscoverCampaigns = () => {
    navigate('/discover-campaigns');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Back to Home</span>
              </button>
              <h1 className="text-xl font-semibold">ProofPerks User Dashboard</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-gray-500">Earnings:</span>
                <span className="ml-2 font-medium">{earnings} XRP</span>
              </div>
              <span className="text-sm text-gray-600">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your NFTs...</p>
            </div>
          ) : nfts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-medium text-gray-900 mb-4">
                  No Campaign NFTs Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Visit businesses to collect campaign NFTs and earn rewards by sharing your data!
                </p>
                <button
                  onClick={handleDiscoverCampaigns}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Discover Campaigns
                </button>
              </div>
            </div>
          ) : (
            nfts.map((nft) => (
              <NFTCard
                key={nft.id}
                campaign={nft}
                onOptIn={handleOptIn}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard; 