import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getContract, getCampaignById } from '../utils/contract';
import PopulateDataButton from './PopulateDataButton';
import { ethers } from 'ethers';

// Image component with category-based fallbacks
const ImageWithFallback = ({ src, alt, className, category }) => {
  // Define placeholder images for different categories
  const placeholders = {
    'Sportswear': 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&auto=format&fit=crop&q=80',
    'Running Shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    'Food & Beverage': 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&auto=format&fit=crop&q=80',
    'Fitness': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    'Dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    'Business': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    'default': 'https://via.placeholder.com/400x200?text=Campaign+Image'
  };
  
  const getFallbackUrl = (category) => {
    return placeholders[category] || placeholders.default;
  };
  
  const handleError = (e) => {
    e.target.src = getFallbackUrl(category);
  };

  return (
    <img
      src={src || getFallbackUrl(category)}
      alt={alt}
      className={`w-full object-cover ${className}`}
      onError={handleError}
    />
  );
};

const BusinessDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const navigate = useNavigate();
  const walletAddress = localStorage.getItem('walletAddress');

  useEffect(() => {
    if (!walletAddress) {
      navigate('/connect');
      return;
    }
    
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        const contract = await getContract();
        const campaignCount = await contract.currentCampaignId();
        
        if (Number(campaignCount) === 0) {
          setCampaigns([]);
          return;
        }
        
        const fetchedCampaigns = [];
        for (let i = 0; i < Number(campaignCount); i++) {
          try {
            const campaign = await getCampaignById(i);
            if (campaign) {
              // Process campaign data
              const processedCampaign = {
                ...campaign,
                id: i,
                // Set image URL based on location or category if they contain URLs
                imageUrl: campaign.location?.startsWith('http') 
                  ? campaign.location 
                  : campaign.category?.startsWith('http')
                    ? campaign.category
                    : 'https://via.placeholder.com/400x200?text=Campaign+Image',
                // Set display category (if category is a URL, use a default)
                displayCategory: campaign.category?.startsWith('http') 
                  ? 'General' 
                  : campaign.category
              };
              fetchedCampaigns.push(processedCampaign);
            }
          } catch (err) {
            console.error(`Error fetching campaign ${i}:`, err);
          }
        }

        setCampaigns(fetchedCampaigns);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [walletAddress, navigate]);

  const handleCreateCampaign = () => {
    navigate('/business/create-campaign');
  };

  const handleViewDetails = (campaignId) => {
    navigate(`/business/campaign/${campaignId}`);
  };

  const handleBackToHome = () => {
    // Clear wallet address and user role when going back to home
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  // Filter campaigns based on active tab
  const filteredCampaigns = campaigns.filter(campaign => {
    const isExpired = new Date(campaign.expiryDate) < new Date();
    return activeTab === 'active' ? !isExpired : isExpired;
  });

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Business Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Business Dashboard</h1>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold">ProofPerks Business Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreateCampaign}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Campaign
              </button>
              <span className="text-sm text-gray-600">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Active Campaigns
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed Campaigns
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-12">
              Loading your campaigns...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No {activeTab} campaigns found.</p>
              <p className="text-sm text-gray-500 mt-2">
                {activeTab === 'active' ? 'Create your first campaign to start engaging with users!' : 'Completed campaigns will appear here.'}
              </p>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-48">
                  <ImageWithFallback
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="h-full"
                    category={campaign.displayCategory}
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    {campaign.displayCategory}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{campaign.title}</h3>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Minted: {campaign.minted}</span>
                    <span>Claimed: {campaign.claimed}</span>
                    <span>Burned: {campaign.burned}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>Views: {campaign.views}</span>
                    <span>Conversion: {((campaign.burned / campaign.minted) * 100).toFixed(1)}%</span>
                  </div>
                  <button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors"
                    onClick={() => handleViewDetails(campaign.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default BusinessDashboard; 