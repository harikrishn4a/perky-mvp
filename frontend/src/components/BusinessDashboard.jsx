import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContract, getCampaignById } from '../utils/contract';
import PopulateDataButton from './PopulateDataButton';

const BusinessDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
              fetchedCampaigns.push(campaign);
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
  }, []);

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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Business Dashboard</h1>
        <div className="flex gap-4">
          <PopulateDataButton />
          <Link
            to="/create-campaign"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            Create Campaign
          </Link>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="text-xl text-gray-600 mb-6">No campaigns found. Create your first campaign!</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {campaign.imageUrl ? (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={campaign.imageUrl} 
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x200?text=Campaign+Image';
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{campaign.title}</h3>
                <p className="text-gray-600 mb-4">{campaign.reward}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium text-gray-800">{campaign.category}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">{campaign.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-500">Minted</p>
                    <p className="font-medium text-blue-700">{campaign.minted}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-green-500">Claimed</p>
                    <p className="font-medium text-green-700">{campaign.claimed}</p>
                  </div>
                </div>

                {campaign.metrics && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-purple-500">Claim Rate</p>
                      <p className="font-medium text-purple-700">{campaign.claimRate}%</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <p className="text-sm text-orange-500">Burn Rate</p>
                      <p className="font-medium text-orange-700">{campaign.burnRate}%</p>
                    </div>
                  </div>
                )}

                <Link
                  to={`/business/campaign/${campaign.id}`}
                  className="block w-full text-center mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessDashboard; 