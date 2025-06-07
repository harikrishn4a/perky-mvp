import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignById, mintProof } from '../utils/contract';
import ClaimSuccess from './ClaimSuccess';

// Category-based placeholder images - matching with CustomerGallery
const CATEGORY_IMAGES = {
  'Sportswear': 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&auto=format&fit=crop&q=80',
  'Running Shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  'Food & Beverage': 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&auto=format&fit=crop&q=80',
  'Fitness': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
  'Dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  'Business': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
  'default': 'https://via.placeholder.com/400x200?text=Campaign+Image'
};

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getCampaignById(id);
        
        // Process the campaign data
        const processedData = {
          ...data,
          displayCategory: data.category?.startsWith('http') ? 'General' : data.category,
          imageUrl: data.location?.startsWith('http') 
            ? data.location 
            : data.category?.startsWith('http')
              ? data.category
              : null,
          displayLocation: data.location?.startsWith('http') ? null : data.location,
          expiryDate: data.expiryTimestamp 
            ? new Date(Number(data.expiryTimestamp) * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC'
              })
            : null
        };
        
        setCampaign(processedData);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err.message || 'Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleClaimClick = async () => {
    try {
      setClaiming(true);
      setError(null);
      
      const tx = await mintProof(id);
      console.log('Claim transaction:', tx);
      
      setClaimSuccess(true);
    } catch (err) {
      console.error('Error claiming NFT:', err);
      setError(err.message || 'Failed to claim NFT');
    } finally {
      setClaiming(false);
    }
  };

  const getFallbackImage = (category) => {
    return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={() => navigate('/discover-campaigns')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600">Campaign not found</div>
          </div>
        </div>
      </div>
    );
  }

  if (claimSuccess) {
    return <ClaimSuccess />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Back Button */}
          <div className="p-4 border-b">
            <button
              onClick={() => navigate('/discover-campaigns')}
              className="text-gray-600 hover:text-gray-800 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Campaigns
            </button>
          </div>

          {/* Campaign Image */}
          <div className="relative h-64 w-full bg-gray-100">
            <img
              src={campaign.imageUrl || getFallbackImage(campaign.displayCategory)}
              alt={campaign.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = getFallbackImage(campaign.displayCategory);
              }}
            />
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              {campaign.displayCategory}
            </div>
          </div>

          <div className="p-6">
            {/* Campaign Title */}
            <h1 className="text-3xl font-bold mb-6">{campaign.title}</h1>

            {/* Campaign Details */}
            <div className="space-y-6 mb-8">
              {/* Reward */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Reward</h3>
                <p className="mt-1 text-xl font-semibold text-blue-900">
                  {campaign.reward}
                </p>
              </div>
              
              {/* Location */}
              {campaign.displayLocation && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="mt-1 text-lg text-gray-900">{campaign.displayLocation}</p>
                  </div>
                </div>
              )}

              {/* Expiry Date */}
              {campaign.expiryDate && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
                    <p className="mt-1 text-lg text-gray-900">{campaign.expiryDate}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {campaign.tags && campaign.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {campaign.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex space-x-4 text-sm">
                <div className="bg-green-50 px-3 py-1 rounded-full text-green-800">
                  {campaign.claimed} Claimed
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-800">
                  {campaign.views} Views
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                {error}
              </div>
            )}

            {/* Claim Button */}
            <button
              onClick={handleClaimClick}
              disabled={claiming}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                claiming 
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {claiming ? 'Claiming...' : 'Claim NFT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails; 