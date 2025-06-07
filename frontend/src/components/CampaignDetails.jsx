import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignById } from '../utils/contract';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        console.log('Fetching campaign with ID:', id);
        const data = await getCampaignById(id);
        console.log('Fetched campaign data:', data);
        
        // Process the campaign data
        const processedData = {
          ...data,
          // Ensure category is "Food & Beverage" if the field contains a URL
          category: data.category?.includes('http') ? 'Food & Beverage' : data.category,
          // Move image URL to the correct field if it's in the category field
          imageUrl: data.category?.includes('http') ? data.category : data.imageUrl
        };
        
        console.log('Processed campaign data:', processedData);
        setCampaign(processedData);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleClaimClick = () => {
    navigate(`/campaign/${id}/opt-in`);
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
            <div className="text-red-600">Error loading campaign: {error}</div>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Back Button */}
          <button
            onClick={() => navigate('/discover-campaigns')}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 flex items-center"
          >
            ← Back to Campaigns
          </button>

          {/* Campaign Image */}
          <div className="h-64 w-full bg-gray-200">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x400?text=Campaign+Image';
              }}
            />
          </div>

          <div className="p-6">
            {/* Campaign Title */}
            <h1 className="text-3xl font-bold mb-4">{campaign.title}</h1>

            {/* Campaign Type */}
            <div className="text-gray-600 mb-6">{campaign.category}</div>

            {/* Campaign Details */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-lg text-gray-900">{campaign.location}</p>
              </div>
              {campaign.expiryDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Expiry Date</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {campaign.expiryDate}
                  </p>
                </div>
              )}
            </div>

            {/* Claim Button */}
            <button
              onClick={handleClaimClick}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Claim NFT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails; 